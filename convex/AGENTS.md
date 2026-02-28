# Convex AGENTS

## Package Identity

- Purpose: persistent memory, recall, consolidation, decay, and knowledge-graph foundation logic.
- Scope: Convex schema, cron jobs, and query/action/mutation entrypoints.

## Setup Commands

- Open Convex dev server: `npm run convex:dev`
- Deploy functions: `npm run convex:deploy`
- Run generated query/action: `npm run convex:run <path>`

## Conventions

- Keep table/field names stable under `crystal*` namespace.
- Define strict value unions for memory/store/category/source to avoid drift.
- Preserve soft-delete/archival semantics in query and recall paths.
- Prefer query/mutation/action input validation with `v.object`.

### ✅ DO / ❌ DON'T

- ✅ `convex/schema.ts`
- ✅ `convex/crystal/memories.ts`
- ✅ `convex/crystal/recall.ts`
- ✅ `convex/crons.ts`
- ❌ `convex/_generated/*` unless regenerating via Convex tooling.

## Touch Points / Key Files

- `./schema.ts`
- `./crons.ts`
- `./convex/crystal/memories.ts`
- `./convex/crystal/recall.ts`
- `./convex/crystal/associations.ts`
- `./convex/crystal/graph.ts`
- `./convex/crystal/consolidate.ts`

## JIT Index Hints

- List Convex files: `rg --files convex`
- Inspect schema changes: `rg -n "defineTable|vectorIndex|index\\(" convex/schema.ts`
- Inspect cron schedule: `rg -n "crons\\.interval|cronJobs" convex/crons.ts`
- Inspect graph APIs: `rg -n "getKnowledgeGraphFoundationStatus|seedKnowledgeGraphFromMemory" convex/crystal/graph.ts`

## Common Gotchas

- `vectorSearch` requires embeddings dimension matching (`1536`) to match MCP provider output.
- Migration/stateful actions can be expensive; run with caution against large historical memory sets.

## Pre-PR Checks

- `npm run crystal:doctor`
- `npm run convex:run -- crystal/graph:getKnowledgeGraphFoundationStatus`
