import { stableUserId } from "./auth";
import { query } from "../_generated/server";

const nowMs = () => Date.now();
const msPerDay = 24 * 60 * 60 * 1000;

// ─── Tier limits ─────────────────────────────────────────────────────────────
type UserTier = "free" | "starter" | "pro" | "ultra" | "unlimited";

const TIER_LIMITS: Record<
  UserTier,
  { memories: number | null; stmMessages: number | null; channels: number | null; stmTtlDays: number | null }
> = {
  free:      { memories: 500,    stmMessages: 500,    channels: 1,    stmTtlDays: 30   },
  starter:   { memories: 2_500,  stmMessages: 5_000,  channels: 5,    stmTtlDays: 90   },
  pro:       { memories: 10_000, stmMessages: 25_000, channels: null, stmTtlDays: 365  },
  ultra:     { memories: 50_000, stmMessages: null,   channels: null, stmTtlDays: null },
  unlimited: { memories: null,   stmMessages: null,   channels: null, stmTtlDays: null },
};

const TIER_ORDER: UserTier[] = ["free", "starter", "pro", "ultra", "unlimited"];

const PROFILE_SAMPLE_LIMIT = 20;
const ACTIVE_MEMORY_SAMPLE_LIMIT = 2000;
const ARCHIVED_MEMORY_SAMPLE_LIMIT = 2000;
const MESSAGE_SAMPLE_LIMIT = 5000;
const SESSION_SAMPLE_LIMIT = 5000;
const CHECKPOINT_SAMPLE_LIMIT = 5000;

function pickLatestProfile<T extends { updatedAt?: number }>(profiles: T[]): T | undefined {
  return profiles.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
}

const PRO_PRODUCT_ID = "f78ee82b-719e-4de8-850a-3e9eea3db4b0";
const ULTRA_PRODUCT_ID = "9d59dd76-5026-4079-95f7-bf594f71121b";
const UNLIMITED_EMAILS = ["andy@illumin8.ca", "admin@illumin8.ca", "andydoucet@gmail.com"];

function deriveTierFromProfile(
  profile: { subscriptionStatus?: string; plan?: string } | null | undefined,
  email: string,
): UserTier {
  if (UNLIMITED_EMAILS.includes(email.toLowerCase())) return "unlimited";
  if (profile?.subscriptionStatus === "unlimited") return "unlimited";
  if (profile?.subscriptionStatus !== "active" && profile?.subscriptionStatus !== "trialing") return "free";
  const plan = (profile?.plan ?? "").toLowerCase();
  if (plan === ULTRA_PRODUCT_ID || plan === "ultra") return "ultra";
  if (plan === PRO_PRODUCT_ID || plan === "pro") return "pro";
  if (plan === "starter") return "starter";
  return "pro";
}

// ─── getUserUsageStats ────────────────────────────────────────────────────────

export const getUserUsageStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const userId = stableUserId(identity.subject);
    const email = (identity.email ?? "").toLowerCase();

    // -- Derive tier from profile --
    const profileSample = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(PROFILE_SAMPLE_LIMIT);
    const profile = pickLatestProfile(profileSample);
    const tier = deriveTierFromProfile(profile, email);
    const limits = TIER_LIMITS[tier];
    const subscriptionStatus = profile?.subscriptionStatus ?? "inactive";

    // -- Active memories --
    const activeSample = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .take(ACTIVE_MEMORY_SAMPLE_LIMIT + 1);

    const archivedSample = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", true))
      .take(ARCHIVED_MEMORY_SAMPLE_LIMIT + 1);

    const activeBounded = activeSample.length > ACTIVE_MEMORY_SAMPLE_LIMIT;
    const archivedBounded = archivedSample.length > ARCHIVED_MEMORY_SAMPLE_LIMIT;
    const activeMemories = activeSample.slice(0, ACTIVE_MEMORY_SAMPLE_LIMIT);

    const totalMemories = activeMemories.length;
    const archivedMemories = archivedSample.slice(0, ARCHIVED_MEMORY_SAMPLE_LIMIT).length;

    // -- Breakdown by store --
    const byStoreRaw: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    let oldestMs: number | null = null;
    let newestMs: number | null = null;

    for (const m of activeMemories) {
      byStoreRaw[m.store] = (byStoreRaw[m.store] ?? 0) + 1;
      if (m.category) {
        byCategory[m.category] = (byCategory[m.category] ?? 0) + 1;
      }
      if (oldestMs === null || m.createdAt < oldestMs) oldestMs = m.createdAt;
      if (newestMs === null || m.createdAt > newestMs) newestMs = m.createdAt;
    }

    const byStore = {
      sensory: byStoreRaw["sensory"] ?? 0,
      episodic: byStoreRaw["episodic"] ?? 0,
      semantic: byStoreRaw["semantic"] ?? 0,
      procedural: byStoreRaw["procedural"] ?? 0,
      prospective: byStoreRaw["prospective"] ?? 0,
    };

    const now = nowMs();
    const oldestMemoryDays = oldestMs !== null ? Math.floor((now - oldestMs) / msPerDay) : null;
    const newestMemoryDays = newestMs !== null ? Math.floor((now - newestMs) / msPerDay) : null;

    // -- STM messages (cap at 5000 for performance) --
    const messageSample = await ctx.db
      .query("crystalMessages")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .take(MESSAGE_SAMPLE_LIMIT + 1);
    const messagesBounded = messageSample.length > MESSAGE_SAMPLE_LIMIT;
    const totalStmMessages = messageSample.slice(0, MESSAGE_SAMPLE_LIMIT).length;

    // -- Sessions --
    const sessionSample = await ctx.db
      .query("crystalSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(SESSION_SAMPLE_LIMIT + 1);
    const sessionsBounded = sessionSample.length > SESSION_SAMPLE_LIMIT;
    const totalSessions = sessionSample.slice(0, SESSION_SAMPLE_LIMIT).length;

    // -- Checkpoints --
    const checkpointSample = await ctx.db
      .query("crystalCheckpoints")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(CHECKPOINT_SAMPLE_LIMIT + 1);
    const checkpointsBounded = checkpointSample.length > CHECKPOINT_SAMPLE_LIMIT;
    const checkpoints = checkpointSample.slice(0, CHECKPOINT_SAMPLE_LIMIT).length;

    // -- Percentages --
    const memoriesUsedPercent =
      limits.memories !== null ? Math.min(100, Math.round((totalMemories / limits.memories) * 100)) : 0;
    const stmUsedPercent =
      limits.stmMessages !== null ? Math.min(100, Math.round((totalStmMessages / limits.stmMessages) * 100)) : 0;

    // -- upgradeAvailable --
    const tierIdx = TIER_ORDER.indexOf(tier);
    const upgradeAvailable = tierIdx < TIER_ORDER.indexOf("ultra");

    const usageNote =
      activeBounded || archivedBounded || messagesBounded || sessionsBounded || checkpointsBounded
        ? `Usage stats are approximate; sampling caps: active=${ACTIVE_MEMORY_SAMPLE_LIMIT}, archived=${ARCHIVED_MEMORY_SAMPLE_LIMIT}, messages=${MESSAGE_SAMPLE_LIMIT}, sessions=${SESSION_SAMPLE_LIMIT}, checkpoints=${CHECKPOINT_SAMPLE_LIMIT}.`
        : undefined;

    return {
      tier,
      plan: profile?.plan ?? tier,
      limits,
      usage: {
        totalMemories,
        archivedMemories,
        totalStmMessages,
        memoriesUsedPercent,
        stmUsedPercent,
        byStore,
        byCategory,
        oldestMemoryDays,
        newestMemoryDays,
        totalSessions,
        checkpoints,
      },
      usageNote,
      subscriptionStatus,
      upgradeAvailable,
    };
  },
});

export const getMemoryStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);

    const sampleLimit = 500;
    const sample = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .take(sampleLimit + 1);

    const bounded = sample.length > sampleLimit;
    const active = sample.slice(0, sampleLimit);
    const now = nowMs();

    // Also count archived
    const archivedSample = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", true))
      .take(sampleLimit);

    const archivedCount = archivedSample.length;

    const byStore = active.reduce<Record<string, number>>((acc, memory) => {
      acc[memory.store] = (acc[memory.store] ?? 0) + 1;
      return acc;
    }, {});

    const strengthSum = active.reduce((sum, memory) => sum + memory.strength, 0);
    const averageStrength = active.length > 0 ? strengthSum / active.length : 0;

    const last24h = now - msPerDay;
    const capturesLast24h = active.filter((memory) => memory.createdAt >= last24h).length;

    const strongest = active
      .slice()
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5)
      .map((memory) => ({
        memoryId: memory._id,
        title: memory.title,
        store: memory.store,
        strength: memory.strength,
        confidence: memory.confidence,
      }));

    return {
      totalMemories: active.length + archivedCount,
      archivedCount,
      byStore,
      avgStrength: averageStrength,
      recentCaptures: capturesLast24h,
      activeMemories: active.length,
      strongest,
      statsNote: bounded ? `Stats are approximate; capped at ${sampleLimit} memories.` : undefined,
    };
  },
});
