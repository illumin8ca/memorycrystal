import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

const snapshotInput = v.object({
  label: v.string(),
  description: v.optional(v.string()),
  createdBy: v.optional(v.union(v.literal("gerald"), v.literal("andy"))),
  sessionId: v.optional(v.id("vexclawSessions")),
  memoryIds: v.optional(v.array(v.id("vexclawMemories"))),
  semanticSummary: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  maxMemories: v.optional(v.number()),
});

const listInput = v.object({
  sessionId: v.optional(v.id("vexclawSessions")),
  limit: v.optional(v.number()),
});

const listMemoryIds = async (ctx: any, memoryIds: string[]) => {
  const snapshots = [];

  for (const memoryId of memoryIds) {
    const memory = await ctx.db.get(memoryId);
    if (!memory || memory.archived) {
      continue;
    }

    snapshots.push({
      memoryId: memoryId as Id<"vexclawMemories">,
      strength: memory.strength,
      content: memory.content,
      store: memory.store,
    });
  }

  return snapshots;
};

export const createCheckpoint = mutation({
  args: snapshotInput,
  handler: async (ctx, args) => {
    const requestedLimit = Math.min(Math.max(args.maxMemories ?? 12, 1), 50);
    const chosenIds = args.memoryIds?.length
      ? args.memoryIds
      : (
          await ctx.db
            .query("vexclawMemories")
            .withIndex("by_last_accessed", (q) => q.gte("lastAccessedAt", 0))
            .filter((q) => q.eq("archived", false as unknown as never))
            .take(requestedLimit)
        )
          .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
          .slice(0, requestedLimit)
          .map((memory) => memory._id);

    const snapshot = await listMemoryIds(ctx, chosenIds);
    const defaultSummary = snapshot
      .slice(0, 3)
      .map((entry) => `${entry.store}: ${entry.content.slice(0, 80)}`)
      .join("\n");

    const checkpointId = await ctx.db.insert("vexclawCheckpoints", {
      label: args.label,
      description: args.description,
      createdAt: Date.now(),
      createdBy: args.createdBy ?? "gerald",
      sessionId: args.sessionId,
      memorySnapshot: snapshot,
      semanticSummary: args.semanticSummary ?? defaultSummary,
      tags: args.tags ?? [],
    });

    return checkpointId;
  },
});

export const getCheckpoint = query({
  args: {
    checkpointId: v.id("vexclawCheckpoints"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.checkpointId);
  },
});

export const listCheckpoints = query({
  args: listInput,
  handler: async (ctx, args) => {
    const requestedLimit = Math.min(Math.max(args.limit ?? 20, 1), 100);
    const checkpoints = args.sessionId
      ? await ctx.db
          .query("vexclawCheckpoints")
          .filter((q) => q.eq("sessionId", args.sessionId as unknown as never))
          .order("desc")
          .take(requestedLimit)
      : await ctx.db
          .query("vexclawCheckpoints")
          .withIndex("by_created", (q) => q.gte("createdAt", 0))
          .order("desc")
          .take(requestedLimit);

    // already in desc order from the index; sort is a no-op safety net
    return checkpoints.sort((a, b) => b.createdAt - a.createdAt);
  },
});
