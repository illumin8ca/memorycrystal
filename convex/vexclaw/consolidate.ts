import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";

const dayMs = 24 * 60 * 60 * 1000;
const nowMs = () => Date.now();
const MAX_BATCH = 200;

const consolidationInput = v.object({
  sensoryMaxAgeHours: v.optional(v.number()),
  minClusterSize: v.optional(v.number()),
  maxSensorySamples: v.optional(v.number()),
  clusterThreshold: v.optional(v.float64()),
});

type MemoryRecord = {
  _id: string;
  store: string;
  category: string;
  title: string;
  content: string;
  embedding: number[];
  strength: number;
  confidence: number;
  valence: number;
  arousal: number;
  archived: boolean;
  accessCount: number;
  lastAccessedAt: number;
  createdAt: number;
  archivedAt?: number;
  source: string;
  tags: string[];
  promotedFrom?: string;
};

type ScoredCandidate = {
  _id: string;
  title: string;
  content: string;
  _score?: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const shortText = (value: string, limit: number) =>
  value.length > limit ? `${value.slice(0, limit).trim()}…` : value;

const normalize = (tags: string[]) =>
  Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))).sort();

const average = (vectors: number[][]) => {
  if (vectors.length === 0) {
    return [];
  }

  const width = vectors[0].length;
  const totals = new Array<number>(width).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < width; i += 1) {
      totals[i] += vector[i] ?? 0;
    }
  }

  return totals.map((sum) => sum / vectors.length);
};

const summarizeMemories = (docs: MemoryRecord[]) =>
  docs
    .map(
      (memory, index) => `${index + 1}. [${memory.store}] ${shortText(memory.title, 80)}\n${shortText(memory.content, 180)}`
    )
    .join("\n\n");

export const getSensoryMemories = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("vexclawMemories")
      .filter((q: any) => q.eq("store", "sensory"))
      .filter((q: any) => q.eq("archived", false))
      .take(args.limit);
  },
});

export const getMemoryForConsolidation = query({
  args: { memoryId: v.id("vexclawMemories") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.memoryId);
  },
});

export const archiveConsolidatedMemory = mutation({
  args: { memoryId: v.id("vexclawMemories"), archivedAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memoryId, { archived: true, archivedAt: args.archivedAt });
  },
});

export const insertConsolidatedMemory = mutation({
  args: {
    store: v.string(),
    category: v.string(),
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    strength: v.float64(),
    confidence: v.float64(),
    valence: v.float64(),
    arousal: v.float64(),
    accessCount: v.number(),
    lastAccessedAt: v.number(),
    createdAt: v.number(),
    source: v.string(),
    tags: v.array(v.string()),
    archived: v.boolean(),
    promotedFrom: v.optional(v.id("vexclawMemories")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("vexclawMemories", args as any);
  },
});

export const runConsolidation = action({
  args: consolidationInput,
  handler: async (ctx, args) => {
    const now = nowMs();
    const sensoryAgeMs = Math.max(args.sensoryMaxAgeHours ?? 24, 2) * 60 * 60 * 1000;
    const minClusterSize = Math.min(Math.max(args.minClusterSize ?? 2, 2), 12);
    const maxSensorySamples = Math.min(Math.max(args.maxSensorySamples ?? 200, 20), MAX_BATCH);
    const clusterThreshold = Math.min(Math.max(args.clusterThreshold ?? 0.75, 0.65), 0.98);
    const neighborWindow = 8;

    const sensory = (await ctx.runQuery("vexclaw/consolidate:getSensoryMemories" as any, {
      limit: MAX_BATCH + 1,
    })) as MemoryRecord[];

    const deferred = Math.max(0, sensory.length - MAX_BATCH);
    const sensoryBatch = sensory.slice(0, MAX_BATCH);
    if (deferred > 0) {
      console.log(`[runConsolidation] deferred ${deferred} sensory memories to next run`);
    }

    const candidates = sensoryBatch
      .filter((memory) => now - memory.createdAt >= sensoryAgeMs)
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, maxSensorySamples);

    const processed = new Set<string>();
    const createdEpisodic: string[] = [];
    const stats = {
      processed: 0,
      skipped: 0,
      promoted: 0,
      errors: 0,
    };

    for (const memory of candidates) {
      if (processed.has(memory._id)) {
        stats.skipped += 1;
        continue;
      }
      stats.processed += 1;

      try {
        const nearest = (await ctx.vectorSearch("vexclawMemories", "by_embedding", {
          vector: memory.embedding,
          limit: neighborWindow + 1,
          filter: (q: any) =>
            q.and(q.eq("store", "sensory"), q.eq("archived", false)),
        })) as unknown as ScoredCandidate[];

        const cluster = nearest
          .map((entry) => ({
            entry,
            score: clamp01(entry._score ?? 0),
          }))
          .filter((candidate) => candidate.score >= clusterThreshold)
          .map((candidate) => candidate.entry._id);

        for (const id of cluster) {
          processed.add(id);
        }

        if (cluster.length < minClusterSize) {
          stats.skipped += 1;
          continue;
        }

        const docs = (
          await Promise.all(
            cluster.map(async (memoryId) =>
              ctx.runQuery("vexclaw/consolidate:getMemoryForConsolidation" as any, {
                memoryId,
              }) as Promise<MemoryRecord | null>
            )
          )
        ).filter(
          (item): item is MemoryRecord =>
            item !== null && item.store === "sensory" && item.archived === false
        );

        if (docs.length < minClusterSize) {
          stats.skipped += 1;
          continue;
        }

        const base = docs[0];
        const embedding = average(docs.map((item) => item.embedding));
        if (embedding.length === 0) {
          stats.skipped += 1;
          continue;
        }

        const title = shortText(`Episodic cluster: ${docs.map((item) => item.title).join(" | ")}`, 110);
        const content = [
          `Source cluster summary (${docs.length} memories):`,
          "",
          summarizeMemories(docs),
        ].join("\n\n");

        const episodicId = await ctx.runMutation("vexclaw/consolidate:insertConsolidatedMemory" as any, {
          store: "episodic",
          category: "event",
          title,
          content,
          embedding,
          strength: clamp01(0.45 + Math.min(docs.length, 12) * 0.05),
          confidence: clamp01(0.55 + Math.min(docs.length, 20) * 0.02),
          valence: Math.min(1, docs.reduce((sum, item) => sum + item.valence, 0) / docs.length),
          arousal: Math.min(1, docs.reduce((sum, item) => sum + item.arousal, 0) / docs.length),
          accessCount: docs.length,
          lastAccessedAt: now,
          createdAt: now,
          source: "cron",
          tags: normalize(docs.flatMap((item) => item.tags)),
          archived: false,
          promotedFrom: base._id,
        });

        for (const item of docs) {
          await ctx.runMutation("vexclaw/consolidate:archiveConsolidatedMemory" as any, {
            memoryId: item._id,
            archivedAt: now,
          });
        }

        createdEpisodic.push(episodicId);
      } catch (error) {
        stats.errors += 1;
        console.log(`[runConsolidation] failed to process source memory ${memory._id}`, error);
      }
    }

    for (const episodicId of createdEpisodic) {
      try {
        const episodic = (await ctx.runQuery("vexclaw/consolidate:getMemoryForConsolidation" as any, {
          memoryId: episodicId,
        })) as (MemoryRecord & { _id: string }) | null;
        if (!episodic) {
          continue;
        }

        if (episodic.accessCount < 3 || episodic.confidence < 0.8 || episodic.strength < 0.8) {
          stats.skipped += 1;
          continue;
        }

        const semanticCandidates = (await ctx.vectorSearch("vexclawMemories", "by_embedding", {
          vector: episodic.embedding,
          limit: 3,
          filter: (q: any) =>
            q.and(q.eq("store", "semantic"), q.eq("archived", false)),
        })) as Array<{ _score?: number; score?: number }>;

        const topScore = semanticCandidates[0]?._score ?? semanticCandidates[0]?.score ?? 0;
        if (topScore >= 0.92) {
          continue;
        }

        await ctx.runMutation("vexclaw/consolidate:insertConsolidatedMemory" as any, {
          store: "semantic",
          category: episodic.category,
          title: `Semantic: ${episodic.title}`,
          content: episodic.content,
          embedding: episodic.embedding,
          strength: clamp01(episodic.strength * 0.95 + 0.05),
          confidence: clamp01(episodic.confidence + 0.05),
          valence: episodic.valence,
          arousal: episodic.arousal,
          accessCount: 0,
          lastAccessedAt: now,
          createdAt: now,
          source: "cron",
          tags: episodic.tags,
          archived: false,
          promotedFrom: episodicId,
        });
        stats.promoted += 1;
      } catch (error) {
        stats.errors += 1;
        console.log(`[runConsolidation] failed to promote episodic memory ${episodicId}`, error);
      }
    }

    return {
      ...stats,
    };
  },
});
