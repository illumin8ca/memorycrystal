# Plugin AGENTS

## Package Identity

- Purpose: OpenClaw plugin manifest and lifecycle hooks for loading VexClaw MCP.
- Scope: plugin runtime metadata and hook handler code.

## Setup Commands

- Install plugin wiring: `npm run vexclaw:enable`
- Verify plugin runtime: `npm run test:smoke`
- Full install path: `npm run vexclaw:bootstrap`
- Disable wiring: `npm run vexclaw:disable`

## Conventions

- Keep `openclaw-hook.json` declarative and stable.
- Keep handler output deterministic and JSON-safe.
- Treat plugin environment as thin bootstrap layer; delegate runtime behavior to MCP server.
- Keep compatibility with OpenClaw hook contract (`startup`, `postTurn`) unchanged unless migration is explicit.

### ✅ DO / ❌ DON'T

- ✅ `plugin/openclaw-hook.json`
- ✅ `plugin/handler.js`
- ✅ `plugin/HOOK.md`
- ❌ Changing hook field names (`tools`, `mcpArgs`, `mcpCommand`) without updating docs/wiring scripts.

## Touch Points / Key Files

- `./openclaw-hook.json`
- `./handler.js`
- `./HOOK.md`
- `./../scripts/vexclaw-enable.sh`
- `./../scripts/vexclaw-disable.sh`

## JIT Index Hints

- Find hook fields: `cat plugin/openclaw-hook.json`
- Validate handler entrypoints: `rg -n "startup|postTurn|status" plugin/handler.js`
- Confirm bootstrap paths: `rg -n "openclaw-hook.json|handler.js|capabilities|mcpCommand" plugin/openclaw-hook.json scripts/vexclaw-enable.sh`

## Common Gotchas

- `openclaw` CLI is optional in some environments; scripts should still complete wiring files even when restart command is unavailable.
- Plugin handler is currently metadata-ready only; runtime execution remains MCP-first.

## Pre-PR Checks

- `npm run vexclaw:enable -- --dry-run`
- `npm run vexclaw:disable -- --dry-run`
