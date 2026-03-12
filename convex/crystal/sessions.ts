import { stableUserId } from "./auth";
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
    return ctx.db.insert("crystalSessions", { ...args, userId: stableUserId(identity.subject) });
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
    return ctx.db.insert("crystalWakeState", { ...args, userId: stableUserId(identity.subject) });
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

export const getLastSession = query({
  args: { channel: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    const channel = args.channel?.trim() || undefined;

    if (channel) {
      const channelSessions = await ctx.db
        .query("crystalSessions")
        .withIndex("by_user_channel", (q) => q.eq("userId", userId).eq("channel", channel))
        .order("desc")
        .take(1);
      return channelSessions[0] ?? null;
    }

    const sessions = await ctx.db
      .query("crystalSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);

    return sessions[0] ?? null;
  },
});

export const getActiveMemories = query({
  args: { channel: v.optional(v.string()), limit: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);

    let q = ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false));

    if (args.channel) {
      q = q.filter((q) => q.eq(q.field("channel"), args.channel)) as typeof q;
    }

    return q.take(args.limit);
  },
});
