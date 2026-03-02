import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return ctx.db.insert("crystalSessions", { ...args, userId: identity.subject });
  },
});

export const createSessionInternal = internalMutation({
  args: {
    userId: v.string(),
    channel: v.string(),
    startedAt: v.number(),
    lastActiveAt: v.number(),
    messageCount: v.number(),
    memoryCount: v.number(),
    summary: v.optional(v.string()),
    participants: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("crystalSessions", args);
  },
});

export const createWakeState = mutation({
  args: {
    sessionId: v.id("crystalSessions"),
    injectedMemoryIds: v.array(v.id("crystalMemories")),
    wakePrompt: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return ctx.db.insert("crystalWakeState", { ...args, userId: identity.subject });
  },
});

export const createWakeStateInternal = internalMutation({
  args: {
    userId: v.string(),
    sessionId: v.id("crystalSessions"),
    injectedMemoryIds: v.array(v.id("crystalMemories")),
    wakePrompt: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("crystalWakeState", args);
  },
});

export const getActiveMemories = query({
  args: { channel: v.optional(v.string()), limit: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    let q = ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false));

    if (args.channel) {
      q = q.filter((q) => q.eq(q.field("channel"), args.channel)) as typeof q;
    }

    return q.take(args.limit);
  },
});
