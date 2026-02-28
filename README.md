# VexClaw

**Persistent cognitive memory for AI assistants.**

VexClaw gives your AI a real memory — across every conversation, channel, and session. It captures what was said, extracts what matters, and makes it all searchable and recallable.

---

## What It Does

Every time you talk to your AI assistant, VexClaw:

1. **Logs the full conversation** to a daily transcript in your Obsidian vault (`logs/YYYY-MM-DD.md`)
2. **Extracts durable memories** — decisions, facts, preferences, lessons — using GPT-4o-mini
3. **Stores everything in Convex** — cloud-synced, vector-indexed, semantically searchable
4. **Injects relevant memories** before each AI response so your assistant actually remembers context

---

## Two Layers of Memory

| Layer | What it stores | Where | TTL |
|---|---|---|---|
| **Short-term (STM)** | Raw messages, verbatim | Convex `vexclawMessages` | 14 days |
| **Long-term (LTM)** | Extracted facts, decisions, lessons | Convex `vexclawMemories` + Obsidian | Forever |

STM is the rolling window. LTM is the permanent knowledge base. Both are vector-indexed for semantic search.

---

## Architecture

```
OpenClaw (your AI assistant)
  │
  ├─ recall-hook.js         Before each response:
  │   └─ before_model_resolve  search STM + LTM, inject relevant memories
  │
  └─ capture-hook.js        After each response:
      ├─ llm_output event      extract memories via GPT-4o-mini
      ├─ Convex                save STM messages + LTM memories
      └─ Obsidian vault        append daily log + write memory notes
           ├─ logs/YYYY-MM-DD.md     (full transcript, permanent)
           ├─ episodic/              (events, experiences)
           ├─ semantic/              (facts, knowledge)
           ├─ procedural/            (how-to, workflows)
           ├─ prospective/           (plans, todos)
           └─ sensory/               (observations)
```

### Plugin Registration

VexClaw registers with OpenClaw in two ways:

- **Recall** — via `hooks.internal.entries.vexclaw-memory` (fires `before_model_resolve`)
- **Capture** — via `plugins.entries.vexclaw-capture` (fires `llm_output` + `message_received`)

The `plugins.entries` approach uses OpenClaw's full JavaScript plugin API, giving access to turn-level events not available through internal hooks.

> **Config rule:** Never edit `openclaw.json` directly at runtime. See [docs/02-setup-guides/CONFIG.md](docs/02-setup-guides/CONFIG.md) for the safe config workflow.

---

## Monorepo Structure

```
openclaw-vexclaw/
  apps/
    web/              Next.js 15 web app (SaaS dashboard)
  convex/
    schema.ts         All database tables
    vexclaw/
      capture.ts      Memory extraction functions
      recall.ts       Vector search + injection
      sessions.ts     Session management
      userProfiles.ts SaaS user profiles + subscriptions
      apiKeys.ts      API key generation + validation
      dashboard.ts    Dashboard queries
  mcp-server/
    src/index.ts      MCP server (8 tools)
  plugin/
    capture-hook.js   Post-turn capture (Node.js child process)
    recall-hook.js    Pre-turn recall (Node.js child process)
    handler.js        Internal hooks entry point
  scripts/
    seed-*.js         Database seeding scripts
```

---

## SaaS Product

VexClaw is available as a hosted SaaS (coming soon).

- **$20/month** — pay as you go, cancel anytime
- Works with OpenClaw out of the box
- Dashboard built with Next.js 15 + Convex + shadcn/ui
- Billing via Polar.sh
- Deployed to Railway

The web dashboard gives you:
- Live memory feed and stats
- Memory vault with semantic search and store filters
- Short-term message log
- API key management for connecting your OpenClaw instance

---

## Self-Hosted Setup

See [docs/02-setup-guides/INSTALL.md](docs/02-setup-guides/INSTALL.md) for full instructions.

**Requirements:** OpenClaw, Node.js 18+, Convex account, OpenAI API key, Obsidian (optional)

---

## Memory Stores

| Store | Purpose | Example |
|---|---|---|
| `episodic` | Events and experiences | "We decided to pivot VexClaw to SaaS on Feb 27" |
| `semantic` | Facts and knowledge | "Railway is used for web app deployment" |
| `procedural` | How-to and workflows | "Use Codex spark for coding agents" |
| `prospective` | Plans and intentions | "Need to wire Convex Auth to dashboard UI" |
| `sensory` | Observations and signals | "Andy prefers concise responses" |

---

## Convex Backend

Deployment: `rightful-mockingbird-389.convex.cloud`

Key tables: `vexclawMemories`, `vexclawMessages`, `vexclawSessions`, `vexclawCheckpoints`, `vexclawUserProfiles`, `vexclawApiKeys`

---

## MCP Tools

| Tool | Description |
|---|---|
| `vexclaw_remember` | Manually store a memory |
| `vexclaw_recall` | Semantic search across LTM |
| `vexclaw_what_do_i_know` | List recent memories by store |
| `vexclaw_why_did_we` | Search for decision rationale |
| `vexclaw_forget` | Archive a memory |
| `vexclaw_stats` | Memory system stats |
| `vexclaw_checkpoint` | Save a memory snapshot |
| `vexclaw_wake` | Bootstrap session with recent context |

---

## Roadmap

- [x] Phase 1 — Convex schema + vector indexes
- [x] Phase 2 — MCP server (8 tools)
- [x] Phase 3 — LTM capture + Obsidian sync (381 memories seeded)
- [x] Phase 4a — STM (short-term message buffer, 14-day TTL)
- [x] Phase 4b — Daily Obsidian conversation logs
- [x] Phase 4c — SaaS web app scaffold (Next.js + Convex + Polar.sh)
- [ ] Phase 4d — Convex Auth + Polar billing wired to dashboard
- [ ] Phase 4e — Railway deployment
- [ ] Phase 5 — Spreading activation (memory associations)
- [ ] Phase 6 — Proper OpenClaw plugin refactor (kind: "memory")
- [ ] Phase 7 — Browser extension / universal capture (beyond OpenClaw)

---

*VexClaw is proprietary. Not for public distribution.*
