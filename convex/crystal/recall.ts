import { stableUserId } from "./auth";
import { v } from "convex/values";
import { action, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

const nowMs = () => Date.now();
const millisecondsPerDay = 24 * 60 * 60 * 1000;

const vectorTakeMin = 20;
const vectorTakeMax = 100;
const minLimit = 1;
const maxLimit = 20;
const defaultLimit = 8;
const recencyDecayFactor = 0.1;

const memoryStore = v.union(
  v.literal("sensory"),
  v.literal("episodic"),
  v.literal("semantic"),
  v.literal("procedural"),
  v.literal("prospective")
);

const memoryCategory = v.union(
  v.literal("decision"),
  v.literal("lesson"),
  v.literal("person"),
  v.literal("rule"),
  v.literal("event"),
  v.literal("fact"),
  v.literal("goal"),
  v.literal("workflow"),
  v.literal("conversation")
);

type RecallCandidateDocument = {
  _id: string;
  store: string;
  category: string;
  title: string;
  content: string;
  strength: number;
  confidence: number;
  arousal: number;
  valence: number;
  accessCount: number;
  lastAccessedAt: number;
  createdAt: number;
  tags: string[];
  archived: boolean;
};

type RecallResult = {
  _score?: number;
  memoryId: string;
  store: string;
  category: string;
  title: string;
  content: string;
  strength: number;
  confidence: number;
  tags: string[];
  scoreValue: number;
  relation?: string;
};

const requestSchema = v.object({
  embedding: v.array(v.float64()),
  query: v.optional(v.string()),
  stores: v.optional(v.array(memoryStore)),
  categories: v.optional(v.array(memoryCategory)),
  tags: v.optional(v.array(v.string())),
  limit: v.optional(v.number()),
  includeAssociations: v.optional(v.boolean()),
  includeArchived: v.optional(v.boolean()),
  recentMemoryIds: v.optional(v.array(v.string())),
});

type RecallSet = {
  memories: RecallResult[];
  injectionBlock: string;
};

const clamp01 = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
};

const normalizeId = (value: string | { id: string }) => (typeof value === "string" ? value : value.id);

const recencyScore = (ageDays: number) => clamp01(Math.exp(-recencyDecayFactor * ageDays));

const normalizeTagList = (tags: string[]) =>
  tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

const dedupeById = (items: RecallResult[]) => {
  const seen = new Set<string>();
  const out: RecallResult[] = [];

  for (const item of items) {
    if (seen.has(item.memoryId)) {
      continue;
    }
    seen.add(item.memoryId);
    out.push(item);
  }

  return out;
};

/**
 * `ctx` is the Convex action context. This file uses action-only helpers
 * like `runQuery`, and the SDK typing does not expose complete context shapes
 * for these helpers in this file, so `any` is an intentional choice.
 */
const buildAssociationCandidates = async (ctx: any, userId: string, memoryId: string, limit: number) => {
  // In an Action context, ctx.db is not available — use ctx.runQuery to call a query function.
  // Fall back gracefully if associations aren't populated.
  const outgoing: any[] = await ctx.runQuery(
    internal.crystal.associations.listByFrom,
    { userId, fromMemoryId: memoryId }
  ).catch(() => []);

  const incoming: any[] = await ctx.runQuery(
    internal.crystal.associations.listByTo,
    { userId, toMemoryId: memoryId }
  ).catch(() => []);

  return [...outgoing, ...incoming]
    .map((association: { _id: string; relationshipType: string; weight: number; fromMemoryId: string | { id: string }; toMemoryId: string | { id: string } }) => ({
      _id: association._id,
      relationshipType: association.relationshipType,
      weight: association.weight,
      sourceId: normalizeId(association.fromMemoryId),
      targetId: normalizeId(association.toMemoryId),
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
};

const buildInjectionBlock = (memories: RecallResult[]) => {
  if (memories.length === 0) {
    return "## 🧠 Memory Crystal Memory Recall\nNo matching memories found.";
  }

  const lines = memories.map((memory) => {
    const relation = memory.relation ? ` (${memory.relation})` : "";
    return [
      `### ${memory.store.toUpperCase()}: ${memory.title}${relation}`,
      memory.content,
      `Tags: ${memory.tags.join(", ") || "none"} | Strength: ${(memory.strength ?? 0).toFixed(2)} | Confidence: ${(memory.confidence ?? 0).toFixed(2)} | Score: ${(memory.scoreValue ?? 0).toFixed(2)}`,
      "",
    ].join("\n");
  });

  return ["## 🧠 Memory Crystal Memory Recall", ...lines].join("\n");
};

/**
 * Look up crystalMemoryNodeLinks for a set of memory IDs.
 * Used by the recallMemories action to apply a knowledge-graph boost.
 */
export const getNodesForMemories = internalQuery({
  args: { userId: v.string(), memoryIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    // Look up crystalMemoryNodeLinks for each memoryId
    const links = await Promise.all(
      args.memoryIds.map((id) =>
        ctx.db
          .query("crystalMemoryNodeLinks")
          .withIndex("by_memory", (q) => q.eq("memoryId", id as any))
          .collect()
      )
    );
    return links.flat();
  },
});

export const searchMemoriesByText = internalQuery({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const [contentResults, titleResults] = await Promise.all([
      ctx.db
        .query("crystalMemories")
        .withSearchIndex("search_content", (q) =>
          q.search("content", args.query).eq("userId", args.userId).eq("archived", false)
        )
        .take(limit),
      ctx.db
        .query("crystalMemories")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.query).eq("userId", args.userId).eq("archived", false)
        )
        .take(limit),
    ]);

    // Dedupe by _id; title hits get a 15% score boost marker
    const seen = new Set<string>();
    const results: Array<{ _id: string; bm25Boost: number }> = [];

    for (const doc of titleResults) {
      if (!seen.has(doc._id as string)) {
        seen.add(doc._id as string);
        results.push({ _id: doc._id as string, bm25Boost: 0.15 });
      }
    }
    for (const doc of contentResults) {
      if (!seen.has(doc._id as string)) {
        seen.add(doc._id as string);
        results.push({ _id: doc._id as string, bm25Boost: 0.0 });
      }
    }

    return results;
  },
});

export const recallMemories = action({
  args: requestSchema,
  handler: async (ctx, args) => {
    const requestedLimit = Math.floor(args.limit ?? defaultLimit);
    const normalizedLimit = Math.min(Math.max(requestedLimit, minLimit), maxLimit);
    const vectorTake = Math.min(Math.max(normalizedLimit * 4, vectorTakeMin), vectorTakeMax);
    // Task 1: Default includeAssociations to true
    const includeAssociations = args.includeAssociations ?? true;
    const includeArchived = args.includeArchived ?? false;
    const requestedTags = args.tags?.length ? normalizeTagList(args.tags) : undefined;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);

    // Derive text query for BM25 hybrid search.
    // Passed as `query` from the plugin/mcp-server alongside the embedding.
    const textQuery: string = args.query ?? "";

    // Run vector search and BM25 text search in parallel
    const [vectorResults, textSearchResults] = await Promise.all([
      ctx.vectorSearch("crystalMemories", "by_embedding", {
        vector: args.embedding,
        limit: vectorTake,
        filter: (q: any) => q.eq("userId", userId),
      }) as Promise<Array<{ _id: string; _score: number }>>,
      textQuery.trim().length > 0
        ? ctx.runQuery(internal.crystal.recall.searchMemoriesByText, {
            userId,
            query: textQuery,
            limit: vectorTake,
          })
        : Promise.resolve([] as Array<{ _id: string; bm25Boost: number }>),
    ]);

    // Build BM25 boost map keyed by memory _id
    const bm25BoostMap = new Map<string, number>();
    for (const entry of textSearchResults as Array<{ _id: string; bm25Boost: number }>) {
      bm25BoostMap.set(entry._id, entry.bm25Boost);
    }

    // Fetch full documents for each vector result (vectorSearch only returns _id + _score)
    const rawResults = (
      await Promise.all(
        vectorResults.map(async (vr) => {
          const doc = await ctx.runQuery(internal.crystal.memories.getMemoryInternal, { memoryId: vr._id as any });
          if (!doc) return null;
          return { ...doc, _id: vr._id, _score: vr._score };
        })
      )
    ).filter((d) => d !== null) as Array<RecallCandidateDocument & { _id: string; _score: number; userId: string }>;

    const now = nowMs();

    const ranked = rawResults
      .filter((candidate) => {
        if (!includeArchived && candidate.archived) {
          return false;
        }

        if (args.stores?.length) {
          const hasStore = args.stores.some((store) => store === candidate.store);
          if (!hasStore) {
            return false;
          }
        }

        if (args.categories?.length) {
          const hasCategory = args.categories.some((category) => category === candidate.category);
          if (!hasCategory) {
            return false;
          }
        }

        if (requestedTags?.length) {
          const lowerTags = normalizeTagList(candidate.tags);
          const hasAllTags = requestedTags.every((tag) => lowerTags.includes(tag));
          if (!hasAllTags) {
            return false;
          }
        }

        return true;
      })
      .map((candidate) => {
        const vectorScore = clamp01(candidate._score ?? 0);
        const ageDays = Math.max(
          0,
          (now - (candidate.lastAccessedAt ?? candidate.createdAt ?? now)) / millisecondsPerDay
        );
        const recency = recencyScore(ageDays);
        const accessScore = clamp01((candidate.accessCount ?? 0) / 20);

        // Scoring formula:
        // - vectorScore (0.35): semantic similarity from embedding ANN
        // - strength (0.30): user/system assigned memory importance
        // - recency (0.20): exponential decay based on last access
        // - accessScore (0.10): normalized access frequency (cap 20 accesses)
        // - bm25Boost (0.05): keyword match bonus from FTS (if hybrid search enabled)
        // - nodeBoost (0.05): knowledge graph node linkage bonus
        // Note: components sum to 1.05 to allow slight upward pressure on well-connected memories
        const bm25Boost = bm25BoostMap.get(candidate._id) ?? 0;
        const scoreValue =
          candidate.strength * 0.3 + recency * 0.2 + accessScore * 0.1 + vectorScore * 0.35 + bm25Boost * 0.05;
        // nodeBoost applied in post-processing below

        return {
          memoryId: candidate._id,
          store: candidate.store,
          category: candidate.category,
          title: candidate.title,
          content: candidate.content,
          strength: candidate.strength,
          confidence: candidate.confidence,
          tags: candidate.tags,
          _score: candidate._score,
          scoreValue,
        } as RecallResult;
      })
      .sort((a, b) => b.scoreValue - a.scoreValue)
      .filter((result) => result.scoreValue >= 0.25)
      .slice(0, normalizedLimit);

    // Session deduplication: filter out memories already shown this session
    const recentMemoryIdSet = new Set<string>(args.recentMemoryIds ?? []);
    const sessionFiltered = recentMemoryIdSet.size > 0
      ? ranked.filter((r) => !recentMemoryIdSet.has(r.memoryId))
      : ranked;

    let finalMemories = dedupeById(sessionFiltered);

    // Task 3: Node/Relation Graph Boost
    // Look up crystalMemoryNodeLinks for all final memories and boost scores for
    // well-connected memories (linkConfidence > 0.7).
    const finalMemoryIds = finalMemories.map((m) => m.memoryId);
    if (finalMemoryIds.length > 0) {
      const nodeLinks: Array<{ memoryId: string; linkConfidence: number }> = await ctx
        .runQuery(internal.crystal.recall.getNodesForMemories, {
          userId,
          memoryIds: finalMemoryIds,
        })
        .catch(() => []);

      // Build a set of memoryIds that have at least one high-confidence node link
      const boostedMemoryIds = new Set<string>(
        nodeLinks
          .filter((link) => link.linkConfidence > 0.7)
          .map((link) => link.memoryId)
      );

      if (boostedMemoryIds.size > 0) {
        finalMemories = finalMemories.map((memory) => {
          if (boostedMemoryIds.has(memory.memoryId)) {
            return { ...memory, scoreValue: memory.scoreValue + 0.05 };
          }
          return memory;
        });
        // Re-sort after applying node boost
        finalMemories = finalMemories.sort((a, b) => b.scoreValue - a.scoreValue);
      }
    }

    if (!includeAssociations || ranked.length === 0) {
      const injectionBlock = buildInjectionBlock(finalMemories);

      for (const memory of finalMemories) {
        await ctx
          .runMutation("crystal/memories:updateMemoryAccess" as any, { memoryId: memory.memoryId })
          .catch(() => {});
      }

      return {
        memories: finalMemories,
        injectionBlock,
      } as RecallSet;
    }

    // Task 2: Batch Association Lookup
    // Collect all final memory IDs and run buildAssociationCandidates concurrently
    // instead of sequentially, reducing round trips.
    const linkedIds = new Set<string>(finalMemories.map((result) => result.memoryId));

    const allAssocCandidatesNested = await Promise.all(
      finalMemories.map((topResult) => buildAssociationCandidates(ctx, userId, topResult.memoryId, 3))
    );

    // Expand associated memories — fetch docs and score them
    const expanded: RecallResult[] = [];

    for (let i = 0; i < finalMemories.length; i++) {
      const topResult = finalMemories[i];
      const assocCandidates = allAssocCandidatesNested[i];

      for (const assoc of assocCandidates) {
        const candidateId = topResult.memoryId === assoc.sourceId ? assoc.targetId : assoc.sourceId;
        if (!candidateId || linkedIds.has(candidateId) || candidateId === topResult.memoryId) {
          continue;
        }

        const linked = await ctx.runQuery(internal.crystal.memories.getMemoryInternal, { memoryId: candidateId as any });
        if (!linked || linked.userId !== userId || (!includeArchived && linked.archived)) {
          continue;
        }

        const candidate = linked as RecallCandidateDocument & { _id: string };
        linkedIds.add(candidateId);

        const ageDays = Math.max(0, (now - (candidate.lastAccessedAt ?? candidate.createdAt)) / millisecondsPerDay);
        const recency = recencyScore(ageDays);
        const accessScore = Math.min((candidate.accessCount ?? 0) / 20, 1);
        const associationWeight = Math.max(0.1, Math.min(assoc.weight, 1));
        const scoreValue = topResult.scoreValue * associationWeight * 0.25 + recency * 0.15 + accessScore * 0.1;

        expanded.push({
          memoryId: candidateId,
          store: candidate.store,
          category: candidate.category,
          title: candidate.title,
          content: candidate.content,
          strength: candidate.strength,
          confidence: candidate.confidence,
          tags: candidate.tags,
          scoreValue,
          relation: `${assoc.relationshipType} (${assoc.weight.toFixed(2)})`,
        });
      }
    }

    const memories = dedupeById([...finalMemories, ...expanded])
      .sort((a, b) => b.scoreValue - a.scoreValue)
      .slice(0, normalizedLimit);

    for (const memory of finalMemories) {
      await ctx
        .runMutation("crystal/memories:updateMemoryAccess" as any, { memoryId: memory.memoryId })
        .catch(() => {});
    }

    return {
      memories,
      injectionBlock: buildInjectionBlock(memories),
    } as RecallSet;
  },
});
