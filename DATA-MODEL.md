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

- `crystalMemories`
- `crystalAssociations`
- `crystalNodes`
- `crystalRelations`
- `crystalMemoryNodeLinks`
- `crystalSessions`
- `crystalCheckpoints`
- `crystalWakeState`

## Entity definitions

### `crystalMemories`

Primary recall document with embeddings and operational metadata.

### `crystalAssociations`

Legacy association graph using memory-memory relation edges.

### `crystalNodes`

Typed node entities for graph foundation (`person`, `project`, `goal`, etc.).

### `crystalRelations`

Typed relations between nodes with confidence, channels, and evidence.

### `crystalMemoryNodeLinks`

Bridge between raw memories and typed graph nodes.

### `crystalSessions`

Conversation/session context and counters.

### `crystalCheckpoints`

Saved checkpoint snapshots and semantic summaries.

### `crystalWakeState`

State for injected wake prompts.

## Relationships

- `crystalAssociations.fromMemoryId` and `.toMemoryId` -> `crystalMemories`
- `crystalMemoryNodeLinks.memoryId` -> `crystalMemories`
- `crystalMemoryNodeLinks.nodeId` -> `crystalNodes`
- `crystalRelations.fromNodeId` and `.toNodeId` -> `crystalNodes`
- `crystalRelations.evidenceMemoryIds` -> `crystalMemories[]`
- `crystalSessions` referenced by `crystalMemories`, `crystalCheckpoints`, `crystalWakeState`

## Performance indexes

- `crystalMemories`: vector index `by_embedding`
- `crystalMemories`: `by_store_category`, `by_strength`, `by_last_accessed`, `by_session`
- `crystalAssociations`: `by_from`, `by_to`
- `crystalNodes`: `by_canonical_key`, `by_node_type`, `by_status`
- `crystalRelations`: `by_from_node`, `by_to_node`, `by_relation`, `by_from_to_relation`
- `crystalMemoryNodeLinks`: `by_memory`, `by_node`
- `crystalSessions`: `by_channel`
- `crystalCheckpoints`: `by_created`
- `crystalWakeState`: `by_session`

## Example payload

```json
{
  "store": "semantic",
  "category": "fact",
  "title": "Memory Crystal is MCP-first",
  "content": "Memory Crystal persists memory into Convex and exposes MCP tools for recall and write."
}
```

## ERD

```mermaid
erDiagram
    CrystalMemories ||--o{ CrystalAssociations : source
    CrystalMemories ||--o{ CrystalAssociations : target
    CrystalMemories ||--o{ CrystalMemoryNodeLinks : linkedBy
    CrystalNodes ||--o{ CrystalMemoryNodeLinks : bridgesTo
    CrystalNodes ||--o{ CrystalRelations : from
    CrystalNodes ||--o{ CrystalRelations : to
    CrystalMemories ||--o{ CrystalSessions : session
    CrystalSessions ||--o{ CrystalCheckpoints : snapshots
    CrystalSessions ||--o{ CrystalWakeState : wake
    CrystalMemories ||--o{ CrystalWakeState : injected
    CrystalCheckpoints ||--o{ CrystalMemories : memorySnapshot
