#!/usr/bin/env node
import { createServer } from "node:http";
import { URL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { handleRecallTool, recallTool } from "./tools/recall.js";
import { handleRememberTool, rememberTool } from "./tools/remember.js";
import { handleCheckpointTool, checkpointTool } from "./tools/checkpoint.js";
import { handleForgetTool, forgetTool } from "./tools/forget.js";
import { handleStatsTool, statsTool } from "./tools/stats.js";
import { handleWhatDoIKnowTool, whatDoIKnowTool } from "./tools/what-do-i-know.js";
import { handleWhyDidWeTool, whyDidWeTool } from "./tools/why-did-we.js";
import { handleWakeTool, wakeTool } from "./tools/wake.js";
import { handleRecentTool, recentTool } from "./tools/recent.js";
import { handleSearchMessagesTool, searchMessagesTool } from "./tools/search-messages.js";

function createMcpServer() {
  const server = new Server(
    {
      name: "crystal-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        rememberTool,
        recallTool,
        recentTool,
        searchMessagesTool,
        whatDoIKnowTool,
        whyDidWeTool,
        forgetTool,
        statsTool,
        checkpointTool,
        wakeTool,
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

      switch (name) {
        case "crystal_remember":
          return handleRememberTool(args);
        case "crystal_recall":
          return handleRecallTool(args);
        case "crystal_recent":
          return handleRecentTool(args);
        case "crystal_search_messages":
          return handleSearchMessagesTool(args);
        case "crystal_what_do_i_know":
          return handleWhatDoIKnowTool(args);
      case "crystal_why_did_we":
        return handleWhyDidWeTool(args);
      case "crystal_forget":
        return handleForgetTool(args);
      case "crystal_stats":
        return handleStatsTool(args);
      case "crystal_checkpoint":
        return handleCheckpointTool(args);
      case "crystal_wake":
        return handleWakeTool(args);
      default:
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
        };
    }
  });

  return server;
}

async function runStdio() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function runSse() {
  const host = process.env.CRYSTAL_MCP_HOST ?? "127.0.0.1";
  const parsedPort = Number(process.env.CRYSTAL_MCP_PORT);
  const port = Number.isFinite(parsedPort) ? parsedPort : 8788;

  let activeTransport: SSEServerTransport | null = null;
  let activeSessionId: string | null = null;

  const httpServer = createServer(async (req, res) => {
    const reqUrl = new URL(req.url ?? "/", `http://${host}:${port}`);

    if (req.method === "GET" && reqUrl.pathname === "/sse") {
      try {
        if (activeTransport) {
          await activeTransport.close();
          activeTransport = null;
          activeSessionId = null;
        }

        const server = createMcpServer();
        const transport = new SSEServerTransport("/messages", res);
        activeTransport = transport;
        activeSessionId = transport.sessionId;

        transport.onclose = () => {
          activeTransport = null;
          activeSessionId = null;
        };

        await server.connect(transport);
      } catch (err) {
        res.writeHead(500).end(`Failed to open SSE: ${String(err)}`);
      }
      return;
    }

    if (req.method === "POST" && reqUrl.pathname === "/messages") {
      if (!activeTransport) {
        res.writeHead(503).end("No active SSE session");
        return;
      }

      const sessionId = reqUrl.searchParams.get("sessionId");
      if (!sessionId || sessionId !== activeSessionId) {
        res.writeHead(400).end("Invalid or missing sessionId");
        return;
      }

      try {
        await activeTransport.handlePostMessage(req, res);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[mcp-sse] Failed to process /messages request", err);
        if (!res.writableEnded) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Failed to process MCP message");
        }
      }
      return;
    }

    if (req.method === "GET" && reqUrl.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, mode: "sse", hasSession: !!activeTransport }));
      return;
    }

    res.writeHead(404).end("Not found");
  });

  httpServer.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`Memory Crystal MCP SSE listening on http://${host}:${port} (GET /sse, POST /messages)`);
  });
}

const mode = (process.env.CRYSTAL_MCP_MODE ?? "sse").toLowerCase();
if (mode === "stdio") {
  await runStdio();
} else {
  await runSse();
}
