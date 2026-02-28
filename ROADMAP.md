# VexClaw Product Roadmap

## Positioning

VexClaw is now a drop-in memory plugin for OpenClaw with a single-command install path and a clean API-preserving evolution path.

- Install with one command: `npm run vexclaw:bootstrap`
- No framework changes required in OpenClaw
- Existing MCP tool names remain stable (`vexclaw_*`)
- Optional graph migration available after launch via Convex action

This is the canonical roadmap. `docs/ROADMAP.md` points to this file.

## What is shipped now (v1.0 foundation)

- Plugin wiring and one-command bootstrap.
- Convex memory stores and MCP tools operational for production use.
- Core recall/remember pipeline and plugin health checks stabilized.
- Phase-0 typed graph foundation implemented:
  - New tables: `vexclawNodes`, `vexclawRelations`, `vexclawMemoryNodeLinks`
  - Status query: `vexclaw/graph:getKnowledgeGraphFoundationStatus`
  - Migration action: `vexclaw/graph:seedKnowledgeGraphFromMemory`

## Product roadmap (now and next)

### Phase 5 — Persistent cognitive memory hardening (completed)

- Spreading activation now wired by default in recall:
  - `includeAssociations` is enabled by default in `handleRecallTool` and passed to `vexclaw/recall:recallMemories`.
- Session warm-up protocol completed:
  - `vexclaw_wake` is now documented as required at the start of every new session in `AGENTS.md`.
- MEMORY.md migration executed:
  - dry-run completed successfully.
  - live run completed but failed on network resolution (`ENOTFOUND` for Convex/OpenAI in this environment), with `CONVEX_URL` and `OPENAI_API_KEY` present.
- Dashboard checkpoint viewer added:
  - new `/checkpoints` page and nav entry added to dashboard layout (static/mock data).

### Phase 1 — Launch hardening (0–30 days)

Goal: reduce install risk and operational friction.

- Improve first-run reliability:
  - document required environment and local prerequisites more explicitly
  - reduce false-failure modes in health checks for non-interactive environments
- Observability and ops:
  - `vexclaw-stats` includes MCP/process health indicators
  - daily/weekly memory integrity checks and alert thresholds
- Documentation and packaging:
  - finalized install/uninstall + recovery docs
  - stable plugin artifacts for quick onboarding in fresh OpenClaw profiles

### Phase 2 — Productized memory workflows (30–90 days)

Goal: make memory capture and recall reliably useful for real sessions.

- Add graph materialization in write path:
  - optional entity/relation extraction on memory writes
  - dual-write during recall-safe migration period
- Expand diagnostics and controls:
  - relation confidence thresholds and noise controls
  - relation-aware ranking as optional secondary channel
- Dashboard-ready APIs:
  - graph node/relation projection endpoints
  - explainability metadata for recalled memories
- Delivery criteria:
  - no meaningful recall latency regression
  - >90% successful recall for known prompt set on 2 sample sessions

### Phase 3 — Typed knowledge graph v1 (90–180 days)

Goal: move from memory-linked graph to explicit typed graph reasoning.

- Explicit entity extraction: person/project/tool/goal/event/resource/channel
- Relation enrichment:
  - typed relation classes with confidence/provenance
  - relation lifecycle and deprecation state
- Traversal APIs:
  - neighborhood queries and short-path explanations
  - reasoned suggestions for wake planning
- Rollback path:
  - maintain backward-compatible MCP APIs and legacy association behavior during rollout

## Stretch milestones (future)

- Multi-user/tenant partitioning with strict data isolation
- Policy and permissions layer for channel-sensitive memory visibility
- Retrieval policy templates for agents/channels/projects
- Optional local/edge embeddings and provider portability
- Advanced planning graph (goals → blockers → dependencies → follow-ups)

## Commercial readiness checklist (sellability)

To package VexClaw as a product today:

- Drop-in install with one command and clear configuration prompts
- Stable default MCP contract with backward compatibility
- Deterministic health check + troubleshooting loop
- Strong "what to expect" docs and documented upgrade roadmap
- Migration tools that keep existing memories and behavior

---

Roadmap versions:
- ROADMAP.md (canonical, this file)
- `PRD.md` (full requirements and architecture)
- `PRD_TYPED_KNOWLEDGE_GRAPH.md` (typed graph expansion plan)
