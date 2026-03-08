import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { getConvexClient } from "../lib/convex-client.js";
import { getEmbedAdapter } from "../lib/embed.js";

const memoryStores = ["sensory", "episodic", "semantic", "procedural", "prospective"] as const;
const memoryCategories = [
  "decision",
  "lesson",
  "person",
  "rule",
  "event",
  "fact",
  "goal",
  "workflow",
] as const;

export type CrystalRecallInput = {
  query: string;
  stores?: string[];
  categories?: string[];
  tags?: string[];
  limit?: number;
  includeArchived?: boolean;
  includeAssociations?: boolean;
};

type RecallResult = {
  memoryId: string;
  store: string;
  category: string;
  title: string;
  content: string;
  strength: number;
  confidence: number;
  tags: string[];
  score: number;
  relation?: string;
};

export const recallTool: Tool = {
  name: "crystal_recall",
  description: "Semantic recall over stored Memory Crystal memories.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        minLength: 1,
      },
      stores: {
        type: "array",
        items: {
          type: "string",
          enum: memoryStores,
        },
      },
      categories: {
        type: "array",
        items: {
          type: "string",
          enum: memoryCategories,
        },
      },
      tags: {
        type: "array",
        items: { type: "string" },
      },
      limit: {
        type: "number",
        minimum: 1,
        maximum: 20,
      },
      includeAssociations: {
        type: "boolean",
        default: true,
      },
      includeArchived: {
        type: "boolean",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
};

const buildInjectionBlock = (memories: RecallResult[]): string => {
  if (memories.length === 0) {
    return "## 🧠 Memory Crystal Memory Recall\nNo matching memories found.";
  }

  const header = "## 🧠 Memory Crystal Memory Recall";
  const lines = memories.map((memory) => {
    const relation = memory.relation ? ` (${memory.relation})` : "";
    return [
      `### ${memory.store.toUpperCase()}: ${memory.title}${relation}`,
      memory.content,
      `Tags: ${memory.tags.join(", ")} | Strength: ${memory.strength} | Confidence: ${memory.confidence}`,
      "",
    ].join("\n");
  });

  return [header, ...lines].join("\n");
};

const ensureRecallInput = (value: unknown): CrystalRecallInput => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid arguments");
  }

  const input = value as Record<string, unknown>;
  const { query, stores, categories, tags, limit, includeArchived, includeAssociations } = input;

  if (typeof query !== "string" || query.trim().length === 0) {
    throw new Error("query is required");
  }

  const validatedStores =
    stores === undefined
      ? undefined
      : Array.isArray(stores)
        ? stores.map((value) => {
            if (typeof value !== "string" || !memoryStores.includes(value as (typeof memoryStores)[number])) {
              throw new Error("Invalid store value");
            }
            return value;
          })
        : (() => {
            throw new Error("stores must be an array of memory stores");
          })();

  const validatedCategories =
    categories === undefined
      ? undefined
      : Array.isArray(categories)
        ? categories.map((value) => {
            if (
              typeof value !== "string" ||
              !memoryCategories.includes(value as (typeof memoryCategories)[number])
            ) {
              throw new Error("Invalid category value");
            }
            return value;
        })
      : (() => {
          throw new Error("categories must be an array of memory categories");
        })();

  const validatedTags =
    tags === undefined
      ? undefined
      : Array.isArray(tags)
        ? tags
            .map((value) => {
              if (typeof value !== "string") {
                throw new Error("tags must be an array of strings");
              }
              return value;
            })
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : (() => {
            throw new Error("tags must be an array of strings");
          })();

  const parsedLimit =
    limit === undefined
      ? undefined
      : Number.isFinite(Number(limit))
        ? Number(limit)
        : (() => {
            throw new Error("limit must be a number");
          })();

  if (includeArchived !== undefined && typeof includeArchived !== "boolean") {
    throw new Error("includeArchived must be boolean");
  }

  if (includeAssociations !== undefined && typeof includeAssociations !== "boolean") {
    throw new Error("includeAssociations must be boolean");
  }

    return {
      query,
      stores: validatedStores,
      categories: validatedCategories,
      tags: validatedTags,
      limit: parsedLimit,
      includeArchived,
      includeAssociations: includeAssociations ?? true,
    };
};

export const handleRecallTool = async (args: unknown): Promise<CallToolResult> => {
  try {
    const parsed = ensureRecallInput(args);
    const adapter = getEmbedAdapter();
    let embedding: number[] | null;
    try {
      embedding = await adapter.embed(parsed.query);
    } catch {
      return {
        content: [
          {
            type: "text",
            text: "⚠️ Memory Crystal recall degraded: embedding service unavailable. Please retry.",
          },
        ],
        isError: true,
      };
    }

    if (embedding === null) {
      return {
        content: [
          {
            type: "text",
            text: "⚠️ Memory Crystal recall degraded: embedding service unavailable. Please retry.",
          },
        ],
        isError: true,
      };
    }

    const response = (await getConvexClient().action("crystal/recall:recallMemories" as any, {
      embedding,
      query: parsed.query,
      stores: parsed.stores,
      categories: parsed.categories,
      tags: parsed.tags,
      limit: parsed.limit,
      includeAssociations: parsed.includeAssociations,
      includeArchived: parsed.includeArchived,
    })) as { memories: RecallResult[]; injectionBlock: string };

    const { memories, injectionBlock } = response;

    return {
      content: [
        {
          type: "text",
          text: injectionBlock,
        },
        {
          type: "text",
          text: JSON.stringify({ memories, injectionBlock }, null, 2),
        },
      ],
    };
  } catch (err: unknown) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error: ${(err as { message?: string })?.message || String(err)}`,
        },
      ],
    };
  }
};
