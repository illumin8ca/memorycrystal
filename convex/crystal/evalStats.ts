// evalStats query module
import { stableUserId } from "./auth";
import { query } from "../_generated/server";
import { v } from "convex/values";

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 14;

// Max docs to scan per query — embeddings are large (1536 floats each),
// so we keep this low to stay under Convex's 8MB read limit.
const MAX_SCAN = 512;

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
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    const now = Date.now();
    const stale30Cutoff = now - 30 * DAY_MS;
    const stale60Cutoff = now - 60 * DAY_MS;
    const stale90Cutoff = now - 90 * DAY_MS;

    // Pull from dashboardTotals for fast aggregate counts
    const totals = await ctx.db
      .query("crystalDashboardTotals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const totalMemories = totals?.activeMemories ?? 0;
    const byStore = {
      sensory: totals?.activeMemoriesByStore?.sensory ?? 0,
      episodic: totals?.activeMemoriesByStore?.episodic ?? 0,
      semantic: totals?.activeMemoriesByStore?.semantic ?? 0,
      procedural: totals?.activeMemoriesByStore?.procedural ?? 0,
      prospective: totals?.activeMemoriesByStore?.prospective ?? 0,
    };

    // For per-memory stats, scan a safe batch (no embeddings needed but Convex loads full docs)
    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .take(MAX_SCAN);

    let totalStrength = 0;
    let graphEnrichedCount = 0;
    let staleCount30d = 0;
    let staleCount60d = 0;
    let staleCount90d = 0;
    let neverRecalledCount = 0;

    for (const memory of memories) {
      if (memory.graphEnriched === true) graphEnrichedCount += 1;
      if (memory.lastAccessedAt <= stale30Cutoff) staleCount30d += 1;
      if (memory.lastAccessedAt <= stale60Cutoff) staleCount60d += 1;
      if (memory.lastAccessedAt <= stale90Cutoff) staleCount90d += 1;
      if (memory.accessCount === 0) neverRecalledCount += 1;
      totalStrength += memory.strength;
    }

    const scanned = memories.length;
    // Scale up enriched/stale counts proportionally if we hit the scan cap
    const scale = scanned > 0 && totalMemories > scanned ? totalMemories / scanned : 1;

    const avgStrength = scanned > 0 ? totalStrength / scanned : 0;
    const graphEnrichedPercent = scanned > 0
      ? Math.round((graphEnrichedCount / scanned) * 100)
      : 0;

    return {
      totalMemories,
      graphEnrichedCount: Math.round(graphEnrichedCount * scale),
      graphEnrichedPercent,
      staleCount30d: Math.round(staleCount30d * scale),
      staleCount60d: Math.round(staleCount60d * scale),
      staleCount90d: Math.round(staleCount90d * scale),
      neverRecalledCount: Math.round(neverRecalledCount * scale),
      avgStrength,
      byStore,
      scannedSample: scanned,
    };
  },
});

export const getTopRecalledMemories = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    const safeLimit = clampLimit(limit);

    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .take(MAX_SCAN);

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
      .sort((a, b) => b.accessCount - a.accessCount || b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, safeLimit);
  },
});

export const getNeverRecalledMemories = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    const safeLimit = clampLimit(limit);

    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .take(MAX_SCAN);

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
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    const now = Date.now();
    const startMs = now - TREND_DAYS * DAY_MS;
    const dayKeys = buildRecentDayKeys();
    const buckets: TrendDayMap = Object.fromEntries(dayKeys.map((key) => [key, 0]));

    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .take(MAX_SCAN);

    for (const memory of memories) {
      if (memory.createdAt < startMs) continue;
      const key = toDateKey(memory.createdAt);
      if (Object.prototype.hasOwnProperty.call(buckets, key)) {
        buckets[key] += 1;
      }
    }

    return dayKeys.map((key) => ({ date: key, count: buckets[key] ?? 0 }));
  },
});

export const getGraphCoverageTrend = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    const now = Date.now();
    const startMs = now - TREND_DAYS * DAY_MS;
    const dayKeys = buildRecentDayKeys();

    const enrichedMap: CoverageTrendMap = Object.fromEntries(
      dayKeys.map((key) => [key, { enrichedCount: 0, totalCount: 0 }])
    );

    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .take(MAX_SCAN);

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
