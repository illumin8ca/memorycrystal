import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { stableUserId } from "./auth";
import { hasRole, normalizeRoles } from "./permissions";
import { internal } from "../_generated/api";

const DASHBOARD_AUDIT_KEY_HASH = "dashboard";

async function getLatestProfileByUserId(ctx: any, userId: string) {
  try {
    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    return profiles.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0] ?? null;
  } catch {
    // If schema/index isn't available yet, fail closed and treat as no profile.
    return null;
  }
}

async function getActorRoleState(ctx: any, actorUserId: string) {
  const actorProfile = await getLatestProfileByUserId(ctx, actorUserId);
  const actorRoles = normalizeRoles(actorProfile?.roles);
  return {
    actorRoles,
    canImpersonate: hasRole(actorRoles, "manager") || hasRole(actorRoles, "admin"),
    isAdmin: hasRole(actorRoles, "admin"),
  };
}

async function audit(ctx: any, actorUserId: string, action: string, meta?: Record<string, unknown>) {
  await ctx.runMutation(internal.crystal.mcp.writeAuditLog, {
    userId: actorUserId,
    keyHash: DASHBOARD_AUDIT_KEY_HASH,
    action,
    ts: Date.now(),
    actorUserId,
    meta: meta ? JSON.stringify(meta) : undefined,
  });
}

async function getActiveSessionByActor(ctx: any, actorUserId: string) {
  try {
    return await ctx.db
      .query("crystalImpersonationSessions")
      .withIndex("by_actor_active", (q: any) => q.eq("actorUserId", actorUserId).eq("active", true))
      .first();
  } catch {
    // If table/index isn't available yet in an environment, disable impersonation gracefully.
    return null;
  }
}

export async function resolveEffectiveUserId(ctx: any, actorUserId: string, requestedAsUserId?: string | null) {
  const active = await getActiveSessionByActor(ctx, actorUserId);

  if (!active) return actorUserId;

  if (requestedAsUserId && requestedAsUserId !== active.targetUserId) {
    throw new Error("Invalid impersonation target");
  }

  return active.targetUserId;
}

export const getImpersonationState = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return { canImpersonate: false, actorRoles: [], activeSession: null };

      const actorUserId = stableUserId(identity.subject);
      const { actorRoles, canImpersonate } = await getActorRoleState(ctx, actorUserId);
      const activeSession = await getActiveSessionByActor(ctx, actorUserId);

      return {
        canImpersonate,
        actorRoles,
        activeSession,
      };
    } catch {
      // Never let impersonation state take down the dashboard.
      return { canImpersonate: false, actorRoles: [], activeSession: null };
    }
  },
});

export const startImpersonation = mutation({
  args: {
    targetUserId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { targetUserId, reason }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const actorUserId = stableUserId(identity.subject);
    const { canImpersonate, isAdmin } = await getActorRoleState(ctx, actorUserId);
    if (!canImpersonate) throw new Error("Forbidden: manager or admin role required");
    if (targetUserId === actorUserId) throw new Error("Cannot impersonate yourself");

    const targetProfile = await getLatestProfileByUserId(ctx, targetUserId);
    const targetRoles = normalizeRoles(targetProfile?.roles);
    if (!isAdmin && hasRole(targetRoles, "admin")) {
      throw new Error("Forbidden: managers cannot impersonate admins");
    }

    const existing = await ctx.db
      .query("crystalImpersonationSessions")
      .withIndex("by_actor_active", (q) => q.eq("actorUserId", actorUserId).eq("active", true))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        active: false,
        endedAt: now,
      });
    }

    const sessionId = await ctx.db.insert("crystalImpersonationSessions", {
      actorUserId,
      targetUserId,
      reason,
      startedAt: now,
      endedAt: undefined,
      active: true,
    });

    await audit(ctx, actorUserId, "impersonation_start", {
      targetUserId,
      reason: reason ?? null,
      sessionId,
    });

    return await ctx.db.get(sessionId);
  },
});

export const stopImpersonation = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const actorUserId = stableUserId(identity.subject);

    const active = await ctx.db
      .query("crystalImpersonationSessions")
      .withIndex("by_actor_active", (q) => q.eq("actorUserId", actorUserId).eq("active", true))
      .first();

    if (!active) return { stopped: false };

    const now = Date.now();
    await ctx.db.patch(active._id, {
      active: false,
      endedAt: now,
    });

    await audit(ctx, actorUserId, "impersonation_stop", {
      targetUserId: active.targetUserId,
      sessionId: active._id,
      startedAt: active.startedAt,
      endedAt: now,
    });

    return { stopped: true, sessionId: active._id };
  },
});
