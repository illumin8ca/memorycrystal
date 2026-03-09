import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const memoryStore = v.union(
  v.literal("sensory"),
  v.literal("episodic"),
  v.literal("semantic"),
  v.literal("procedural"),
  v.literal("prospective")
);

const memoryCategory = v.union(
  v.literal("decision"),
  v.literal("lesson"),
  v.literal("person"),
  v.literal("rule"),
  v.literal("event"),
  v.literal("fact"),
  v.literal("goal"),
  v.literal("workflow"),
  v.literal("conversation")
);

const memorySource = v.union(
  v.literal("conversation"),
  v.literal("cron"),
  v.literal("observation"),
  v.literal("inference"),
  v.literal("external")
);

const graphNodeType = v.union(
  v.literal("person"),
  v.literal("project"),
  v.literal("goal"),
  v.literal("decision"),
  v.literal("concept"),
  v.literal("tool"),
  v.literal("event"),
  v.literal("resource"),
  v.literal("channel")
);

const graphNodeStatus = v.union(v.literal("active"), v.literal("deprecated"));

const graphRelationType = v.union(
  v.literal("mentions"),
  v.literal("decided_in"),
  v.literal("leads_to"),
  v.literal("depends_on"),
  v.literal("owns"),
  v.literal("uses"),
  v.literal("conflicts_with"),
  v.literal("supports"),
  v.literal("occurs_with"),
  v.literal("assigned_to")
);

const graphLinkRole = v.union(v.literal("subject"), v.literal("object"), v.literal("topic"));

export default defineSchema({
  ...authTables,

  crystalMemories: defineTable({
    userId: v.string(),
    store: memoryStore,
    category: memoryCategory,
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    strength: v.float64(),
    confidence: v.float64(),
    valence: v.float64(),
    arousal: v.float64(),
    accessCount: v.number(),
    lastAccessedAt: v.number(),
    createdAt: v.number(),
    source: memorySource,
    sessionId: v.optional(v.id("crystalSessions")),
    channel: v.optional(v.string()),
    tags: v.array(v.string()),
    archived: v.boolean(),
    archivedAt: v.optional(v.number()),
    promotedFrom: v.optional(v.id("crystalMemories")),
    checkpointId: v.optional(v.id("crystalCheckpoints")),
  })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["userId", "archived"],
    })
    .index("by_user", ["userId", "archived"])
    .index("by_store_category", ["store", "category", "archived"])
    .index("by_strength", ["strength", "archived"])
    .index("by_last_accessed", ["lastAccessedAt"])
    .index("by_session", ["sessionId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["userId", "archived"],
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["userId", "archived"],
    }),

  crystalAssociations: defineTable({
    fromMemoryId: v.id("crystalMemories"),
    toMemoryId: v.id("crystalMemories"),
    userId: v.optional(v.string()),
    relationshipType: v.union(
      v.literal("supports"),
      v.literal("contradicts"),
      v.literal("derives_from"),
      v.literal("co_occurred"),
      v.literal("generalizes"),
      v.literal("precedes")
    ),
    weight: v.float64(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_from", ["fromMemoryId"])
    .index("by_to", ["toMemoryId"])
    .index("by_user", ["userId"]),

  crystalNodes: defineTable({
    userId: v.string(),
    label: v.string(),
    nodeType: graphNodeType,
    alias: v.array(v.string()),
    canonicalKey: v.string(),
    description: v.string(),
    strength: v.float64(),
    confidence: v.float64(),
    tags: v.array(v.string()),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    sourceMemoryIds: v.array(v.id("crystalMemories")),
    status: graphNodeStatus,
  })
    .index("by_user", ["userId"])
    .index("by_user_canonical", ["userId", "canonicalKey"])
    .index("by_canonical_key", ["canonicalKey"])
    .index("by_node_type", ["nodeType"])
    .index("by_status", ["status"]),

  crystalRelations: defineTable({
    userId: v.string(),
    fromNodeId: v.id("crystalNodes"),
    toNodeId: v.id("crystalNodes"),
    relationType: graphRelationType,
    weight: v.float64(),
    evidenceMemoryIds: v.array(v.id("crystalMemories")),
    evidenceWindow: v.optional(
      v.object({
        from: v.optional(v.number()),
        to: v.optional(v.number()),
      })
    ),
    channels: v.array(v.string()),
    proofNote: v.optional(v.string()),
    confidence: v.float64(),
    confidenceReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    promotedFrom: v.optional(v.id("crystalRelations")),
  })
    .index("by_user", ["userId"])
    .index("by_from_node", ["fromNodeId"])
    .index("by_to_node", ["toNodeId"])
    .index("by_relation", ["relationType", "fromNodeId", "toNodeId"])
    .index("by_from_to_relation", ["fromNodeId", "toNodeId", "relationType"]),

  crystalMemoryNodeLinks: defineTable({
    userId: v.string(),
    memoryId: v.id("crystalMemories"),
    nodeId: v.id("crystalNodes"),
    role: graphLinkRole,
    linkConfidence: v.float64(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_memory", ["memoryId"])
    .index("by_node", ["nodeId"]),

  crystalSessions: defineTable({
    userId: v.string(),
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
    .index("by_user", ["userId", "lastActiveAt"])
    .index("by_channel", ["channel", "lastActiveAt"]),

  crystalCheckpoints: defineTable({
    userId: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.string(),
    sessionId: v.optional(v.id("crystalSessions")),
    memorySnapshot: v.array(
      v.object({
        memoryId: v.id("crystalMemories"),
        strength: v.float64(),
        content: v.string(),
        store: v.string(),
      })
    ),
    semanticSummary: v.string(),
    tags: v.array(v.string()),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_created", ["createdAt"]),

  crystalWakeState: defineTable({
    userId: v.string(),
    sessionId: v.id("crystalSessions"),
    injectedMemoryIds: v.array(v.id("crystalMemories")),
    wakePrompt: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),

  crystalMessages: defineTable({
    userId: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    channel: v.optional(v.string()),
    sessionKey: v.optional(v.string()),
    timestamp: v.number(),
    embedding: v.optional(v.array(v.float64())),
    embedded: v.boolean(),
    expiresAt: v.number(),
    metadata: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_user_time", ["userId", "timestamp"])
    .index("by_channel_time", ["channel", "timestamp"])
    .index("by_session_time", ["sessionKey", "timestamp"])
    .index("by_embedded", ["embedded", "timestamp"])
    .index("by_expires", ["expiresAt"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["channel", "role"],
    }),

  crystalUserProfiles: defineTable({
    userId: v.string(),
    polarSubscriptionId: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled"),
      v.literal("trialing"),
      v.literal("unlimited")
    ),
    plan: v.optional(v.string()),
    roles: v.optional(v.array(v.union(v.literal("subscriber"), v.literal("manager"), v.literal("admin")))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_polar_subscription", ["polarSubscriptionId"])
    .index("by_polar_customer", ["polarCustomerId"]),

  crystalApiKeys: defineTable({
    userId: v.string(),
    keyHash: v.string(),
    label: v.optional(v.string()),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    active: v.boolean(),
    expiresAt: v.optional(v.number()), // Unix ms timestamp, null = never expires
  })
    .index("by_user", ["userId"])
    .index("by_key_hash", ["keyHash"]),

  crystalRateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),

  crystalAuditLog: defineTable({
    userId: v.string(),
    keyHash: v.string(),
    action: v.string(), // "capture", "recall", "forget", "checkpoint", etc.
    ts: v.number(),
    actorUserId: v.optional(v.string()),
    effectiveUserId: v.optional(v.string()),
    targetUserId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    meta: v.optional(v.string()), // JSON string with extra info (memory id, query, etc.)
  })
    .index("by_user", ["userId", "ts"])
    .index("by_key", ["keyHash", "ts"]),

  crystalImpersonationSessions: defineTable({
    actorUserId: v.string(),
    targetUserId: v.string(),
    reason: v.optional(v.string()),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    active: v.boolean(),
  })
    .index("by_actor", ["actorUserId", "startedAt"])
    .index("by_actor_active", ["actorUserId", "active"]),
});
