import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";

const DEFAULT_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MAX_CONTENT_LENGTH = 8000; // truncate very long messages

const roleEnum = v.union(v.literal("user"), v.literal("assistant"), v.literal("system"));

const truncateContent = (content: string): string =>
  content.length > MAX_CONTENT_LENGTH ? content.slice(0, MAX_CONTENT_LENGTH) : content;

const normalizeText = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed?.length ? trimmed : undefined;
};

const toClampedLimit = (value: number | undefined, min: number, max: number, fallback: number): number => {
  const requested = Number.isFinite(value ?? NaN) ? (value as number) : fallback;
  return Math.min(Math.max(Math.floor(requested), min), max);
};

export const logMessage = mutation({
  args: {
    role: roleEnum,
    content: v.string(),
    channel: v.optional(v.string()),
    sessionKey: v.optional(v.string()),
    metadata: v.optional(v.string()),
    ttlDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ttlDays = Math.max(args.ttlDays ?? 14, 0);
    const ttlMs = ttlDays * 24 * 60 * 60 * 1000;

    const messageId = await ctx.db.insert("vexclawMessages", {
      role: args.role,
      content: truncateContent(args.content),
      channel: normalizeText(args.channel),
      sessionKey: normalizeText(args.sessionKey),
      timestamp: now,
      embedding: undefined,
      embedded: false,
      expiresAt: now + (ttlDays === 0 ? 0 : ttlMs || DEFAULT_TTL_MS),
      metadata: normalizeText(args.metadata),
    });

    return messageId;
  },
});

export const updateMessageEmbedding = mutation({
  args: {
    messageId: v.id("vexclawMessages"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      embedded: true,
      embedding: args.embedding,
    });

    return args.messageId;
  },
});

export const getRecentMessages = query({
  args: {
    limit: v.optional(v.number()),
    channel: v.optional(v.string()),
    sessionKey: v.optional(v.string()),
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const requestedLimit = toClampedLimit(args.limit, 1, 100, 20);
    const channel = normalizeText(args.channel);
    const sessionKey = normalizeText(args.sessionKey);
    const sinceMs = args.sinceMs;

    const baseQuery = channel
      ? ctx.db.query("vexclawMessages").withIndex("by_channel_time", (q: any) => {
          let query = q.eq("channel", channel as never);
          if (sinceMs !== undefined) {
            query = query.gte("timestamp", sinceMs);
          }
          return query;
        })
      : sessionKey
        ? ctx.db.query("vexclawMessages").withIndex("by_session_time", (q: any) => {
            let query = q.eq("sessionKey", sessionKey as never);
            if (sinceMs !== undefined) {
              query = query.gte("timestamp", sinceMs);
            }
            return query;
          })
        : ctx.db.query("vexclawMessages").withIndex("by_timestamp", (q) =>
            q.gte("timestamp", sinceMs ?? 0)
          );

    const recent = await baseQuery.order("desc").take(requestedLimit);

    return recent.reverse();
  },
});

export const getUnembeddedMessages = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const requestedLimit = toClampedLimit(args.limit, 1, 100, 50);

    return (
      await ctx.db
        .query("vexclawMessages")
        .withIndex("by_embedded", (q) => q.eq("embedded", false))
        .order("desc")
        .take(requestedLimit)
    ).reverse();
  },
});

export const getMessage = query({
  args: { messageId: v.id("vexclawMessages") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.messageId);
  },
});

export const expireOldMessages = mutation({
  args: {},
  handler: async (ctx, _args) => {
    const now = Date.now();
    const expiredMessages = await ctx.db
      .query("vexclawMessages")
      .withIndex("by_expires", (q) => q.lte("expiresAt", now))
      .take(200);

    let deleted = 0;
    for (const message of expiredMessages) {
      await ctx.db.delete(message._id);
      deleted += 1;
    }

    return { deleted };
  },
});

export const searchMessages = action({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
    channel: v.optional(v.string()),
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const channel = normalizeText(args.channel);
    const limit = toClampedLimit(args.limit, 1, 100, 10);
    // Only channel and role are valid filterFields in the vectorIndex definition
    const filter = channel !== undefined
      ? (q: any) => q.eq("channel", channel)
      : undefined;

    const vectorResults = (await ctx.vectorSearch("vexclawMessages", "by_embedding", {
      vector: args.embedding,
      limit,
      ...(filter ? { filter } : {}),
    })) as Array<{ _id: string; _score: number }>;

    const messages = await Promise.all(
      vectorResults.map(async (result) => {
        const message = await ctx.runQuery("vexclaw/messages:getMessage" as any, { messageId: result._id });
        if (!message) return null;
        // Apply sinceMs filter post-fetch (not a valid vector filterField)
        if (args.sinceMs !== undefined && message.timestamp < args.sinceMs) return null;
        return {
          messageId: result._id,
          role: message.role,
          content: message.content,
          channel: message.channel,
          sessionKey: message.sessionKey,
          timestamp: message.timestamp,
          score: result._score ?? 0,
        };
      })
    );

    return messages.filter((entry): entry is NonNullable<(typeof messages)[number]> => entry !== null);
  },
});
