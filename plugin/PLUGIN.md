# Memory Crystal Plugin — Architecture

## Overview

This directory contains the OpenClaw plugin for Memory Crystal. There are multiple
entry points due to the evolution of the OpenClaw plugin system. This document
clarifies which files are canonical and which are legacy.

---

## Files

### ✅ `index.js` — **CANONICAL** (use this)
The primary OpenClaw plugin API entry point. Loaded via `openclaw.plugin.json`
and `package.json`. Uses `api.registerHook()` to register two hooks:

- **`message_received`** — Buffers inbound user messages and injects the wake briefing on the first turn of a session.
- **`llm_output`** — Captures the full conversation turn (user + assistant) to Memory Crystal after each LLM response.

API key and Convex URL are read from `ctx.config` (plugin config), falling back to `process.env`.

---

### ⚠️ `capture-hook.js` — **DEPRECATED / LEGACY**
A standalone capture module using `api.on()` (older event emitter style) that
duplicates the logic now in `index.js`. Previously used by `handler.js` via
`child_process.spawnSync`.

**Do not use directly.** Logic has been consolidated into `index.js`.
Kept for reference and backwards compatibility.

---

### ⚠️ `handler.js` — **LEGACY HOOK HANDLER**
The entry point for older OpenClaw installations that used the `openclaw-hook.json`
hook format (schemaVersion 1). Dispatches hook calls by spawning child processes:

- Capture hooks → `capture-hook.js`
- Recall hooks → `recall-hook.js`

Referenced by `openclaw-hook.json`. Not used by modern OpenClaw plugin API.
Kept for backwards compatibility with older OpenClaw hook systems.

---

### ✅ `recall-hook.js` — **CANONICAL standalone script**
A standalone Node.js script that performs vector-similarity memory recall.
Used by `handler.js` (legacy) and can be called directly:

```bash
echo '{"query":"what did we discuss?","channel":"discord"}' | node recall-hook.js
```

Reads `OPENAI_API_KEY` and `CONVEX_URL` from environment or `../mcp-server/.env`.
Outputs JSON: `{ injectionBlock: string, memories: [] }`.

---

### ⚠️ `openclaw-capture-plugin.js` — **LEGACY / STANDALONE**
A self-contained capture handler that was used as a direct hook export before
the plugin API matured. Manages pending messages via disk (`/tmp/crystal-pending.json`)
to survive across child-process invocations.

Handles `message_received`, `llm_output`, and `message_sent` events.
API key is resolved at runtime: `process.env.CRYSTAL_API_KEY` → `mcp-server/.env`.

Kept for reference. The modern equivalent is `index.js`.

---

### `openclaw.plugin.json` — Plugin manifest (modern)
Declares the plugin for the modern OpenClaw plugin API. Entry point: `index.js`.

### `openclaw-hook.json` — Hook manifest (legacy)
Declares hooks for older OpenClaw hook systems. Entry point: `handler.js`.

### `package.json`
Node.js package metadata. `main: "index.js"`, `openclaw.extensions: ["./index.js"]`.

---

## API Key / Config

For `index.js` (canonical): the API key comes from the plugin config (`ctx.config.apiKey`),
set in the OpenClaw UI/config when installing the plugin. Falls back to `process.env.CRYSTAL_API_KEY`.

For `openclaw-capture-plugin.js` (legacy): resolves `CRYSTAL_API_KEY` from
`process.env.CRYSTAL_API_KEY` first, then parses `mcp-server/.env`.

For `recall-hook.js`: reads `OPENAI_API_KEY` and `CONVEX_URL` from env or `mcp-server/.env`.

---

## Summary Table

| File | Role | Status |
|---|---|---|
| `index.js` | OpenClaw plugin API entry (hooks) | ✅ Canonical |
| `recall-hook.js` | Standalone recall script | ✅ Canonical |
| `capture-hook.js` | Old-style capture (api.on) | ⚠️ Deprecated |
| `handler.js` | Legacy hook dispatcher | ⚠️ Legacy |
| `openclaw-capture-plugin.js` | Standalone capture handler | ⚠️ Legacy |
| `openclaw.plugin.json` | Modern plugin manifest | ✅ Active |
| `openclaw-hook.json` | Legacy hook manifest | ⚠️ Legacy |
