import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";

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

export const getMemoriesForDecay = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return ctx.db.query("vexclawMemories").filter((q) => q.eq("archived", false as unknown as never)).take(args.limit);
  },
});

export const applyDecayPatch = mutation({
  args: {
    memoryId: v.id("vexclawMemories"),
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

export const applyDecay = action({
  args: {
    ageOverrideDays: v.optional(v.number()),
  },
  handler: async (ctx, { ageOverrideDays }) => {
    const now = nowMs();
    const memoryBatch = await ctx.runQuery("vexclaw/decay:getMemoriesForDecay" as any, {
      limit: MAX_BATCH + 1,
    });
    const ageCap = ageOverrideDays ?? 30;
    const memories = memoryBatch.slice(0, MAX_BATCH);
    const deferred = Math.max(0, memoryBatch.length - MAX_BATCH);

    if (deferred > 0) {
      console.log(`[applyDecay] deferred ${deferred} memories to next run`);
    }

    let decayed = 0;
    let archived = 0;
    let errors = 0;

    for (const memory of memories) {
      try {
        const ageDays = (now - (memory.lastAccessedAt ?? memory.createdAt)) / (24 * 60 * 60 * 1000);

        if (ageDays < 0.001) {
          continue;
        }

        const nextStrength = computeDecay(
          memory.strength,
          Math.min(ageDays, ageCap),
          memory.accessCount,
          memory.valence,
          memory.arousal
        );

        if (nextStrength === memory.strength) {
          continue;
        }

        if (nextStrength < 0.1) {
          await ctx.runMutation("vexclaw/decay:applyDecayPatch" as any, {
            memoryId: memory._id,
            strength: nextStrength,
            archived: true,
            archivedAt: now,
          });
          archived += 1;
          decayed += 1;
          continue;
        }

        await ctx.runMutation("vexclaw/decay:applyDecayPatch" as any, {
          memoryId: memory._id,
          strength: nextStrength,
          archived: false,
          archivedAt: now,
        });
        decayed += 1;
      } catch (error) {
        errors += 1;
        console.log(`[applyDecay] failed to decay memory ${memory._id}`, error);
      }
    }

    return {
      decayed,
      archived,
      errors,
    };
  },
});
