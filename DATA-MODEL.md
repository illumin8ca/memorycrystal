# Data Model

## Table of Contents

1. Schema Overview
2. Entity Definitions
3. Relationships
4. Indexes
5. Example Payloads
6. Mermaid ERD

## Schema Overview

Primary table families are in `convex/schema.ts`:

- `vexclawMemories`
- `vexclawAssociations`
- `vexclawNodes`
- `vexclawRelations`
- `vexclawMemoryNodeLinks`
- `vexclawSessions`
- `vexclawCheckpoints`
- `vexclawWakeState`

## Entity definitions

### `vexclawMemories`

Primary recall document with embeddings and operational metadata.

### `vexclawAssociations`

Legacy association graph using memory-memory relation edges.

### `vexclawNodes`

Typed node entities for graph foundation (`person`, `project`, `goal`, etc.).

### `vexclawRelations`

Typed relations between nodes with confidence, channels, and evidence.

### `vexclawMemoryNodeLinks`

Bridge between raw memories and typed graph nodes.

### `vexclawSessions`

Conversation/session context and counters.

### `vexclawCheckpoints`

Saved checkpoint snapshots and semantic summaries.

### `vexclawWakeState`

State for injected wake prompts.

## Relationships

- `vexclawAssociations.fromMemoryId` and `.toMemoryId` -> `vexclawMemories`
- `vexclawMemoryNodeLinks.memoryId` -> `vexclawMemories`
- `vexclawMemoryNodeLinks.nodeId` -> `vexclawNodes`
- `vexclawRelations.fromNodeId` and `.toNodeId` -> `vexclawNodes`
- `vexclawRelations.evidenceMemoryIds` -> `vexclawMemories[]`
- `vexclawSessions` referenced by `vexclawMemories`, `vexclawCheckpoints`, `vexclawWakeState`

## Performance indexes

- `vexclawMemories`: vector index `by_embedding`
- `vexclawMemories`: `by_store_category`, `by_strength`, `by_last_accessed`, `by_session`
- `vexclawAssociations`: `by_from`, `by_to`
- `vexclawNodes`: `by_canonical_key`, `by_node_type`, `by_status`
- `vexclawRelations`: `by_from_node`, `by_to_node`, `by_relation`, `by_from_to_relation`
- `vexclawMemoryNodeLinks`: `by_memory`, `by_node`
- `vexclawSessions`: `by_channel`
- `vexclawCheckpoints`: `by_created`
- `vexclawWakeState`: `by_session`

## Example payload

```json
{
  "store": "semantic",
  "category": "fact",
  "title": "VexClaw is MCP-first",
  "content": "VexClaw persists memory into Convex and exposes MCP tools for recall and write."
}
```

## ERD

```mermaid
erDiagram
    VexclawMemories ||--o{ VexclawAssociations : source
    VexclawMemories ||--o{ VexclawAssociations : target
    VexclawMemories ||--o{ VexclawMemoryNodeLinks : linkedBy
    VexclawNodes ||--o{ VexclawMemoryNodeLinks : bridgesTo
    VexclawNodes ||--o{ VexclawRelations : from
    VexclawNodes ||--o{ VexclawRelations : to
    VexclawMemories ||--o{ VexclawSessions : session
    VexclawSessions ||--o{ VexclawCheckpoints : snapshots
    VexclawSessions ||--o{ VexclawWakeState : wake
    VexclawMemories ||--o{ VexclawWakeState : injected
    VexclawCheckpoints ||--o{ VexclawMemories : memorySnapshot
