# Memory Crystal Context Engine Feasibility Spike

**Date:** 2026-03-15  
**Status:** Design spike (no code changes)  
**Project:** Memory Crystal (`~/projects/memorycrystal`)

---

## 1) Executive Summary

Memory Crystal can plausibly evolve from a long-term memory plugin into a full **ContextEngine** for OpenClaw, but this is not a “small extension.” It is a context-runtime product with persistence, summarization, retrieval, and strict token-budget assembly requirements.

What we would build:
- A `kind: "context-engine"` plugin that owns in-session context lifecycle (`bootstrap`, `ingest`, `assemble`, `compact`, etc.).
- Hybrid storage strategy:
  - **Cloud canonical store** (Convex) for persistence across resets/devices.
  - **Local cache** for low-latency reads and offline tolerance.
- **Graph-aware summarization** that prioritizes entities, commitments, decisions, and unresolved work.
- **Semantic context assembly** (embedding retrieval + recency) rather than purely chronological summary stacks.

Expected outcome:
- Memory Crystal can compete with LCM on continuity while differentiating via semantic + graph-aware retrieval and cross-session/platform memory.
- Realistic delivery: **~10–14 weeks** to reach robust parity-like behavior (not 2 weeks), with phased release.

---

## 2) Architecture Proposal

### 2.1 High-level flow

1. **Message ingestion**
   - Every turn message is accepted through `ingest` / `ingestBatch`.
   - Persist immediately to:
     - Local append log + local index/cache (SQLite or equivalent local store).
     - Convex canonical conversation/event store.

2. **Enrichment pipeline (async where possible)**
   - Extract entities, decisions, tasks, artifacts, code symbols.
   - Link to Memory Crystal knowledge graph.
   - Create/update embeddings for:
     - raw message chunks,
     - summary nodes,
     - graph facts.

3. **Compaction/summarization**
   - Convert older message ranges into summary nodes.
   - Build hierarchical summaries (DAG/tree-like rollups) for multi-scale retrieval.
   - Weight summary content with graph centrality + decision salience (not just chronology).

4. **Assembly at inference time**
   - Given prompt + session tail + budget:
     - fetch most recent raw tail,
     - retrieve semantically relevant summary/memory nodes,
     - inject high-priority graph facts (active decisions, open loops, constraints),
     - return ordered message list within budget.

### 2.2 Storage design: Cloud + local cache

**Canonical (Convex):**
- Conversations, messages, summary nodes, graph references, embeddings metadata.
- Enables cross-session persistence and cross-client sync (OpenClaw / Claude Code / Codex via MCP).

**Local cache:**
- Recent messages + recent summaries + retrieval index.
- Fast `assemble` path without network round-trip for every token decision.
- Write-through or write-behind with replay queue when offline.

### 2.3 Graph-aware summarization

Traditional compaction is token-centric and chronological. Proposed Memory Crystal compaction is **importance-aware**:

Scoring dimensions:
- Entity prominence (frequency + graph degree).
- Decision markers (accepted/rejected options, final choices).
- Commitments (promises, TODOs, deadlines).
- Unresolved threads/questions.
- User preference statements.

Result:
- Summaries retain “why this matters” and future actionability.
- Lower risk of losing key strategic context during aggressive compaction.

### 2.4 Semantic assembly

Instead of “top of DAG + last N messages” only:

Assembly candidates:
- Fresh tail (strict recency block).
- Session summaries (multi-depth).
- Cross-session relevant memories.
- Graph facts tied to active entities in current prompt.

Ranking function (conceptual):

`score = a*semantic_relevance + b*recency + c*graph_importance + d*decision_priority - e*token_cost`

Then select with budget packing until token cap reached.

### 2.5 Budget-based context window management

Adopt LCM-style budget discipline with deterministic fallback ladder:

1. **Normal:** semantic + graph + fresh tail mix.
2. **Aggressive:** drop low-score candidates, compress summaries further.
3. **Emergency truncation:** always preserve safety/system/user-latest turns; trim remainder deterministically.

This protects reliability under worst-case token pressure.

---

## 3) OpenClaw ContextEngine Hook Mapping

Based on OpenClaw ContextEngine interface (v2026.3.x plugin SDK), map hooks as follows:

### `bootstrap`
- Load session-local state and high-value carryover context from Memory Crystal.
- Reconcile session identity (`sessionId`, `sessionKey`) with existing records.
- Warm local cache with recent summaries + active graph entities.
- Output: imported count and bootstrap status.

### `ingest` / `ingestBatch`
- Persist incoming messages locally + to Convex.
- Deduplicate by message fingerprint / turn id.
- Queue enrichment (embeddings + graph extraction).
- Mark heartbeat turns separately for lower-priority enrichment.

### `assemble`
- Compute token budget target.
- Build candidate set (fresh tail + semantic summaries + recalled memories + graph facts).
- Re-rank and pack by budget.
- Return ordered `messages[]`, `estimatedTokens`, optional `systemPromptAddition`.

### `compact`
- Trigger graph-informed summarization for compaction ranges.
- Build or update hierarchical summaries.
- Persist provenance links (summary -> source message ids / graph entities).
- Return before/after token stats and compaction details.

### `afterTurn`
- Finalize ingestion consistency checks.
- Capture durable memory events (decision taken, new standing preference, new project fact).
- Evaluate compaction threshold and schedule deferred compaction if needed.

### `prepareSubagentSpawn`
- Build scoped child context pack:
  - parent objective,
  - relevant summaries,
  - graph entities for task scope,
  - hard constraints.
- Return rollback handle if spawn fails.

### `onSubagentEnded`
- Ingest child outputs/outcomes.
- Convert notable findings into memories/graph updates.
- Update parent session summary with child conclusions and artifacts.

---

## 4) Key Question: Can one plugin be both `memory` and `context-engine`?

## Answer (from OpenClaw SDK + slot model):

**Not as a single declared plugin kind.**

Evidence:
- `PluginKind` is a union type: `"memory" | "context-engine"` (single value, not array).
- Manifest field is `kind?: PluginKind` (single optional scalar).
- Slot mapping is exclusive by kind:
  - `kind: "memory"` -> `plugins.slots.memory`
  - `kind: "context-engine"` -> `plugins.slots.contextEngine`
- OpenClaw applies exclusive slot selection per kind and disables competing plugins in that slot.

Implications:
- A single manifest cannot simultaneously declare both kinds.
- Operationally, the clean model is:
  1. **Two plugin packages/ids** sharing backend libraries and Convex schema, OR
  2. One primary context-engine plugin + optional companion memory plugin for legacy memory tools/surfaces.

Does context-engine supersede memory slot?
- **No, not globally.** They are separate slots in config. A context engine does not automatically replace all memory-slot behavior.
- Practically, for Memory Crystal, the context-engine plugin would own session context lifecycle, while memory slot can remain for memory-specific tools/UX or be simplified over time.

Recommendation:
- Ship as **two packages sharing one backend core** during migration:
  - `memorycrystal-memory` (`kind: memory`)
  - `memorycrystal-context-engine` (`kind: context-engine`)
- Later evaluate consolidation UX once OpenClaw offers multi-kind manifests (if ever).

---

## 5) What LCM Does Better Today (Honest Assessment)

1. **Local-first reliability**
   - SQLite in-process gives near-zero latency and strong offline behavior.

2. **Mature DAG compaction mechanics**
   - Leaf + condensed passes, incremental depth controls, and known operational knobs.

3. **Deterministic fallback posture**
   - Explicit compaction ladder and predictable context guarantees under pressure.

4. **Operational simplicity + cost**
   - No mandatory cloud dependency, no cloud bills for storage/sync.

5. **Open MIT project with focused scope**
   - Easier for users to inspect and trust behavior.

To match LCM baseline, Memory Crystal must deliver:
- deterministic assembly fallback guarantees,
- offline-safe local behavior,
- measurable latency budget compliance,
- robust provenance for compacted summaries,
- debuggability tools (inspect/expand/trace why a summary entered context).

---

## 6) Scope Estimate

Assumptions:
- 1 experienced engineer full-time equivalent, occasional support.
- Existing Memory Crystal infrastructure reusable (Convex, graph, embeddings).
- No major OpenClaw API churn mid-build.

### Phase 1 — Basic Context Engine (3–4 weeks)
- Implement hooks end-to-end (`bootstrap`, `ingest`, `assemble`, `compact`, `afterTurn`).
- Simple chronological summarization.
- Token-budget assembly with deterministic fallback.
- Local cache + Convex persistence baseline.

### Phase 2 — Graph-aware Summarization (3–4 weeks)
- Entity/decision extraction reliability improvements.
- Importance-weighted summary generation.
- Summary provenance + debugging metadata.

### Phase 3 — Semantic Assembly + Cross-platform Sync (4–6 weeks)
- Embedding retrieval in `assemble` with hybrid ranking.
- Cross-session memory/context blending policies.
- Subagent-aware context handoff and learning capture.
- Hardening for latency, offline replay, and failure recovery.

### Total
- **10–14 weeks** realistic for robust MVP-to-production hardening.
- So: **closer to 3 months** than 2 weeks or 1 month.

---

## 7) Risks & Open Questions

### 7.1 Latency risk
- Cloud round-trips on hot path can degrade every turn.
- Mitigation: local cache-first assembly + async cloud sync + bounded timeouts.

### 7.2 Offline mode
- Without network, context quality may degrade unless local cache is authoritative enough.
- Mitigation: write-ahead local journal and deferred Convex reconciliation.

### 7.3 Cost risk
- Summarization + embedding + storage can exceed expected cost at scale.
- Mitigation: adaptive summarization thresholds, batch embeddings, and retention tiers.

### 7.4 Complexity risk
- Full context engine is hard: compaction correctness, provenance, deterministic assembly, and failure handling.
- Mitigation: phased rollout + golden transcript test suite + observability from day one.

### 7.5 Determinism vs relevance tension
- Semantic retrieval improves relevance but can become non-deterministic.
- Mitigation: explicit scoring logs and stable tie-breakers.

### 7.6 Multi-slot product UX
- Two-package architecture may confuse users.
- Mitigation: installer/wizard that configures both slots coherently.

---

## Research Notes (sources consulted)

1. **OpenClaw plugin docs**
   - `/tools/plugin` and `/plugins/manifest` docs confirm `kind` usage and separate slot keys (`memory`, `contextEngine`).

2. **Installed OpenClaw SDK/types (local system)**
   - `dist/plugin-sdk/context-engine/types.d.ts` confirms hook surface (`bootstrap`, `ingest`, `ingestBatch`, `assemble`, `compact`, `afterTurn`, `prepareSubagentSpawn`, `onSubagentEnded`).
   - `dist/plugin-sdk/plugins/types.d.ts` shows `PluginKind = "memory" | "context-engine"` and `kind?: PluginKind`.
   - `dist/plugin-sdk/plugins/manifest.d.ts` shows manifest `kind?: PluginKind` (single field).
   - `dist/plugin-sdk/config/types.plugins.d.ts` shows separate slot config: `plugins.slots.memory` and `plugins.slots.contextEngine`.
   - `dist/registry-*.js` shows exclusive slot selection behavior by kind.

3. **LCM repository (GitHub)**
   - README confirms architecture: SQLite persistence, DAG summarization/condensation, context assembly with fresh tail, retrieval tools, deterministic compaction patterns.
   - Project structure indicates dedicated modules for engine, assembly, compaction, retrieval, expansion, large-file handling.

---

## Suggested Next Step

Run a 2-week implementation spike for **Phase 1 skeleton only**:
- minimal context-engine plugin package,
- local cache + Convex dual-write,
- deterministic assembly fallback,
- basic compaction,
- tracing/metrics.

At the end, decide go/no-go for full 3-month build based on measured latency + context quality.
