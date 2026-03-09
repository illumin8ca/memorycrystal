import { stableUserId } from "./auth";
import { query } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

type UserTier = "free" | "starter" | "pro" | "ultra" | "unlimited";
const STORAGE_LIMITS: Record<UserTier, number | null> = {
  free: 500,
  starter: 10_000,
  pro: 25_000,
  ultra: null,
  unlimited: null,
};
const MESSAGE_TTL_DAYS: Record<UserTier, number> = {
  free: 30,
  starter: 60,
  pro: 90,
  ultra: 365,
  unlimited: 365,
};

const PAGE_SIZE = 25;
const DASHBOARD_MEMORY_SAMPLE_LIMIT = 500;
const DASHBOARD_MESSAGE_SAMPLE_LIMIT = 5000;

async function isAllowedUser(ctx: any, userId: string): Promise<boolean> {
  const profiles = await ctx.db
    .query("crystalUserProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const profile = profiles.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];

  if (!profile) return true;
  if (profile.subscriptionStatus === "cancelled") return false;
  return true;
}

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        totalMemories: 0,
        totalMessages: 0,
        memoriesByStore: {},
        activeStores: 0,
        recentActivity: [],
      };
    }
    const userId = stableUserId(identity.subject);
    if (!(await isAllowedUser(ctx, userId))) {
      return {
        totalMemories: 0,
        totalMessages: 0,
        memoriesByStore: {},
        activeStores: 0,
        recentActivity: [],
      };
    }

    const sampledMemories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .take(DASHBOARD_MEMORY_SAMPLE_LIMIT + 1);

    const sampledMessages = await ctx.db
      .query("crystalMessages")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .take(DASHBOARD_MESSAGE_SAMPLE_LIMIT + 1);

    const boundedMemories = sampledMemories.length > DASHBOARD_MEMORY_SAMPLE_LIMIT;
    const boundedMessages = sampledMessages.length > DASHBOARD_MESSAGE_SAMPLE_LIMIT;
    const memories = sampledMemories.slice(0, DASHBOARD_MEMORY_SAMPLE_LIMIT);
    const messages = sampledMessages.slice(0, DASHBOARD_MESSAGE_SAMPLE_LIMIT);

    const recent = [...memories]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((m) => ({ title: m.title, store: m.store, createdAt: m.createdAt }));

    const byStore: Record<string, number> = {};
    for (const m of memories) {
      byStore[m.store] = (byStore[m.store] ?? 0) + 1;
    }

    return {
      totalMemories: memories.length,
      totalMessages: messages.length,
      memoriesByStore: byStore,
      activeStores: Object.keys(byStore).length,
      recentActivity: recent,
      statsNote:
        boundedMemories || boundedMessages
          ? `Stats are approximate; sampled at ${DASHBOARD_MEMORY_SAMPLE_LIMIT} memories and ${DASHBOARD_MESSAGE_SAMPLE_LIMIT} messages.`
          : undefined,
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
    if (!identity) return [];
    const userId = stableUserId(identity.subject);
    if (!(await isAllowedUser(ctx, userId))) return [];

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
    if (!identity) return [];
    const userId = stableUserId(identity.subject);
    if (!(await isAllowedUser(ctx, userId))) return [];

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

export const getUsage = query({
  args: {},
  handler: async (ctx): Promise<{
    memoriesUsed: number;
    memoriesLimit: number | null;
    tier: UserTier;
    messageTtlDays: number;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        memoriesUsed: 0,
        memoriesLimit: 500,
        tier: "free",
        messageTtlDays: MESSAGE_TTL_DAYS.free,
      };
    }
    const userId = stableUserId(identity.subject);

    const tier = (await ctx.runQuery(internal.crystal.userProfiles.getUserTier, {
      userId,
    })) as UserTier;
    const memoriesUsed = await ctx.runQuery(internal.crystal.mcp.getMemoryCount, {
      userId,
    });

    return {
      memoriesUsed,
      memoriesLimit: STORAGE_LIMITS[tier],
      tier,
      messageTtlDays: MESSAGE_TTL_DAYS[tier],
    };
  },
});
