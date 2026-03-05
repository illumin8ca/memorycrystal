import { stableUserId } from "./auth";
import { query } from "../_generated/server";
import { v } from "convex/values";

const PAGE_SIZE = 25;

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
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
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
    page: v.optional(v.number()),
  },
  handler: async (ctx, { limit = PAGE_SIZE, store, archived = false, page = 0 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    if (!(await hasActiveSubscription(ctx, userId))) return [];

    const pageSize = Math.min(Math.max(Math.trunc(limit ?? PAGE_SIZE), 1), 100);
    const safePage = Math.max(Math.trunc(page ?? 0), 0);
    const skip = safePage * pageSize;

    const all = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", archived))
      .order("desc")
      .collect();

    const filtered = store ? all.filter((m) => m.store === store) : all;
    const page_items = filtered.slice(skip, skip + pageSize);

    return page_items.map(({ embedding: _e, ...rest }) => ({
      ...rest,
      totalCount: filtered.length,
    }));
  },
});

export const listMessages = query({
  args: {
    limit: v.optional(v.number()),
    sinceMs: v.optional(v.number()),
    page: v.optional(v.number()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, { limit = PAGE_SIZE, sinceMs, page = 0, role }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    if (!(await hasActiveSubscription(ctx, userId))) return [];

    const pageSize = Math.min(Math.max(Math.trunc(limit ?? PAGE_SIZE), 1), 100);
    const safePage = Math.max(Math.trunc(page ?? 0), 0);
    const skip = safePage * pageSize;

    const all = await ctx.db
      .query("crystalMessages")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const filtered = role ? all.filter((m) => m.role === role) : all;
    const since = sinceMs ? filtered.filter((m) => m.timestamp >= sinceMs) : filtered;
    const page_items = since.slice(skip, skip + pageSize);

    return page_items.map((m) => ({ ...m, totalCount: since.length }));
  },
});
