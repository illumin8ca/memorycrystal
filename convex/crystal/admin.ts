import { query } from "../_generated/server";
import { v } from "convex/values";
import { stableUserId } from "./auth";
import { canPerformWriteActions, normalizeRoles } from "./permissions";

function pickLatestProfile<T extends { updatedAt?: number }>(profiles: T[]): T | undefined {
  return profiles.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
}

async function requireAdminViewer(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  const userId = stableUserId(identity.subject);
  const viewerProfiles = await ctx.db
    .query("crystalUserProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const viewerProfile = pickLatestProfile(viewerProfiles as any[]);
  const roles = normalizeRoles((viewerProfile as any)?.roles);

  if (!canPerformWriteActions(roles)) {
    throw new Error("Forbidden: admin area requires manager or admin role");
  }

  return { userId, roles };
}

export const getViewerAccess = query({
  args: {},
  handler: async (ctx) => {
    const { userId, roles } = await requireAdminViewer(ctx);
    return { userId, roles };
  },
});

export const listUsers = query({
  args: { search: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { search, limit }) => {
    await requireAdminViewer(ctx);

    const rows = await ctx.db.query("crystalUserProfiles").collect();
    const latestByUser = new Map<string, any>();

    for (const row of rows) {
      const existing = latestByUser.get(row.userId);
      if (!existing || (row.updatedAt ?? 0) > (existing.updatedAt ?? 0)) {
        latestByUser.set(row.userId, row);
      }
    }

    const normalizedSearch = search?.trim().toLowerCase();
    const allUsers = Array.from(latestByUser.values())
      .filter((profile) => {
        if (!normalizedSearch) return true;
        return (
          profile.userId.toLowerCase().includes(normalizedSearch) ||
          (profile.polarCustomerId ?? "").toLowerCase().includes(normalizedSearch) ||
          (profile.polarSubscriptionId ?? "").toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    const capped = allUsers.slice(0, Math.max(1, Math.min(limit ?? 200, 500)));

    const users = await Promise.all(
      capped.map(async (profile) => {
        const roles = normalizeRoles(profile.roles);
        const keys = await ctx.db
          .query("crystalApiKeys")
          .withIndex("by_user", (q: any) => q.eq("userId", profile.userId))
          .collect();

        const totalKeys = keys.length;
        const activeKeys = keys.filter((k) => k.active).length;
        const hasBillingLinkage = Boolean(profile.polarCustomerId || profile.polarSubscriptionId);

        return {
          userId: profile.userId,
          roles,
          subscriptionStatus: profile.subscriptionStatus,
          plan: profile.plan ?? null,
          polarCustomerId: profile.polarCustomerId ?? null,
          polarSubscriptionId: profile.polarSubscriptionId ?? null,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          profileHealth: {
            hasBillingLinkage,
            hasSubscriptionPlan: Boolean(profile.plan),
            hasRoles: roles.length > 0,
          },
          apiKeys: {
            total: totalKeys,
            active: activeKeys,
          },
        };
      })
    );

    return {
      totalMatched: allUsers.length,
      users,
    };
  },
});

export const getUserDetail = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireAdminViewer(ctx);

    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const profile = pickLatestProfile(profiles);
    if (!profile) return null;

    const keys = await ctx.db
      .query("crystalApiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .collect();

    const messages = await ctx.db
      .query("crystalMessages")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);

    const sessions = await ctx.db
      .query("crystalSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const roles = normalizeRoles(profile.roles);
    const activeKeys = keys.filter((k) => k.active);

    return {
      userId: profile.userId,
      roles,
      accountSummary: {
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        memoryCount: memories.length,
        messageCountRecentScan: messages.length,
        sessionsCount: sessions.length,
      },
      subscription: {
        status: profile.subscriptionStatus,
        plan: profile.plan ?? null,
        polarCustomerId: profile.polarCustomerId ?? null,
        polarSubscriptionId: profile.polarSubscriptionId ?? null,
      },
      apiKeys: {
        total: keys.length,
        active: activeKeys.length,
        latestCreatedAt: keys.length ? Math.max(...keys.map((k) => k.createdAt)) : null,
        latestUsedAt: keys.length ? Math.max(...keys.map((k) => k.lastUsedAt ?? 0)) || null : null,
      },
      profileHealth: {
        hasBillingLinkage: Boolean(profile.polarCustomerId || profile.polarSubscriptionId),
        hasSubscriptionPlan: Boolean(profile.plan),
        hasRoles: roles.length > 0,
      },
    };
  },
});
