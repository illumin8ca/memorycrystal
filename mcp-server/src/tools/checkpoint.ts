import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { getConvexClient } from "../lib/convex-client.js";

export type CrystalCheckpointInput = {
  mode?: "create" | "list";
  label?: string;
  description?: string;
  memoryIds?: string[];
  sessionId?: string;
  semanticSummary?: string;
  tags?: string[];
  limit?: number;
  createdBy?: "gerald" | "andy";
};

export const checkpointTool: Tool = {
  name: "crystal_checkpoint",
  description: "Create or list Memory Crystal checkpoints.",
  inputSchema: {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: ["create", "list"],
      },
      label: {
        type: "string",
      },
      description: {
        type: "string",
      },
      memoryIds: {
        type: "array",
        items: { type: "string" },
      },
      sessionId: {
        type: "string",
      },
      semanticSummary: {
        type: "string",
      },
      tags: {
        type: "array",
        items: { type: "string" },
      },
      limit: {
        type: "number",
        minimum: 1,
        maximum: 100,
      },
      createdBy: {
        type: "string",
        enum: ["gerald", "andy"],
      },
    },
    additionalProperties: false,
  },
};

const ensureInput = (value: unknown): CrystalCheckpointInput => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid arguments");
  }

  const input = value as Record<string, unknown>;
  const mode = input.mode === undefined ? "create" : input.mode;
  if (mode !== "create" && mode !== "list") {
    throw new Error("mode must be create or list");
  }

  const label = input.label;
  if (mode === "create" && (typeof label !== "string" || label.trim().length === 0)) {
    throw new Error("label is required for create mode");
  }

  const parsedLimit =
    input.limit === undefined
      ? undefined
      : Number.isFinite(Number(input.limit))
        ? Number(input.limit)
        : (() => {
            throw new Error("limit must be a number");
          })();

  const memoryIds =
    input.memoryIds === undefined
      ? undefined
      : Array.isArray(input.memoryIds)
        ? input.memoryIds
        : (() => {
            throw new Error("memoryIds must be array of ids");
          })();

  return {
    mode,
    label: typeof label === "string" ? label : undefined,
    description: typeof input.description === "string" ? input.description : undefined,
    memoryIds,
    sessionId: typeof input.sessionId === "string" ? input.sessionId : undefined,
    semanticSummary: typeof input.semanticSummary === "string" ? input.semanticSummary : undefined,
    tags: Array.isArray(input.tags) ? input.tags.map((tag) => String(tag)) : undefined,
    limit: parsedLimit,
    createdBy: input.createdBy === "andy" || input.createdBy === "gerald" ? input.createdBy : undefined,
  };
};

export const handleCheckpointTool = async (args: unknown): Promise<CallToolResult> => {
  try {
    const parsed = ensureInput(args);

    if (parsed.mode === "list") {
      const checkpoints = await getConvexClient().query("crystal/checkpoints:listCheckpoints" as any, {
        sessionId: parsed.sessionId,
        limit: parsed.limit ?? 20,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(checkpoints, null, 2),
          },
        ],
      };
    }

    const checkpointId = await getConvexClient().mutation("crystal/checkpoints:createCheckpoint" as any, {
      label: parsed.label ?? "checkpoint",
      description: parsed.description,
      createdBy: parsed.createdBy ?? "gerald",
      sessionId: parsed.sessionId,
      memoryIds: parsed.memoryIds ?? [],
      semanticSummary: parsed.semanticSummary,
      tags: parsed.tags ?? [],
      maxMemories: parsed.limit,
    });
    const checkpoint = (await getConvexClient().query("crystal/checkpoints:getCheckpoint" as any, {
      checkpointId,
    })) as { memorySnapshot?: unknown[] } | null;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              checkpointId,
              memoriesSnapshotted: checkpoint?.memorySnapshot?.length ?? 0,
              mode: "create",
              label: parsed.label,
            },
            null,
            2
          ),
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
