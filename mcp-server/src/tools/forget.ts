import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { getConvexClient } from "../lib/convex-client.js";

export type CrystalForgetInput = {
  memoryId: string;
  reason?: string;
};

export const forgetTool: Tool = {
  name: "crystal_forget",
  description: "Soft-delete a Memory Crystal memory by id.",
  inputSchema: {
    type: "object",
    properties: {
      memoryId: {
        type: "string",
      },
      reason: {
        type: "string",
      },
    },
    required: ["memoryId"],
    additionalProperties: false,
  },
};

const ensureForgetInput = (value: unknown): CrystalForgetInput => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid arguments");
  }

  const input = value as Record<string, unknown>;
  if (typeof input.memoryId !== "string" || input.memoryId.length === 0) {
    throw new Error("memoryId is required");
  }

  if (input.reason !== undefined && typeof input.reason !== "string") {
    throw new Error("reason must be a string");
  }

  return {
    memoryId: input.memoryId,
    reason: input.reason,
  };
};

export const handleForgetTool = async (args: unknown): Promise<CallToolResult> => {
  try {
    const parsed = ensureForgetInput(args);

    const result = (await getConvexClient().mutation("crystal/memories:forgetMemory" as any, {
      memoryId: parsed.memoryId,
      reason: parsed.reason,
    })) as { memoryId?: string; archived?: boolean } | null;

    const payload = {
      success: result !== null,
      archived: result?.archived === true,
    };

    return {
      content: [
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
