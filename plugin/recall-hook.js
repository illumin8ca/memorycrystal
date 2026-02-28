#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const OPENAI_MODEL = "text-embedding-3-small";
const OPENAI_URL = "https://api.openai.com/v1/embeddings";
const CONVEX_ACTION = "/api/action";
const CONVEX_QUERY = "/api/query";
const DEFAULT_LIMIT = 8;
const RECALL_PATHS = ["vexclaw/recall:recallMemories"];

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
    process.env.VEXCLAW_ENV_FILE,
    path.resolve(__dirname, "..", "mcp-server", ".env"),
    process.env.VEXCLAW_ROOT ? path.resolve(process.env.VEXCLAW_ROOT, "mcp-server", ".env") : null,
  ].filter((entry) => typeof entry === "string" && entry.trim().length > 0);

  const envFile = envCandidates.find((entry) => fs.existsSync(entry));

  return {
    ...(envFile ? readFileEnv(envFile) : {}),
    ...process.env,
  };
};

const readInputFromStdin = async () => {
  const chunks = [];
  return await new Promise((resolve) => {
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(chunks.join("")));
  });
};

const safeGetString = (value) => (typeof value === "string" ? value : "");

const parseInput = async () => {
  const env = loadRuntimeEnv();
  const argQuery = safeGetString(process.argv[2]);
  const rawPayload = (await readInputFromStdin()).trim();

  if (!rawPayload) {
    return {
      query: argQuery,
      channel: "",
      sessionId: "",
      sessionKey: "",
      env,
    };
  }

  try {
    const parsed = JSON.parse(rawPayload);
    return {
      query: safeGetString(parsed?.query) || argQuery || "",
      channel: safeGetString(parsed?.channel),
      sessionId: safeGetString(parsed?.sessionId),
      sessionKey: safeGetString(parsed?.sessionKey) || safeGetString(parsed?.sessionId),
      env,
    };
  } catch {
    return {
      query: rawPayload || argQuery,
      channel: "",
      sessionId: "",
      sessionKey: "",
      env,
    };
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

const getEmbedding = async (query, env) => {
  const openaiKey = env.OPENAI_API_KEY;
  if (!openaiKey || typeof query !== "string" || query.trim().length === 0) {
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
      input: query,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload?.data?.[0]?.embedding ?? null;
};

const formatBlock = (memories) => {
  if (!Array.isArray(memories) || memories.length === 0) {
    return "## 🧠 VexClaw Memory Recall\nNo matching memories found.";
  }

  const lines = ["## 🧠 VexClaw Memory Recall"];
  for (const memory of memories) {
    const store = typeof memory.store === "string" ? memory.store.toUpperCase() : "UNKNOWN";
    const title = typeof memory.title === "string" ? memory.title : "";
    const content = typeof memory.content === "string" ? memory.content : "";
    const tags = Array.isArray(memory.tags)
      ? memory.tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0).join(", ")
      : "";
    const strength = typeof memory.strength === "number" ? memory.strength.toFixed(2) : "0.00";
    const confidence = typeof memory.confidence === "number" ? memory.confidence.toFixed(2) : "0.00";
    const score = typeof memory.score === "number" ? memory.score.toFixed(2) : "0.00";
    lines.push(`### ${store}: ${title}`);
    lines.push(content);
    lines.push(`Tags: ${tags.length > 0 ? tags : "none"} | Strength: ${strength} | Confidence: ${confidence} | Score: ${score}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
};

const normalizeMemory = (memory) => {
  if (!memory || typeof memory !== "object") {
    return null;
  }
  return {
    memoryId: safeGetString(memory.memoryId),
    store: safeGetString(memory.store),
    category: safeGetString(memory.category),
    title: safeGetString(memory.title),
    content: safeGetString(memory.content),
    strength: Number.isFinite(memory.strength) ? memory.strength : 0,
    confidence: Number.isFinite(memory.confidence) ? memory.confidence : 0,
    tags: Array.isArray(memory.tags) ? memory.tags : [],
    score: Number.isFinite(memory.score) ? memory.score : Number.isFinite(memory._score) ? memory._score : 0,
    scoreValue: Number.isFinite(memory.scoreValue) ? memory.scoreValue : 0,
  };
};

const searchMemories = async ({ embedding, env }) => {
  const convexUrl = toConvexUrl(env.CONVEX_URL);
  if (!convexUrl || !Array.isArray(embedding) || embedding.length === 0) {
    return [];
  }

  for (const path of RECALL_PATHS) {
    const actionResponse = await fetch(`${convexUrl}${CONVEX_ACTION}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        path,
        args: {
          embedding,
          limit: DEFAULT_LIMIT,
        },
      }),
    });

    if (!actionResponse.ok) {
      continue;
    }

    const actionPayload = await actionResponse.json().catch(() => null);
    const actionData = actionPayload?.value ?? actionPayload;
    const actionMemories = Array.isArray(actionData?.memories) ? actionData.memories : [];
    if (actionMemories.length > 0) {
      return actionMemories;
    }
  }

  return [];
};

const fetchRecentMessages = async (channel, sessionKey, limit = 20, env) => {
  const convexUrl = toConvexUrl(env.CONVEX_URL);
  if (!convexUrl) {
    return [];
  }

  const response = await fetch(`${convexUrl}${CONVEX_QUERY}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      path: "vexclaw/messages:getRecentMessages",
      args: {
        limit,
        channel,
        sessionKey,
      },
    }),
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json().catch(() => null);
  const data = payload?.value ?? payload;
  const messages = Array.isArray(data)
    ? data
    : Array.isArray(data?.messages)
      ? data.messages
      : [];
  return messages.filter((message) => message && typeof message === "object");
};

const formatRecentMessages = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return "";
  }

  const lines = messages.map((message) => {
    const timestamp = typeof message.timestamp === "number" ? new Date(message.timestamp).toLocaleTimeString() : "Invalid time";
    const role = typeof message.role === "string" ? message.role : "unknown";
    const content = typeof message.content === "string" ? message.content : "";
    const trimmed = content.length > 150 ? content.slice(0, 150) : content;
    return `[${timestamp}] ${role}: ${trimmed}`;
  });

  return ["## Short-Term Memory (recent messages)", ...lines].join("\n");
};

const main = async () => {
  const { query, env, channel, sessionKey } = await parseInput();
  const embedding = await getEmbedding(query, env);
  if (!embedding) {
    process.stdout.write(JSON.stringify({ injectionBlock: "", memories: [] }));
    return;
  }

  const memories = (await searchMemories({ embedding, env }))
    .slice(0, DEFAULT_LIMIT)
    .map(normalizeMemory)
    .filter(Boolean);
  const recentMessages = await fetchRecentMessages(channel, sessionKey, 20, env);
  const recentBlock = formatRecentMessages(recentMessages);
  const longTermBlock = formatBlock(memories);
  const injectionBlock = [recentBlock, longTermBlock].filter(Boolean).join("\n\n");

  process.stdout.write(
    JSON.stringify({
      injectionBlock,
      memories,
    })
  );
};

main().catch(() => {
  process.stdout.write(JSON.stringify({ injectionBlock: "", memories: [] }));
  process.exit(0);
});
