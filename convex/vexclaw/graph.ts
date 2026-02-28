import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

const nowMs = () => Date.now();
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const memoryNodeTypes = ["person", "project", "goal", "decision", "concept", "tool", "event", "resource", "channel"] as const;
type MemoryNodeType = (typeof memoryNodeTypes)[number];

type GraphRelationType =
  | "mentions"
  | "decided_in"
  | "leads_to"
  | "depends_on"
  | "owns"
  | "uses"
  | "conflicts_with"
  | "supports"
  | "occurs_with"
  | "assigned_to";

const relationTypeMap: Record<string, GraphRelationType> = {
  supports: "supports",
  contradicts: "conflicts_with",
  derives_from: "depends_on",
  co_occurred: "occurs_with",
  generalizes: "supports",
  precedes: "leads_to",
};

const normalizeText = (value: string) => value.trim().toLowerCase();
const normalizeChannel = (value?: string) => normalizeText(value ?? "unknown");

const uniqueStrings = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));

const canonicalize = (prefix: string, value: string) => {
  const slug = normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefix}:${slug || "untitled"}`;
};

const mapAssociationType = (relationshipType: string): GraphRelationType => relationTypeMap[relationshipType] ?? "supports";

const ensureNode = async (
  ctx: any,
  canonicalKey: string,
  label: string,
  nodeType: MemoryNodeType,
  sourceMemoryId: string,
  description = ""
): Promise<{ nodeId: string; created: boolean }> => {
  const existing = (
    await ctx.db
      .query("vexclawNodes")
      .withIndex("by_canonical_key", (q: any) => q.eq("canonicalKey", canonicalKey))
      .take(1)
  )[0] as { _id: string; sourceMemoryIds: string[] } | undefined;

  if (existing) {
    if (!existing.sourceMemoryIds.includes(sourceMemoryId)) {
      await ctx.db.patch(existing._id, {
        sourceMemoryIds: [...existing.sourceMemoryIds, sourceMemoryId],
        updatedAt: nowMs(),
      });
    }
    return { nodeId: existing._id, created: false };
  }

  const now = nowMs();
  const nodeId = await ctx.db.insert("vexclawNodes", {
    label,
    nodeType,
    alias: [],
    canonicalKey,
    description,
    strength: 0.5,
    confidence: 0.5,
    tags: [],
    metadata: "",
    createdAt: now,
    updatedAt: now,
    sourceMemoryIds: [sourceMemoryId],
    status: "active",
  });

  return { nodeId, created: true };
};

const upsertNodeLink = async (
  ctx: any,
  memoryId: string,
  nodeId: string,
  role: "subject" | "object" | "topic",
  linkConfidence = 0.7
) => {
  const existing = (
    await ctx.db
      .query("vexclawMemoryNodeLinks")
      .withIndex("by_memory", (q: any) => q.eq("memoryId", memoryId as never))
      .filter((q: any) => q.eq("nodeId", nodeId as never))
      .take(1)
  )[0] as { _id: string } | undefined;

  if (existing) {
    return existing._id;
  }

  return ctx.db.insert("vexclawMemoryNodeLinks", {
    memoryId,
    nodeId,
    role,
    linkConfidence,
    createdAt: nowMs(),
  });
};

const upsertRelation = async (
  ctx: any,
  fromNodeId: string,
  toNodeId: string,
  relationType: GraphRelationType,
  evidenceMemoryIds: string[],
  channels: string[],
  weight = 0.7,
  proofNote = ""
): Promise<{ created: number; updated: number }> => {
  const existing = (
    await ctx.db
      .query("vexclawRelations")
      .withIndex("by_from_to_relation", (q: any) =>
        q.eq("fromNodeId", fromNodeId as never).eq("toNodeId", toNodeId as never).eq("relationType", relationType)
      )
      .take(1)
  )[0] as
    | {
        _id: string;
        weight: number;
        confidence: number;
        channels: string[];
        evidenceMemoryIds: string[];
        proofNote?: string;
      }
    | undefined;

  const now = nowMs();
  if (existing) {
    await ctx.db.patch(existing._id, {
      updatedAt: now,
      weight: clamp(Math.max(existing.weight, weight), 0.1, 1),
      confidence: clamp(Math.max(existing.confidence, weight), 0.1, 1),
      proofNote: proofNote || existing.proofNote,
      evidenceMemoryIds: uniqueStrings([...existing.evidenceMemoryIds, ...evidenceMemoryIds]),
      channels: uniqueStrings([...existing.channels, ...channels]),
    });
    return { created: 0, updated: 1 };
  }

  await ctx.db.insert("vexclawRelations", {
    fromNodeId,
    toNodeId,
    relationType,
    weight: clamp(weight, 0.1, 1),
    evidenceMemoryIds: uniqueStrings(evidenceMemoryIds),
    evidenceWindow: undefined,
    channels: uniqueStrings(channels),
    proofNote,
    confidence: clamp(weight, 0.1, 1),
    confidenceReason: "Backfill migration from association graph.",
    createdAt: now,
    updatedAt: now,
    promotedFrom: undefined,
  });

  return { created: 1, updated: 0 };
};

export const getKnowledgeGraphFoundationStatus = query({
  handler: async (ctx) => ({
    memories: (await ctx.db.query("vexclawMemories").withIndex("by_last_accessed", (q) => q.gte("lastAccessedAt", 0)).take(200)).length,
    nodes: (await ctx.db.query("vexclawNodes").take(200)).length,
    relations: (await ctx.db.query("vexclawRelations").take(200)).length,
    links: (await ctx.db.query("vexclawMemoryNodeLinks").take(200)).length,
    generatedAt: nowMs(),
  }),
});

export const seedKnowledgeGraphFromMemory = mutation({
  args: v.object({
    maxMemories: v.optional(v.number()),
    maxAssociations: v.optional(v.number()),
    includeAssociations: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const includeAssociations = args.includeAssociations ?? true;
    const maxMemories = Math.floor(clamp(args.maxMemories ?? 400, 1, 5000));
    const maxAssociations = Math.floor(clamp(args.maxAssociations ?? 400, 0, 10000));

    const memories = await ctx.db
      .query("vexclawMemories")
      .filter((q: any) => q.eq("archived", false))
      .take(maxMemories);

    const created = {
      nodes: 0,
      relations: 0,
      updatedRelations: 0,
      links: 0,
    };

    const getMemoryNode = async (memory: { _id: string; title?: string; content?: string; channel?: string }) => {
      const canonical = canonicalize("memory", memory._id);
      const existing = (
        await ctx.db
          .query("vexclawNodes")
          .withIndex("by_canonical_key", (q: any) => q.eq("canonicalKey", canonical))
          .take(1)
      )[0] as { _id: string } | undefined;
      if (existing) {
        return { nodeId: existing._id, created: false };
      }

      const label = normalizeText(memory.title || memory.content?.slice(0, 80) || "Untitled memory");
      return ensureNode(
        ctx,
        canonical,
        label,
        "event",
        memory._id,
        "Auto-generated memory topic node from phase 0 seed."
      );
    };

    for (const memory of memories) {
      const memoryId = memory._id;
      const source = await getMemoryNode(memory as any);
      if (!source) {
        continue;
      }

      if (source.created) {
        created.nodes += 1;
      }

      await upsertNodeLink(ctx, memoryId, source.nodeId, "topic", 0.95);
      created.links += 1;

      if (memory.channel) {
        const channelCanonical = canonicalize("channel", normalizeChannel(memory.channel));
        const channel = await ensureNode(
          ctx,
          channelCanonical,
          normalizeChannel(memory.channel),
          "channel",
          memoryId,
          "Auto-generated channel node from phase 0 seed."
        );
        if (channel.created) {
          created.nodes += 1;
        }
        await upsertNodeLink(ctx, memoryId, channel.nodeId, "topic", 0.65);
        created.links += 1;
      }

      for (const tag of memory.tags ?? []) {
        const normalizedTag = normalizeText(tag);
        if (!normalizedTag) {
          continue;
        }

        const tagCanonical = canonicalize("concept", normalizedTag);
        const tagNode = await ensureNode(
          ctx,
          tagCanonical,
          normalizedTag,
          "concept",
          memoryId,
          "Auto-generated concept node from memory tags."
        );
        if (tagNode.created) {
          created.nodes += 1;
        }
        await upsertNodeLink(ctx, memoryId, tagNode.nodeId, "topic", 0.8);
        created.links += 1;
      }
    }

    if (includeAssociations) {
      const associations = await ctx.db
        .query("vexclawAssociations")
        .filter((q: any) => q.gte("weight", 0))
        .take(maxAssociations);

      for (const association of associations) {
        const sourceMemory = (await ctx.db.get(association.fromMemoryId)) as { _id: string; channel?: string } | null;
        const targetMemory = (await ctx.db.get(association.toMemoryId)) as { _id: string; channel?: string } | null;
        if (!sourceMemory || !targetMemory) {
          continue;
        }

        const sourceNode = await getMemoryNode(sourceMemory as never);
        const targetNode = await getMemoryNode(targetMemory as never);
        if (!sourceNode || !targetNode) {
          continue;
        }

        if (sourceNode.created) {
          created.nodes += 1;
        }
        if (targetNode.created) {
          created.nodes += 1;
        }

        const relation = await upsertRelation(
          ctx,
          sourceNode.nodeId,
          targetNode.nodeId,
          mapAssociationType(association.relationshipType),
          [sourceMemory._id, targetMemory._id],
          [
            normalizeChannel(sourceMemory.channel),
            normalizeChannel(targetMemory.channel),
            "vexclaw-associate",
          ],
          association.weight,
          "Backfilled from vexclawAssociations during phase 0."
        );

        created.relations += relation.created;
        created.updatedRelations += relation.updated;
        await upsertNodeLink(ctx, sourceMemory._id, sourceNode.nodeId, "subject", 0.7);
        await upsertNodeLink(ctx, targetMemory._id, targetNode.nodeId, "object", 0.7);
      }
    }

    const associationTotal = includeAssociations ? (await ctx.db.query("vexclawAssociations").take(200)).length : 0;

    return {
      runAt: nowMs(),
      includeAssociations,
      requested: {
        memories: memories.length,
        associations: associationTotal,
      },
      created,
    };
  },
});
