# AGENTS.md — VexClaw Development Context

Read this before touching anything in this repo.

---

## What VexClaw Is

VexClaw is two things:

1. **A memory plugin for OpenClaw** — captures conversations, extracts facts, recalls context before each AI response. Hooks into OpenClaw via two mechanisms (internal hooks for recall, JavaScript plugin API for capture).

2. **A SaaS product** — $20/month hosted memory service with a web dashboard, multi-tenant Convex backend, Polar.sh billing. Web app lives in `apps/web/`. Target deployment: Railway.

The long-term vision is universal AI memory — not limited to OpenClaw. Browser extension and open API planned.

---

## Repo Structure

```
openclaw-vexclaw/         ← monorepo root
  apps/web/               ← Next.js 15 SaaS dashboard
  convex/                 ← Convex backend (shared)
    schema.ts             ← source of truth for all tables
    vexclaw/              ← all Convex functions
  mcp-server/             ← MCP server (port 8788)
    src/index.ts
    .env                  ← CONVEX_URL, OPENAI_API_KEY, OBSIDIAN_VAULT_PATH
  plugin/                 ← OpenClaw plugin files (source of truth)
    capture-hook.js
    recall-hook.js
    handler.js
  scripts/                ← seeding, setup, codex task files
  docs/                   ← documentation
  railway.toml            ← Railway deploy config (root → apps/web)
  pnpm-workspace.yaml
```

**Live plugin files** (deployed copies):
```
~/.openclaw/extensions/vexclaw-memory/    ← internal hooks (recall)
~/.openclaw/extensions/vexclaw-capture/   ← JavaScript plugin API (capture)
```

After editing `plugin/`, always copy to both extension dirs and restart the gateway.

---

## The Memory Flow (Plain English)

```
User sends message
  → recall-hook.js fires (before_model_resolve)
      → embeds the query
      → searches vexclawMessages (STM) + vexclawMemories (LTM)
      → injects top results into system prompt

AI responds
  → capture-hook.js fires (llm_output event)
      → logs user message + AI response to Obsidian/logs/YYYY-MM-DD.md
      → saves both messages to vexclawMessages (STM, 14-day TTL)
      → calls GPT-4o-mini to extract up to 3 memories from the turn
      → embeds and dedupes extracted memories
      → saves new memories to vexclawMemories (LTM, permanent)
      → writes each memory as a .md file to Obsidian/<store>/
```

---

## Convex Tables

| Table | Purpose | TTL |
|---|---|---|
| `vexclawMemories` | Long-term distilled facts | Permanent |
| `vexclawMessages` | Raw verbatim messages | 14 days |
| `vexclawSessions` | Session tracking | Manual |
| `vexclawCheckpoints` | Memory snapshots | Manual |
| `vexclawUserProfiles` | SaaS subscription data | Permanent |
| `vexclawApiKeys` | Hashed API keys | Until revoked |

Deployment: `rightful-mockingbird-389.convex.cloud`

Valid `store` values: `sensory | episodic | semantic | procedural | prospective`
Valid `category` values: `decision | lesson | person | rule | event | fact | goal | workflow`
Valid `source` values: `conversation | cron | observation | inference | external`

---

## OpenClaw Config Rules

**Never edit `~/.openclaw/openclaw.json` directly inside a running session.**

The safe workflow:
1. Draft the exact `jq` commands or JSON patch needed
2. Present them to Andy for review
3. Andy applies outside the runtime
4. Verify with `jq empty ~/.openclaw/openclaw.json` and `openclaw doctor`

Plugin registration in `openclaw.json`:
- Recall: `hooks.internal.entries.vexclaw-memory` (entry point: `handler.js`)
- Capture: `plugins.entries.vexclaw-capture` + `plugins.allow` (entry point: `index.js`)

Valid plugin entry fields: `{ "enabled": true }` — no `source`, no `path`.

## Session startup protocol

At the start of every new session, Gerald must call `vexclaw_wake` before doing anything else.

- Send `vexclaw_wake` as the very first action in the session flow.
- Continue only after wake succeeds.
- If wake fails, pause and resolve before running other workflow steps.

---

## Design System (Web App)

Non-negotiable rules for `apps/web/`:

- Background: `#090909`
- Surface (cards): `#141414`
- Elevated (inputs, hover): `#1e1e1e`
- Accent: `#0066ff` (electric blue)
- Accent hover: `#0044cc`
- Text primary: `#f0f0f0`
- Text secondary: `#888888`
- Borders: `1px solid #2a2a2a`
- `border-radius: 0` — **everywhere, no exceptions**
- No gradients
- Flat and sharp

---

## Current Status (as of 2026-02-27)

**Working:**
- LTM capture + Obsidian note writing
- STM message logging (Convex)
- Daily transcript logs (`Obsidian/logs/YYYY-MM-DD.md`)
- Recall hook (before_model_resolve, fires on every turn)
- Web app scaffold (marketing page + dashboard UI, placeholder data)
- Convex multi-tenant schema (userProfiles, apiKeys)

**Not yet working:**
- Capture plugin (`vexclaw-capture`) — needs Codex to apply the config patch to `openclaw.json` outside runtime (see instructions in `docs/02-setup-guides/CONFIG.md`)
- Convex Auth wired to web UI (forms are static HTML)
- Polar.sh billing integrated
- Railway deployment

**Next priority:**
Apply the capture plugin config, verify `[vexclaw] capture hooks registered` in gateway log, confirm daily logs are writing.

---

## Key Commands

```bash
# Deploy Convex functions
cd convex && npx convex deploy

# Run MCP server
cd mcp-server && npm run start

# Start web app dev server
cd apps/web && npm run dev

# Copy plugin files to live extensions (after editing plugin/)
cp plugin/capture-hook.js ~/.openclaw/extensions/vexclaw-memory/
cp plugin/capture-hook.js ~/.openclaw/extensions/vexclaw-capture/  # same file
cp plugin/recall-hook.js ~/.openclaw/extensions/vexclaw-memory/
cp plugin/handler.js ~/.openclaw/extensions/vexclaw-memory/

# Restart gateway (do NOT run from within a session)
openclaw gateway restart
```

---

## What Not to Do

- Do not run `openclaw gateway restart` from inside an exec session — it kills the session
- Do not edit `~/.openclaw/openclaw.json` directly from within the AI runtime
- Do not add `source` or `path` keys to `plugins.entries` — they are not valid schema fields
- Do not publish to ClaWHub — VexClaw is proprietary
- Do not commit API keys or the `.env` file
