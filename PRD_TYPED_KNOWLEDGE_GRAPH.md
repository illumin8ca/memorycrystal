# Memory Crystal — Typed Knowledge Graph Upgrade (Post-MVP Roadmap)

## 1) Objective

Move Memory Crystal memory from **memory-store-centric documents** to a **typed knowledge graph** while preserving the current MCP tool contract and existing memory data.

Canonical implementation roadmap is tracked in root `ROADMAP.md`.

### Definition of “typed knowledge graph”
- Nodes are first-class typed entities (`entityType` + canonical keys).
- Edges are directional, typed relations (`relationType`) with confidence, provenance, and lifecycle metadata.
- Raw memories remain the source-of-truth for semantic retrieval, but can be projected as graph nodes/edges.
- Query APIs return:
  - relevance-ranked memories (existing behavior)
  - graph neighborhoods (new behavior)
  - typed traversals for reasoning and explainability.

## 2) Where we are today (audit)

- ✅ Multi-store memory documents already exist (`sensory`, `episodic`, `semantic`, `procedural`, `prospective`).
- ✅ `crystalAssociations` (Memory Crystal association store) already stores undifferentiated graph links between memories.
- ✅ Recall can include spread activation from linked memories (`includeAssociations` path already implemented in `convex/crystal/recall.ts`).
- ✅ **Phase 0 foundation is implemented**:
  - `crystalNodes`, `crystalRelations`, `crystalMemoryNodeLinks` are added to `convex/schema.ts`.
  - `convex/crystal/graph.ts` includes `seedKnowledgeGraphFromMemory` and `getKnowledgeGraphFoundationStatus`.
  - Legacy recall/write behavior is unchanged.
- ⚠️ Relations are not fully typed as ontology nodes/edges.
- ⚠️ Edges are memory-to-memory only; there are no explicit entities for people, projects, tasks, technologies, decisions, or channels.
- ⚠️ No dedicated graph API tools for neighborhood traversal or typed path discovery.
- ⚠️ No migration pipeline for backfilling graph edges from historical memories.

## 3) Target schema (v1 typed graph)

### 3.1 Nodes table: `crystalNodes`

Purpose: canonical entities and conceptual abstractions that memories refer to.

Fields:
- `label: string` (canonical display label)
- `nodeType: "person" | "project" | "goal" | "decision" | "concept" | "tool" | "event" | "resource" | "channel"`
- `alias: array<string>`
- `canonicalKey: string` (normalized stable key, e.g. `person:andy-doucet`)
- `description: string`
- `strength: number (0–1)` (importance / confidence-style signal)
- `confidence: number (0–1)`
- `tags: array<string>`
- `metadata: object` (extensible)
- `createdAt: number`
- `updatedAt: number`
- `sourceMemoryIds: array<crystalMemories>` (physical table currently named `crystalMemories`)
- `status: "active" | "deprecated"`

### 3.2 Edges table: `crystalRelations`

Purpose: typed facts between nodes and memory evidence.

Fields:
- `fromNodeId: id<crystalNodes>`
- `toNodeId: id<crystalNodes>`
- `relationType:`
  - "mentions"
  - "decided_in"
  - "leads_to"
  - "depends_on"
  - "owns"
  - "uses"
  - "conflicts_with"
  - "supports"
  - "occurs_with"
  - "assigned_to"
  
- `weight: number (0–1)`
- `evidenceMemoryIds: array<crystalMemories>` (physical table currently named `crystalMemories`)
- `evidenceWindow: { from?: number, to?: number }` (optional temporal bounds)
- `channels: array<string>` (discord/telegram/imessage/cli)
- `proofNote: string` (optional generated rationale)
- `confidence: number (0–1)`
- `confidenceReason: string`
- `createdAt: number`
- `updatedAt: number`
- `promotedFrom: optional id<crystalRelations>` (if this edge replaced an older one)

### 3.3 Bridge table: `crystalMemoryNodeLinks` (derived/managed)

Purpose: stable bidirectional mapping for explainability and fast UIs.

Fields:
- `memoryId: id<crystalMemories>` (physical table currently named `crystalMemories`)
- `nodeId: id<crystalNodes>`
- `role: "subject" | "object" | "topic"`
- `linkConfidence: number (0–1)`
- `createdAt: number`

## 4) Extraction pipeline design

### 4.1 Capture path
Every `crystal_remember` call should optionally include `graphIntents`:
- inline tags (`tags`),
- extracted entity mentions,
- candidate relation intents.

If `graphIntents` is omitted, extraction still occurs server-side for legacy clients.

### 4.2 Auto-extract service
Create `convex/crystal/graph.extractFromText`:
- Input: `memoryText`, `memoryId`, `store`, `channel`, optional `speaker`
- Output:
  - `nodes` (upserted/merged)
  - `relations` (upserted)
  - `links` (memory-node bindings)
- Heuristic:
  - parse for entities (capitalized phrases, quoted usernames, known entities cache)
  - infer typed edges from explicit verbs (`depends`, `caused`, `decided`, `uses`, etc.)
  - assign confidence with conservative defaults (`0.55` for implicit, `0.8+` for explicit)

### 4.3 Deduplication and promotion
- Node dedupe: by `canonicalKey` + alias map.
- Edge upsert:
  - if existing same `(from,to,type)` then merge `weight=max(...)`, append evidence
  - else create new relation edge
- Association cron (`crystal-associate`) can continue to seed with similarity-based `co_occurred` until graph builder reaches steady state.

## 5) New MCP/read APIs (V2)

Keep current tools stable and add optional graph tools:
- `crystal_neighbors`:
  - Input: `nodeIdOrLabel`, `depth`, `relationType[]`, `limit`
  - Output: neighborhood with edge weights
- `crystal_graph_query`:
  - Input: `fromLabel`, `relationType`, optional `toType`
  - Output: ranked path summaries
- `crystal_graph_explain`:
  - Input: `memoryId` or `relationId`
  - Output: provenance trail (`evidenceMemoryIds`, score, prompt timestamps)

These can be added as **non-breaking additions** without changing existing 8 tool handlers.

## 6) Migration plan to typed graph

### Phase 0 (2 days): schema + backfill bridge
- ✅ Add new tables (`crystalNodes`, `crystalRelations`, `crystalMemoryNodeLinks`)
- ✅ Create migration job to seed graph:
  - one node per existing memory topic (memory title/content fallback)
  - channel and tags promoted to concept nodes
  - edges from existing `crystalAssociations` converted into typed `supports/conflicts_with/depends_on/occurs_with/leads_to` relations
  - preserve all legacy tables and keep old association table.

### Phase 1 (2–3 days): extraction + graph materialization
- Add server action `graph.extractFromText`
- Extend `crystal/memories.createMemory` and `crystal_remember` to emit graph mutations in the same flow.
- Add idempotency keys per text chunk to avoid duplicate nodes/edges.

### Phase 2 (1–2 days): query and MCP enhancements
- Add `crystal_neighbors` and `crystal_graph_explain` for dashboards/agents.
- Update recall to optionally blend graph neighbors as a second-stage expansion channel.
- Add admin view for relation tables in memory UI.

### Phase 3 (1 day): rollout + fallback
- Keep old `crystalAssociations` behavior for one release.
- Dual-write edges to both `crystalAssociations` and `crystalRelations` while we stabilize.
- Add migration health checks:
  - percent of high-confidence memories with at least one node,
  - recall latency impact,
  - graph cardinality growth rate.

## 7) Acceptance criteria

- [ ] New semantic query can return:
  - `(node) "Convex"` → `(uses)` `(tooling)` → `(decisions)` with confidence >= 0.7.
- [ ] `crystal_wake` includes at least one relation-aware suggestion (goal + blockers + dependencies).
- [ ] Recall result can include `crystal_relation_trace` evidence IDs for every relation-backed memory.
- [ ] Rollback path: disabling graph features returns to legacy `crystalAssociations` only with no data loss.
- [ ] All existing MCP tools continue working unchanged.

## 8) Risks

- **Extraction quality risk**: entity extraction errors can create graph noise.
  - Mitigation: require evidence + confidence threshold and expose soft-delete/edit for false edges.
- **Cost risk**: more LLM calls for extraction/normalization.
  - Mitigation: keep extraction for non-noise stores only (`semantic/procedural/prospective`) first; run graph synthesis async.
- **Operational risk**: larger recall surface can exceed latency budget.
  - Mitigation: depth/edge caps + strict budget and kill-switch in query.

## 9) Owner and timeline

- Owner: Gerald
- Suggested cadence: one 3–4 day chunk once MVP memory plugin is stable.
- Non-breaking rollout target: maintain existing MCP contracts and keep plugin install path unchanged.
