// evalStats query module
import { stableUserId } from "./auth";
import { query } from "../_generated/server";
import { v } from "convex/values";

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 14;


type TrendDayMap = Record<string, number>;

type CoverageTrendMap = Record<string, { enrichedCount: number; totalCount: number }>;

function clampLimit(value?: number, fallback = 10): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(20, Math.trunc(value)));
}

function toDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildRecentDayKeys(days = TREND_DAYS): string[] {
  const now = Date.now();
  const keys: string[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now - i * DAY_MS);
    keys.push(toDateKey(date.getTime()));
  }

  return keys;
}

export const getMemoryHealthStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = stableUserId(identity.subject);
    const now = Date.now();
    const stale30Cutoff = now - 30 * DAY_MS;
    const stale60Cutoff = now - 60 * DAY_MS;
    const stale90Cutoff = now - 90 * DAY_MS;

    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .collect();

    const byStore = {
      sensory: 0,
      episodic: 0,
      semantic: 0,
      procedural: 0,
      prospective: 0,
    };

    let totalStrength = 0;
    let graphEnrichedCount = 0;
    let staleCount30d = 0;
    let staleCount60d = 0;
    let staleCount90d = 0;
    let neverRecalledCount = 0;

    for (const memory of memories) {
      if (byStore[memory.store as keyof typeof byStore] !== undefined) {
        byStore[memory.store as keyof typeof byStore] += 1;
      }

      if (memory.graphEnriched === true) {
        graphEnrichedCount += 1;
      }

      if (memory.lastAccessedAt <= stale30Cutoff) {
        staleCount30d += 1;
      }

      if (memory.lastAccessedAt <= stale60Cutoff) {
        staleCount60d += 1;
      }

      if (memory.lastAccessedAt <= stale90Cutoff) {
        staleCount90d += 1;
      }

      if (memory.accessCount === 0) {
        neverRecalledCount += 1;
      }

      totalStrength += memory.strength;
    }

    const totalMemories = memories.length;
    const avgStrength = totalMemories > 0 ? totalStrength / totalMemories : 0;
    const graphEnrichedPercent = totalMemories > 0
      ? Math.round((graphEnrichedCount / totalMemories) * 100)
      : 0;

    return {
      totalMemories,
      graphEnrichedCount,
      graphEnrichedPercent,
      staleCount30d,
      staleCount60d,
      staleCount90d,
      neverRecalledCount,
      avgStrength,
      byStore,
    };
  },
});

export const getTopRecalledMemories = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = stableUserId(identity.subject);
    const safeLimit = clampLimit(limit);

    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .collect();

    return memories
      .map((memory) => ({
        memoryId: memory._id,
        title: memory.title,
        store: memory.store,
        category: memory.category,
        accessCount: memory.accessCount,
        strength: memory.strength,
        lastAccessedAt: memory.lastAccessedAt,
      }))
      .sort((a, b) => {
        if (b.accessCount !== a.accessCount) return b.accessCount - a.accessCount;
        if (b.lastAccessedAt !== a.lastAccessedAt) return b.lastAccessedAt - a.lastAccessedAt;
        return b.strength - a.strength;
      })
      .slice(0, safeLimit);
  },
});

export const getNeverRecalledMemories = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = stableUserId(identity.subject);
    const safeLimit = clampLimit(limit);

    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .collect();

    return memories
      .filter((memory) => memory.accessCount === 0)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, safeLimit)
      .map((memory) => ({
        memoryId: memory._id,
        title: memory.title,
        store: memory.store,
        category: memory.category,
        createdAt: memory.createdAt,
        strength: memory.strength,
      }));
  },
});

export const getCaptureTrend = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = stableUserId(identity.subject);
    const now = Date.now();
    const startMs = now - (TREND_DAYS * DAY_MS);
    const dayKeys = buildRecentDayKeys();
    const buckets: TrendDayMap = Object.fromEntries(dayKeys.map((key) => [key, 0]));

    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .collect();

    for (const memory of memories) {
      if (memory.createdAt < startMs) continue;

      const key = toDateKey(memory.createdAt);
      if (Object.prototype.hasOwnProperty.call(buckets, key)) {
        buckets[key] += 1;
      }
    }

    return dayKeys.map((key) => ({
      date: key,
      count: buckets[key] ?? 0,
    }));
  },
});

export const getGraphCoverageTrend = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = stableUserId(identity.subject);
    const now = Date.now();
    const startMs = now - (TREND_DAYS * DAY_MS);
    const dayKeys = buildRecentDayKeys();

    const enrichedMap: CoverageTrendMap = Object.fromEntries(
      dayKeys.map((key) => [key, { enrichedCount: 0, totalCount: 0 }])
    );

    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .collect();

    for (const memory of memories) {
      if (memory.createdAt >= startMs) {
        const totalKey = toDateKey(memory.createdAt);
        if (Object.prototype.hasOwnProperty.call(enrichedMap, totalKey)) {
          enrichedMap[totalKey].totalCount += 1;
        }
      }

      if (memory.graphEnrichedAt !== undefined && memory.graphEnrichedAt >= startMs) {
        const enrichedKey = toDateKey(memory.graphEnrichedAt);
        if (Object.prototype.hasOwnProperty.call(enrichedMap, enrichedKey)) {
          enrichedMap[enrichedKey].enrichedCount += 1;
        }
      }
    }

    return dayKeys.map((key) => ({
      date: key,
      enrichedCount: enrichedMap[key]?.enrichedCount ?? 0,
      totalCount: enrichedMap[key]?.totalCount ?? 0,
    }));
  },
});

