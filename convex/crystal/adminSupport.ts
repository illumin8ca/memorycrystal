import { internal } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { stableUserId } from "./auth";
import {
  normalizeRoles,
  requireApiKeyManagementAccess,
  requireRoleAssignmentAccess,
  requireWriteAccess,
} from "./permissions";

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateKey(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function pickLatestProfile<T extends { updatedAt?: number }>(profiles: T[]): T | undefined {
  return profiles.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
}

async function getActorForMutation(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  const actorUserId = stableUserId(identity.subject);
  const actorProfile = await ctx.runMutation(internal.crystal.userProfiles.ensureProfileForUserInternal, {
    userId: actorUserId,
    email: identity.email ?? undefined,
  });

  return {
    actorUserId,
    actorProfile,
  };
}

async function getActorForQuery(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  const actorUserId = stableUserId(identity.subject);
  const profiles = await ctx.db
    .query("crystalUserProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", actorUserId))
    .collect();

  return {
    actorUserId,
    actorProfile: (pickLatestProfile(profiles as any[]) ?? { roles: ["subscriber"] }) as any,
  };
}

async function writeAdminAudit(
  ctx: any,
  actorUserId: string,
  action: string,
  targetUserId: string,
  targetType: string,
  targetId?: string,
  meta?: Record<string, unknown>,
) {
  await ctx.runMutation(internal.crystal.mcp.writeAuditLog, {
    userId: actorUserId,
    keyHash: "admin_console",
    action,
    ts: Date.now(),
    actorUserId,
    effectiveUserId: actorUserId,
    targetUserId,
    targetType,
    targetId,
    meta: meta ? JSON.stringify(meta) : undefined,
  });
}

export const getSupportUserContext: any = query({
  args: { targetUserId: v.string() },
  handler: async (ctx, { targetUserId }) => {
    const { actorProfile } = await getActorForQuery(ctx);
    requireWriteAccess(actorProfile?.roles, "Forbidden: support context requires manager or admin role");

    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", targetUserId))
      .collect();

    const latestProfile = pickLatestProfile(profiles) ?? null;
    const keys = await ctx.db
      .query("crystalApiKeys")
      .withIndex("by_user", (q: any) => q.eq("userId", targetUserId))
      .collect();

    return {
      profile: latestProfile,
      profileCount: profiles.length,
      apiKeys: keys.map(({ keyHash: _kh, ...rest }: any) => rest),
    };
  },
});

export const adminUpdateUserRoles: any = mutation({
  args: {
    targetUserId: v.string(),
    roles: v.array(v.union(v.literal("subscriber"), v.literal("manager"), v.literal("admin"))),
  },
  handler: async (ctx, { targetUserId, roles }) => {
    const { actorUserId, actorProfile } = await getActorForMutation(ctx);
    requireRoleAssignmentAccess(actorProfile?.roles, "Forbidden: role assignment requires admin role");

    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", targetUserId))
      .collect();
    const targetProfile = pickLatestProfile(profiles);
    if (!targetProfile) throw new Error("Target user profile not found");

    const normalizedRoles = normalizeRoles(roles);
    const previousRoles = normalizeRoles(targetProfile.roles);

    await ctx.db.patch(targetProfile._id, {
      roles: normalizedRoles,
      updatedAt: Date.now(),
    });

    await writeAdminAudit(
      ctx,
      actorUserId,
      "admin_update_user_roles",
      targetUserId,
      "profile",
      String(targetProfile._id),
      { previousRoles, newRoles: normalizedRoles },
    );

    return {
      profileId: targetProfile._id,
      roles: normalizedRoles,
    };
  },
});

export const adminRevokeUserApiKey: any = mutation({
  args: {
    targetUserId: v.string(),
    keyId: v.id("crystalApiKeys"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { targetUserId, keyId, reason }) => {
    const { actorUserId, actorProfile } = await getActorForMutation(ctx);
    requireApiKeyManagementAccess(actorProfile?.roles, "Forbidden: API key management requires manager or admin role");

    const key = await ctx.db.get(keyId);
    if (!key || key.userId !== targetUserId) throw new Error("Key not found for target user");

    const wasActive = key.active;
    if (wasActive) {
      await ctx.db.patch(keyId, { active: false });
    }

    await writeAdminAudit(
      ctx,
      actorUserId,
      "admin_revoke_user_api_key",
      targetUserId,
      "api_key",
      String(keyId),
      { wasActive, reason: reason?.slice(0, 500) },
    );

    return { ok: true, wasActive };
  },
});

export const adminRegenerateUserApiKey: any = mutation({
  args: {
    targetUserId: v.string(),
    oldKeyId: v.id("crystalApiKeys"),
    label: v.optional(v.string()),
    revokeOld: v.optional(v.boolean()),
  },
  handler: async (ctx, { targetUserId, oldKeyId, label, revokeOld }) => {
    const { actorUserId, actorProfile } = await getActorForMutation(ctx);
    requireApiKeyManagementAccess(actorProfile?.roles, "Forbidden: API key management requires manager or admin role");

    const oldKey = await ctx.db.get(oldKeyId);
    if (!oldKey || oldKey.userId !== targetUserId) throw new Error("Key not found for target user");

    const shouldRevokeOld = revokeOld !== false;
    if (shouldRevokeOld && oldKey.active) {
      await ctx.db.patch(oldKeyId, { active: false });
    }

    const rawKey = generateKey();
    const keyHash = await sha256Hex(rawKey);
    const newKeyId = await ctx.db.insert("crystalApiKeys", {
      userId: targetUserId,
      keyHash,
      label: label ?? oldKey.label,
      createdAt: Date.now(),
      active: true,
    });

    await writeAdminAudit(
      ctx,
      actorUserId,
      "admin_regenerate_user_api_key",
      targetUserId,
      "api_key",
      String(newKeyId),
      {
        oldKeyId: String(oldKeyId),
        revokeOld: shouldRevokeOld,
        oldWasActive: oldKey.active,
      },
    );

    return { rawKey, newKeyId, revokedOldKey: shouldRevokeOld && oldKey.active };
  },
});

export const adminEnsureUserProfile: any = mutation({
  args: {
    targetUserId: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { targetUserId, email }) => {
    const { actorUserId, actorProfile } = await getActorForMutation(ctx);
    requireWriteAccess(actorProfile?.roles, "Forbidden: profile repair requires manager or admin role");

    const before = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", targetUserId))
      .collect();

    const profile = await ctx.runMutation(internal.crystal.userProfiles.ensureProfileForUserInternal, {
      userId: targetUserId,
      email,
    });

    await writeAdminAudit(
      ctx,
      actorUserId,
      "admin_ensure_user_profile",
      targetUserId,
      "profile",
      String(profile?._id ?? ""),
      { existed: before.length > 0 },
    );

    return {
      created: before.length === 0,
      profile,
    };
  },
});

export const adminResyncUserSubscriptionLinkage: any = mutation({
  args: {
    targetUserId: v.string(),
  },
  handler: async (ctx, { targetUserId }) => {
    const { actorUserId, actorProfile } = await getActorForMutation(ctx);
    requireWriteAccess(actorProfile?.roles, "Forbidden: subscription resync requires manager or admin role");

    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", targetUserId))
      .collect();

    let latest = pickLatestProfile(profiles);
    if (!latest) {
      latest = await ctx.runMutation(internal.crystal.userProfiles.ensureProfileForUserInternal, {
        userId: targetUserId,
      });
    }
    if (!latest) throw new Error("Failed to ensure target profile");

    const normalizedRoles = normalizeRoles(latest.roles);

    const inferredPolarCustomerId = latest.polarCustomerId ?? profiles.find((p: any) => !!p.polarCustomerId)?.polarCustomerId;
    const inferredPolarSubscriptionId =
      latest.polarSubscriptionId ?? profiles.find((p: any) => !!p.polarSubscriptionId)?.polarSubscriptionId;

    const patch: Record<string, unknown> = {
      roles: normalizedRoles,
      updatedAt: Date.now(),
    };

    const changedFields: string[] = [];

    if (inferredPolarCustomerId && inferredPolarCustomerId !== latest.polarCustomerId) {
      patch.polarCustomerId = inferredPolarCustomerId;
      changedFields.push("polarCustomerId");
    }
    if (inferredPolarSubscriptionId && inferredPolarSubscriptionId !== latest.polarSubscriptionId) {
      patch.polarSubscriptionId = inferredPolarSubscriptionId;
      changedFields.push("polarSubscriptionId");
    }

    if (latest.subscriptionStatus === "unlimited" && latest.plan !== "unlimited") {
      patch.plan = "unlimited";
      changedFields.push("plan");
    }

    const rolesChanged = JSON.stringify(normalizedRoles) !== JSON.stringify(latest.roles ?? []);
    if (rolesChanged) {
      changedFields.push("roles");
    }

    await ctx.db.patch(latest._id, patch);

    await writeAdminAudit(
      ctx,
      actorUserId,
      "admin_resync_user_subscription_linkage",
      targetUserId,
      "profile",
      String(latest._id),
      {
        changedFields,
        profileCount: profiles.length,
      },
    );

    const updated = await ctx.db.get(latest._id);

    return {
      ok: true,
      changedFields,
      profile: updated,
    };
  },
});
