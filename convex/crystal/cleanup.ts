import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";

const nowMs = () => Date.now();
const MAX_BATCH = 200;

const cleanupInput = v.object({
  sensoryTtlHours: v.optional(v.number()),
  strengthFloor: v.optional(v.float64()),
});

export const getMemoriesForCleanup = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return ctx.db.query("crystalMemories").take(args.limit);
  },
});

export const getAssociationsByFrom = query({
  args: { memoryId: v.id("crystalMemories"), limit: v.number() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("crystalAssociations")
      .withIndex("by_from", (q: any) => q.eq("fromMemoryId", args.memoryId as never))
      .take(args.limit);
  },
});

export const getAssociationsByTo = query({
  args: { memoryId: v.id("crystalMemories"), limit: v.number() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("crystalAssociations")
      .withIndex("by_to", (q: any) => q.eq("toMemoryId", args.memoryId as never))
      .take(args.limit);
  },
});

export const deleteAssociation = mutation({
  args: { associationId: v.id("crystalAssociations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.associationId);
  },
});

export const deleteMemory = mutation({
  args: { memoryId: v.id("crystalMemories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.memoryId);
  },
});

export const archiveWeakMemory = mutation({
  args: { memoryId: v.id("crystalMemories"), archivedAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memoryId, { archived: true, archivedAt: args.archivedAt });
  },
});

const deleteAssociationsForMemory = async (ctx: any, memoryId: string) => {
  const outgoing = await ctx.runQuery("crystal/cleanup:getAssociationsByFrom" as any, {
    memoryId,
    limit: 200,
  });

  const incoming = await ctx.runQuery("crystal/cleanup:getAssociationsByTo" as any, {
    memoryId,
    limit: 200,
  });

  for (const association of [...outgoing, ...incoming]) {
    await ctx.runMutation("crystal/cleanup:deleteAssociation" as any, {
      associationId: association._id,
    });
  }

  return outgoing.length + incoming.length;
};

export const runCleanup = action({
  args: cleanupInput,
  handler: async (ctx, args) => {
    const now = nowMs();
    const sensoryTtlMs = Math.max(args.sensoryTtlHours ?? 24, 1) * 60 * 60 * 1000;
    const strengthFloor = Math.max(args.strengthFloor ?? 0.1, 0);

    const memoryBatch = await ctx.runQuery("crystal/cleanup:getMemoriesForCleanup" as any, {
      limit: MAX_BATCH + 1,
    });
    const memories = memoryBatch.slice(0, MAX_BATCH);
    const deferred = Math.max(0, memoryBatch.length - MAX_BATCH);
    if (deferred > 0) {
      console.log(`[runCleanup] deferred ${deferred} memories to next run`);
    }

    let archivedByStrength = 0;
    let deletedSensory = 0;
    let removedAssociations = 0;
    let errors = 0;

    for (const memory of memories) {
      try {
        const isExpiredSensory = memory.store === "sensory" && !memory.archived && now - memory.createdAt >= sensoryTtlMs;
        const isWeakMemory = !memory.archived && memory.strength < strengthFloor;

        if (isExpiredSensory) {
          removedAssociations += await deleteAssociationsForMemory(ctx, memory._id);
          await ctx.runMutation("crystal/cleanup:deleteMemory" as any, {
            memoryId: memory._id,
          });
          deletedSensory += 1;
          continue;
        }

        if (isWeakMemory) {
          await ctx.runMutation("crystal/cleanup:archiveWeakMemory" as any, {
            memoryId: memory._id,
            archivedAt: now,
          });
          archivedByStrength += 1;
        }
      } catch (error) {
        errors += 1;
        console.log(`[runCleanup] failed to process memory ${memory._id}`, error);
      }
    }

    return {
      deleted: deletedSensory,
      archived: archivedByStrength,
      errors,
    };
  },
});
