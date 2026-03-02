import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

const nowMs = () => Date.now();
const MAX_BATCH = 200;

const cleanupInput = v.object({
  sensoryTtlHours: v.optional(v.number()),
  strengthFloor: v.optional(v.float64()),
});

export const getMemoriesForCleanup = internalQuery({
  args: { userId: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId).eq("archived", false))
      .take(args.limit);
  },
});

export const getAssociationsByFrom = internalQuery({
  args: { memoryId: v.id("crystalMemories"), limit: v.number() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("crystalAssociations")
      .withIndex("by_from", (q: any) => q.eq("fromMemoryId", args.memoryId as never))
      .take(args.limit);
  },
});

export const getAssociationsByTo = internalQuery({
  args: { memoryId: v.id("crystalMemories"), limit: v.number() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("crystalAssociations")
      .withIndex("by_to", (q: any) => q.eq("toMemoryId", args.memoryId as never))
      .take(args.limit);
  },
});

export const deleteAssociation = internalMutation({
  args: { associationId: v.id("crystalAssociations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.associationId);
  },
});

export const deleteMemory = internalMutation({
  args: { memoryId: v.id("crystalMemories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.memoryId);
  },
});

export const archiveWeakMemory = internalMutation({
  args: { memoryId: v.id("crystalMemories"), archivedAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memoryId, { archived: true, archivedAt: args.archivedAt });
  },
});

const deleteAssociationsForMemory = async (ctx: any, memoryId: string) => {
  const outgoing = await ctx.runQuery(internal.crystal.cleanup.getAssociationsByFrom, { memoryId, limit: 200 });
  const incoming = await ctx.runQuery(internal.crystal.cleanup.getAssociationsByTo, { memoryId, limit: 200 });
  for (const association of [...outgoing, ...incoming]) {
    await ctx.runMutation(internal.crystal.cleanup.deleteAssociation, { associationId: association._id });
  }
  return outgoing.length + incoming.length;
};

export const runCleanup = action({
  args: cleanupInput,
  handler: async (ctx, args) => {
    const now = nowMs();
    const sensoryTtlMs = Math.max(args.sensoryTtlHours ?? 24, 1) * 60 * 60 * 1000;
    const strengthFloor = Math.max(args.strengthFloor ?? 0.1, 0);

    const userIds: string[] = await ctx.runQuery(internal.crystal.userProfiles.listAllUserIds, {});

    let deletedSensory = 0;
    let archivedByStrength = 0;
    let removedAssociations = 0;
    let errors = 0;

    for (const userId of userIds) {
      const memoryBatch: any[] = await ctx.runQuery(internal.crystal.cleanup.getMemoriesForCleanup, {
        userId,
        limit: MAX_BATCH + 1,
      });

      const memories = memoryBatch.slice(0, MAX_BATCH);
      const deferred = Math.max(0, memoryBatch.length - MAX_BATCH);
      if (deferred > 0) {
        console.log(`[runCleanup] user ${userId}: deferred ${deferred} memories to next run`);
      }

      for (const memory of memories) {
        try {
          const isExpiredSensory = memory.store === "sensory" && now - memory.createdAt >= sensoryTtlMs;
          const isWeakMemory = memory.strength < strengthFloor;

          if (isExpiredSensory) {
            removedAssociations += await deleteAssociationsForMemory(ctx, memory._id);
            await ctx.runMutation(internal.crystal.cleanup.deleteMemory, { memoryId: memory._id });
            deletedSensory += 1;
            continue;
          }

          if (isWeakMemory) {
            await ctx.runMutation(internal.crystal.cleanup.archiveWeakMemory, { memoryId: memory._id, archivedAt: now });
            archivedByStrength += 1;
          }
        } catch (error) {
          errors += 1;
          console.log(`[runCleanup] failed to process memory ${memory._id}`, error);
        }
      }
    }

    return { deleted: deletedSensory, archived: archivedByStrength, removedAssociations, errors };
  },
});
