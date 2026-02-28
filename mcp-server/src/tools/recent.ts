import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { getConvexClient } from "../lib/convex-client.js";

type STMMessage = {
  _id?: string;
  role?: string;
  content?: string;
  channel?: string;
  sessionKey?: string;
  timestamp?: number;
  sinceMs?: number;
};

export type CrystalRecentInput = {
  limit?: number;
  channel?: string;
  sessionKey?: string;
  sinceMs?: number;
};

export const recentTool: Tool = {
  name: "crystal_recent",
  description: "Fetch the most recent short-term messages.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        minimum: 1,
        maximum: 100,
        default: 20,
      },
      channel: {
        type: "string",
      },
      sessionKey: {
        type: "string",
      },
      sinceMs: {
        type: "number",
      },
    },
    additionalProperties: false,
  },
};

const clampLimit = (value: unknown): number => {
  if (!Number.isFinite(Number(value))) {
    return 20;
  }
  const parsed = Number(value);
  if (parsed <= 0) {
    return 20;
  }
  return Math.min(100, Math.max(1, Math.floor(parsed)));
};

const trimText = (value: string, maxChars: number): string => {
  const text = value ?? "";
  return text.length > maxChars ? text.slice(0, maxChars) : text;
};

const ensureRecentInput = (value: unknown): CrystalRecentInput => {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const input = value as Record<string, unknown>;
  const limit = clampLimit(input.limit);
  const channel = typeof input.channel === "string" ? input.channel : undefined;
  const sessionKey = typeof input.sessionKey === "string" ? input.sessionKey : undefined;
  const sinceMs = typeof input.sinceMs === "number" && Number.isFinite(input.sinceMs) ? input.sinceMs : undefined;

  return {
    limit,
    channel,
    sessionKey,
    sinceMs,
  };
};

const buildRecentBlock = (messages: STMMessage[], limit: number): string => {
  const lines = messages.map((message) => {
    const timestamp = typeof message.timestamp === "number" ? new Date(message.timestamp).toLocaleTimeString() : "Invalid time";
    const role = typeof message.role === "string" && message.role.length > 0 ? message.role : "unknown";
    const content = typeof message.content === "string" ? message.content : "";
    return `[${timestamp}] ${role}: ${trimText(content, 200)}`;
  });

  return [`## Recent Messages (last ${limit})`, "", ...lines].join("\n");
};

export const handleRecentTool = async (args: unknown): Promise<CallToolResult> => {
  try {
    const parsed = ensureRecentInput(args);
    const limit = parsed.limit ?? 20;
    const response = (await getConvexClient().query(
      "crystal/messages:getRecentMessages" as any,
      {
        limit,
        channel: parsed.channel,
        sessionKey: parsed.sessionKey,
        sinceMs: parsed.sinceMs,
      }
    )) as { messages: STMMessage[] } | STMMessage[];

    const messages = Array.isArray(response)
      ? response
      : Array.isArray(response?.messages)
        ? response.messages
        : [];

    return {
      content: [
        {
          type: "text",
          text: buildRecentBlock(messages, limit),
        },
        {
          type: "text",
          text: JSON.stringify(
            {
              messages,
              query: {
                limit,
                channel: parsed.channel,
                sessionKey: parsed.sessionKey,
                sinceMs: parsed.sinceMs,
              },
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
