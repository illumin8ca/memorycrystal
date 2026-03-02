import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";

const nowMs = () => Date.now();
const MAX_BATCH = 500;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

const computeDecay = (
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
      .withIndex("by_user", (q) => q.eq("userId", identity.subject).eq("archived", false))
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
    if (!memory || memory.userId !== identity.subject) return;
    const patch: Record<string, unknown> = { strength: args.strength };
    if (args.archived) {
      patch.archived = true;
      patch.archivedAt = args.archivedAt ?? Date.now();
    }
    await ctx.db.patch(args.memoryId, patch);
  },
});

export const applyDecay = action({
  args: {
    ageOverrideDays: v.optional(v.number()),
  },
  handler: async (ctx, { ageOverrideDays }) => {
    const now = nowMs();
    const ageCap = ageOverrideDays ?? 30;

    // Get all user IDs and run decay per user
    const userIds: string[] = await ctx.runQuery(internal.crystal.userProfiles.listAllUserIds, {});

    let totalDecayed = 0;
    let totalArchived = 0;
    let totalErrors = 0;

    for (const userId of userIds) {
      const memoryBatch: any[] = await ctx.runQuery(internal.crystal.decay.getMemoriesForDecay, {
        userId,
        limit: MAX_BATCH + 1,
      });

      const memories = memoryBatch.slice(0, MAX_BATCH);
      const deferred = Math.max(0, memoryBatch.length - MAX_BATCH);
      if (deferred > 0) {
        console.log(`[applyDecay] user ${userId}: deferred ${deferred} memories to next run`);
      }

      for (const memory of memories) {
        try {
          const ageDays = (now - (memory.lastAccessedAt ?? memory.createdAt)) / (24 * 60 * 60 * 1000);
          if (ageDays < 0.001) continue;

          const nextStrength = computeDecay(
            memory.strength,
            Math.min(ageDays, ageCap),
            memory.accessCount,
            memory.valence,
            memory.arousal
          );

          if (nextStrength === memory.strength) continue;

          await ctx.runMutation(internal.crystal.decay.applyDecayPatch, {
            memoryId: memory._id,
            strength: nextStrength,
            archived: nextStrength < 0.1,
            archivedAt: now,
          });

          totalDecayed += 1;
          if (nextStrength < 0.1) totalArchived += 1;
        } catch (error) {
          totalErrors += 1;
          console.log(`[applyDecay] failed to decay memory ${memory._id}`, error);
        }
      }
    }

    return { decayed: totalDecayed, archived: totalArchived, errors: totalErrors };
  },
});
