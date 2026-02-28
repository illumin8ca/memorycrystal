import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { getConvexClient } from "../lib/convex-client.js";
import { getEmbedAdapter } from "../lib/embed.js";

const memoryStores = ["sensory", "episodic", "semantic", "procedural", "prospective"] as const;

type MemoryRecord = {
  memoryId: string;
  store: string;
  category: string;
  title: string;
  content: string;
  confidence: number;
  strength: number;
};

export type CrystalWhatDoIKnowInput = {
  topic: string;
  stores?: string[];
  limit?: number;
  tags?: string[];
};

export const whatDoIKnowTool: Tool = {
  name: "crystal_what_do_i_know",
  description: "Broad topic scan over Memory Crystal memories.",
  inputSchema: {
    type: "object",
    properties: {
      topic: {
        type: "string",
        minLength: 3,
      },
      stores: {
        type: "array",
        items: {
          type: "string",
          enum: memoryStores,
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
    },
    required: ["topic"],
    additionalProperties: false,
  },
};

const topSummary = (records: MemoryRecord[]) =>
  records.slice(0, 3).map((record) => record.title).join("; ");

const buildBlock = (summary: string, records: MemoryRecord[]) => [
  "## What Do I Know",
  "",
  `Summary: ${summary || "No matching memories found."}`,
  "",
  ...(records.length
    ? records.map((record) => `- [${record.store}] ${record.title} (${record.strength.toFixed(2)})`)
    : ["No matches"]),
].join("\n");

const ensureInput = (value: unknown): CrystalWhatDoIKnowInput => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid arguments");
  }

  const input = value as Record<string, unknown>;
  if (typeof input.topic !== "string" || input.topic.trim().length === 0) {
    throw new Error("topic is required");
  }

  const validatedStores =
    input.stores === undefined
      ? undefined
      : Array.isArray(input.stores)
        ? input.stores.map((value) => {
            if (typeof value !== "string" || !memoryStores.includes(value as (typeof memoryStores)[number])) {
              throw new Error("Invalid store value");
            }
            return value;
          })
        : (() => {
            throw new Error("stores must be an array of memory stores");
          })();

  const validatedTags =
    input.tags === undefined
      ? undefined
      : Array.isArray(input.tags)
        ? input.tags
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
    input.limit === undefined
      ? undefined
      : Number.isFinite(Number(input.limit))
        ? Number(input.limit)
        : (() => {
            throw new Error("limit must be a number");
          })();

  return {
    topic: input.topic,
    stores: validatedStores,
    tags: validatedTags,
    limit: parsedLimit,
  };
};

export const handleWhatDoIKnowTool = async (args: unknown): Promise<CallToolResult> => {
  try {
    const parsed = ensureInput(args);
    const adapter = getEmbedAdapter();
    let embedding: number[] | null;
    try {
      embedding = await adapter.embed(parsed.topic);
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

    const result = (await getConvexClient().action("crystal/recall:recallMemories" as any, {
      embedding,
      stores: parsed.stores,
      tags: parsed.tags,
      limit: parsed.limit,
    })) as { memories: MemoryRecord[] };

    const memories = result.memories;

    const summary = topSummary(memories);
    const payload = {
      summary,
      memoryCount: memories.length,
      topMemories: memories.slice(0, 5),
    };

    return {
      content: [
        {
          type: "text",
          text: buildBlock(summary, memories),
        },
        {
          type: "text",
          text: JSON.stringify(payload, null, 2),
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
