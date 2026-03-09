import { stableUserId } from "./auth";
import { query } from "../_generated/server";
import { v } from "convex/values";
import { type UserTier, TIER_LIMITS } from "../../shared/tierLimits";
import { resolveEffectiveUserId } from "./impersonation";
import { deriveTier } from "./userProfiles";
import {
  getDashboardTotals,
} from "./dashboardTotals";

const STORAGE_LIMITS: Record<UserTier, number | null> = {
  free: TIER_LIMITS.free.memories,
  starter: TIER_LIMITS.starter.memories,
  pro: TIER_LIMITS.pro.memories,
  ultra: TIER_LIMITS.ultra.memories,
  unlimited: TIER_LIMITS.unlimited.memories,
};
const MESSAGE_TTL_DAYS: Record<UserTier, number> = {
  free: TIER_LIMITS.free.stmTtlDays ?? 30,
  starter: TIER_LIMITS.starter.stmTtlDays ?? 60,
  pro: TIER_LIMITS.pro.stmTtlDays ?? 90,
  ultra: TIER_LIMITS.ultra.stmTtlDays ?? 365,
  unlimited: TIER_LIMITS.unlimited.stmTtlDays ?? 365,
};
const PAGE_SIZE = 25;
// Maximum rows to scan for listing (memories have embeddings, so keep this small).
const LIST_MEMORIES_SCAN_LIMIT = 500;
const LIST_MESSAGES_SCAN_LIMIT = 500;
// Search is bounded separately to avoid loading full datasets while still allowing
// pagination over the first window of matches.
const LIST_MEMORIES_SEARCH_LIMIT = 250;
const LIST_MESSAGES_SEARCH_LIMIT = 200;

const normalizeSearch = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed?.length ? trimmed : undefined;
};

const clampPageValue = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(Math.trunc(value), min), max);
};

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
  args: { asUserId: v.optional(v.string()) },
  handler: async (ctx, { asUserId }) => {
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
    const actorUserId = stableUserId(identity.subject);
    const userId = await resolveEffectiveUserId(ctx, actorUserId, asUserId);
    if (!(await isAllowedUser(ctx, userId))) {
      return {
        totalMemories: 0,
        totalMessages: 0,
        memoriesByStore: {},
        activeStores: 0,
        recentActivity: [],
      };
    }

    const totals = await getDashboardTotals(ctx, userId);

    return {
      totalMemories: totals.activeMemories,
      totalMessages: totals.totalMessages,
      memoriesByStore: totals.activeMemoriesByStore,
      activeStores: totals.activeStoreCount,
      recentActivity: totals.lastCaptureCreatedAt
        ? [
            {
              title: totals.lastCaptureTitle ?? "",
              store: totals.lastCaptureStore ?? "sensory",
              createdAt: totals.lastCaptureCreatedAt,
            },
          ]
        : [],
    };
  },
});

export const listMemories = query({
  args: {
    asUserId: v.optional(v.string()),
    limit: v.optional(v.number()),
    store: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    page: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, {
    asUserId,
    limit = PAGE_SIZE,
    store,
    archived = false,
    page = 0,
    search,
  }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const actorUserId = stableUserId(identity.subject);
    const userId = await resolveEffectiveUserId(ctx, actorUserId, asUserId);
    if (!(await isAllowedUser(ctx, userId))) return [];

    const pageSize = clampPageValue(limit ?? PAGE_SIZE, 1, 100);
    const safePage = Math.max(Math.trunc(page ?? 0), 0);
    const skip = safePage * pageSize;
    const normalizedSearch = normalizeSearch(search);

    if (normalizedSearch) {
      const queryWindow = skip + pageSize;
      const scanWindow = Math.min(
        Math.max((store ? queryWindow * 4 : queryWindow * 2), pageSize),
        LIST_MEMORIES_SEARCH_LIMIT
      );

      const [titleResults, contentResults] = await Promise.all([
        ctx.db
          .query("crystalMemories")
          .withSearchIndex("search_title", (q) =>
            q.search("title", normalizedSearch).eq("userId", userId).eq("archived", archived)
          )
          .take(scanWindow + 1),
        ctx.db
          .query("crystalMemories")
          .withSearchIndex("search_content", (q) =>
            q.search("content", normalizedSearch).eq("userId", userId).eq("archived", archived)
          )
          .take(scanWindow + 1),
      ]);

      const seenIds = new Set<string>();
      const merged: Array<any> = [];

      for (const row of titleResults.concat(contentResults)) {
        if (!row || seenIds.has(row._id)) continue;
        seenIds.add(row._id);
        merged.push(row);
      }

      const scanBounded =
        titleResults.length > scanWindow || contentResults.length > scanWindow;
      const filtered = store ? merged.filter((m) => m.store === store) : merged;
      const pageItems = filtered.slice(skip, skip + pageSize);
      const totalCount = filtered.length + (scanBounded ? 1 : 0);

      return pageItems.map(({ embedding: _e, ...rest }) => ({
        ...rest,
        totalCount,
        statsNote: scanBounded
          ? `Search results are approximate; scanned latest ${scanWindow} records from each index.`
          : undefined,
      }));
    }

    // Scan a bounded window instead of .collect() to stay under 16MB read limit.
    // When filtering by store, we need extra rows since we'll discard non-matching ones.
    const scanLimit = store
      ? Math.min((skip + pageSize) * 10, LIST_MEMORIES_SCAN_LIMIT)
      : Math.min(skip + pageSize, LIST_MEMORIES_SCAN_LIMIT);

    const sampled = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", archived))
      .order("desc")
      .take(scanLimit + 1);

    const scanBounded = sampled.length > scanLimit;
    const bounded = sampled.slice(0, scanLimit);
    const filtered = store ? bounded.filter((m) => m.store === store) : bounded;
    const page_items = filtered.slice(skip, skip + pageSize);

    return page_items.map(({ embedding: _e, ...rest }) => ({
      ...rest,
      totalCount: filtered.length,
      statsNote: scanBounded
        ? `Results are approximate; scanned latest ${scanLimit} records.`
        : undefined,
    }));
  },
});

export const listMessages = query({
  args: {
    asUserId: v.optional(v.string()),
    limit: v.optional(v.number()),
    sinceMs: v.optional(v.number()),
    page: v.optional(v.number()),
    role: v.optional(v.union(v.literal("user"), v.literal("assistant"), v.literal("system"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, {
    asUserId,
    limit = PAGE_SIZE,
    sinceMs,
    page = 0,
    role,
    search,
  }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const actorUserId = stableUserId(identity.subject);
    const userId = await resolveEffectiveUserId(ctx, actorUserId, asUserId);
    if (!(await isAllowedUser(ctx, userId))) return [];

    const pageSize = clampPageValue(limit ?? PAGE_SIZE, 1, 100);
    const safePage = Math.max(Math.trunc(page ?? 0), 0);
    const skip = safePage * pageSize;
    const normalizedSearch = normalizeSearch(search);
    const normalizedRole =
      role === "user" || role === "assistant" || role === "system" ? role : undefined;

    if (normalizedSearch) {
      const scanLimit = Math.min(
        Math.max((skip + pageSize) * 2, pageSize),
        LIST_MESSAGES_SEARCH_LIMIT
      );

      const sampled = await ctx.db
        .query("crystalMessages")
        .withSearchIndex("search_content", (q) => {
          let query = q.search("content", normalizedSearch).eq("userId", userId);
          if (normalizedRole) {
            query = query.eq("role", normalizedRole);
          }
          return query;
        })
        .take(scanLimit + 1);

      const scanBounded = sampled.length > scanLimit;
      const bounded = sampled.slice(0, scanLimit);
      const pageItems = bounded.slice(skip, skip + pageSize);
      const totalCount = bounded.length + (scanBounded ? 1 : 0);

      return pageItems.map((m) => ({
        ...m,
        totalCount,
        statsNote: scanBounded
          ? `Message search is approximate; searched latest ${scanLimit} records.`
          : undefined,
      }));
    }

    const scanLimit = Math.min(
      normalizedRole ? Math.max(skip + pageSize, pageSize) * 2 : skip + pageSize,
      LIST_MESSAGES_SCAN_LIMIT
    );

    const sampled = await ctx.db
      .query("crystalMessages")
      .withIndex("by_user_time", (q) =>
        sinceMs ? q.eq("userId", userId).gte("timestamp", sinceMs) : q.eq("userId", userId)
      )
      .order("desc")
      .take(scanLimit + 1);

    const scanBounded = sampled.length > scanLimit;
    const bounded = sampled.slice(0, scanLimit);
    const filtered = normalizedRole ? bounded.filter((m) => m.role === normalizedRole) : bounded;
    const pageItems = filtered.slice(skip, skip + pageSize);

    return pageItems.map((m) => ({
      ...m,
      totalCount: filtered.length,
      statsNote: scanBounded
        ? `Message list is approximate; scanned latest ${scanLimit} records.`
        : undefined,
    }));
  },
});

export const getUsage = query({
  args: { asUserId: v.optional(v.string()) },
  handler: async (ctx, { asUserId }): Promise<{
    memoriesUsed: number;
    memoriesLimit: number | null;
    tier: UserTier;
    messageTtlDays: number;
    approximate?: boolean;
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
    const actorUserId = stableUserId(identity.subject);
    const userId = await resolveEffectiveUserId(ctx, actorUserId, asUserId);

    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    const latestProfile = profiles.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
    const tier = deriveTier(latestProfile);

    const totals = await getDashboardTotals(ctx, userId);

    return {
      memoriesUsed: totals.activeMemories,
      memoriesLimit: STORAGE_LIMITS[tier],
      tier,
      messageTtlDays: MESSAGE_TTL_DAYS[tier],
      approximate: false,
    };
  },
});
