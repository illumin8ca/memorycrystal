import { stableUserId } from "./auth";
import { query } from "../_generated/server";
import { v } from "convex/values";
import { type UserTier, TIER_LIMITS } from "../../shared/tierLimits";
import { resolveEffectiveUserId } from "./impersonation";
import { deriveTier } from "./userProfiles";

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
// Keep dashboard sampling intentionally small: crystalMemories rows include embeddings
// (~12KB each) and crystalMessages can include large content. Larger scans can exceed
// Convex's 16MB per-function read budget in production.
// Budget math: 16MB / ~14KB per memory row ≈ 1,170 rows max.
// We stay well under to leave headroom for other reads in the same transaction.
const DASHBOARD_MEMORY_SAMPLE_LIMIT = 75;
const DASHBOARD_MESSAGE_SAMPLE_LIMIT = 200;
// Maximum rows to scan for listing (memories have embeddings, so keep this small).
const LIST_MEMORIES_SCAN_LIMIT = 500;
const LIST_MESSAGES_SCAN_LIMIT = 500;
// Maximum rows to scan when counting memories for usage display.
// Even for unlimited users, we cap the scan to stay under read limits.
const USAGE_COUNT_SCAN_LIMIT = 800;

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
    asUserId: v.optional(v.string()),
    limit: v.optional(v.number()),
    store: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, { asUserId, limit = PAGE_SIZE, store, archived = false, page = 0 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const actorUserId = stableUserId(identity.subject);
    const userId = await resolveEffectiveUserId(ctx, actorUserId, asUserId);
    if (!(await isAllowedUser(ctx, userId))) return [];

    const pageSize = Math.min(Math.max(Math.trunc(limit ?? PAGE_SIZE), 1), 100);
    const safePage = Math.max(Math.trunc(page ?? 0), 0);
    const skip = safePage * pageSize;

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
    role: v.optional(v.string()),
  },
  handler: async (ctx, { asUserId, limit = PAGE_SIZE, sinceMs, page = 0, role }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const actorUserId = stableUserId(identity.subject);
    const userId = await resolveEffectiveUserId(ctx, actorUserId, asUserId);
    if (!(await isAllowedUser(ctx, userId))) return [];

    const pageSize = Math.min(Math.max(Math.trunc(limit ?? PAGE_SIZE), 1), 100);
    const safePage = Math.max(Math.trunc(page ?? 0), 0);
    const skip = safePage * pageSize;

    const scanLimit = Math.max(skip + pageSize, LIST_MESSAGES_SCAN_LIMIT);
    const sampled = await ctx.db
      .query("crystalMessages")
      .withIndex("by_user_time", (q) =>
        sinceMs ? q.eq("userId", userId).gte("timestamp", sinceMs) : q.eq("userId", userId)
      )
      .order("desc")
      .take(scanLimit + 1);

    const scanBounded = sampled.length > scanLimit;
    const bounded = sampled.slice(0, scanLimit);
    const filtered = role ? bounded.filter((m) => m.role === role) : bounded;
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

    // Derive tier inline to avoid runQuery overhead and share read budget.
    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    const latestProfile = profiles.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
    const tier = deriveTier(latestProfile);

    // Count memories inline with a safe scan cap to stay under 16MB read limit.
    // Each memory row is ~14KB (mainly the 1536-dim embedding). USAGE_COUNT_SCAN_LIMIT
    // rows × 14KB ≈ 11MB, leaving headroom for the profile read above.
    const scanCap = USAGE_COUNT_SCAN_LIMIT;

    const active = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q: any) => q.eq("userId", userId).eq("archived", false))
      .take(scanCap + 1);

    let approximate = false;
    let memoriesUsed: number;

    if (active.length > scanCap) {
      // User has more memories than we can safely scan. Report the cap.
      memoriesUsed = scanCap;
      approximate = true;
    } else {
      // Try to also count archived, within remaining budget.
      const remaining = Math.max(scanCap - active.length, 0);
      if (remaining > 0) {
        const archived = await ctx.db
          .query("crystalMemories")
          .withIndex("by_user", (q: any) => q.eq("userId", userId).eq("archived", true))
          .take(remaining + 1);
        if (archived.length > remaining) {
          memoriesUsed = active.length + remaining;
          approximate = true;
        } else {
          memoriesUsed = active.length + archived.length;
        }
      } else {
        memoriesUsed = active.length;
        approximate = true;
      }
    }

    return {
      memoriesUsed,
      memoriesLimit: STORAGE_LIMITS[tier],
      tier,
      messageTtlDays: MESSAGE_TTL_DAYS[tier],
      approximate,
    };
  },
});
