# MCP Server AGENTS

## Package Identity

- Purpose: MCP tool surface exposed as `vexclaw_*` and all Convex/embedding/Obsidian adapters.
- Scope: `mcp-server/src`.

## Setup Commands

- Install deps: `cd mcp-server && npm install`
- Build server: `cd mcp-server && npm run build`
- Run locally: `cd mcp-server && npm run start`
- Check client contract: `npm run convex:run`

## Conventions

- Follow `typescript` strict typing (`mcp-server/tsconfig.json`).
- Keep tool schemas explicit and deterministic (`Tool` input schemas).
- Validate incoming arguments before calling Convex actions.
- Prefer small single-purpose handlers in `src/tools`.
- Keep shared client/embed/obsidian adapters in `src/lib`.

### ✅ DO / ❌ DON'T

- ✅ `src/tools/remember.ts`
- ✅ `src/tools/recall.ts`
- ✅ `src/index.ts`
- ❌ `src` code that catches and swallows errors without operator feedback.

## Touch Points / Key Files

- `./src/index.ts`
- `./src/tools/remember.ts`
- `./src/tools/recall.ts`
- `./src/tools/what-do-i-know.ts`
- `./src/lib/convex-client.ts`
- `./src/lib/embed.ts`
- `./src/lib/obsidian.ts`
- `./package.json`

## JIT Index Hints

- Search tool names: `rg -n "name: \"vexclaw_" src/tools`
- Find input schemas: `rg -n "inputSchema|required" src/tools`
- Validate Convex calls: `rg -n "mutation\\(|query\\(|action\\(" src`

## Common Gotchas

- `scripts/vexclaw-enable.sh` writes command maps based on `mcp-server/dist/index.js`; rebuild before enable when tool logic changes.
- Embedding provider behavior should remain explicit; keep `EMBEDDING_PROVIDER` in env for defaults.

## Pre-PR Checks

- `cd mcp-server && npm run build`
- `npm run test:smoke`
