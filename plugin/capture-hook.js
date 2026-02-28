#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const EXTRACTION_MODEL = "gpt-4o-mini";
const OPENAI_MODEL = "text-embedding-3-small";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/embeddings";
const CONVEX_MUTATION = "/api/mutation";
const CONVEX_ACTION = "/api/action";
const STM_LOG_MESSAGE_PATH = "crystal/messages:logMessage";
const CONVEX_SEARCH_PATHS = ["crystal/recall:recallMemories"];
const VALID_STORES = new Set(["sensory", "episodic", "semantic", "procedural", "prospective"]);
const VALID_CATEGORIES = new Set(["decision", "lesson", "person", "rule", "event", "fact", "goal", "workflow"]);
const RELATION_TAG = "related-existing";
const DEDUPE_HIGH_SIMILARITY = 0.92;
const DEDUPE_RELATED_THRESHOLD = 0.75;
const DEFAULT_OBSIDIAN_VAULT = path.join(process.env.HOME || "", "Documents", "Memory");

const clamp = (value, min, max, fallback) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
};

const safeGetString = (value) => (typeof value === "string" ? value : "");

const toStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }
  const dedupe = new Set();
  const normalized = [];
  for (const tag of value) {
    if (typeof tag !== "string") {
      continue;
    }
    const next = tag.trim().toLowerCase();
    if (next.length === 0 || dedupe.has(next)) {
      continue;
    }
    dedupe.add(next);
    normalized.push(next);
  }
  return normalized;
};

const readFileEnv = (filePath) => {
  const values = {};
  if (!fs.existsSync(filePath)) {
    return values;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const [key, value = ""] = trimmed.split("=", 2);
    const normalizedKey = key.trim();
    values[normalizedKey] = value.trim().replace(/^"+|"+$/g, "");
  }
  return values;
};

const loadRuntimeEnv = () => {
  const envCandidates = [
    process.env.CRYSTAL_ENV_FILE,
    path.resolve(__dirname, "..", "mcp-server", ".env"),
    process.env.CRYSTAL_ROOT ? path.resolve(process.env.CRYSTAL_ROOT, "mcp-server", ".env") : null,
  ].filter((entry) => typeof entry === "string" && entry.trim().length > 0);

  const envFile = envCandidates.find((entry) => fs.existsSync(entry));

  return {
    ...(envFile ? readFileEnv(envFile) : {}),
    ...process.env,
  };
};

const readStdin = async () => {
  const chunks = [];
  return await new Promise((resolve) => {
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(chunks.join("")));
  });
};

const readJson = async () => {
  const raw = (await readStdin()).trim();
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const toConvexUrl = (value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "";
  }
  if (/^https?:\/\//i.test(value)) {
    return value.replace(/\/+$/, "");
  }
  return `https://${value.replace(/\/+$/, "")}`;
};

const normalizeCandidate = (candidate) => {
  if (typeof candidate !== "object" || candidate === null) {
    return null;
  }
  const store = typeof candidate.store === "string" ? candidate.store.trim().toLowerCase() : "";
  const category = typeof candidate.category === "string" ? candidate.category.trim().toLowerCase() : "";
  let title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const content = typeof candidate.content === "string" ? candidate.content.trim() : "";

  if (!VALID_STORES.has(store) || !VALID_CATEGORIES.has(category)) {
    return null;
  }
  if (title.length > 80) {
    title = title.slice(0, 80).trim();
  }
  if (title.length < 5 || content.length === 0) {
    return null;
  }

  return {
    store,
    category,
    title,
    content,
    confidence: clamp(candidate.confidence, 0, 1, 0.7),
    valence: clamp(candidate.valence, -1, 1, 0),
    arousal: clamp(candidate.arousal, 0, 1, 0.3),
    tags: toStringArray(candidate.tags),
  };
};

const extractMemories = async ({ userMessage, agentResponse, env }) => {
  const openaiKey = env.OPENAI_API_KEY;
  if (!openaiKey) {
    return [];
  }

  const systemPrompt = [
    "You are a memory extraction system for long-term memory storage.",
    "Extract up to 3 durable facts from the conversation turn.",
    "Return a JSON object: {\"memories\": [..]}.",
    "Never skip a meaningful stack decision, fact, goal, workflow, person detail, lesson, rule, event, or preference.",
    "Each memory object: {store, category, title (5-80 chars), content (1-3 sentences), tags[], confidence (0-1), valence (-1 to 1), arousal (0-1)}",
    "store: sensory|episodic|semantic|procedural|prospective",
    "category: decision|lesson|person|rule|event|fact|goal|workflow",
  ].join("\n");

  const userPrompt = `USER: ${userMessage}\nASSISTANT: ${agentResponse}`;

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: EXTRACTION_MODEL,
      max_tokens: 1024,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  const responseText = payload?.choices?.[0]?.message?.content ?? "";
  if (!responseText.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(responseText);
    // GPT returns {memories:[...]} or [...] directly
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.memories)
        ? parsed.memories
        : parsed.store
          ? [parsed]
          : [];
    return arr.map(normalizeCandidate).filter((item) => item !== null);
  } catch {
    return [];
  }
};

const getEmbedding = async (text, env) => {
  if (typeof text !== "string" || text.length === 0) {
    return null;
  }
  const openaiKey = env.OPENAI_API_KEY;
  if (!openaiKey) {
    return null;
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload?.data?.[0]?.embedding ?? null;
};

const unwrapConvexResponse = (payload) => {
  if (payload === null || payload === undefined) {
    return null;
  }
  if (typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "value")) {
    return payload.value;
  }
  return payload;
};

const postToConvexMutation = async ({ path, args, env }) => {
  const convexUrl = toConvexUrl(env.CONVEX_URL);
  if (!convexUrl) {
    return null;
  }

  const response = await fetch(`${convexUrl}${CONVEX_MUTATION}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      path,
      args,
    }),
  });

  if (!response.ok) {
    return null;
  }

  return response.json().catch(() => null);
};

const extractMemoryId = (payload) => {
  const value = unwrapConvexResponse(payload);
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object") {
    const direct = value.id || value.memoryId || value._id || value.result;
    if (typeof direct === "string" || typeof direct === "number") {
      return String(direct);
    }
  }
  return null;
};

const getSimilarityScore = (memory) => {
  if (!memory || typeof memory !== "object") {
    return 0;
  }
  if (typeof memory._score === "number" && Number.isFinite(memory._score)) {
    return memory._score;
  }
  if (typeof memory.score === "number" && Number.isFinite(memory.score)) {
    return memory.score;
  }
  if (typeof memory.scoreValue === "number" && Number.isFinite(memory.scoreValue)) {
    return memory.scoreValue;
  }
  return 0;
};

const logMessageToSTM = async (message, role, channel, sessionKey, env) => {
  const content = safeGetString(message);
  if (!content) {
    return;
  }

  const normalizedRole = role === "assistant" ? "assistant" : "user";
  const normalizedChannel = safeGetString(channel) || "unknown";
  const normalizedSessionKey = safeGetString(sessionKey);

  try {
    // Save raw message immediately — no embedding latency
    const saveResult = await postToConvexMutation({
      path: STM_LOG_MESSAGE_PATH,
      args: {
        role: normalizedRole,
        content: content.slice(0, 8000),
        channel: normalizedChannel,
        sessionKey: normalizedSessionKey,
      },
      env,
    });

    const messageId = saveResult?.value ?? (typeof saveResult === "string" ? saveResult : null);
    if (!messageId) return;

    // Generate embedding inline (OPENAI_API_KEY is available here unlike Convex action runtime)
    const embedding = await getEmbedding(content.slice(0, 8000), env);
    if (embedding) {
      await postToConvexMutation({
        path: "crystal/messages:updateMessageEmbedding",
        args: { messageId, embedding },
        env,
      }).catch(() => {}); // non-fatal if this fails
    } else {
      // Embedding unavailable (expired key, quota exceeded, network error)
      // Message is saved and recoverable — background stmEmbedder cron will retry
      console.warn(`WARN: STM embed skipped for ${normalizedRole} message (embedding unavailable — check OPENAI_API_KEY / quota). Message saved as text-only.`);
    }
  } catch (error) {
    console.error(`WARN: STM log failed (${normalizedRole}): ${error?.message || "unknown error"}`);
  }
};

const searchSimilarMemory = async ({ embedding, env }) => {
  const convexUrl = toConvexUrl(env.CONVEX_URL);
  if (!convexUrl || !Array.isArray(embedding) || embedding.length === 0) {
    return null;
  }

  for (const path of CONVEX_SEARCH_PATHS) {
    const response = await fetch(`${convexUrl}${CONVEX_ACTION}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        path,
        args: {
          embedding,
          limit: 1,
        },
      }),
    });
    if (!response.ok) {
      continue;
    }

    const payload = await response.json().catch(() => null);
    const data = unwrapConvexResponse(payload);
    const memories = Array.isArray(data?.memories) ? data.memories : [];
    if (memories.length > 0) {
      return memories[0];
    }
  }

  return null;
};

const saveMemory = async ({ memory, embedding, env, channel, sessionId }) => {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    return null;
  }

  const convexUrl = toConvexUrl(env.CONVEX_URL);
  if (!convexUrl) {
    return null;
  }

  const body = {
    path: "crystal/memories:createMemory",
    args: {
      store: memory.store,
      category: memory.category,
      title: memory.title,
      content: memory.content,
      embedding,
      confidence: memory.confidence,
      valence: memory.valence,
      arousal: memory.arousal,
      source: "conversation",
      channel: typeof channel === "string" ? channel : undefined,
      // sessionId in hook payload is an OpenClaw session key, not a Convex document id.
      // Do not pass it into Convex createMemory(sessionId:v.id("crystalSessions")) unless explicitly mapped.
      sessionId: undefined,
      tags: memory.tags,
    },
  };

  const response = await fetch(`${convexUrl}${CONVEX_MUTATION}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return null;
  }
  const data = await response.json().catch(() => ({}));
  if (data && typeof data === "object" && data.status === "error") {
    return null;
  }
  const value = unwrapConvexResponse(data);
  if (value === null || value === undefined) {
    return null;
  }
  return data;
};

const expandPath = (value) => {
  if (!value) {
    return DEFAULT_OBSIDIAN_VAULT;
  }
  if (value === "~") {
    return DEFAULT_OBSIDIAN_VAULT;
  }
  if (value.startsWith("~/")) {
    return path.join(process.env.HOME || "", value.slice(2));
  }
  return value;
};

const slugify = (value) => {
  const text = safeGetString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return text.length > 0 ? text : "memory";
};

const toObsidianFile = (memory, id, env, channel) => {
  const created = new Date().toISOString();
  const tags = Array.isArray(memory.tags) ? memory.tags : [];
  const confidence = typeof memory.confidence === "number" ? memory.confidence : 0;
  const title = memory.title;
  const store = memory.store;
  const category = memory.category;
  const frontMatter = [
    "---",
    `id: ${id}`,
    `store: ${store}`,
    `category: ${category}`,
    `confidence: ${confidence}`,
    `tags: [${tags.join(", ")}]`,
    `created: ${created}`,
    `source: conversation`,
    `channel: ${safeGetString(channel)}`,
    "---",
    "",
    `# ${title}`,
    "",
    memory.content,
    "",
  ];
  return frontMatter.join("\n");
};


const appendDailyLog = ({ userMessage, assistantMessage, env, channel, sessionKey }) => {
  const vaultPath = expandPath(env.OBSIDIAN_VAULT_PATH || DEFAULT_OBSIDIAN_VAULT);
  if (!vaultPath) return;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = now.toTimeString().slice(0, 8);  // HH:MM:SS

  const logDir = path.resolve(vaultPath, "logs");
  const logFile = path.resolve(logDir, `${dateStr}.md`);

  try {
    fs.mkdirSync(logDir, { recursive: true });

    // Write header if file is new
    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, `# Conversation Log — ${dateStr}\n\n`, "utf8");
    }

    const channelLabel = safeGetString(channel) || "unknown";
    const sessionLabel = safeGetString(sessionKey) || "";
    const lines = [];

    if (userMessage) {
      lines.push(`## [${timeStr}] USER${sessionLabel ? ` (${sessionLabel})` : ""} — ${channelLabel}`);
      lines.push(userMessage.trim());
      lines.push("");
    }
    if (assistantMessage) {
      lines.push(`## [${timeStr}] AI — ${channelLabel}`);
      lines.push(assistantMessage.trim());
      lines.push("");
    }

    if (lines.length > 0) {
      fs.appendFileSync(logFile, lines.join("\n") + "\n", "utf8");
    }
  } catch (error) {
    console.warn(`WARN: Daily log write failed: ${error?.message || "unknown error"}`);
  }
};

const writeObsidianNote = async ({ memory, memoryId, env, channel }) => {
  const vaultPath = expandPath(env.OBSIDIAN_VAULT_PATH || DEFAULT_OBSIDIAN_VAULT);
  if (!vaultPath) {
    return;
  }

  const storeDir = path.resolve(vaultPath, memory.store);
  const filePath = path.resolve(storeDir, `${slugify(memory.title)}-${Date.now()}.md`);
  const payload = toObsidianFile(memory, memoryId, env, channel);

  try {
    fs.mkdirSync(storeDir, { recursive: true });
    fs.writeFileSync(filePath, payload, "utf8");
  } catch (error) {
    console.warn(`WARN: Obsidian write failed for ${filePath}: ${error?.message || "unknown error"}`);
  }
};

const main = async () => {
  const env = loadRuntimeEnv();
  const payload = await readJson();

  const hookName = safeGetString(payload?.hookName || payload?.hook || payload?.event) || "message";
  if (["turn", "postTurn", "message"].includes(hookName)) {
    const userMessage = safeGetString(payload?.userMessage) || safeGetString(payload?.message?.content);
    const assistantMessage =
      safeGetString(payload?.assistantMessage) || safeGetString(payload?.response?.content) || safeGetString(payload?.agentResponse);
    const channel = safeGetString(payload?.channel) || safeGetString(process.env.CRYSTAL_CHANNEL) || "unknown";
    const sessionKey = safeGetString(payload?.sessionKey) || safeGetString(payload?.sessionId);

    if (userMessage) {
      await logMessageToSTM(userMessage, "user", channel, sessionKey, env);
    }
    if (assistantMessage) {
      await logMessageToSTM(assistantMessage, "assistant", channel, sessionKey, env);
    }

    // Dual-write: append both messages to daily Obsidian log
    appendDailyLog({ userMessage, assistantMessage, env, channel, sessionKey });
  }

  const userMessage = safeGetString(payload.userMessage);
  const agentResponse = safeGetString(payload.agentResponse);
  const channel = safeGetString(payload.channel);
  const sessionId = safeGetString(payload.sessionId);

  const memories = await extractMemories({ userMessage, agentResponse, env });
  const written = [];
  let skipped = 0;

  for (const memory of memories) {
    const embedding = await getEmbedding(memory.content, env);
    if (!embedding) {
      continue;
    }

    const match = await searchSimilarMemory({ embedding, env });
    const similarity = getSimilarityScore(match);
    if (similarity > DEDUPE_HIGH_SIMILARITY) {
      skipped += 1;
      continue;
    }

    const candidate = { ...memory };
    if (similarity >= DEDUPE_RELATED_THRESHOLD) {
      candidate.tags = toStringArray([...(memory.tags || []), RELATION_TAG]);
    }

    const saveResult = await saveMemory({ memory: candidate, embedding, env, channel, sessionId });
    if (saveResult) {
      const memoryId = extractMemoryId(saveResult);
      if (memoryId) {
        await writeObsidianNote({ memory: candidate, memoryId, env, channel });
      }
      written.push(memoryId || true);
    }
  }

  process.stdout.write(
    JSON.stringify({
      attempted: memories.length,
      saved: written.length,
      skipped,
      ids: written.map((item) => (typeof item === "string" ? item : item === true ? null : item)).filter(Boolean),
    })
  );
};

main().catch(() => {
  process.stdout.write(
    JSON.stringify({
      attempted: 0,
      saved: 0,
      skipped: 0,
      ids: [],
    })
  );
  process.exit(0);
});
