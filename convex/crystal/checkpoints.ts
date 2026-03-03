import { stableUserId } from "./auth";
import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

const snapshotInput = v.object({
  label: v.string(),
  description: v.optional(v.string()),
  sessionId: v.optional(v.id("crystalSessions")),
  memoryIds: v.optional(v.array(v.id("crystalMemories"))),
  semanticSummary: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  maxMemories: v.optional(v.number()),
});

const listInput = v.object({
  sessionId: v.optional(v.id("crystalSessions")),
  limit: v.optional(v.number()),
});

const listMemoryIds = async (ctx: any, memoryIds: string[]) => {
  const snapshots = [];
  for (const memoryId of memoryIds) {
    const memory = await ctx.db.get(memoryId);
    if (!memory || memory.archived) continue;
    snapshots.push({
      memoryId: memoryId as Id<"crystalMemories">,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);

    const requestedLimit = Math.min(Math.max(args.maxMemories ?? 12, 1), 50);
    const chosenIds = args.memoryIds?.length
      ? args.memoryIds
      : (
          await ctx.db
            .query("crystalMemories")
            .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
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

    return ctx.db.insert("crystalCheckpoints", {
      userId,
      label: args.label,
      description: args.description,
      createdAt: Date.now(),
      createdBy: userId,
      sessionId: args.sessionId,
      memorySnapshot: snapshot,
      semanticSummary: args.semanticSummary ?? defaultSummary,
      tags: args.tags ?? [],
    });
  },
});

export const getCheckpoint = query({
  args: { checkpointId: v.id("crystalCheckpoints") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const checkpoint = await ctx.db.get(args.checkpointId);
    if (!checkpoint || checkpoint.userId !== stableUserId(identity.subject)) return null;
    return checkpoint;
  },
});

export const listCheckpoints = query({
  args: listInput,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    const requestedLimit = Math.min(Math.max(args.limit ?? 20, 1), 100);

    const checkpoints = await ctx.db
      .query("crystalCheckpoints")
      .withIndex("by_user", (q) => q.eq("userId", userId).gte("createdAt", 0))
      .order("desc")
      .take(requestedLimit);

    return checkpoints.sort((a, b) => b.createdAt - a.createdAt);
  },
});
