import { httpRouter } from "convex/server";
import { auth } from "./auth";
import {
  mcpAuth,
  mcpCapture,
  mcpAsset,
  mcpGetMemory,
  mcpLog,
  mcpCheckpoint,
  mcpRecentMessages,
  mcpRecall,
  mcpSearchMessages,
  mcpReflect,
  mcpStats,
  mcpWakeGet,
  mcpWakePost,
} from "./crystal/mcp";
import { polarWebhook } from "./crystal/polarWebhook";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({ path: "/api/mcp/capture", method: "POST", handler: mcpCapture });
http.route({ path: "/api/mcp/asset", method: "POST", handler: mcpAsset });
http.route({ path: "/api/mcp/memory", method: "POST", handler: mcpGetMemory });
http.route({ path: "/api/mcp/recall", method: "POST", handler: mcpRecall });
http.route({ path: "/api/mcp/search-messages", method: "POST", handler: mcpSearchMessages });
http.route({ path: "/api/mcp/recent-messages", method: "POST", handler: mcpRecentMessages });
http.route({ path: "/api/mcp/checkpoint", method: "POST", handler: mcpCheckpoint });
http.route({ path: "/api/mcp/wake", method: "GET", handler: mcpWakeGet });
http.route({ path: "/api/mcp/wake", method: "POST", handler: mcpWakePost });
http.route({ path: "/api/mcp/log", method: "POST", handler: mcpLog });
http.route({ path: "/api/mcp/reflect", method: "POST", handler: mcpReflect });
http.route({ path: "/api/mcp/stats", method: "GET", handler: mcpStats });
http.route({ path: "/api/mcp/stats", method: "POST", handler: mcpStats });
http.route({ path: "/api/polar/webhook", method: "POST", handler: polarWebhook });
// Backwards-compatible auth aliases
http.route({ path: "/api/mcp-auth", method: "POST", handler: mcpAuth });
http.route({ path: "/api/mcp/auth", method: "GET", handler: mcpAuth });
http.route({ path: "/api/mcp/auth", method: "POST", handler: mcpAuth });

export default http;
