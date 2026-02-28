import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";

const relationTypes = v.union(
  v.literal("supports"),
  v.literal("contradicts"),
  v.literal("derives_from"),
  v.literal("co_occurred"),
  v.literal("generalizes"),
  v.literal("precedes")
);
type RelationType =
  | "supports"
  | "contradicts"
  | "derives_from"
  | "co_occurred"
  | "generalizes"
  | "precedes";

const associationDirection = v.union(v.literal("from"), v.literal("to"));
const SKIP_IF_RECENT_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ASSOC_TOTAL = 10000;
const MAX_SAMPLE_CAP = 100;

const associationInput = v.object({
  fromMemoryId: v.id("vexclawMemories"),
  toMemoryId: v.id("vexclawMemories"),
  relationshipType: relationTypes,
  weight: v.float64(),
});

const associationQueryInput = v.object({
  memoryId: v.id("vexclawMemories"),
  direction: v.optional(associationDirection),
  limit: v.optional(v.number()),
});

const buildAssociationsInput = v.object({
  maxSamples: v.optional(v.number()),
  neighborsPerMemory: v.optional(v.number()),
  similarityThreshold: v.optional(v.number()),
});

type AssocCandidate = {
  _id: string;
  _score?: number;
  score?: number;
};

const clampAssociationWeight = (weight: number) => Math.max(0.1, Math.min(1, weight));

export const upsertAssociation = mutation({
  args: associationInput,
  handler: async (ctx, args) => {
    if (args.fromMemoryId === args.toMemoryId) {
      throw new Error("Cannot associate a memory with itself");
    }

    const existing = await ctx.db
      .query("vexclawAssociations")
      .withIndex("by_from", (q) => q.eq("fromMemoryId", args.fromMemoryId))
      .filter((q) => q.eq("toMemoryId", args.toMemoryId as string))
      .take(1);

    if (existing.length > 0) {
      const existingAssoc = existing[0];
      await ctx.db.patch(existingAssoc._id, {
        relationshipType: args.relationshipType,
        weight: Math.max(existingAssoc.weight, args.weight),
        updatedAt: Date.now(),
      });
      return existingAssoc._id;
    }

    return ctx.db.insert("vexclawAssociations", {
      fromMemoryId: args.fromMemoryId,
      toMemoryId: args.toMemoryId,
      relationshipType: args.relationshipType,
      weight: args.weight,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getAssociationsForMemory = query({
  args: associationQueryInput,
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);
    const direction = args.direction ?? "from";

    const associations =
      direction === "from"
        ? await ctx.db
            .query("vexclawAssociations")
            .withIndex("by_from", (q) => q.eq("fromMemoryId", args.memoryId))
            .take(limit)
        : await ctx.db
            .query("vexclawAssociations")
            .withIndex("by_to", (q) => q.eq("toMemoryId", args.memoryId))
            .take(limit);

    return associations.sort((a, b) => b.weight - a.weight).map((association) => ({
        associationId: association._id,
        fromMemoryId: association.fromMemoryId,
        toMemoryId: association.toMemoryId,
        relationshipType: association.relationshipType,
        weight: association.weight,
      }));
  },
});

export const removeAssociation = mutation({
  args: {
    associationId: v.id("vexclawAssociations"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.associationId);
    if (!existing) {
      return null;
    }

    await ctx.db.delete(args.associationId);
    return { deleted: args.associationId };
  },
});

export const getMemoriesForAssociation = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("vexclawMemories")
      .filter((q: any) => q.eq("archived", false))
      .take(args.limit);
  },
});

export const hasRecentAssociationQuery = query({
  args: { memoryId: v.string(), cutoffMs: v.number() },
  handler: async (ctx, args) => {
    const recentAsSource = await ctx.db
      .query("vexclawAssociations")
      .withIndex("by_from", (q: any) => q.eq("fromMemoryId", args.memoryId as never))
      .filter((q: any) => q.gt("updatedAt", args.cutoffMs))
      .take(1);
    if (recentAsSource.length > 0) return true;
    const recentAsTarget = await ctx.db
      .query("vexclawAssociations")
      .withIndex("by_to", (q: any) => q.eq("toMemoryId", args.memoryId as never))
      .filter((q: any) => q.gt("updatedAt", args.cutoffMs))
      .take(1);
    return recentAsTarget.length > 0;
  },
});

export const getTotalAssociationCount = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const sample = await ctx.db.query("vexclawAssociations").take(args.limit + 1);
    return sample.length;
  },
});

export const upsertAssociationRecord = mutation({
  args: {
    fromMemoryId: v.string(),
    toMemoryId: v.string(),
    relationshipType: v.union(
      v.literal("supports"), v.literal("contradicts"), v.literal("derives_from"),
      v.literal("co_occurred"), v.literal("generalizes"), v.literal("precedes")
    ),
    weight: v.float64(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("vexclawAssociations")
      .withIndex("by_from", (q: any) => q.eq("fromMemoryId", args.fromMemoryId as never))
      .filter((q: any) => q.eq("toMemoryId", args.toMemoryId))
      .take(1);
    const weight = clampAssociationWeight(args.weight);
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, {
        relationshipType: args.relationshipType,
        weight: Math.max(existing[0].weight, weight),
        updatedAt: Date.now(),
      });
      return { created: false };
    }
    await ctx.db.insert("vexclawAssociations", {
      fromMemoryId: args.fromMemoryId as any,
      toMemoryId: args.toMemoryId as any,
      relationshipType: args.relationshipType,
      weight,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { created: true };
  },
});

export const buildAssociations = action({
  args: buildAssociationsInput,
  handler: async (ctx, args) => {
    const existingAssociations = await ctx.runQuery("vexclaw/associations:getTotalAssociationCount" as any, {
      limit: MAX_ASSOC_TOTAL + 1,
    });

    if (existingAssociations > MAX_ASSOC_TOTAL) {
      console.log(
        `[buildAssociations] existing associations exceed cap (${existingAssociations}/${MAX_ASSOC_TOTAL})`
      );
      return {
        processed: 0,
        created: 0,
        skipped: 0,
      };
    }

    const maxSamples = Math.min(Math.max(args.maxSamples ?? 180, 20), MAX_SAMPLE_CAP);
    const neighborsPerMemory = Math.min(Math.max(args.neighborsPerMemory ?? 6, 2), 20);
    const threshold = Math.min(Math.max(args.similarityThreshold ?? 0.75, 0.6), 0.99);
    const skipIfRecentBefore = Date.now() - SKIP_IF_RECENT_MS;

    const memories = (
      await ctx.runQuery("vexclaw/associations:getMemoriesForAssociation" as any, {
        limit: maxSamples,
      })
    ).sort((a: { lastAccessedAt: number }, b: { lastAccessedAt: number }) => b.lastAccessedAt - a.lastAccessedAt);

    let created = 0;
    let skipped = 0;
    let processed = 0;

    for (const source of memories) {
      const hasRecent = await ctx.runQuery(
        "vexclaw/associations:hasRecentAssociationQuery" as any,
        { memoryId: source._id, cutoffMs: skipIfRecentBefore }
      );
      if (hasRecent) {
        skipped += 1;
        continue;
      }

      processed += 1;

      const nearest = (await ctx.vectorSearch("vexclawMemories", "by_embedding", {
        vector: source.embedding,
        limit: neighborsPerMemory + 1,
        filter: (q: any) => q.eq("archived", false),
      })) as Array<AssocCandidate & { _id: string }>;

      for (const candidate of nearest) {
        if (candidate._id === source._id) {
          continue;
        }

        const score = candidate._score ?? candidate.score ?? 0;
        if (score < threshold) {
          continue;
        }

        const orderedFrom = source._id < candidate._id ? source._id : candidate._id;
        const orderedTo = source._id < candidate._id ? candidate._id : source._id;

        const result = await ctx.runMutation(
          "vexclaw/associations:upsertAssociationRecord" as any,
          {
            fromMemoryId: orderedFrom,
            toMemoryId: orderedTo,
            relationshipType: score > 0.93 ? "supports" : "co_occurred",
            weight: score,
          }
        );

        if (result.created) {
          created += 1;
        } else {
          skipped += 1;
        }
      }
    }

    return {
      processed,
      created,
      skipped,
    };
  },
});

// Helper queries for recall action (actions cannot use ctx.db directly)
export const listByFrom = query({
  args: { fromMemoryId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("vexclawAssociations")
      .withIndex("by_from", (q: any) => q.eq("fromMemoryId", args.fromMemoryId as never))
      .take(100);
  },
});

export const listByTo = query({
  args: { toMemoryId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("vexclawAssociations")
      .withIndex("by_to", (q: any) => q.eq("toMemoryId", args.toMemoryId as never))
      .take(100);
  },
});
