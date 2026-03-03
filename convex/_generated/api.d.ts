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
import type * as crystal_apiKeys from "../crystal/apiKeys.js";
import type * as crystal_associations from "../crystal/associations.js";
import type * as crystal_auth from "../crystal/auth.js";
import type * as crystal_checkpoints from "../crystal/checkpoints.js";
import type * as crystal_cleanup from "../crystal/cleanup.js";
import type * as crystal_consolidate from "../crystal/consolidate.js";
import type * as crystal_dashboard from "../crystal/dashboard.js";
import type * as crystal_decay from "../crystal/decay.js";
import type * as crystal_graph from "../crystal/graph.js";
import type * as crystal_mcp from "../crystal/mcp.js";
import type * as crystal_memories from "../crystal/memories.js";
import type * as crystal_messages from "../crystal/messages.js";
import type * as crystal_recall from "../crystal/recall.js";
import type * as crystal_sessions from "../crystal/sessions.js";
import type * as crystal_stats from "../crystal/stats.js";
import type * as crystal_stmEmbedder from "../crystal/stmEmbedder.js";
import type * as crystal_userProfiles from "../crystal/userProfiles.js";
import type * as crystal_wake from "../crystal/wake.js";
import type * as eslint_rules_no_public_userid_arg from "../eslint_rules/no_public_userid_arg.js";
import type * as http from "../http.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  "crystal/apiKeys": typeof crystal_apiKeys;
  "crystal/associations": typeof crystal_associations;
  "crystal/auth": typeof crystal_auth;
  "crystal/checkpoints": typeof crystal_checkpoints;
  "crystal/cleanup": typeof crystal_cleanup;
  "crystal/consolidate": typeof crystal_consolidate;
  "crystal/dashboard": typeof crystal_dashboard;
  "crystal/decay": typeof crystal_decay;
  "crystal/graph": typeof crystal_graph;
  "crystal/mcp": typeof crystal_mcp;
  "crystal/memories": typeof crystal_memories;
  "crystal/messages": typeof crystal_messages;
  "crystal/recall": typeof crystal_recall;
  "crystal/sessions": typeof crystal_sessions;
  "crystal/stats": typeof crystal_stats;
  "crystal/stmEmbedder": typeof crystal_stmEmbedder;
  "crystal/userProfiles": typeof crystal_userProfiles;
  "crystal/wake": typeof crystal_wake;
  "eslint_rules/no_public_userid_arg": typeof eslint_rules_no_public_userid_arg;
  http: typeof http;
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
