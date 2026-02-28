# Memory Crystal — Cognitive Memory System for Gerald
## Product Requirements Document

**Status:** DRAFT — Sections 1, 2, and 3 are active; delivery cadence is now tracked in `ROADMAP.md`
**Last Updated:** 2026-02-26
**Owner:** Andy Doucet
**Agent:** Gerald

---

# SECTION 1 — PRODUCT REQUIREMENTS
*Authored by Sonnet 4.6*

## 1. Executive Summary

Memory Crystal is a persistent cognitive memory layer for Gerald, an OpenClaw-based Claude agent that assists Andy Doucet. It is modeled after the architecture of human memory — not as a metaphor, but as a structural blueprint — implementing five distinct memory stores with biologically-inspired decay, spreading activation, and associative recall.

**Why it exists:** Gerald is amnesiac by design. Every session starts fresh. Context windows compact and discard. The more Gerald is used across channels (Discord, Telegram, future surfaces), the more painful this becomes — not just as a UX inconvenience, but as a fundamental ceiling on how useful Gerald can actually be. A developer's AI assistant that can't remember what stack they use, what projects they're building, or what was decided last Tuesday is not an assistant — it's a very expensive autocomplete.

Memory Crystal solves this by externalizing Gerald's memory into Convex (fast, structured, queryable, real-time) with a human-readable mirror in Obsidian markdown. Gerald gains MCP tools to read and write memories mid-conversation. Andy gains an admin panel in the Gerald Dashboard to browse, edit, and audit what Gerald remembers.

**What success looks like:**
- Gerald greets Andy on day 47 and already knows what project Andy is building, what blockers exist, and what was decided in last week's retro — without being told.
- Andy never has to re-explain context. Zero "as I mentioned before" moments.
- Andy can open the Gerald Dashboard and see exactly what Gerald knows, correct a wrong memory, or delete a sensitive one.
- Gerald operates identically across Discord, Telegram, and any future channel — memory is channel-agnostic.
- Memory recall adds less than 400ms to Gerald's response time at p95.

---

## 2. Problem Statement

### 2.1 Session Amnesia (The Root Problem)
Gerald is a stateless process. Each session starts from a blank slate. The only continuity that exists today is what fits in static files (`MEMORY.md`, `USER.md`, daily notes) — which Gerald must manually maintain, and which are already showing seams. These files don't scale, don't have structured retrieval, and don't support semantic search. They're a workaround masquerading as a solution.

### 2.2 Context Compaction Destroys Working Memory
Within a single long session, Claude's context window fills and compacts. When compaction occurs, the beginning of the conversation — including critical context, decisions made, and instructions given — is silently discarded. There is currently no mechanism to checkpoint "what matters" before compaction happens, and no way to re-surface it afterward.

### 2.3 No Relational Understanding
Gerald has no understanding of relationships between pieces of information. Memories exist in isolation, not in a graph. There is no spreading activation — no way for recalling one memory to surface related ones. Gerald misses implicit context constantly.

### 2.4 No Automatic Capture
Gerald only writes to memory files if explicitly instructed. Important information flows by constantly without being captured: architectural decisions, opinions Andy expresses, preferences revealed through behavior, project context buried in casual conversation.

### 2.5 Group Chat Blind Spots
Gerald participates in Discord and Telegram channels. Currently, Gerald has no mechanism to capture channel-specific context. Each group chat interaction starts cold, yet these channels are where a lot of Andy's real work discussions happen.

### 2.6 The Scaling Wall
`MEMORY.md` is a flat file. As the relationship deepens, this file will become unwieldy. No search, no filtering, no expiry, no categorization, no relevance ranking. The current architecture cannot scale beyond a few months of use without becoming actively harmful to Gerald's performance.

---

## 3. Goals & Non-Goals

### Goals

**G1 — Persistent memory that survives session restarts and compaction**
Every meaningful piece of information is captured in Convex, queryable, and retrievable in future sessions.

**G2 — Five-store cognitive architecture**
- **Sensory buffer** (24h TTL): Raw recent events
- **Episodic store**: Specific events with timestamp and decay
- **Semantic store**: Durable facts about Andy, projects, preferences
- **Procedural store**: How-to knowledge and workflows
- **Prospective store**: Future intentions and commitments

**G3 — Memory strength and decay**
Each memory has `strength` (0.0–1.0) that decays over time. Emotional weight slows decay. Frequently recalled memories gain reinforcement. Weak memories are archived, not deleted.

**G4 — Spreading activation on recall**
When a memory is retrieved, related memories are surfaced alongside it, weighted by associative distance.

**G5 — Dual-write to Obsidian vault**
Every memory write also creates/updates a markdown file in Andy's Obsidian vault. Human-readable, auditable, portable backup.

**G6 — MCP tool surface for Gerald**
Node.js MCP server exposes tools Gerald calls mid-conversation:
- `crystal_remember` — write a new memory
- `crystal_recall` — semantic search
- `crystal_what_do_i_know` — broad topic check
- `crystal_why_did_we` — decision archaeology
- `crystal_forget` — soft-delete
- `crystal_stats` — health stats
- `crystal_checkpoint` — save working context
- `crystal_wake` — morning briefing

**G7 — Admin UI panel in Gerald Dashboard**
Andy can browse, search, edit, and delete memories at `gerald.andydoucet.com/memory`. Protected by existing Telegram-based auth.

**G8 — Channel-agnostic**
Memory works identically across Discord, Telegram, CLI, and future channels. Channel stored as metadata.

**G9 — Embedding-based semantic search**
OpenAI `text-embedding-3-small` (1536 dims), abstracted behind interface swappable to local Ollama.

**G10 — Automatic capture without interruption**
Gerald captures information worth storing in the background, without asking Andy each time.

### Non-Goals

- **NG1** — Not a general-purpose knowledge base
- **NG2** — Not multi-tenant (single agent, single user)
- **NG3** — Not a replacement for the context window
- **NG4** — Not real-time collaborative (Obsidian sync is one-way in v1)
- **NG5** — Not a conversation logger (no verbatim transcripts)
- **NG6** — Not emotionally generative (valence metadata only affects decay rate)
- **NG7** — Not blockchain or decentralized

---

## 4. User Stories

### Andy's Perspective
- **AS-1** — Seamless continuity: Gerald picks up where we left off, zero re-explaining
- **AS-2** — Proactive surfacing: Gerald surfaces relevant memories without being asked
- **AS-3** — Transparency and control: Dashboard shows exactly what Gerald knows; full CRUD
- **AS-4** — Natural correction: "That's wrong, Gerald" updates/removes the memory immediately
- **AS-5** — Cross-channel coherence: Same Gerald on Discord, Telegram, CLI
- **AS-6** — Prospective memory: Gerald remembers commitments and surfaces them proactively
- **AS-7** — Human-readable vault: Every memory also lives in Obsidian as markdown
- **AS-8** — Memory health visibility: Dashboard shows health stats (count, avg strength, decay rate)

### Gerald's Perspective
- **GS-1** — Call `crystal_wake()` at session start to get a briefing of what matters right now
- **GS-2** — Call `crystal_recall()` before answering complex questions
- **GS-3** — Call `crystal_remember()` when something important happens, without interrupting flow
- **GS-4** — Call `crystal_checkpoint()` before context compaction warnings
- **GS-5** — Know when NOT to store (transient chatter, not every message)
- **GS-6** — Access memories across all channels without special-casing

---

## 5. Success Metrics

- **Recall latency**: p95 < 400ms from query to injected context
- **Recall relevance**: >80% of recalled memories rated "relevant" by Andy in spot checks
- **Capture rate**: >90% of decisions/facts Andy says "remember this" about are captured automatically within 60s
- **Zero context-loss events**: Defined as Andy having to re-explain something Gerald should know
- **Memory health**: Average strength > 0.4 across active semantic store after 30 days
- **Uptime**: Memory Crystal MCP server available >99.5% of Gerald's active hours
- **Dashboard adoption**: Andy uses `/memory` panel at least once per week to audit/correct

---

# SECTION 2 — TECHNICAL ARCHITECTURE
*Authored by Codex 5.3*

## 1. System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GERALD'S WORLD                                      │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │   Discord   │    │  Telegram   │    │  iMessage   │                     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                     │
│         └─────────────────┼─────────────────────┘                          │
│                           ▼                                                  │
│              ┌────────────────────────┐                                     │
│              │      OpenClaw Core     │                                     │
│              │   (Claude Sonnet 4.x)  │                                     │
│              └────────────┬───────────┘                                     │
│                           │  MCP stdio                                      │
│                           ▼                                                  │
│              ┌────────────────────────┐                                     │
│              │    Memory Crystal MCP Server   │  ← Node.js/TS process              │
│              │  ~/openclaw/crystal/    │    runs alongside OpenClaw          │
│              │  mcp-server/index.ts   │                                     │
│              └──────┬─────────────────┘                                     │
│                     │                                                        │
│          ┌──────────┴──────────┐                                            │
│          ▼                     ▼                                            │
│  ┌───────────────┐   ┌──────────────────┐                                  │
│  │ OpenAI Embed  │   │   Convex Cloud   │                                  │
│  │ text-embed-   │   │  ┌────────────┐  │                                  │
│  │ 3-small 1536d │   │  │  memories  │  │                                  │
│  └───────────────┘   │  │  assocs    │  │                                  │
│                       │  │  sessions  │  │                                  │
│                       │  │  checkpts  │  │                                  │
│                       │  └────────────┘  │                                  │
│                       │  ┌────────────┐  │                                  │
│                       │  │ Cron Jobs  │  │                                  │
│                       │  │ (decay,    │  │                                  │
│                       │  │  promote,  │  │                                  │
│                       │  │  cluster)  │  │                                  │
│                       │  └────────────┘  │                                  │
│                       └────────┬─────────┘                                  │
│               ┌────────────────┴────────────────┐                          │
│               ▼                                  ▼                          │
│  ┌────────────────────────┐      ┌───────────────────────────┐             │
│  │   Obsidian Vault       │      │   Gerald Dashboard         │             │
│  │  ~/Documents/Gerald/   │      │  gerald.andydoucet.com     │             │
│  │  Memory/               │      │  /memory panel              │             │
│  │  ├── sensory/          │      └───────────────────────────┘             │
│  │  ├── episodic/         │                                                  │
│  │  ├── semantic/         │                                                  │
│  │  ├── procedural/       │                                                  │
│  │  └── prospective/      │                                                  │
│  └────────────────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

**Write path (memory capture):**
```
User message → OpenClaw → (post-turn) → Memory Crystal MCP crystal_remember
  → LLM extraction (Claude Haiku) → structured memory objects
  → OpenAI embed → 1536-dim vector
  → Convex mutation (crystalMemories.create) → vector index
  → Convex action → Obsidian file write
  → Convex real-time push → Dashboard updates live
```

**Read path (memory recall):**
```
Incoming message → Memory Crystal MCP crystal_recall
  → embed query text → vector search (top-40 candidates)
  → composite score filter (top-8 results)
  → inject formatted block into Gerald's system prompt
  → Gerald responds with memory context
  → accessCount + lastAccessedAt updated async
```

**Background consolidation:**
```
Convex cron (every 12h) → crystal_consolidate action
  → fetch sensory memories, cluster by embedding similarity > 0.75
  → LLM synthesis (Claude Haiku) → episodic memory
  → promote high-confidence episodic (conf > 0.8, access > 3) → semantic
  → decay all strengths → archive weak (strength < 0.1)
```

---

## 2. Data Model — Full Convex Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // PRIMARY MEMORY STORE
  crystalMemories: defineTable({
    store: v.union(
      v.literal("sensory"),      // raw fragments, TTL ~24h
      v.literal("episodic"),     // synthesized episodes
      v.literal("semantic"),     // distilled facts, persistent
      v.literal("procedural"),   // how-to workflows
      v.literal("prospective")   // future intentions
    ),
    category: v.union(
      v.literal("decision"), v.literal("lesson"),
      v.literal("person"),   v.literal("rule"),
      v.literal("event"),    v.literal("fact"),
      v.literal("goal"),     v.literal("workflow")
    ),
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),  // 1536-dim
    strength: v.float64(),            // 0–1, decays daily
    confidence: v.float64(),          // 0–1
    valence: v.float64(),             // -1 to 1 (emotional charge)
    arousal: v.float64(),             // 0–1 (intensity)
    accessCount: v.number(),
    lastAccessedAt: v.number(),       // Unix ms
    createdAt: v.number(),
    source: v.union(
      v.literal("conversation"), v.literal("cron"),
      v.literal("observation"),  v.literal("inference"),
      v.literal("external")
    ),
    sessionId: v.optional(v.id("crystalSessions")),
    channel: v.optional(v.string()),  // "discord" | "telegram" | "imessage"
    tags: v.array(v.string()),
    archived: v.boolean(),
    archivedAt: v.optional(v.number()),
    promotedFrom: v.optional(v.id("crystalMemories")),
    checkpointId: v.optional(v.id("crystalCheckpoints")),
  })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["store", "category", "archived"],
    })
    .index("by_store_category", ["store", "category", "archived"])
    .index("by_strength", ["strength", "archived"])
    .index("by_last_accessed", ["lastAccessedAt"])
    .index("by_session", ["sessionId"]),

  // ASSOCIATIVE LINKS
  crystalAssociations: defineTable({
    fromMemoryId: v.id("crystalMemories"),
    toMemoryId: v.id("crystalMemories"),
    relationshipType: v.union(
      v.literal("supports"),    v.literal("contradicts"),
      v.literal("derives_from"),v.literal("co_occurred"),
      v.literal("generalizes"), v.literal("precedes")
    ),
    weight: v.float64(),        // 0–1
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_from", ["fromMemoryId"])
    .index("by_to", ["toMemoryId"]),

  // SESSION TRACKING
  crystalSessions: defineTable({
    channel: v.string(),
    channelId: v.optional(v.string()),
    startedAt: v.number(),
    lastActiveAt: v.number(),
    endedAt: v.optional(v.number()),
    messageCount: v.number(),
    memoryCount: v.number(),
    summary: v.optional(v.string()),
    participants: v.array(v.string()),
    model: v.optional(v.string()),
    checkpointId: v.optional(v.id("crystalCheckpoints")),
  })
    .index("by_channel", ["channel", "lastActiveAt"]),

  // CHECKPOINTS
  crystalCheckpoints: defineTable({
    label: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.union(v.literal("gerald"), v.literal("andy")),
    sessionId: v.optional(v.id("crystalSessions")),
    memorySnapshot: v.array(v.object({
      memoryId: v.id("crystalMemories"),
      strength: v.float64(),
      content: v.string(),
      store: v.string(),
    })),
    semanticSummary: v.string(),
    tags: v.array(v.string()),
  })
    .index("by_created", ["createdAt"]),

  // WAKE STATE
  crystalWakeState: defineTable({
    sessionId: v.id("crystalSessions"),
    injectedMemoryIds: v.array(v.id("crystalMemories")),
    wakePrompt: v.string(),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"]),
});
```

---

## 3. MCP Tool Specifications

```typescript
// All tools exposed by the Memory Crystal MCP Server

// crystal_remember
input: {
  store: MemoryStore,           // required
  category: MemoryCategory,     // required
  title: string,                // 5-80 chars
  content: string,              // full memory text
  tags?: string[],
  confidence?: number,          // 0-1, default 0.7
  valence?: number,             // -1 to 1, default 0
  arousal?: number,             // 0-1, default 0.3
  channel?: string,
}
output: { memoryId: string, title: string, store: string }

// crystal_recall
input: {
  query: string,
  stores?: MemoryStore[],       // filter by store type
  categories?: MemoryCategory[],
  tags?: string[],
  limit?: number,               // default 8, max 20
  includeArchived?: boolean,    // default false
}
output: { memories: FormattedMemory[], injectionBlock: string }

// crystal_what_do_i_know
input: { topic: string }
output: { summary: string, memoryCount: number, topMemories: FormattedMemory[] }

// crystal_why_did_we
input: { decision: string }
output: { reasoning: string, relatedMemories: FormattedMemory[] }

// crystal_forget
input: { memoryId: string, reason?: string }
output: { success: boolean, archived: boolean }

// crystal_stats
input: {}
output: {
  totalMemories: number,
  byStore: Record<MemoryStore, number>,
  avgStrength: number,
  recentCaptures: number,       // last 24h
  archivedCount: number,
}

// crystal_checkpoint
input: { label: string, description?: string, tags?: string[] }
output: { checkpointId: string, memoriesSnapshotted: number }

// crystal_wake
input: { channel?: string }
output: { briefing: string, openGoals: FormattedMemory[], recentDecisions: FormattedMemory[] }
```

---

## 4. Auto-Capture Pipeline

```typescript
// lib/extract.ts — LLM extraction prompt
const EXTRACTION_PROMPT = `
You are a memory extraction system for an AI agent named Gerald.
Review the following conversation turn and extract memories worth storing.
Return JSON array of memory objects (empty array if nothing worth storing).

Rules:
- Extract FACTS, DECISIONS, PREFERENCES, GOALS, HOW-TOs, PEOPLE info
- Skip: greetings, confirmations, transient status ("okay", "sure", "done")
- Skip: things that are already common knowledge
- Be concise — memory content should be 1-3 sentences max
- Assign appropriate store: sensory (raw), semantic (fact), episodic (event), procedural (workflow), prospective (future plan)

Conversation:
USER: {userMessage}
GERALD: {geraldResponse}

Return JSON array:
[{ store, category, title, content, confidence, valence, arousal, tags }]
`;

// Deduplication: before writing, vector search for similar memories
// If cosine similarity > 0.92 with existing memory → patch/merge instead of insert
// If 0.75-0.92 → create association link + insert new
// If < 0.75 → insert fresh
```

---

## 5. Auto-Recall Pipeline

```typescript
// Composite scoring function
function scoreMemory(mem: Memory, vectorScore: number, now: number): number {
  const daysSinceAccess = (now - mem.lastAccessedAt) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.exp(-0.1 * daysSinceAccess);          // exponential decay
  const accessScore = Math.min(1.0, mem.accessCount / 20);         // normalize at 20 accesses
  return (
    mem.strength      * 0.3 +
    recencyScore      * 0.2 +
    accessScore       * 0.1 +
    vectorScore       * 0.4
  );
}

// Injection format (prepended to Gerald's system prompt)
const MEMORY_INJECTION_TEMPLATE = `
## 🧠 Memory Crystal Memory Recall
The following memories are relevant to this conversation:

{memories.map(m => `
### ${m.store.toUpperCase()}: ${m.title}
${m.content}
Tags: ${m.tags.join(", ")} | Strength: ${m.strength.toFixed(2)} | Confidence: ${m.confidence.toFixed(2)}
`)}

Use this context naturally. Do not recite memory entries verbatim.
`;
```

---

## 6. Background Cron Jobs

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
const crons = cronJobs();

// Decay: every 24h
crons.interval("crystal-decay", { hours: 24 }, internal.crystal.decay);

// Consolidation: every 12h (cluster sensory → episodic → semantic)
crons.interval("crystal-consolidate", { hours: 12 }, internal.crystal.consolidate);

// Cleanup: archive memories strength < 0.1, delete sensory > 24h old
crons.interval("crystal-cleanup", { hours: 24 }, internal.crystal.cleanup);

// Spreading activation: build association links for new memories
crons.interval("crystal-associate", { hours: 6 }, internal.crystal.buildAssociations);
```

**Decay logic:**
```typescript
// Emotional memories decay at 0.01/day, others at 0.02/day
const isHighEmotion = Math.abs(mem.valence) > 0.7 && mem.arousal > 0.7;
const decayRate = isHighEmotion ? 0.01 : 0.02;
const daysSinceAccess = (now - mem.lastAccessedAt) / 86400000;
const newStrength = Math.max(0, mem.strength - decayRate * daysSinceAccess);
// Archive (don't delete) when newStrength < 0.1
```

---

## 7. Obsidian Dual-Write

**Vault structure:**
```
~/Documents/Gerald/Memory/
├── sensory/
│   └── 2026-02-25-sensory-001.md
├── episodic/
│   └── 2026-02-25-crystal-memory-system-decision.md
├── semantic/
│   └── andy-prefers-typescript.md
├── procedural/
│   └── deploy-gerald-dashboard.md
└── prospective/
│   └── review-crystal-schema-weekend.md
└── _index.md                    # auto-generated master index
```

**File format:**
```markdown
---
id: jx7k9abc123
store: semantic
category: decision
strength: 0.95
confidence: 0.9
tags: [convex, architecture, memory]
created: 2026-02-25T20:00:00Z
source: conversation
channel: discord
---

# Andy chose Convex over Supabase for Memory Crystal

Andy already pays for Convex, has an existing project, and it has native vector
search, real-time subscriptions, and TypeScript-first design. No additional
infrastructure needed.
```

**Sync trigger:** Convex action fires after every `crystalMemories` write. Uses Node.js `fs.writeFile` via an HTTP action to the MCP server's local filesystem endpoint.

---

## 8. Gerald Dashboard /memory Panel

**Features:**
- Memory browser: filterable by store, category, strength, date, tags
- Search bar: semantic search (calls `crystal_recall` via API)
- Memory card: shows title, content, strength bar, decay curve, source channel, tags, associations
- Edit in place: title, content, tags, confidence
- Delete (archive): soft-delete with confirmation
- Stats panel: total count, by-store breakdown, avg strength, last 24h captures
- Checkpoint viewer: browse historical snapshots

**Real-time:** Convex React hooks (`useQuery`) subscribe to `crystalMemories` table — dashboard updates instantly as Gerald captures new memories.

**Auth:** Existing Telegram-based auth at `gerald.andydoucet.com` (user ID 511172388 only).

---

## 9. OpenClaw Integration

**Changes to workspace:**
```
~/openclaw/
├── AGENTS.md              # update: add Memory Crystal MCP registration + usage rules
├── skills/
│   └── crystal/
│       ├── SKILL.md       # how Gerald uses Memory Crystal tools
│       └── prompts/
│           ├── extraction.md   # auto-capture prompt
│           └── injection.md    # recall injection format
└── crystal/                # MCP server lives here
    └── mcp-server/
        ├── package.json
        ├── index.ts
        └── tools/
```

**AGENTS.md additions:**
```markdown
## 🧠 Memory Crystal Memory
You have persistent memory via Memory Crystal MCP tools. Use them:
- At session start: call `crystal_wake()` to get your briefing
- Before answering complex questions: call `crystal_recall(query)`
- After learning something important: call `crystal_remember(...)`
- Before context compaction warnings: call `crystal_checkpoint(label)`
- Use `crystal_why_did_we(decision)` to explain past decisions to Andy

Memory privacy: do NOT store PII, passwords, or secrets in Memory Crystal.
```

---

## 10. Build Phases

| Phase | Scope | Est. Effort | Definition of Done |
|-------|-------|-------------|-------------------|
| **1 — MVP** | Convex schema, sensory + semantic stores, basic `crystal_remember` + `crystal_recall` MCP tools, manual only | 1-2 days | Gerald can manually store and recall memories via MCP tools |
| **2 — Full cognitive model** | Episodic, procedural, prospective stores, decay cron, consolidation pipeline, associations | 2-3 days | All 5 stores working, decay math verified, memories promote automatically |
| **3 — Auto-capture + recall** | LLM extraction post-turn, deduplication, auto-recall injection into system prompt, Obsidian dual-write | 2-3 days | Gerald captures memories without being asked; recalls on every turn |
| **4 — Dashboard** | Gerald Dashboard `/memory` panel, real-time Convex subscriptions, CRUD UI | 1-2 days | Andy can browse/edit/delete memories at gerald.andydoucet.com/memory |
| **5 — Spreading activation + wake** | Association graph, `crystal_wake` morning briefing, `crystal_checkpoint` + `crystal_why_did_we` | 2-3 days | Related memories surface together; Gerald opens sessions with context briefing |

---

# SECTION 3 — DELIVERY & ROLLOUT PLAN
*Authored by Gerald*

## 1. Phased Rollout Plan

### Phase 1 — Minimum Viable Memory (Target: working in 1-2 days)

**What gets built:**
- `gerald-crystal` repo initialized with Convex project connected to existing Andy Convex account
- Convex schema deployed: `crystalMemories` table only (sensory + semantic stores), vector index
- Embedding adapter: OpenAI `text-embedding-3-small`, wrapped in `lib/embed.ts`
- Two MCP tools: `crystal_remember` and `crystal_recall`
- MCP server wired into OpenClaw via `openclaw.json` MCP config
- `AGENTS.md` updated: Gerald knows to call `crystal_recall` at session start and `crystal_remember` for key facts

**Definition of done:**
- Gerald can manually call `crystal_remember` mid-conversation and have it persist to Convex
- Gerald can call `crystal_recall("Convex memory system")` and get back relevant stored memories
- Memory survives a full session restart and is retrievable in a new session
- Latency: recall < 500ms end-to-end

**Dependencies:** Convex account access, OpenAI API key for embeddings, OpenClaw MCP config

---

### Phase 2 — Full Cognitive Model (Target: 2-3 days after Phase 1)

**What gets built:**
- All 5 memory stores active (episodic, procedural, prospective added)
- All 5 tables deployed: `crystalAssociations`, `crystalSessions`, `crystalCheckpoints`, `crystalWakeState`
- Decay cron (every 24h): strength reduction, archive at < 0.1
- Consolidation cron (every 12h): cluster sensory → synthesize episodic via Claude Haiku
- Auto-promotion: high-confidence episodic → semantic
- Spreading activation: `crystal_associate` cron builds association links
- Remaining MCP tools: `crystal_forget`, `crystal_stats`, `crystal_checkpoint`, `crystal_what_do_i_know`, `crystal_why_did_we`, `crystal_wake`

**Definition of done:**
- Sensory memories created in Phase 1 have been auto-promoted to episodic/semantic by cron
- Decay math verified: test memory created with strength=1.0, check it reads correctly lower after 24h
- `crystal_wake` returns a coherent briefing from existing memories
- Association links exist between semantically related memories

**Dependencies:** Phase 1 complete, Claude Haiku API access for consolidation LLM calls

---

### Phase 3 — Auto-Capture + Auto-Recall (Target: 2-3 days after Phase 2)

**What gets built:**
- Auto-capture: post-turn hook in OpenClaw fires LLM extraction (Claude Haiku) on every conversation exchange, stores worthy memories automatically
- Deduplication: before write, vector search for similarity > 0.92 → patch/merge instead of insert
- Auto-recall: before Gerald responds, `crystal_recall` fires and injects top-8 relevant memories into system prompt block
- Obsidian dual-write: Convex action writes markdown file to `~/Documents/Gerald/Memory/` on every memory write
- Channel metadata: memories tagged with source channel (discord/telegram/imessage)

**Definition of done:**
- Have a conversation with Gerald, then restart session — Gerald recalls facts from the prior conversation unprompted
- Obsidian vault shows new files for memories captured in the conversation
- Dedup works: say the same fact twice, only one memory created (updated, not duplicated)
- Auto-recall latency measured, p95 < 400ms

**Dependencies:** Phase 2 complete, Obsidian installed, vault path configured

---

### Phase 4 — Gerald Dashboard /memory Panel (Target: 1-2 days after Phase 3)

**What gets built:**
- New route `/memory` in Gerald Dashboard (Next.js)
- Memory browser: list view with filter by store, category, strength, date, tags
- Search: calls Memory Crystal API, shows semantic results
- Memory card: title, content, strength bar (visual), decay rate, source channel, tags, associations
- Edit in-place: title, content, tags, confidence (PATCH to Convex mutation)
- Soft-delete button with confirmation (calls `crystal_forget`)
- Stats panel: total, by-store breakdown, avg strength, last 24h captures
- Real-time: Convex React `useQuery` hooks so dashboard updates live as Gerald captures memories

**Definition of done:**
- Andy can open `gerald.andydoucet.com/memory`, see all memories, search by topic
- Editing a memory in the dashboard is reflected in Gerald's next recall
- Deleting a memory in the dashboard means Gerald no longer recalls it
- Real-time: capture a memory via chat, see it appear in the dashboard tab within 2 seconds

**Dependencies:** Phase 3 complete, existing Gerald Dashboard auth

---

### Phase 5 — Intelligence Layer (Target: 2-3 days after Phase 4)

**What gets built:**
- Full spreading activation on recall: when a memory is retrieved, its top-3 associated memories are included in the result set
- `crystal_wake` refined: morning briefing includes open prospective memories, recent decisions, active projects, suggested follow-ups
- Checkpoint viewer in dashboard: browse historical snapshots, restore context
- Memory import tool: one-shot script to ingest existing `MEMORY.md` and daily logs into Memory Crystal as semantic memories (migration complete)
- Association graph visualization in dashboard (simple force-directed graph of linked memories)
- Emotional weight tuning: review valence/arousal assignments, ensure high-emotion memories are decaying appropriately slower

**Definition of done:**
- Session start `crystal_wake` gives Gerald a genuinely useful briefing without manual prompting
- Recall of "Convex" surfaces associated "Gerald Dashboard", "memory system", "TypeScript" memories
- Historical checkpoints browsable in dashboard
- All existing MEMORY.md content is in Memory Crystal

**Dependencies:** Phase 4 complete

---

## 2. Repository & Project Structure

### Decision: Standalone Repo

**Verdict: New standalone repo `gerald-crystal`**

Rationale:
- The Convex backend is not tightly coupled to the dashboard UI — separating them allows independent deployment and versioning
- The MCP server is a separate long-running process from Gerald Dashboard's Next.js server
- If we ever want to reuse Memory Crystal for a different agent or project, it's already decoupled
- Gerald Dashboard imports the Convex client and subscribes to the shared Convex deployment — no code duplication needed

### Folder Structure

```
gerald-crystal/                     # standalone repo
├── convex/                        # Convex backend (deploys to existing Convex project)
│   ├── schema.ts                  # all 5 tables defined
│   ├── crystal/
│   │   ├── memories.ts            # CRUD mutations + queries
│   │   ├── recall.ts              # vector search + composite scoring
│   │   ├── decay.ts               # decay mutation
│   │   ├── consolidate.ts         # sensory→episodic→semantic pipeline
│   │   ├── associations.ts        # link building + spreading activation
│   │   ├── checkpoints.ts         # snapshot mutations
│   │   └── wake.ts                # morning briefing action
│   ├── crons.ts                   # all scheduled jobs
│   └── _generated/                # auto-generated by Convex CLI
│
├── mcp-server/                    # MCP server (runs alongside OpenClaw)
│   ├── package.json
│   ├── index.ts                   # MCP stdio entrypoint
│   ├── tools/
│   │   ├── remember.ts
│   │   ├── recall.ts
│   │   ├── checkpoint.ts
│   │   ├── wake.ts
│   │   ├── forget.ts
│   │   ├── stats.ts
│   │   ├── what-do-i-know.ts
│   │   └── why-did-we.ts
│   └── lib/
│       ├── embed.ts               # embedding adapter (OpenAI / Ollama)
│       ├── convex-client.ts       # Convex HTTP client for MCP server
│       ├── extract.ts             # LLM extraction prompt + parser
│       └── obsidian.ts            # markdown file writer
│
├── scripts/
│   ├── migrate-memory-md.ts       # one-shot import of existing MEMORY.md
│   ├── migrate-daily-logs.ts      # import daily memory files
│   └── test-recall.ts             # manual recall quality testing
│
├── .env.example                   # CONVEX_URL, OPENAI_API_KEY, OBSIDIAN_VAULT_PATH
├── README.md
└── package.json

~/openclaw/                        # existing OpenClaw workspace (changes only)
├── AGENTS.md                      # add Memory Crystal usage instructions
└── skills/
    └── crystal/
        └── SKILL.md               # skill file for Memory Crystal tool usage

gerald-dashboard/                  # existing repo (additions only)
└── app/
    └── memory/
        ├── page.tsx               # /memory route
        ├── MemoryBrowser.tsx
        ├── MemoryCard.tsx
        ├── MemorySearch.tsx
        └── MemoryStats.tsx
```

### Convex Project Sharing

Gerald Dashboard and Memory Crystal share the **same Convex deployment**. Both reference the same `CONVEX_URL`. The Memory Crystal tables (`crystal*`) are namespaced clearly and don't conflict with any existing Gerald Dashboard tables.

```bash
# Deploy Memory Crystal schema to existing Convex project
cd gerald-crystal
npx convex deploy --project <existing-project-id>
```

---

## 3. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| **R1** | OpenAI embedding costs exceed budget | Medium | Low | text-embedding-3-small is ~$0.02/1M tokens. At ~500 memories/month × avg 100 tokens = 50K tokens = ~$0.001/month. Negligible. Ollama fallback available if needed. |
| **R2** | Convex free tier limits hit | Low | High | Convex free tier: 1M function calls/month, 8GB storage. At our scale (hundreds of memories, not millions) we're nowhere near limits. Monitor via Convex dashboard. |
| **R3** | Auto-capture is too aggressive (noise) | High | Medium | Start with conservative extraction prompt — only capture decisions, facts, explicit instructions. Tune aggressiveness via confidence threshold. Andy can delete false positives from dashboard. |
| **R4** | Auto-capture misses important info | Medium | Medium | First 2 weeks: Andy manually calls `crystal_remember` for anything critical. Review capture rate in dashboard. Tune extraction prompt iteratively. |
| **R5** | MCP server crashes and Gerald loses memory access | Medium | High | Add health check in AGENTS.md: Gerald tries `crystal_stats` at session start, falls back to flat-file memory if unavailable. MCP server restarts via `pm2` or launchd. |
| **R6** | OpenClaw MCP API changes break integration | Low | High | Pin to specific OpenClaw version in release notes. MCP is a stable standard — tool-level breaking changes are unlikely. Monitor OpenClaw changelog. |
| **R7** | Obsidian vault path changes or becomes inaccessible | Low | Low | Dual-write is for human convenience only, not critical path. If vault write fails, log warning and continue. Convex is source of truth. |
| **R8** | Memory privacy leak in group chats | Medium | High | Tag all memories with source channel. Add explicit rule in extraction prompt: "Do not store information shared by people other than Andy." Group chat memories require Andy's explicit `crystal_remember` call. |
| **R9** | Convex cold start latency spikes recall time | Low | Medium | Convex serverless functions have <100ms cold starts in practice. If p95 recall exceeds 400ms budget, add a keep-warm cron that pings the recall function every 5 minutes. |
| **R10** | Data loss if Convex account is closed/compromised | Low | Critical | Obsidian vault is the offline backup. Add weekly export cron: dump all semantic + procedural memories to a JSON file in `~/openclaw/memory/crystal-backup-YYYY-MM-DD.json`. |

---

## 4. Open Questions

**OQ1 — Obsidian vault path**
Where exactly does Andy's Obsidian vault live? Needs to be a path accessible from the iMac Pro where OpenClaw runs.
- Suggested: `~/Documents/Gerald/Memory/` unless Andy has an existing vault
- If Andy uses Obsidian Sync, we can write to wherever the local vault is mounted

**OQ2 — Embedding model: OpenAI vs local Ollama**
- OpenAI: better quality, ~$0/month at our scale, requires internet + API key
- Ollama (e.g., `nomic-embed-text`): fully local, zero cost, slightly lower quality, no internet dependency
- **Recommendation:** Start with OpenAI, switch to Ollama if privacy becomes a concern or API key is unavailable

**OQ3 — MCP transport: stdio vs HTTP**
- stdio: simpler, OpenClaw manages the process lifecycle, no port to manage
- HTTP: more flexible, can be called from dashboard or other tools, persistent connection
- **Recommendation:** stdio for Phase 1 (simplest), consider HTTP in Phase 5 if dashboard needs direct Memory Crystal API access

**OQ4 — LLM for extraction: Claude Haiku vs local**
- Claude Haiku: fast, cheap (~$0.25/1M input tokens), requires Anthropic API key
- Local Ollama: free, offline, slower and lower quality for extraction
- **Recommendation:** Claude Haiku for extraction. At ~500 memories/month × 200 tokens/extraction = 100K tokens = ~$0.025/month. Negligible.

**OQ5 — Auto-recall on every turn vs selective**
- Every turn: maximum context, higher latency, more embedding API calls
- Selective (only when query seems complex or references past context): lower cost, some misses
- **Recommendation:** Every turn for Phase 3. If latency becomes an issue, add a fast pre-filter (keyword matching) before embedding the query.

**OQ6 — Group chat memory policy**
- Currently: MEMORY.md is blocked in Discord for privacy
- With Memory Crystal: should Gerald auto-capture from Discord conversations?
- **Recommendation:** No auto-capture in group chats in Phase 3. Require explicit `crystal_remember` calls. Re-evaluate in Phase 5.

**OQ7 — Memory retention period for sensory store**
- Current plan: 24h TTL
- Should sensory memories be archived (searchable) or hard-deleted after TTL?
- **Recommendation:** Archive (not delete). Storage is cheap and having old sensory memories available for forensics/debugging is worth it.

---

## 5. Migration Plan

### What Exists Today
- `~/openclaw/MEMORY.md` — curated long-term memory (~3KB, key facts and active focus)
- `~/openclaw/memory/2026-02-*.md` — daily logs (Feb 17, 24, 25, plus a research session file)
- `~/openclaw/memory/briefs/`, `daily/`, `tacit/`, `maintenance/` subdirectories
- `~/openclaw/memory/heartbeat-state.json`

### Migration Steps (Phase 5, one-shot script)

**Step 1: Ingest MEMORY.md**
```bash
npx ts-node scripts/migrate-memory-md.ts \
  --file ~/openclaw/MEMORY.md \
  --store semantic \
  --category fact \
  --confidence 0.9
```
Each bullet point or section in MEMORY.md becomes a separate semantic memory. LLM extracts clean fact statements from the markdown.

**Step 2: Ingest daily logs**
```bash
npx ts-node scripts/migrate-daily-logs.ts \
  --dir ~/openclaw/memory/ \
  --store episodic \
  --category event
```
Each dated entry becomes an episodic memory with the date as the timestamp. Decisions become `category: decision`, lessons become `category: lesson`.

**Step 3: Verify**
```bash
npx ts-node scripts/test-recall.ts --query "X.com automation"
npx ts-node scripts/test-recall.ts --query "Gerald Dashboard"
npx ts-node scripts/test-recall.ts --query "Convex memory system"
```
Spot-check that key facts from the flat files are now recallable via Memory Crystal.

**Step 4: Transition**
- Keep `MEMORY.md` and daily logs as read-only archives (rename to `MEMORY.md.archive`)
- Update `AGENTS.md`: remove instruction to read `MEMORY.md` at session start, replace with `crystal_wake()` call
- Begin using Memory Crystal exclusively from this point forward

**Step 5: Cleanup (optional, after 30 days)**
- If Memory Crystal has been stable for 30 days with no recall gaps, `MEMORY.md` can be deprecated entirely
- Daily log files can be discontinued (session memories handled by Memory Crystal sessions table)

---

## 6. Testing Strategy

### Unit Tests (Convex functions)
```typescript
// test/decay.test.ts
test("high-emotion memory decays slower", async () => {
  const highEmotion = { valence: 0.9, arousal: 0.8, strength: 1.0, lastAccessedAt: Date.now() - 86400000 };
  const normal = { valence: 0.1, arousal: 0.2, strength: 1.0, lastAccessedAt: Date.now() - 86400000 };
  expect(computeNewStrength(highEmotion)).toBeCloseTo(0.99); // 0.01/day
  expect(computeNewStrength(normal)).toBeCloseTo(0.98);      // 0.02/day
});

test("memory archived at strength < 0.1", async () => {
  const weak = { strength: 0.05 };
  expect(shouldArchive(weak)).toBe(true);
});
```

### Recall Quality Tests
```bash
# scripts/test-recall.ts — run manually after any schema/scoring changes
const TEST_CASES = [
  { query: "what stack does Gerald Dashboard use", expectedTags: ["next.js", "convex", "typescript"] },
  { query: "X.com automation approval", expectedTags: ["xcom", "approval", "automation"] },
  { query: "why did we choose Convex", expectedTags: ["convex", "memory", "decision"] },
];
```
Each test case runs `crystal_recall`, checks that expected tags appear in top-3 results. Run before and after any scoring weight changes.

### Integration Tests (MCP tools)
- Start MCP server, send mock `crystal_remember` call via stdio, verify memory appears in Convex
- Send `crystal_recall` with known query, verify returned memories match expected

### End-to-End Validation (manual, weekly)
Andy's checklist:
1. Start fresh OpenClaw session
2. Verify `crystal_wake` returns a coherent briefing
3. Reference a project decision from a prior week — verify Gerald recalls it correctly
4. Make a new decision, end session, restart, verify it was captured
5. Open Dashboard, verify the new memory appears

### Regression: Cross-Session Continuity
After any significant change to the MCP server or Convex schema, run:
```
1. Session A: tell Gerald a unique fact ("the project codename is Orion")
2. End session A
3. Session B: ask Gerald "what's the project codename?"
4. Verify Gerald answers "Orion" without prompting
```

---

## 7. Operational Runbook

### Daily: Nothing required
Memory Crystal runs fully autonomously. Decay and consolidation crons fire automatically.

### Weekly: Memory Health Check
Open `gerald.andydoucet.com/memory` → Stats panel. Verify:
- Active semantic memories > N (growing over time ✅)
- Average strength > 0.4 (not mass-decaying ✅)
- Last 24h captures > 0 on active days (auto-capture working ✅)

### When Gerald recalls something wrong
```
Option A (conversational): "Gerald, that's wrong — [correct fact]"
  → Gerald calls crystal_forget(wrongMemoryId) + crystal_remember(correctedFact)

Option B (dashboard): Open /memory → search for the wrong memory → Edit in place
```

### When Gerald forgets something it should know
1. Check `crystal_stats` — is the MCP server reachable?
2. Call `crystal_recall("topic")` manually to test retrieval
3. If memory exists but wasn't recalled: composite score may be too low (increase strength manually in dashboard)
4. If memory doesn't exist: it wasn't captured. Call `crystal_remember` manually

### When MCP server is down
Signs: Gerald says "I don't have access to my memory tools right now"

Fix:
```bash
# Check if process is running
ps aux | grep crystal-mcp

# Restart
cd ~/openclaw/crystal/mcp-server
npm start &

# Or via pm2
pm2 restart crystal-mcp
```
In the meantime, Gerald falls back to flat-file memory (MEMORY.md archive) per fallback instructions in AGENTS.md.

### When Convex is down
This is rare (Convex SLA is 99.9%). Gerald logs a warning and falls back to flat-file memory automatically. When Convex comes back, memories written during the outage may be missing — Andy manually adds any critical ones via `crystal_remember`.

### Manual memory backup
```bash
npx ts-node scripts/export-backup.ts \
  --output ~/openclaw/memory/crystal-backup-$(date +%Y-%m-%d).json \
  --stores semantic,procedural,prospective
```
Run this any time before a major schema change or Convex project migration.

### Adding a memory manually (without chat)
```bash
# via MCP test script
npx ts-node scripts/add-memory.ts \
  --store semantic \
  --category fact \
  --title "Andy's Convex project ID" \
  --content "Project ID is xyz123, deployed at abc.convex.cloud" \
  --tags convex,infra
```

---

## 8. Future Roadmap

### Post-Phase 5 Ideas (no timeline, in priority order)

**Multi-channel memory isolation**
Add fine-grained channel policies: some memories are "Discord-only" (not surfaced in Telegram), some are "all channels". Useful when Gerald participates in multiple group chats with different audiences.

**Memory sharing between agents**
If Andy ever runs a second OpenClaw agent (e.g., a specialized coding agent), Memory Crystal could serve as shared memory. Both agents read/write to the same Convex project but with different `agentId` filters.

**Voice-triggered memories**
When Gerald makes a voice call, important things said during the call are auto-captured into Memory Crystal via the call transcript. Requires voice-call plugin integration.

**Obsidian → Memory Crystal two-way sync**
v1 is Convex → Obsidian only. A future watcher script could monitor Obsidian vault for manual edits and sync them back to Convex. Enables Andy to write memories directly in Obsidian and have Gerald pick them up.

**Memory confidence calibration**
Track how often recalled memories are "correct" (implicit signal: Andy doesn't correct Gerald after a recall). Use this signal to adjust confidence scores over time. Memories that Gerald recalls correctly more often should strengthen; ones that lead to corrections should weaken.

**Convex → local SQLite fallback**
If Convex goes away or Andy wants a fully offline setup, export all memories to a local SQLite database with a compatible schema. The MCP server abstraction makes this a backend swap, not an architectural change.

**Smart prospective memory triggers**
Prospective memories (future intentions) today are surfaced in `crystal_wake`. Future: trigger them proactively — if Andy says "remind me about X on Friday" and it's now Friday, Memory Crystal surfaces that memory automatically via a cron that runs `crystal_recall` with the current date as a filter.

**Memory analytics dashboard**
Chart memory growth over time, decay curves per memory, most-recalled topics, recall latency trends. Helps Andy understand what Gerald actually knows and how the system is performing.

**Cross-project memory import**
Import from other sources: Notion databases, GitHub issues, linear tickets, email threads. Build a generic importer that extracts semantic memories from structured external data. The `source: "external"` field already supports this.

---

# Appendix: Key References
- Context Studios "Memory Crystal" article: <https://www.contextstudios.ai/blog/building-ai-agent-memory-with-convex-how-we-gave-our-ai-a-brain-that-actually-remembers>
- Convex vector search docs: <https://docs.convex.dev/search/vector-search>
- Convex agents component: <https://docs.convex.dev/agents>
- Mem0 OSS (reference only): <https://github.com/mem0ai/mem0>
