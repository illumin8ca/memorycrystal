#!/usr/bin/env node
import express, { type Request } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { z } from "zod";

type ApiRequestOptions = {
  method?: "GET" | "POST";
  path: string;
  apiKey?: string;
  body?: unknown;
};

const DEFAULT_API_URL = "https://rightful-mockingbird-389.convex.site";
const DEFAULT_PORT = 3100;

function getApiBaseUrl(): string {
  return (process.env.MEMORY_CRYSTAL_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
}

function getApiKeyFromRequest(req: Request): string | undefined {
  const authHeader = req.header("authorization") || req.header("Authorization");
  const envApiKey = process.env.MEMORY_CRYSTAL_API_KEY?.trim();

  if (authHeader) {
    const [scheme, token] = authHeader.split(/\s+/, 2);
    if (scheme?.toLowerCase() === "bearer" && token?.trim()) {
      return token.trim();
    }
  }

  return envApiKey || undefined;
}

async function callMemoryCrystalApi<T>({ method = "POST", path, apiKey, body }: ApiRequestOptions): Promise<T> {
  if (!apiKey) {
    throw new Error(
      "Missing API key. Set MEMORY_CRYSTAL_API_KEY on the server or send Authorization: Bearer <key>."
    );
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });

  const rawText = await response.text();
  let payload: unknown = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `${response.status} ${response.statusText}`;
    throw new Error(`Memory Crystal API error (${response.status}): ${message}`);
  }

  return payload as T;
}

function toTextResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data as Record<string, unknown>,
  };
}

function createServer(req: Request): McpServer {
  const apiKey = getApiKeyFromRequest(req);

  const server = new McpServer(
    {
      name: "memory-crystal-streamable-http",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
      instructions:
        "Use these tools to search, save, checkpoint, and inspect Memory Crystal data through the hosted API.",
    }
  );

  server.registerTool(
    "memory_search",
    {
      title: "Search memories",
      description: "Search saved memories by natural-language query.",
      inputSchema: {
        query: z.string().min(1).describe("Search query"),
        limit: z.number().int().min(1).max(50).default(5).optional().describe("Maximum number of results"),
      },
    },
    async ({ query, limit = 5 }) => {
      const result = await callMemoryCrystalApi({
        path: "/api/mcp/recall",
        apiKey,
        body: { query, limit },
      });
      return toTextResult(result);
    }
  );

  server.registerTool(
    "memory_save",
    {
      title: "Save a memory",
      description: "Persist a new memory into Memory Crystal.",
      inputSchema: {
        content: z.string().min(1).describe("Memory content to save"),
        title: z.string().min(1).optional().describe("Optional short title"),
        category: z
          .enum(["fact", "decision", "lesson", "goal", "preference"])
          .optional()
          .describe("Optional memory category"),
      },
    },
    async ({ content, title, category }) => {
      const normalizedTitle = title?.trim() || content.slice(0, 80);
      const result = await callMemoryCrystalApi({
        path: "/api/mcp/capture",
        apiKey,
        body: {
          text: content,
          content,
          title: normalizedTitle,
          category,
        },
      });
      return toTextResult(result);
    }
  );

  server.registerTool(
    "memory_checkpoint",
    {
      title: "Create checkpoint",
      description: "Snapshot the current conversation state.",
      inputSchema: {
        summary: z.string().min(1).describe("Checkpoint summary"),
      },
    },
    async ({ summary }) => {
      const result = await callMemoryCrystalApi({
        path: "/api/mcp/checkpoint",
        apiKey,
        body: {
          summary,
          label: summary,
          title: summary,
          description: summary,
        },
      });
      return toTextResult(result);
    }
  );

  server.registerTool(
    "search_messages",
    {
      title: "Search recent messages",
      description: "Search recent conversation messages by query.",
      inputSchema: {
        query: z.string().min(1).describe("Search query"),
        limit: z.number().int().min(1).max(50).default(10).optional().describe("Maximum number of results"),
      },
    },
    async ({ query, limit = 10 }) => {
      const result = await callMemoryCrystalApi({
        path: "/api/mcp/search-messages",
        apiKey,
        body: { query, limit },
      });
      return toTextResult(result);
    }
  );

  server.registerTool(
    "recent_messages",
    {
      title: "Recent messages",
      description: "Fetch the most recent conversation messages.",
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(20).optional().describe("Maximum number of messages"),
      },
    },
    async ({ limit = 20 }) => {
      const result = await callMemoryCrystalApi({
        path: "/api/mcp/recent-messages",
        apiKey,
        body: { limit },
      });
      return toTextResult(result);
    }
  );

  server.registerTool(
    "memory_stats",
    {
      title: "Memory stats",
      description: "Get memory usage statistics.",
    },
    async () => {
      const result = await callMemoryCrystalApi({
        method: "GET",
        path: "/api/mcp/stats",
        apiKey,
      });
      return toTextResult(result);
    }
  );

  return server;
}

async function handleMcpRequest(req: Request, res: express.Response) {
  const server = createServer(req);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal server error",
        },
        id: null,
      });
    }
  } finally {
    await transport.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
}

const host = process.env.HOST || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || String(DEFAULT_PORT), 10);
const app = createMcpExpressApp({ host });

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    name: "memory-crystal-streamable-http",
    apiUrl: getApiBaseUrl(),
  });
});

app.post("/mcp", handleMcpRequest);
app.get("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed. Use POST for Streamable HTTP MCP requests.",
    },
    id: null,
  });
});
app.delete("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed.",
    },
    id: null,
  });
});

app.listen(port, host, () => {
  console.log(`Memory Crystal MCP server listening on http://${host}:${port}/mcp`);
});
