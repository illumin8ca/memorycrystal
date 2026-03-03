import { httpAction, internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

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
  v.literal("workflow")
);

type MemoryStore = "sensory" | "episodic" | "semantic" | "procedural" | "prospective";
type MemoryCategory = "decision" | "lesson" | "person" | "rule" | "event" | "fact" | "goal" | "workflow";

const DEFAULT_STORE: MemoryStore = "episodic";
const DEFAULT_CATEGORY: MemoryCategory = "event";
const STORE_VALUES: MemoryStore[] = ["sensory", "episodic", "semantic", "procedural", "prospective"];
const CATEGORY_VALUES: MemoryCategory[] = [
  "decision",
  "lesson",
  "person",
  "rule",
  "event",
  "fact",
  "goal",
  "workflow",
];

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

async function parseBody(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function normalizeStore(value: unknown): MemoryStore {
  const store = String(value ?? DEFAULT_STORE) as MemoryStore;
  return STORE_VALUES.includes(store) ? store : DEFAULT_STORE;
}

function normalizeCategory(value: unknown): MemoryCategory {
  const category = String(value ?? DEFAULT_CATEGORY) as MemoryCategory;
  return CATEGORY_VALUES.includes(category) ? category : DEFAULT_CATEGORY;
}

export const getApiKeyRecord = internalQuery({
  args: { keyHash: v.string() },
  handler: async (ctx, { keyHash }) => {
    return await ctx.db
      .query("crystalApiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", keyHash))
      .first();
  },
});

export const captureMemory = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    store: memoryStore,
    category: memoryCategory,
    tags: v.array(v.string()),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("crystalMemories", {
      userId: args.userId,
      title: args.title,
      content: args.content,
      store: args.store,
      category: args.category,
      tags: args.tags,
      channel: args.channel,
      source: "external",
      strength: 0.8,
      confidence: 0.9,
      valence: 0,
      arousal: 0.3,
      accessCount: 0,
      lastAccessedAt: now,
      createdAt: now,
      archived: false,
      embedding: [],
    });
    // Schedule async embedding generation
    await ctx.scheduler.runAfter(0, internal.crystal.mcp.embedMemory, { memoryId: id });
    return id;
  },
});

export const createCheckpointExternal = internalMutation({
  args: {
    userId: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { userId, label, description }) => {
    return await ctx.db.insert("crystalCheckpoints", {
      userId,
      label,
      description,
      createdAt: Date.now(),
      createdBy: "external",
      memorySnapshot: [],
      semanticSummary: description ?? label,
      tags: [],
    });
  },
});

export const listRecentMemories = internalQuery({
  args: { userId: v.string(), limit: v.number() },
  handler: async (ctx, { userId, limit }) => {
    const fetch = Math.min(Math.max(limit, 1), 50);
    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .take(Math.max(fetch * 5, 50));

    return memories.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt).slice(0, fetch);
  },
});

export const listRecentCheckpoints = internalQuery({
  args: { userId: v.string(), limit: v.number() },
  handler: async (ctx, { userId, limit }) => {
    return await ctx.db
      .query("crystalCheckpoints")
      .withIndex("by_user", (q) => q.eq("userId", userId).gte("createdAt", 0))
      .order("desc")
      .take(Math.min(Math.max(limit, 1), 20));
  },
});

export const getMemoryStoreStats = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const memories = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .collect();

    const byStore = {
      episodic: 0,
      semantic: 0,
      procedural: 0,
      prospective: 0,
      sensory: 0,
    };

    for (const memory of memories) {
      if (memory.store in byStore) {
        (byStore as any)[memory.store] += 1;
      }
    }

    return { total: memories.length, byStore };
  },
});

async function requireAuth(ctx: any, request: Request): Promise<{ userId: string; key: any } | null> {
  const rawKey = extractBearerToken(request);
  if (!rawKey) return null;
  const keyHash = await sha256Hex(rawKey);
  const key = await ctx.runQuery(internal.crystal.apiKeys.validateApiKey, { keyHash });
  if (!key) return null;

  const keyRecord = await ctx.runQuery(internal.crystal.mcp.getApiKeyRecord, { keyHash });
  if (!keyRecord || !keyRecord.active || !keyRecord.userId) return null;
  return { userId: keyRecord.userId, key: keyRecord };
}

export const mcpCapture = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const body = await parseBody(request);
  if (!body?.title || !body?.content) return json({ error: "title and content are required" }, 400);

  const id = await ctx.runMutation(internal.crystal.mcp.captureMemory, {
    userId: auth.userId,
    title: String(body.title),
    content: String(body.content),
    store: normalizeStore(body.store),
    category: normalizeCategory(body.category),
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    channel: body.channel ? String(body.channel) : undefined,
  });

  return json({ ok: true, id });
});

export const mcpRecall = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const body = await parseBody(request);
  const queryText = String(body?.query ?? "").trim();
  if (!queryText) return json({ memories: [] });

  const requestedLimit = Number(body?.limit ?? 10);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 10, 1), 50);
  const memories = await ctx.runQuery(internal.crystal.mcp.listRecentMemories, { userId: auth.userId, limit });

  const terms = queryText.toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = memories.filter((memory: any) => {
    const haystack = `${memory.title} ${memory.content}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });

  return json({
    memories: filtered.map((memory: any) => ({
      id: memory._id,
      title: memory.title,
      content: memory.content,
      store: memory.store,
      category: memory.category,
      tags: memory.tags,
      createdAt: memory.createdAt,
    })),
  });
});

export const mcpCheckpoint = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const body = await parseBody(request);
  if (!body?.label) return json({ error: "label is required" }, 400);

  const id = await ctx.runMutation(internal.crystal.mcp.createCheckpointExternal, {
    userId: auth.userId,
    label: String(body.label),
    description: body.description ? String(body.description) : undefined,
  });

  return json({ ok: true, id });
});

const wakeHandler = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const recentMemories = await ctx.runQuery(internal.crystal.mcp.listRecentMemories, {
    userId: auth.userId,
    limit: 5,
  });
  const checkpoints = await ctx.runQuery(internal.crystal.mcp.listRecentCheckpoints, {
    userId: auth.userId,
    limit: 1,
  });
  const stats = await ctx.runQuery(internal.crystal.mcp.getMemoryStoreStats, { userId: auth.userId });
  const lastCheckpoint = checkpoints[0] ?? null;
  const checkpointLabel = lastCheckpoint?.label ?? "none";
  const topTitle = recentMemories[0]?.title ?? "none";

  const briefing = `You have ${stats.total} memories. Last checkpoint: ${checkpointLabel}. Recent context: ${topTitle}.`;

  return json({
    briefing,
    recentMemories: recentMemories.map((m: any) => ({
      id: m._id,
      title: m.title,
      content: m.content,
      store: m.store,
      category: m.category,
      tags: m.tags,
      createdAt: m.createdAt,
      lastAccessedAt: m.lastAccessedAt,
    })),
    lastCheckpoint: lastCheckpoint
      ? {
          id: lastCheckpoint._id,
          label: lastCheckpoint.label,
          description: lastCheckpoint.description,
          createdAt: lastCheckpoint.createdAt,
        }
      : null,
  });
});

export const mcpWakeGet = wakeHandler;
export const mcpWakePost = wakeHandler;

export const mcpStats = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const stats = await ctx.runQuery(internal.crystal.mcp.getMemoryStoreStats, {
    userId: auth.userId,
  });

  return json({
    total: stats.total,
    byStore: stats.byStore,
    apiKeyLabel: auth.key.label ?? null,
  });
});

export const mcpAuth = httpAction(async (ctx, request) => {
  let auth = await requireAuth(ctx, request);

  if (!auth) {
    const body = await parseBody(request);
    const keyFromBody = body?.key ? String(body.key) : null;
    if (keyFromBody) {
      const cloned = new Request(request.url, {
        method: request.method,
        headers: { authorization: `Bearer ${keyFromBody}` },
      });
      auth = await requireAuth(ctx, cloned);
    }
  }

  if (!auth) return json({ error: "Unauthorized" }, 401);
  return json({ ok: true, userId: auth.userId });
});

// ── Embedding pipeline ──────────────────────────────────────────────

const OPENAI_EMBEDDING_ENDPOINT = "https://api.openai.com/v1/embeddings";
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

export const embedMemory = internalAction({
  args: { memoryId: v.id("crystalMemories") },
  handler: async (ctx, { memoryId }) => {
    const memory = await ctx.runQuery(internal.crystal.mcp.getMemoryById, { memoryId });
    if (!memory || !memory.content?.trim()) return;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return;

    const response = await fetch(OPENAI_EMBEDDING_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_EMBEDDING_MODEL,
        input: memory.content,
        encoding_format: "float",
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) return;

    const vector = payload.data?.[0]?.embedding;
    if (!Array.isArray(vector)) return;

    await ctx.runMutation(internal.crystal.mcp.patchMemoryEmbedding, {
      memoryId,
      embedding: vector,
    });
  },
});

export const getMemoryById = internalQuery({
  args: { memoryId: v.id("crystalMemories") },
  handler: async (ctx, { memoryId }) => ctx.db.get(memoryId),
});

export const patchMemoryEmbedding = internalMutation({
  args: { memoryId: v.id("crystalMemories"), embedding: v.array(v.float64()) },
  handler: async (ctx, { memoryId, embedding }) => {
    await ctx.db.patch(memoryId, { embedding });
  },
});

// ── Backfill: assign userId to orphaned memories ────────────────────

export const backfillUserIdOnMemories = internalMutation({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit }) => {
    const max = limit ?? 500;
    const all = await ctx.db.query("crystalMemories").take(max);
    let patched = 0;
    for (const doc of all) {
      if (!doc.userId) {
        await ctx.db.patch(doc._id, { userId });
        patched++;
      }
    }
    return { patched };
  },
});

export const backfillEmbeddings = internalAction({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }): Promise<{ processed: number; succeeded: number }> => {
    const memories = await ctx.runQuery(internal.crystal.mcp.listEmptyEmbeddingMemories, { limit: limit ?? 50 });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { processed: 0, succeeded: 0 };
    let succeeded = 0;
    for (const mem of memories) {
      if (!mem.content?.trim()) continue;
      try {
        const res = await fetch(OPENAI_EMBEDDING_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: OPENAI_EMBEDDING_MODEL, input: mem.content, encoding_format: "float" }),
        });
        const data = await res.json().catch(() => null);
        const vec = data?.data?.[0]?.embedding;
        if (Array.isArray(vec)) {
          await ctx.runMutation(internal.crystal.mcp.patchMemoryEmbedding, { memoryId: mem._id, embedding: vec });
          succeeded++;
        }
      } catch {}
    }
    return { processed: memories.length, succeeded };
  },
});

export const listEmptyEmbeddingMemories = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const all = await ctx.db.query("crystalMemories").take(limit * 3);
    return all.filter((m) => !m.embedding || m.embedding.length === 0).slice(0, limit);
  },
});







