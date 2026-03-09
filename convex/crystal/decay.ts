import { stableUserId } from "./auth";
import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { TIER_LIMITS } from "../../shared/tierLimits";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const TIER_MEMORY_LIMITS: Record<string, number> = {
  free: TIER_LIMITS.free.memories ?? 500,
  starter: TIER_LIMITS.starter.memories ?? 10_000,
  pro: TIER_LIMITS.pro.memories ?? 25_000,
  ultra: TIER_LIMITS.ultra.memories ?? 50_000,
  unlimited: TIER_LIMITS.unlimited.memories ?? 999_999,
};

// computeDecay is kept for potential future use (e.g. internal strength adjustments)
export const computeDecay = (
  strength: number,
  ageDays: number,
  accessCount: number,
  valence: number,
  arousal: number
) => {
  const isHighEmotion = Math.abs(valence) > 0.7 && arousal > 0.7;
  const baseDecay = isHighEmotion ? 0.01 : 0.02;
  const recallBoost = Math.min(accessCount * 0.002, 0.01);
  const adjustedDecay = Math.max(0.005, baseDecay - recallBoost);
  const amount = adjustedDecay * ageDays;
  return clamp(strength - amount);
};

export const getMemoriesForDecay = internalQuery({
  args: { userId: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId).eq("archived", false))
      .take(args.limit);
  },
});

export const applyDecayPatch = internalMutation({
  args: {
    memoryId: v.id("crystalMemories"),
    strength: v.float64(),
    archived: v.boolean(),
    archivedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { strength: args.strength };
    if (args.archived) {
      patch.archived = true;
      patch.archivedAt = args.archivedAt ?? Date.now();
    }
    await ctx.db.patch(args.memoryId, patch);
  },
});

// Public query still available for single-user contexts (authenticated)
export const getMemoriesForDecayAuth = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", stableUserId(identity.subject)).eq("archived", false))
      .take(args.limit);
  },
});

// Public patch for single-user authenticated contexts
export const applyDecayPatchAuth = mutation({
  args: {
    memoryId: v.id("crystalMemories"),
    strength: v.float64(),
    archived: v.boolean(),
    archivedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const memory = await ctx.db.get(args.memoryId);
    if (!memory || memory.userId !== stableUserId(identity.subject)) return;
    const patch: Record<string, unknown> = { strength: args.strength };
    if (args.archived) {
      patch.archived = true;
      patch.archivedAt = args.archivedAt ?? Date.now();
    }
    await ctx.db.patch(args.memoryId, patch);
  },
});

/**
 * Storage-pressure-based decay.
 *
 * Decay only fires for a user when they are at ≥90% of their tier memory limit.
 * When triggered, the oldest/weakest memories are archived to bring them back
 * to 85% of their limit.
 *
 * Scoring: combinedScore = strength * 0.4 + recencyScore * 0.6
 * (lower score = archived first)
 */
export const applyDecay = action({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const userIds: string[] = await ctx.runQuery(internal.crystal.userProfiles.listAllUserIds, {});
    let totalArchived = 0;

    for (const userId of userIds) {
      const tier: string = await ctx.runQuery(internal.crystal.userProfiles.getUserTier, { userId });
      const limit = TIER_MEMORY_LIMITS[tier] ?? TIER_MEMORY_LIMITS.free;

      // Fetch enough to determine if we're over threshold (limit + 1 so we know if there are more)
      const memories: any[] = await ctx.runQuery(internal.crystal.decay.getMemoriesForDecay, {
        userId,
        limit: limit + 1,
      });
      const activeCount = memories.length;

      // Skip if below 90% full
      if (activeCount < limit * 0.9) continue;

      const targetCount = Math.floor(limit * 0.85);
      const toArchive = activeCount - targetCount;
      if (toArchive <= 0) continue;

      console.log(
        `[applyDecay] user ${userId} tier=${tier}: ${activeCount}/${limit} active (${Math.round(activeCount / limit * 100)}% full), archiving ${toArchive} to reach ${targetCount}`
      );

      const now = Date.now();
      const scored = memories
        .map((m) => {
          const ageDays = (now - (m.lastAccessedAt ?? m.createdAt)) / 86400000;
          const recencyScore = Math.exp(-0.05 * ageDays); // slow decay curve
          const combinedScore = m.strength * 0.4 + recencyScore * 0.6;
          return { ...m, combinedScore };
        })
        .sort((a, b) => a.combinedScore - b.combinedScore); // lowest score first

      const candidates = scored.slice(0, toArchive);

      for (const memory of candidates) {
        if (!dryRun) {
          await ctx.runMutation(internal.crystal.decay.applyDecayPatch, {
            memoryId: memory._id,
            strength: memory.strength * 0.5, // halve strength as final warning before archival
            archived: true,
            archivedAt: now,
          });
        }
        totalArchived++;
      }
    }

    return { archived: totalArchived, dryRun: dryRun ?? false };
  },
});
