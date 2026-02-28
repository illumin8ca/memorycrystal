# VexClaw OpenClaw Hook

VexClaw registers as an OpenClaw plugin with the full VexClaw MCP tool set.
The plugin is designed to be installed via `npm run vexclaw:bootstrap`.

- `vexclaw_remember`
- `vexclaw_recall`
- `vexclaw_what_do_i_know`
- `vexclaw_why_did_we`
- `vexclaw_forget`
- `vexclaw_stats`
- `vexclaw_checkpoint`
- `vexclaw_wake`

These tool names are intentionally prefixed for OpenClaw MCP compatibility.

## Hook contract

- `startup`: plugin metadata and handler load.
- `postTurn`: reserved for future autopilot memory capture; disabled by default.

## Installation output

Enable flow copies this folder to:

`${OPENCLAW_PLUGIN_DIR}/vexclaw-memory`

or if unset, one of:

- `${OPENCLAW_DIR}/extensions/vexclaw-memory` (if `OPENCLAW_DIR` exists)
- `${XDG_CONFIG_HOME}/openclaw/extensions/vexclaw-memory` (if `XDG_CONFIG_HOME` is set)
- `${HOME}/.config/openclaw/extensions/vexclaw-memory`
- `${HOME}/.openclaw/extensions/vexclaw-memory`
- `${HOME}/Library/Application Support/openclaw/extensions/vexclaw-memory` (macOS)

## MCP command

The handler references the MCP server through `mcpCommand`:

`bash -lc "cd \"$VEXCLAW_ROOT\" && npm --prefix mcp-server run start:vexclaw --silent"`

Set `VEXCLAW_ROOT` to your checked-out plugin repository root before the plugin loads.

This keeps the plugin command portable and consistent with the shipped scripts.
