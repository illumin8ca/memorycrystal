import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { getConvexClient } from "../lib/convex-client.js";
import { getEmbedAdapter } from "../lib/embed.js";

const memoryStores = ["sensory", "episodic", "semantic", "procedural", "prospective"] as const;
const decisionCategory = "decision";

type MemoryRecord = {
  memoryId: string;
  store: string;
  title: string;
  content: string;
  strength: number;
};

export type VexClawWhyDidWeInput = {
  decision: string;
  limit?: number;
};

export const whyDidWeTool: Tool = {
  name: "vexclaw_why_did_we",
  description: "Decision archaeology across VexClaw decision memories.",
  inputSchema: {
    type: "object",
    properties: {
      decision: {
        type: "string",
        minLength: 3,
      },
      limit: {
        type: "number",
        minimum: 1,
        maximum: 20,
      },
    },
    required: ["decision"],
    additionalProperties: false,
  },
};

const buildBlock = (reasoning: string, records: MemoryRecord[]) => [
  "## Why Did We (Decision archaeology)",
  "",
  `Reasoning: ${reasoning || "No clear decision thread was surfaced."}`,
  "",
  ...(records.length === 0 ? ["No decision memories matched."] : records.map((memory, index) => [
    `${index + 1}. [${memory.store}] ${memory.title}`,
    `   ${memory.content}`,
  ]).flat()),
].join("\n");

const ensureInput = (value: unknown): VexClawWhyDidWeInput => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid arguments");
  }

  const input = value as Record<string, unknown>;
  if (typeof input.decision !== "string" || input.decision.trim().length === 0) {
    throw new Error("decision is required");
  }

  const parsedLimit =
    input.limit === undefined
      ? undefined
      : Number.isFinite(Number(input.limit))
        ? Number(input.limit)
        : (() => {
            throw new Error("limit must be a number");
          })();

  return {
    decision: input.decision,
    limit: parsedLimit,
  };
};

export const handleWhyDidWeTool = async (args: unknown): Promise<CallToolResult> => {
  try {
    const parsed = ensureInput(args);
    const adapter = getEmbedAdapter();
    let embedding: number[] | null;
    try {
      embedding = await adapter.embed(parsed.decision);
    } catch {
      return {
        content: [
          {
            type: "text",
            text: "⚠️ VexClaw recall degraded: embedding service unavailable. Please retry.",
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
            text: "⚠️ VexClaw recall degraded: embedding service unavailable. Please retry.",
          },
        ],
        isError: true,
      };
    }

    const response = (await getConvexClient().action("vexclaw/recall:recallMemories" as any, {
      embedding,
      categories: [decisionCategory],
      stores: memoryStores,
      limit: parsed.limit ?? 8,
    })) as { memories: MemoryRecord[] };

    const memories = response.memories;

    const reasoning = memories.length === 0 ? "" : `Primary threads around "${parsed.decision}"`;
    const output = {
      reasoning,
      relatedMemories: memories,
    };

    return {
      content: [
        {
          type: "text",
          text: buildBlock(reasoning, memories),
        },
        {
          type: "text",
          text: JSON.stringify(output, null, 2),
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
