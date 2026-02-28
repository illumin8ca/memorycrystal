import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { getConvexClient } from "../lib/convex-client.js";

export const statsTool: Tool = {
  name: "crystal_stats",
  description: "Health and memory statistics from Memory Crystal.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
};

const buildBlock = (stats: Record<string, unknown>) =>
  [
    "## Memory Crystal Stats",
    `- Total memories: ${stats.totalMemories}`,
    `- Archived memories: ${stats.archivedCount}`,
    `- Average strength: ${typeof stats.avgStrength === "number" ? stats.avgStrength.toFixed(3) : "n/a"}`,
    `- Captures last 24h: ${stats.recentCaptures}`,
    "",
    "## Store counts",
    ...Object.entries((stats.byStore as Record<string, number>) ?? {}).map(
      ([key, value]) => `- ${key}: ${value}`
    ),
    "",
    "## Strongest",
    ...(Array.isArray(stats.strongest)
      ? (stats.strongest as Array<Record<string, unknown>>).map(
          (entry, index) =>
            `${index + 1}. ${String(entry.title)} (${String(entry.store)}) — ${String(entry.strength)}`
        )
      : []),
  ].join("\n");

export const handleStatsTool = async (_args: unknown = null): Promise<CallToolResult> => {
  try {
    const stats = (await getConvexClient().query("crystal/stats:getMemoryStats" as any, {})) as Record<
      string,
      unknown
    >;

    return {
      content: [
        {
          type: "text",
          text: buildBlock(stats),
        },
        {
          type: "text",
          text: JSON.stringify(stats, null, 2),
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
