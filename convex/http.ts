import { httpRouter } from "convex/server";
import { auth } from "./auth";
import {
  mcpAuth,
  mcpCapture,
  mcpCheckpoint,
  mcpRecall,
  mcpStats,
  mcpWakeGet,
  mcpWakePost,
} from "./crystal/mcp";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({ path: "/api/mcp/capture", method: "POST", handler: mcpCapture });
http.route({ path: "/api/mcp/recall", method: "POST", handler: mcpRecall });
http.route({ path: "/api/mcp/checkpoint", method: "POST", handler: mcpCheckpoint });
http.route({ path: "/api/mcp/wake", method: "GET", handler: mcpWakeGet });
http.route({ path: "/api/mcp/wake", method: "POST", handler: mcpWakePost });
http.route({ path: "/api/mcp/stats", method: "GET", handler: mcpStats });
http.route({ path: "/api/mcp/stats", method: "POST", handler: mcpStats });
http.route({ path: "/api/mcp-auth", method: "POST", handler: mcpAuth });

export default http;
