import { stableUserId } from "./auth";
import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { type UserTier, TIER_LIMITS } from "../../shared/tierLimits";
import {
  applyDashboardTotalsDelta,
  getDashboardTotals,
} from "./dashboardTotals";

const DEFAULT_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MAX_CONTENT_LENGTH = 8000; // truncate very long messages

const TIER_TTL_DAYS: Record<UserTier, number> = {
  free: TIER_LIMITS.free.stmTtlDays ?? 30,
  starter: TIER_LIMITS.starter.stmTtlDays ?? 60,
  pro: TIER_LIMITS.pro.stmTtlDays ?? 90,
  ultra: TIER_LIMITS.ultra.stmTtlDays ?? 365,
  unlimited: TIER_LIMITS.unlimited.stmTtlDays ?? 365,
};

const MESSAGE_LIMITS: Record<UserTier, number | null> = {
  free: TIER_LIMITS.free.stmMessages,
  starter: TIER_LIMITS.starter.stmMessages,
  pro: TIER_LIMITS.pro.stmMessages,
  ultra: TIER_LIMITS.ultra.stmMessages,
  unlimited: TIER_LIMITS.unlimited.stmMessages,
};

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

type SearchMessageResult = {
  messageId: string;
  role: "user" | "assistant" | "system";
  content: string;
  channel?: string;
  sessionKey?: string;
  timestamp: number;
  score: number;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const now = Date.now();
    const userId = stableUserId(identity.subject);
    const tier = (await ctx.runQuery(internal.crystal.userProfiles.getUserTier, {
      userId,
    })) as UserTier;
    const limit = MESSAGE_LIMITS[tier];
    if (limit !== null) {
      const existingCount = await ctx.runQuery(internal.crystal.messages.getMessageCount, { userId });
      if (existingCount >= limit) {
        throw new Error("Storage limit reached. Upgrade at https://memorycrystal.ai/dashboard/settings");
      }
    }

    const ttlDays = Math.max(args.ttlDays ?? TIER_TTL_DAYS[tier], 0);
    const ttlMs = ttlDays * 24 * 60 * 60 * 1000;

    const messageId = await ctx.db.insert("crystalMessages", {
      userId,
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

    await applyDashboardTotalsDelta(
      ctx,
      userId,
      { totalMessagesDelta: 1 }
    );

    return messageId;
  },
});

// Internal version for server-side logging (MCP/cron) where userId is known
export const logMessageInternal = internalMutation({
  args: {
    userId: v.string(),
    role: roleEnum,
    content: v.string(),
    channel: v.optional(v.string()),
    sessionKey: v.optional(v.string()),
    metadata: v.optional(v.string()),
    ttlDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    const now = Date.now();
    const tier = (await ctx.runQuery(internal.crystal.userProfiles.getUserTier, {
      userId,
    })) as UserTier;
    const limit = MESSAGE_LIMITS[tier];
    if (limit !== null) {
      const existingCount = await ctx.runQuery(internal.crystal.messages.getMessageCount, { userId });
      if (existingCount >= limit) {
        throw new Error("Storage limit reached. Upgrade at https://memorycrystal.ai/dashboard/settings");
      }
    }

    const ttlDays = Math.max(rest.ttlDays ?? TIER_TTL_DAYS[tier], 0);
    const ttlMs = ttlDays * 24 * 60 * 60 * 1000;

    const messageId = await ctx.db.insert("crystalMessages", {
      userId,
      role: rest.role,
      content: truncateContent(rest.content),
      channel: normalizeText(rest.channel),
      sessionKey: normalizeText(rest.sessionKey),
      timestamp: now,
      embedding: undefined,
      embedded: false,
      expiresAt: now + (ttlDays === 0 ? 0 : ttlMs || DEFAULT_TTL_MS),
      metadata: normalizeText(rest.metadata),
    });

    await applyDashboardTotalsDelta(
      ctx,
      userId,
      { totalMessagesDelta: 1 }
    );

    return messageId;
  },
});

export const updateMessageEmbedding = internalMutation({
  args: {
    messageId: v.id("crystalMessages"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    // updateMessageEmbedding is called by the embedder background job — no user auth needed,
    // but we verify the record exists before patching.
    const existing = await ctx.db.get(args.messageId);
    if (!existing) throw new Error("Message not found");
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);

    const requestedLimit = toClampedLimit(args.limit, 1, 100, 20);
    const channel = normalizeText(args.channel);
    const sessionKey = normalizeText(args.sessionKey);
    const sinceMs = args.sinceMs;

    const baseQuery = channel
      ? ctx.db.query("crystalMessages").withIndex("by_channel_time", (q: any) => {
          let query = q.eq("channel", channel as never);
          if (sinceMs !== undefined) {
            query = query.gte("timestamp", sinceMs);
          }
          return query;
        })
      : sessionKey
        ? ctx.db.query("crystalMessages").withIndex("by_session_time", (q: any) => {
            let query = q.eq("sessionKey", sessionKey as never);
            if (sinceMs !== undefined) {
              query = query.gte("timestamp", sinceMs);
            }
            return query;
          })
        : ctx.db.query("crystalMessages").withIndex("by_timestamp", (q) =>
            q.gte("timestamp", sinceMs ?? 0)
          );

    const recent = await baseQuery
      .order("desc")
      .filter((q) => q.eq(q.field("userId"), userId))
      .take(requestedLimit);

    return recent.reverse();
  },
});

// Internal version for background jobs (no auth context)
export const getMessageCount = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const totals = await getDashboardTotals(ctx, userId);
    return totals.totalMessages;
  },
});

export const getUnembeddedMessages = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const requestedLimit = toClampedLimit(args.limit, 1, 100, 50);

    return (
      await ctx.db
        .query("crystalMessages")
        .withIndex("by_embedded", (q) => q.eq("embedded", false))
        .order("desc")
        .take(requestedLimit)
    ).reverse();
  },
});

// Public version requires auth
export const getUnembeddedMessagesForUser = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    const requestedLimit = toClampedLimit(args.limit, 1, 100, 50);

    return (
      await ctx.db
        .query("crystalMessages")
        .withIndex("by_embedded", (q) => q.eq("embedded", false))
        .filter((q) => q.eq(q.field("userId"), userId))
        .order("desc")
        .take(requestedLimit)
    ).reverse();
  },
});

export const getMessage = query({
  args: { messageId: v.id("crystalMessages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const message = await ctx.db.get(args.messageId);
    if (!message || message.userId !== stableUserId(identity.subject)) return null;
    return message;
  },
});

// Internal version for background jobs (embedder, etc.)
export const getMessageInternal = internalQuery({
  args: { messageId: v.id("crystalMessages") },
  handler: async (ctx, args) => ctx.db.get(args.messageId),
});

export const expireOldMessages = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    const now = Date.now();
    const expiredMessages = await ctx.db
      .query("crystalMessages")
      .withIndex("by_expires", (q) => q.lte("expiresAt", now))
      .take(200);

    let deleted = 0;
    for (const message of expiredMessages) {
      await ctx.db.delete(message._id);
      if (message.userId) {
        await applyDashboardTotalsDelta(ctx, message.userId, {
          totalMessagesDelta: -1,
        });
      }
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
  handler: async (ctx, args): Promise<SearchMessageResult[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);

    const channel = normalizeText(args.channel);
    const limit = toClampedLimit(args.limit, 1, 100, 10);
    // Only channel and role are valid filterFields in the vectorIndex definition
    const filter = channel !== undefined
      ? (q: any) => q.eq("channel", channel)
      : undefined;

    const vectorResults = (await ctx.vectorSearch("crystalMessages", "by_embedding", {
      vector: args.embedding,
      limit,
      ...(filter ? { filter } : {}),
    })) as Array<{ _id: string; _score: number }>;

    const messages: Array<SearchMessageResult | null> = await Promise.all(
      vectorResults.map(async (result) => {
        const message = await ctx.runQuery(internal.crystal.messages.getMessageInternal, { messageId: result._id as any });
        if (!message) return null;
        // Enforce userId ownership post-fetch
        if (message.userId !== userId) return null;
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

    return messages.filter((entry): entry is SearchMessageResult => entry !== null);
  },
});
