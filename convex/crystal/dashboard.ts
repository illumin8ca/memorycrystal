import { stableUserId } from "./auth";
import { query } from "../_generated/server";
import { v } from "convex/values";

async function hasActiveSubscription(ctx: any, userId: string): Promise<boolean> {
  const profiles = await ctx.db
    .query("crystalUserProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const profile = profiles.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
  const status = profile?.subscriptionStatus;
  return status === "active" || status === "trialing" || status === "unlimited";
}

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    if (!(await hasActiveSubscription(ctx, userId))) {
      return {
        totalMemories: 0,
        totalMessages: 0,
        memoriesByStore: {},
        activeStores: 0,
        recentActivity: [],
      };
    }

    const allMemories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .collect();

    const totalMessages = await ctx.db
      .query("crystalMessages")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const recent = [...allMemories]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((m) => ({ title: m.title, store: m.store, createdAt: m.createdAt }));

    const byStore: Record<string, number> = {};
    for (const m of allMemories) {
      byStore[m.store] = (byStore[m.store] ?? 0) + 1;
    }

    return {
      totalMemories: allMemories.length,
      totalMessages: totalMessages.length,
      memoriesByStore: byStore,
      activeStores: Object.keys(byStore).length,
      recentActivity: recent,
    };
  },
});

export const listMemories = query({
  args: {
    limit: v.optional(v.number()),
    store: v.optional(v.string()),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, { limit = 50, store, archived = false }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    if (!(await hasActiveSubscription(ctx, userId))) return [];

    const all = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", archived))
      .take(Math.min((limit ?? 50) * 4, 800));

    const filtered = all
      .filter((m) => !store || m.store === store)
      .slice(0, limit);

    return filtered.map(({ embedding: _e, ...rest }) => rest);
  },
});

export const listMessages = query({
  args: {
    limit: v.optional(v.number()),
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100, sinceMs }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    if (!(await hasActiveSubscription(ctx, userId))) return [];

    const msgs = await ctx.db
      .query("crystalMessages")
      .withIndex("by_timestamp")
      .order("desc")
      .filter((q) => q.eq(q.field("userId"), userId))
      .take(limit);

    if (sinceMs) return msgs.filter((m) => m.timestamp >= sinceMs);
    return msgs;
  },
});
