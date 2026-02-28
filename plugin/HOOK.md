# Memory Crystal OpenClaw Hook

Memory Crystal registers as an OpenClaw plugin with the full Memory Crystal MCP tool set.
The plugin is designed to be installed via `npm run crystal:bootstrap`.

- `crystal_remember`
- `crystal_recall`
- `crystal_what_do_i_know`
- `crystal_why_did_we`
- `crystal_forget`
- `crystal_stats`
- `crystal_checkpoint`
- `crystal_wake`

These tool names are intentionally prefixed for OpenClaw MCP compatibility.

## Hook contract

- `startup`: plugin metadata and handler load.
- `postTurn`: reserved for future autopilot memory capture; disabled by default.

## Installation output

Enable flow copies this folder to:

`${OPENCLAW_PLUGIN_DIR}/crystal-memory`

or if unset, one of:

- `${OPENCLAW_DIR}/extensions/crystal-memory` (if `OPENCLAW_DIR` exists)
- `${XDG_CONFIG_HOME}/openclaw/extensions/crystal-memory` (if `XDG_CONFIG_HOME` is set)
- `${HOME}/.config/openclaw/extensions/crystal-memory`
- `${HOME}/.openclaw/extensions/crystal-memory`
- `${HOME}/Library/Application Support/openclaw/extensions/crystal-memory` (macOS)

## MCP command

The handler references the MCP server through `mcpCommand`/`mcpArgs`:

`node <path-to-repo>/mcp-server/dist/index.js`

`openclaw-hook.json` rewrites these command paths during enable so they stay portable
across machines (for example, to extension-specific hook locations).
