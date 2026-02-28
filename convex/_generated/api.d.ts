/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as vexclaw_apiKeys from "../vexclaw/apiKeys.js";
import type * as vexclaw_associations from "../vexclaw/associations.js";
import type * as vexclaw_checkpoints from "../vexclaw/checkpoints.js";
import type * as vexclaw_cleanup from "../vexclaw/cleanup.js";
import type * as vexclaw_consolidate from "../vexclaw/consolidate.js";
import type * as vexclaw_dashboard from "../vexclaw/dashboard.js";
import type * as vexclaw_decay from "../vexclaw/decay.js";
import type * as vexclaw_graph from "../vexclaw/graph.js";
import type * as vexclaw_memories from "../vexclaw/memories.js";
import type * as vexclaw_messages from "../vexclaw/messages.js";
import type * as vexclaw_recall from "../vexclaw/recall.js";
import type * as vexclaw_sessions from "../vexclaw/sessions.js";
import type * as vexclaw_stats from "../vexclaw/stats.js";
import type * as vexclaw_stmEmbedder from "../vexclaw/stmEmbedder.js";
import type * as vexclaw_userProfiles from "../vexclaw/userProfiles.js";
import type * as vexclaw_wake from "../vexclaw/wake.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  http: typeof http;
  "vexclaw/apiKeys": typeof vexclaw_apiKeys;
  "vexclaw/associations": typeof vexclaw_associations;
  "vexclaw/checkpoints": typeof vexclaw_checkpoints;
  "vexclaw/cleanup": typeof vexclaw_cleanup;
  "vexclaw/consolidate": typeof vexclaw_consolidate;
  "vexclaw/dashboard": typeof vexclaw_dashboard;
  "vexclaw/decay": typeof vexclaw_decay;
  "vexclaw/graph": typeof vexclaw_graph;
  "vexclaw/memories": typeof vexclaw_memories;
  "vexclaw/messages": typeof vexclaw_messages;
  "vexclaw/recall": typeof vexclaw_recall;
  "vexclaw/sessions": typeof vexclaw_sessions;
  "vexclaw/stats": typeof vexclaw_stats;
  "vexclaw/stmEmbedder": typeof vexclaw_stmEmbedder;
  "vexclaw/userProfiles": typeof vexclaw_userProfiles;
  "vexclaw/wake": typeof vexclaw_wake;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
