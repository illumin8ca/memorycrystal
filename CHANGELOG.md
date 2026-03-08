# Changelog

All notable changes to Memory Crystal are documented here.

## [Unreleased]

### Security
- **Removed hardcoded API key** from plugin/index.js; API key is now always sourced from plugin config (`ctx.config.apiKey`), never from a fallback literal.

### Plugin (`plugin/index.js`)
- **Noise filter**: Added `shouldCapture()` guard in `llm_output` hook — heartbeat ACKs, short greetings, simple confirmations, and HEARTBEAT_OK are not written to memory.
- **Reflection hooks**: Plugin now registers `command:new` and `command:reset` hooks that fire `triggerReflection()` on session boundaries, calling `/api/mcp/reflect` with a 4-hour window (fire-and-forget).

### Plugin (`plugin/recall-hook.js`)
- **Adaptive recall skip**: Added `shouldRecall()` guard — empty queries, slash commands, greetings, short acks, pure emoji, and heartbeat patterns skip the embedding+recall round-trip entirely.
- **BM25 hybrid search wiring**: `searchMemories()` now passes `query` string to Convex `recallMemories` action alongside the embedding vector, enabling hybrid vector+BM25 scoring.
- **Session dedup**: Added `sessionMemoryCache` with 4-hour TTL. Memory IDs returned per session are tracked; subsequent recalls for the same session exclude already-seen memories via `recentMemoryIds` arg.

### Convex — Schema (`convex/schema.ts`)
- **BM25 search indexes**: Added `searchIndex("search_content", ...)` and `searchIndex("search_title", ...)` to `crystalMemories` table, enabling full-text search over memory content and title fields with `userId` and `archived` filter fields.

### Convex — Recall (`convex/crystal/recall.ts`)
- **Hybrid scoring formula**: `recallMemories` action now uses a 5-component weighted score:
  `vectorScore × 0.35 + strength × 0.30 + recency × 0.20 + accessScore × 0.10 + bm25Boost × 0.05`
- **Knowledge graph node boost**: After initial ranking, memories with at least one `crystalMemoryNodeLinks` entry with `linkConfidence > 0.7` receive a `+0.05` post-processing score boost.
- **Parallel association lookup**: `buildAssociationCandidates` calls are now batched via `Promise.all()` across all top results (was sequential).
- **Associations on by default**: `includeAssociations` now defaults to `true` if not supplied.
- **BM25 search internal query**: Added `searchMemoriesByText` internalQuery that runs parallel `search_content` + `search_title` Convex search indexes and returns deduplicated results with boost metadata.
- **Schema fields added to requestSchema**: Added `query` (optional string) and `recentMemoryIds` (optional string array) to the `recallMemories` args schema — previously `query` was accessed via `(args as any).query` and `recentMemoryIds` was silently undefined.
- **Graph node lookup query**: Added `getNodesForMemories` internalQuery used to identify graph-linked memories for the node boost post-processing step.

### Convex — Reflection (`convex/crystal/reflection.ts`) — NEW FILE
- **Reflection/distillation pipeline**: New module implementing memory distillation via OpenAI `gpt-4o-mini`.
  - `getRecentMemoriesForReflection` (internalQuery): fetches recent `sensory`/`episodic` memories within a configurable time window.
  - `runReflectionForUser` (internalAction): calls OpenAI to extract decisions, lessons, session summary, and open loops from recent memories; writes each as a new distilled memory (`episodic/decision`, `semantic/lesson`, `episodic/event`, `prospective/goal`).
  - `runReflection` (public action): iterates all users and calls `runReflectionForUser`; used by cron and `/api/mcp/reflect`.

### Convex — HTTP (`convex/http.ts`)
- **`/api/mcp/reflect` route**: New POST route registered, backed by `mcpReflect` handler in `mcp.ts`.

### Convex — Crons (`convex/crons.ts`)
- **Daily reflection cron**: Added `crons.daily("crystal-reflect", { hourUTC: 4, minuteUTC: 30 }, ...)` to run memory distillation for all users daily after the STM expiry job.

### Convex — MCP (`convex/crystal/mcp.ts`)
- **`mcpReflect` HTTP handler**: New handler that authenticates, rate-limits, and calls `runReflectionForUser` for the authenticated user with configurable `windowHours` and optional `sessionId`.

### MCP Server (`mcp-server/src/tools/recall.ts`)
- **Pass `query` to Convex**: `handleRecallTool` now includes `query: parsed.query` in the `recallMemories` action args, enabling BM25 hybrid search from the MCP path (was embedding-only).

---

## Deployment Notes

To deploy to production:

```bash
# Deploy Convex backend (schema + functions)
npx convex deploy

# Or for local dev:
npx convex dev

# MCP server (if running standalone):
cd mcp-server && npm run build && npm start
```

**Environment variables required:**
- `OPENAI_API_KEY` — required for embeddings and reflection LLM calls
- `CONVEX_URL` — Convex deployment URL (set in mcp-server `.env`)
