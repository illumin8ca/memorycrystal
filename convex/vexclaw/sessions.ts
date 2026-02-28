import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createSession = mutation({
  args: {
    channel: v.string(),
    startedAt: v.number(),
    lastActiveAt: v.number(),
    messageCount: v.number(),
    memoryCount: v.number(),
    summary: v.optional(v.string()),
    participants: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("vexclawSessions", args);
  },
});

export const createWakeState = mutation({
  args: {
    sessionId: v.id("vexclawSessions"),
    injectedMemoryIds: v.array(v.id("vexclawMemories")),
    wakePrompt: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("vexclawWakeState", args);
  },
});

export const getActiveMemories = query({
  args: { channel: v.optional(v.string()), limit: v.number() },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("vexclawMemories")
      .withIndex("by_last_accessed", (q) => q.gte("lastAccessedAt", 0))
      .filter((q) => q.eq("archived", false as unknown as never));
    if (args.channel) {
      q = q.filter((q) => q.eq("channel", args.channel));
    }
    return q.take(args.limit);
  },
});
