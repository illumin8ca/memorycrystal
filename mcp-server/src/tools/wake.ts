import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { getConvexClient } from "../lib/convex-client.js";

export type CrystalWakeInput = {
  channel?: string;
};

export const wakeTool: Tool = {
  name: "crystal_wake",
  description: "Get an opening briefing for the current memory session.",
  inputSchema: {
    type: "object",
    properties: {
      channel: {
        type: "string",
      },
    },
    additionalProperties: false,
  },
};

const buildBlock = (briefing: string, openGoals: unknown[], recentDecisions: unknown[]) => [
  briefing,
  "",
  "Open goals",
  ...(openGoals.length === 0 ? ["- none"] : openGoals.map((memory) => `- ${(memory as { title: string }).title}`)),
  "",
  "Recent decisions",
  ...(recentDecisions.length === 0
    ? ["- none"]
    : recentDecisions.map((memory) => `- ${(memory as { title: string }).title}`)),
].join("\n");

const ensureInput = (value: unknown): CrystalWakeInput => {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const input = value as Record<string, unknown>;
  if (input.channel !== undefined && typeof input.channel !== "string") {
    throw new Error("channel must be a string");
  }

  return {
    channel: input.channel?.toString(),
  };
};

export const handleWakeTool = async (args: unknown): Promise<CallToolResult> => {
  try {
    const parsed = ensureInput(args);

    const response = (await getConvexClient().action("crystal/wake:getWakePrompt" as any, {
      channel: parsed.channel,
    })) as {
      briefing: string;
      openGoals: unknown[];
      recentDecisions: unknown[];
    };

    const payload = {
      briefing: response.briefing,
      openGoals: response.openGoals,
      recentDecisions: response.recentDecisions,
    };

    const textBlock = buildBlock(payload.briefing, payload.openGoals, payload.recentDecisions);

    return {
      content: [
        { type: "text", text: textBlock },
        { type: "text", text: JSON.stringify(payload, null, 2) },
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
