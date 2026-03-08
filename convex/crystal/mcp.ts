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
  v.literal("workflow"),
  v.literal("conversation")
);

type MemoryStore = "sensory" | "episodic" | "semantic" | "procedural" | "prospective";
type MemoryCategory = "decision" | "lesson" | "person" | "rule" | "event" | "fact" | "goal" | "workflow" | "conversation";

const DEFAULT_STORE: MemoryStore = "episodic";
const DEFAULT_CATEGORY: MemoryCategory = "conversation";
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
  "conversation",
];

type UserTier = "free" | "starter" | "pro" | "ultra" | "unlimited";

const STORAGE_LIMITS: Record<UserTier, number | null> = {
  free: 500,
  starter: 10_000,
  pro: 25_000,
  ultra: null,
  unlimited: null,
};

const MESSAGE_LIMITS: Record<UserTier, number | null> = {
  free: 500,
  starter: 5_000,
  pro: 25_000,
  ultra: null,
  unlimited: null,
};

const MESSAGE_TTL_DAYS: Record<UserTier, number> = {
  free: 30,
  starter: 60,
  pro: 90,
  ultra: 365,
  unlimited: 365,
};

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

export const issueApiKeyForUser = internalMutation({
  args: { userId: v.string(), label: v.optional(v.string()) },
  handler: async (ctx, { userId, label }) => {
    const rawKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const keyHash = await sha256Hex(rawKey);
    await ctx.db.insert("crystalApiKeys", {
      userId,
      keyHash,
      label: label ?? "internal-test-key",
      createdAt: Date.now(),
      active: true,
    });
    return rawKey;
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
    const tier = (await ctx.runQuery(internal.crystal.userProfiles.getUserTier, {
      userId: args.userId,
    })) as UserTier;
    const limit = STORAGE_LIMITS[tier];

    if (limit !== null) {
      const memoryCount = await ctx.runQuery(internal.crystal.mcp.getMemoryCount, {
        userId: args.userId,
      });
      if (memoryCount >= limit) {
        return {
          error: "Storage limit reached. Upgrade at https://memorycrystal.ai/dashboard/settings",
          limit,
        };
      }
    }

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
    return { id };
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

export const getLastSessionByUser = internalQuery({
  args: { userId: v.string(), channel: v.optional(v.string()) },
  handler: async (ctx, { userId, channel }) => {
    const allSessions = await ctx.db
      .query("crystalSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
    const filtered = channel
      ? allSessions.filter((s) => s.channel === channel)
      : allSessions;
    return filtered[0] ?? null;
  },
});

export const semanticSearch = internalAction({
  args: {
    userId: v.string(),
    queryEmbedding: v.array(v.float64()),
    limit: v.number(),
  },
  handler: async (ctx, { userId, queryEmbedding, limit }): Promise<
    Array<{
      _id: string;
      title: string;
      content: string;
      store: string;
      category: string;
      tags: string[];
      createdAt: number;
      score: number;
    }>
  > => {
    const results = (await ctx.vectorSearch("crystalMemories", "by_embedding", {
      vector: queryEmbedding,
      limit: Math.min(Math.max(limit, 1), 20),
      filter: (q: any) => q.eq("userId", userId),
    })) as Array<{ _id: string; _score: number }>;

    const docs = await Promise.all(
      results.map(async (r) => {
        const doc = await ctx.runQuery(internal.crystal.mcp.getMemoryById, { memoryId: r._id as any });
        if (!doc || doc.archived) return null;
        return {
          _id: String(r._id),
          title: doc.title,
          content: doc.content,
          store: doc.store,
          category: doc.category,
          tags: doc.tags ?? [],
          createdAt: doc.createdAt,
          score: r._score,
        };
      })
    );

    return docs.filter((d): d is NonNullable<typeof d> => d !== null);
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

export const getMemoryCount = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const active = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .collect();
    const archived = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", true))
      .collect();
    return active.length + archived.length;
  },
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

export const checkAndIncrementRateLimit = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, { key }): Promise<{ allowed: boolean; remaining: number }> => {
    const now = Date.now();
    const existing = await ctx.db
      .query("crystalRateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
      if (existing) {
        await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
      } else {
        await ctx.db.insert("crystalRateLimits", { key, windowStart: now, count: 1 });
      }
      return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }

    if (existing.count >= RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0 };
    }

    await ctx.db.patch(existing._id, { count: existing.count + 1 });
    return { allowed: true, remaining: RATE_LIMIT_MAX - existing.count - 1 };
  },
});

async function withRateLimit(ctx: any, keyHash: string): Promise<Response | null> {
  const result = await ctx.runMutation(internal.crystal.mcp.checkAndIncrementRateLimit, {
    key: `mcp:${keyHash}`,
  });
  if (!result.allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Max 60 requests/minute." }), {
      status: 429,
      headers: {
        "content-type": "application/json",
        "Retry-After": "60",
        "X-RateLimit-Limit": "60",
        "X-RateLimit-Remaining": "0",
      },
    });
  }
  return null;
}

async function getTierAndLimit(ctx: any, userId: string): Promise<{ tier: UserTier; limit: number | null }> {
  const tier = (await ctx.runQuery(internal.crystal.userProfiles.getUserTier, { userId })) as UserTier;
  return { tier, limit: STORAGE_LIMITS[tier] };
}

async function requireAuth(ctx: any, request: Request): Promise<{ userId: string; key: any; keyHash: string } | null> {
  const rawKey = extractBearerToken(request);
  if (!rawKey) return null;
  const keyHash = await sha256Hex(rawKey);
  const key = await ctx.runQuery(internal.crystal.apiKeys.validateApiKey, { keyHash });
  if (!key) return null;

  const keyRecord = await ctx.runQuery(internal.crystal.mcp.getApiKeyRecord, { keyHash });
  if (!keyRecord || !keyRecord.active || !keyRecord.userId) return null;
  return { userId: keyRecord.userId, key: keyRecord, keyHash };
}

export const mcpCapture = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const rateLimitResponse = await withRateLimit(ctx, auth.keyHash);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await parseBody(request);
  if (!body?.title || !body?.content) return json({ error: "title and content are required" }, 400);

  const { limit } = await getTierAndLimit(ctx, auth.userId);
  if (limit !== null) {
    const memoryCount = await ctx.runQuery(internal.crystal.mcp.getMemoryCount, {
      userId: auth.userId,
    });
    if (memoryCount >= limit) {
      return json(
        {
          error: "Storage limit reached. Upgrade at https://memorycrystal.ai/dashboard/settings",
          limit,
        },
        403
      );
    }
  }

  const result = await ctx.runMutation(internal.crystal.mcp.captureMemory, {
    userId: auth.userId,
    title: String(body.title),
    content: String(body.content),
    store: normalizeStore(body.store),
    category: normalizeCategory(body.category),
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    channel: body.channel ? String(body.channel) : undefined,
  });

  if (result?.error) {
    return json(
      {
        error: "Storage limit reached. Upgrade at https://memorycrystal.ai/dashboard/settings",
        limit: result.limit,
      },
      403
    );
  }

  return json({ ok: true, id: result.id });
});

export const mcpRecall = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const rateLimitResponse = await withRateLimit(ctx, auth.keyHash);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await parseBody(request);
  const query = String(body?.query ?? "").trim();
  const requestedLimit = Number(body?.limit ?? 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 50)
    : 10;
  if (!query) return json({ error: "query is required" }, 400);

  const apiKey = process.env.OPENAI_API_KEY;
  let memories: any[] = [];

  if (apiKey) {
    try {
      const res = await fetch(OPENAI_EMBEDDING_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: OPENAI_EMBEDDING_MODEL,
          input: query,
          encoding_format: "float",
        }),
      });
      const data = await res.json().catch(() => null);
      const vec = data?.data?.[0]?.embedding;
      if (Array.isArray(vec)) {
        memories = await ctx.runAction(internal.crystal.mcp.semanticSearch, {
          userId: auth.userId,
          queryEmbedding: vec,
          limit,
        });
      }
    } catch {}
  }

  // Lexical fallback
  if (memories.length === 0) {
    const all = await ctx.runQuery(internal.crystal.mcp.listRecentMemories, {
      userId: auth.userId,
      limit: 100,
    });
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    memories = all
      .filter(
        (m) => words.some((w) => m.content?.toLowerCase().includes(w) || m.title?.toLowerCase().includes(w))
      )
      .slice(0, limit)
      .map((m) => ({ ...m, score: 0 }));
  }

  return json({ memories });
});

export const mcpCheckpoint = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const rateLimitResponse = await withRateLimit(ctx, auth.keyHash);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await parseBody(request);
  const label = String(body?.label ?? body?.title ?? "").trim();
  if (!label) return json({ error: "label (or title) is required" }, 400);

  const id = await ctx.runMutation(internal.crystal.mcp.createCheckpointExternal, {
    userId: auth.userId,
    label,
    description: body.description
      ? String(body.description)
      : body.content
      ? String(body.content)
      : undefined,
  });

  return json({ ok: true, id });
});

const wakeHandler = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const rateLimitResponse = await withRateLimit(ctx, auth.keyHash);
  if (rateLimitResponse) return rateLimitResponse;

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
  const topTitle = recentMemories[0]?.title ?? "none";

  // Parse channel from request body if POST
  let channel: string | undefined;
  try {
    if (request.method === "POST") {
      const body = await request.clone().json().catch(() => ({}));
      channel = typeof body?.channel === "string" ? body.channel.trim() || undefined : undefined;
    }
  } catch { /* ignore */ }

  // Fetch last session for continuity
  const lastSession = await ctx.runQuery(internal.crystal.mcp.getLastSessionByUser, {
    userId: auth.userId,
    channel,
  });

  const goals = recentMemories.filter((m: any) => m.store === "prospective" || m.category === "goal");
  const decisions = recentMemories.filter((m: any) => m.category === "decision");

  // Build last session block
  const lastSessionLines: string[] = [];
  if (lastSession?.summary) {
    const ago = lastSession.lastActiveAt
      ? `${Math.round((Date.now() - lastSession.lastActiveAt) / 3600000)}h ago`
      : "recently";
    lastSessionLines.push(
      "",
      `## Last session (${ago}, ${lastSession.messageCount ?? 0} messages):`,
      lastSession.summary.slice(0, 300)
    );
  }

  const bootstrapLines = [
    "## 🔮 Memory Crystal — Active",
    "You have access to persistent memory tools. Use them proactively:",
    "- **crystal_recall** — search your memory when the user references past events, decisions, or asks 'do you remember'",
    "- **crystal_remember** — save important decisions, lessons, facts, goals, or anything worth keeping",
    "- **crystal_checkpoint** — snapshot current memory state at significant milestones",
    "- **crystal_what_do_i_know** — summarize what you know about a topic",
    "- **crystal_why_did_we** — explain the reasoning behind past decisions",
    "Memory is automatically captured each turn. Focus on quality saves with crystal_remember.",
    "",
    "## Memory Crystal Wake Briefing",
    `Channel: ${channel ?? "unknown"}`,
    `Total memories: ${stats.total}`,
    ...lastSessionLines,
    "",
    "Open goals:",
    ...(goals.length ? goals.map((m: any) => `- [${m.store}] ${m.title}`) : ["- none"]),
    "",
    "Recent decisions:",
    ...(decisions.length ? decisions.map((m: any) => `- [${m.store}] ${m.title}`) : ["- none"]),
    "",
    `${goals.length + decisions.length} memories surfaced | Use crystal_recall to search all memories.`,
  ];

  const briefing = bootstrapLines.join("\n");

  // Store session so next wake can show this summary
  const now = Date.now();
  await ctx.runMutation(internal.crystal.sessions.createSessionInternal, {
    userId: auth.userId,
    channel: channel ?? "unknown",
    startedAt: now,
    lastActiveAt: now,
    messageCount: 0,
    memoryCount: stats.total,
    summary: briefing,
    participants: [],
  });

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

export const mcpLog = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const rateLimitResponse = await withRateLimit(ctx, auth.keyHash);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await parseBody(request);
  const role = body?.role === "user" ? "user" : body?.role === "system" ? "system" : "assistant";
  const content = String(body?.content ?? "").trim();
  if (!content) return json({ error: "content is required" }, 400);

  const tier = (await ctx.runQuery(internal.crystal.userProfiles.getUserTier, {
    userId: auth.userId,
  })) as UserTier;

  const messageLimit = MESSAGE_LIMITS[tier];
  if (messageLimit !== null) {
    const messageCount = await ctx.runQuery(internal.crystal.messages.getMessageCount, {
      userId: auth.userId,
    });
    if (messageCount >= messageLimit) {
      return json(
        {
          error: "Storage limit reached. Upgrade at https://memorycrystal.ai/dashboard/settings",
          limit: messageLimit,
        },
        403
      );
    }
  }

  const id = await ctx.runMutation(internal.crystal.messages.logMessageInternal, {
    userId: auth.userId,
    role,
    content,
    channel: body?.channel ? String(body.channel) : undefined,
    sessionKey: body?.sessionKey ? String(body.sessionKey) : undefined,
    ttlDays: MESSAGE_TTL_DAYS[tier],
  });

  return json({ ok: true, id });
});

export const mcpStats = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const rateLimitResponse = await withRateLimit(ctx, auth.keyHash);
  if (rateLimitResponse) return rateLimitResponse;

  const stats = await ctx.runQuery(internal.crystal.mcp.getMemoryStoreStats, {
    userId: auth.userId,
  });

  return json({
    total: stats.total,
    byStore: stats.byStore,
    apiKeyLabel: auth.key.label ?? null,
  });
});

export const mcpReflect = httpAction(async (ctx, request) => {
  const auth = await requireAuth(ctx, request);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const rateLimitResponse = await withRateLimit(ctx, auth.keyHash);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await parseBody(request);
  const windowHoursRaw = Number(body?.windowHours ?? 4);
  const windowHours = Number.isFinite(windowHoursRaw) ? Math.min(Math.max(windowHoursRaw, 0.5), 72) : 4;
  const sessionId = body?.sessionId ? String(body.sessionId) : undefined;

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return json({ error: "Reflection not available: OPENAI_API_KEY not configured" }, 503);
  }

  try {
    const stats = await ctx.runAction(internal.crystal.reflection.runReflectionForUser, {
      userId: auth.userId,
      windowHours,
      sessionId: sessionId as any,
      openaiApiKey,
    });
    return json({ ok: true, stats });
  } catch (err) {
    console.log("[mcpReflect] action failed:", err);
    return json({ error: "Reflection failed", detail: String(err) }, 500);
  }
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

  const rateLimitResponse = await withRateLimit(ctx, auth.keyHash);
  if (rateLimitResponse) return rateLimitResponse;

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

export const listMemoryUserIds = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const max = Math.min(Math.max(limit ?? 50, 1), 500);
    const docs = await ctx.db.query("crystalMemories").take(max);
    return docs.map((m) => ({ id: m._id, userId: m.userId ?? null, hasPipe: typeof m.userId === "string" && m.userId.includes("|") }));
  },
});

export const listApiKeyUserIds = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const max = Math.min(Math.max(limit ?? 50, 1), 500);
    const docs = await ctx.db.query("crystalApiKeys").take(max);
    return docs.map((k) => ({ id: k._id, userId: k.userId ?? null, hasPipe: typeof k.userId === "string" && k.userId.includes("|") }));
  },
});

export const auditDataIntegrity = internalQuery({
  args: {},
  handler: async (ctx) => {
    const memories = await ctx.db.query("crystalMemories").collect();
    const apiKeys = await ctx.db.query("crystalApiKeys").collect();
    const profiles = await ctx.db.query("crystalUserProfiles").collect();

    const memoriesMissingUserId = memories.filter((m) => !m.userId).length;
    const memoryUserIdsWithPipe = memories.filter((m) => typeof m.userId === "string" && m.userId.includes("|")).length;
    const apiKeysMissingUserId = apiKeys.filter((k) => !k.userId).length;
    const apiKeyUserIdsWithPipe = apiKeys.filter((k) => typeof k.userId === "string" && k.userId.includes("|")).length;

    const duplicateProfiles = profiles.reduce((acc: Record<string, number>, p) => {
      if (!p.userId) return acc;
      acc[p.userId] = (acc[p.userId] ?? 0) + 1;
      return acc;
    }, {});
    const usersWithDuplicateProfiles = Object.entries(duplicateProfiles)
      .filter(([, count]) => count > 1)
      .map(([userId, count]) => ({ userId, count }));

    return {
      memoriesMissingUserId,
      memoryUserIdsWithPipe,
      apiKeysMissingUserId,
      apiKeyUserIdsWithPipe,
      usersWithDuplicateProfiles,
    };
  },
});







