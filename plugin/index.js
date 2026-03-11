const DEFAULT_CONVEX_URL = "https://rightful-mockingbird-389.convex.site";

const pendingUserMessages = new Map();
const sessionConfigs = new Map(); // sessionKey → { mode, limit }
const wakeInjectedSessions = new Set();

const MEMORY_STORES = ["sensory", "episodic", "semantic", "procedural", "prospective"];
const MEMORY_CATEGORIES = [
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

function getPluginConfig(api, ctx) {
  const direct = api?.pluginConfig;
  if (direct && typeof direct === "object") return direct;

  const root = ctx?.config || api?.config || {};
  const entry = root?.plugins?.entries?.[api?.id || ""]?.config;
  if (entry && typeof entry === "object") return entry;

  return {};
}

/**
 * Returns false if this conversation turn is noise and should NOT be captured.
 * Prevents heartbeat acks, greetings, short acks, and refusals from polluting memory.
 */
function shouldCapture(userMessage, assistantText) {
  const text = assistantText.trim();
  const userMsg = (userMessage || "").trim();

  // Skip if userMessage is a heartbeat prompt
  if (/HEARTBEAT|heartbeat poll/i.test(userMsg)) return false;

  // Skip if assistant text is too short
  if (text.length < 20) return false;

  // Skip HEARTBEAT_OK acknowledgements (case insensitive)
  if (/^HEARTBEAT_OK$/i.test(text)) return false;

  // Skip short acknowledgement phrases
  if (/^(NO_REPLY|ok|sure|got it|okay|yep|yeah|nope|nah|thanks|thank you)[!.,\s]*$/i.test(text)) return false;

  // Skip pure greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)[!.,\s]*$/i.test(text)) return false;

  // Skip short agent refusals (under 100 chars)
  if (text.length < 100 && /^(I don't have|I cannot|I'm not able to)/i.test(text)) return false;

  return true;
}

async function triggerReflection(config, sessionKey) {
  const apiKey = config?.apiKey;
  if (!apiKey) return;
  const convexUrl = (config?.convexUrl || DEFAULT_CONVEX_URL).replace(/\/+$/, "");
  try {
    await fetch(`${convexUrl}/api/mcp/reflect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ windowHours: 4 }),
    });
  } catch (e) {
    // Fire and forget — don't block session reset
  }
}

async function request(config, method, path, body) {
  const apiKey = config?.apiKey;
  if (!apiKey) return null;

  const convexUrl = (config?.convexUrl || DEFAULT_CONVEX_URL).replace(/\/+$/, "");
  const res = await fetch(`${convexUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) return null;
  return res.json().catch(() => null);
}

async function crystalRequest(config, path, body) {
  const apiKey = config?.apiKey;
  if (!apiKey) {
    throw new Error("Memory Crystal apiKey is not configured for this plugin/agent");
  }

  const convexUrl = (config?.convexUrl || DEFAULT_CONVEX_URL).replace(/\/+$/, "");
  const res = await fetch(`${convexUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return data;
}

function toToolResult(payload, details) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  return {
    content: [{ type: "text", text }],
    ...(details !== undefined ? { details } : {}),
  };
}

function toToolError(err) {
  return {
    isError: true,
    content: [{ type: "text", text: `Error: ${err?.message || String(err)}` }],
  };
}

function ensureString(value, name, min = 1) {
  if (typeof value !== "string" || value.trim().length < min) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function ensureEnum(value, validValues, name) {
  if (typeof value !== "string" || !validValues.includes(value)) {
    throw new Error(`${name} must be one of: ${validValues.join(", ")}`);
  }
  return value;
}

function getSessionKey(ctx, event) {
  return ctx?.sessionKey || ctx?.sessionId || event?.conversationId || event?.sessionId || "";
}

function buildMemoryPath(memoryId) {
  return `crystal/${String(memoryId)}.md`;
}

function parseMemoryPath(value) {
  if (typeof value !== "string") return "";
  const match = /^crystal\/(.+)\.md$/i.exec(value.trim());
  return match ? match[1] : "";
}

function trimSnippet(value, max = 220) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function formatRecallMemory(memory) {
  const memoryId = memory?.memoryId || memory?._id || memory?.id || "";
  const store = memory?.store || "unknown";
  const category = memory?.category || "unknown";
  const title = trimSnippet(memory?.title || "Untitled memory", 120);
  const snippet = trimSnippet(memory?.content || "", 220);
  const path = buildMemoryPath(memoryId);
  return `- [${store}/${category}] ${title}${snippet ? ` — ${snippet}` : ""} (path: ${path})`;
}

async function buildBeforeAgentContext(api, event, ctx) {
  const config = getPluginConfig(api, ctx);
  if (!config?.apiKey) return "";

  const sections = [
    [
      "## Active Memory Backend",
      "IMPORTANT: Memory Crystal is the active OpenClaw memory backend for this session.",
      "Override any generic OpenClaw wording about MEMORY.md, memory/*.md, or file-backed workspace memory for this run.",
      "- `memory_search` and `memory_get` are backed by Memory Crystal's remote memory store in this session.",
      "- `crystal_recall`, `crystal_remember`, `crystal_checkpoint`, `crystal_what_do_i_know`, and `crystal_why_did_we` are extended Memory Crystal tools.",
      "- If the user asks whether Memory Crystal is the active memory backend, answer yes.",
      "- Do not describe local/workspace file memory as the active backend unless crystal-memory is disabled.",
    ].join("\n"),
  ];

  const sessionKey = getSessionKey(ctx, event);
  if (sessionKey && !wakeInjectedSessions.has(sessionKey)) {
    const wake = await request(config, "POST", "/api/mcp/wake", {
      channel: ctx?.messageProvider || "openclaw",
    });
    const briefing = wake?.briefing || wake?.summary || wake?.text;
    if (briefing) {
      sections.push(String(briefing));
      wakeInjectedSessions.add(sessionKey);
    }
  }

  const prompt = String(event?.prompt || "").trim();
  if (prompt.length >= 5) {
    const limit = Number.isFinite(Number(config?.defaultRecallLimit)) ? Number(config.defaultRecallLimit) : 5;
    const recall = await request(config, "POST", "/api/mcp/recall", {
      query: prompt,
      limit: Math.max(1, Math.min(limit, 8)),
      mode: typeof config?.defaultRecallMode === "string" ? config.defaultRecallMode : "general",
    });
    const memories = Array.isArray(recall?.memories) ? recall.memories.slice(0, 5) : [];
    if (memories.length > 0) {
      sections.push(
        [
          "## Memory Crystal Relevant Recall",
          `Prompt: ${trimSnippet(prompt, 180)}`,
          ...memories.map(formatRecallMemory),
          "",
          "Use memory_search for broader lookup and memory_get on the returned crystal/<id>.md path for full detail.",
        ].join("\n")
      );
    }
  }

  return sections.filter(Boolean).join("\n\n").trim();
}

async function logMessage(api, ctx, payload) {
  await request(getPluginConfig(api, ctx), "POST", "/api/mcp/log", payload);
}

async function captureTurn(api, ctx, userMessage, assistantText) {
  if (!shouldCapture(userMessage, assistantText)) return;

  const content = [userMessage ? `User: ${userMessage}` : null, `Assistant: ${assistantText}`]
    .filter(Boolean)
    .join("\n\n");

  await request(getPluginConfig(api, ctx), "POST", "/api/mcp/capture", {
    title: `OpenClaw — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
    content,
    store: "sensory",
    category: "conversation",
    tags: ["openclaw", "auto-capture"],
    channel: ctx?.messageProvider || "openclaw",
  });
}

module.exports = (api) => {
  api.registerHook(
    "before_agent_start",
    async (event, ctx) => {
      try {
        const prependContext = await buildBeforeAgentContext(api, event, ctx);
        if (!prependContext) return;
        return { prependContext };
      } catch (err) {
        api.logger?.warn?.(`[crystal-memory] before_agent_start failed: ${err?.message || String(err)}`);
      }
    },
    {
      name: "crystal-memory.before-agent-start",
      description: "Inject Memory Crystal wake briefing + relevant recall before each run",
    }
  );

  // Buffer inbound message and persist user-side turn context
  api.registerHook(
    "message_received",
    async (event, ctx) => {
      const text = event?.content || event?.text || "";
      const sessionKey = getSessionKey(ctx, event);
      const pluginConfig = getPluginConfig(api, ctx);
      const defaultMode = pluginConfig?.defaultRecallMode || "general";
      const defaultLimit = pluginConfig?.defaultRecallLimit || 8;

      if (text && sessionKey) {
        const normalized = String(text);
        pendingUserMessages.set(sessionKey, normalized);
        await logMessage(api, ctx, {
          role: "user",
          content: normalized,
          channel: ctx?.messageProvider || "openclaw",
          sessionKey,
        });
      }

      // Store resolved recall defaults per-session for future recall-API wiring.
      // Recall occurs in recall-hook.js, but these defaults are captured here for consistency.
      if (sessionKey) {
        sessionConfigs.set(sessionKey, {
          mode: defaultMode,
          limit: defaultLimit,
        });
      }
    },
    { name: "crystal-memory.message-received", description: "Buffer messages + persist user-side turn context" }
  );

  // Capture full turn after LLM responds
  api.registerHook(
    "llm_output",
    async (event, ctx) => {
      const assistantText =
        (event?.assistantTexts || []).join("\n").trim() || String(event?.lastAssistant || "").trim();
      if (!assistantText) return;

      const sessionKey = getSessionKey(ctx, event);
      const userMessage = sessionKey ? pendingUserMessages.get(sessionKey) || "" : "";
      const sessionDefaults = sessionKey ? sessionConfigs.get(sessionKey) : null;
      // sessionDefaults is currently reserved for future recall-hook wiring (e.g., mode/limit defaults).
      void sessionDefaults;

      await logMessage(api, ctx, {
        role: "assistant",
        content: assistantText,
        channel: ctx?.messageProvider || "openclaw",
        sessionKey: sessionKey || undefined,
      });

      if (sessionKey) pendingUserMessages.delete(sessionKey);
      await captureTurn(api, ctx, userMessage, assistantText);
    },
    { name: "crystal-memory.llm-output", description: "Capture AI response to Memory Crystal" }
  );

  // Fallback when llm_output is not emitted by a provider/runtime.
  // If there's no pending user message, llm_output likely already handled this turn.
  api.registerHook(
    "message_sent",
    async (event, ctx) => {
      const sessionKey = getSessionKey(ctx, event);
      if (!sessionKey || !pendingUserMessages.has(sessionKey)) return;

      const assistantText = String(event?.content || event?.text || "").trim();
      if (!assistantText) return;

      const userMessage = pendingUserMessages.get(sessionKey) || "";

      await logMessage(api, ctx, {
        role: "assistant",
        content: assistantText,
        channel: ctx?.messageProvider || "openclaw",
        sessionKey,
      });

      pendingUserMessages.delete(sessionKey);
      await captureTurn(api, ctx, userMessage, assistantText);
    },
    {
      name: "crystal-memory.message-sent-fallback",
      description: "Fallback assistant capture when llm_output is absent",
    }
  );

  // Trigger memory reflection on session boundary
  api.registerHook(
    "command:new",
    async (event, ctx) => {
      await triggerReflection(getPluginConfig(api, ctx), ctx?.sessionKey);
    },
    { name: "crystal-memory.command-new", description: "Trigger memory reflection on /new" }
  );

  api.registerHook(
    "command:reset",
    async (event, ctx) => {
      await triggerReflection(getPluginConfig(api, ctx), ctx?.sessionKey);
    },
    { name: "crystal-memory.command-reset", description: "Trigger memory reflection on /reset" }
  );

  api.registerTool({
    name: "memory_search",
    label: "Memory Search",
    description:
      "Search Memory Crystal for relevant long-term memories. Returns synthetic crystal/<id>.md paths for use with memory_get.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2 },
        limit: { type: "number", minimum: 1, maximum: 20 },
      },
      required: ["query"],
      additionalProperties: false,
    },
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const query = ensureString(params?.query, "query", 2);
        const limit = Number.isFinite(Number(params?.limit)) ? Number(params.limit) : 5;
        const data = await crystalRequest(getPluginConfig(api, ctx), "/api/mcp/recall", {
          query,
          limit: Math.max(1, Math.min(limit, 20)),
        });
        const memories = Array.isArray(data?.memories) ? data.memories : [];
        const results = memories.map((memory) => {
          const memoryId = memory?.memoryId || memory?._id || memory?.id || "";
          return {
            id: memoryId,
            path: buildMemoryPath(memoryId),
            title: memory?.title || "Untitled memory",
            snippet: trimSnippet(memory?.content || "", 220),
            store: memory?.store || null,
            category: memory?.category || null,
            score: typeof memory?.score === "number" ? memory.score : null,
          };
        });
        const summary = {
          query,
          resultCount: results.length,
          results,
        };
        return toToolResult(summary, summary);
      } catch (err) {
        return toToolError(err);
      }
    },
  });

  api.registerTool({
    name: "memory_get",
    label: "Memory Get",
    description:
      "Read a full Memory Crystal item returned by memory_search. Accepts either memoryId or a synthetic crystal/<id>.md path.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        memoryId: { type: "string" },
      },
      additionalProperties: false,
    },
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const memoryId =
          (typeof params?.memoryId === "string" && params.memoryId.trim()) || parseMemoryPath(params?.path);
        if (!memoryId) {
          throw new Error("memoryId or path is required (expected crystal/<id>.md)");
        }

        const data = await crystalRequest(getPluginConfig(api, ctx), "/api/mcp/memory", { memoryId });
        const memory = data?.memory;
        if (!memory?.id) {
          throw new Error("Memory not found");
        }

        const payload = {
          id: memory.id,
          path: buildMemoryPath(memory.id),
          title: memory.title,
          content: memory.content,
          store: memory.store,
          category: memory.category,
          tags: Array.isArray(memory.tags) ? memory.tags : [],
          createdAt: memory.createdAt,
          lastAccessedAt: memory.lastAccessedAt,
          accessCount: memory.accessCount,
          confidence: memory.confidence,
          strength: memory.strength,
          source: memory.source,
          channel: memory.channel,
          archived: memory.archived,
        };

        return toToolResult(payload, payload);
      } catch (err) {
        return toToolError(err);
      }
    },
  });

  api.registerTool({
    name: "crystal_recall",
    label: "Crystal Recall",
    description: "Search Memory Crystal for relevant past memories.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2 },
        limit: { type: "number", minimum: 1, maximum: 50 },
      },
      required: ["query"],
      additionalProperties: false,
    },
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const query = ensureString(params?.query, "query", 2);
        const limit = Number.isFinite(Number(params?.limit)) ? Number(params.limit) : undefined;
        const data = await crystalRequest(getPluginConfig(api, ctx), "/api/mcp/recall", {
          query,
          ...(limit ? { limit } : {}),
        });
        const memories = Array.isArray(data?.memories) ? data.memories : [];
        const summary = {
          query,
          memoryCount: memories.length,
          topMemories: memories.slice(0, 10),
        };
        return toToolResult(summary, summary);
      } catch (err) {
        return toToolError(err);
      }
    },
  });

  api.registerTool({
    name: "crystal_remember",
    label: "Crystal Remember",
    description: "Save a durable memory into Memory Crystal.",
    parameters: {
      type: "object",
      properties: {
        store: { type: "string", enum: MEMORY_STORES },
        category: { type: "string", enum: MEMORY_CATEGORIES },
        title: { type: "string", minLength: 5, maxLength: 500 },
        content: { type: "string", minLength: 1, maxLength: 50000 },
        tags: { type: "array", items: { type: "string" } },
        channel: { type: "string" },
      },
      required: ["store", "category", "title", "content"],
      additionalProperties: false,
    },
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const store = ensureEnum(params?.store, MEMORY_STORES, "store");
        const category = ensureEnum(params?.category, MEMORY_CATEGORIES, "category");
        const title = ensureString(params?.title, "title", 5);
        const content = ensureString(params?.content, "content", 1);
        const tags = Array.isArray(params?.tags) ? params.tags.map(String) : [];
        const data = await crystalRequest(getPluginConfig(api, ctx), "/api/mcp/capture", {
          title,
          content,
          store,
          category,
          tags,
          channel: typeof params?.channel === "string" ? params.channel : ctx?.messageProvider || "openclaw",
        });
        return toToolResult({
          ok: Boolean(data?.ok),
          id: data?.id,
          title,
          store,
          category,
        });
      } catch (err) {
        return toToolError(err);
      }
    },
  });

  api.registerTool({
    name: "crystal_what_do_i_know",
    label: "Crystal What Do I Know",
    description: "Get a broad snapshot of what Memory Crystal contains about a topic.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string", minLength: 3 },
        limit: { type: "number", minimum: 1, maximum: 20 },
      },
      required: ["topic"],
      additionalProperties: false,
    },
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const topic = ensureString(params?.topic, "topic", 3);
        const limit = Number.isFinite(Number(params?.limit)) ? Number(params.limit) : 8;
        const data = await crystalRequest(getPluginConfig(api, ctx), "/api/mcp/recall", {
          query: topic,
          limit,
        });
        const memories = Array.isArray(data?.memories) ? data.memories : [];
        const summary = {
          topic,
          memoryCount: memories.length,
          summary: memories.slice(0, 3).map((m) => m.title).join("; ") || "No matching memories found.",
          topMemories: memories.slice(0, 10),
        };
        return toToolResult(summary, summary);
      } catch (err) {
        return toToolError(err);
      }
    },
  });

  api.registerTool({
    name: "crystal_why_did_we",
    label: "Crystal Why Did We",
    description: "Decision archaeology over Memory Crystal memories.",
    parameters: {
      type: "object",
      properties: {
        decision: { type: "string", minLength: 3 },
        limit: { type: "number", minimum: 1, maximum: 20 },
      },
      required: ["decision"],
      additionalProperties: false,
    },
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const decision = ensureString(params?.decision, "decision", 3);
        const limit = Number.isFinite(Number(params?.limit)) ? Number(params.limit) : 8;
        const data = await crystalRequest(getPluginConfig(api, ctx), "/api/mcp/recall", {
          query: decision,
          limit,
        });
        const memories = Array.isArray(data?.memories) ? data.memories : [];
        const decisionMemories = memories.filter((m) => m?.category === "decision");
        const related = decisionMemories.length > 0 ? decisionMemories : memories;
        const summary = {
          decision,
          reasoning:
            related.length > 0 ? `Primary threads around \"${decision}\"` : "No clear decision thread was surfaced.",
          relatedMemories: related.slice(0, 10),
        };
        return toToolResult(summary, summary);
      } catch (err) {
        return toToolError(err);
      }
    },
  });

  api.registerTool({
    name: "crystal_checkpoint",
    label: "Crystal Checkpoint",
    description: "Create a Memory Crystal checkpoint for this milestone.",
    parameters: {
      type: "object",
      properties: {
        label: { type: "string", minLength: 1 },
        description: { type: "string" },
      },
      required: ["label"],
      additionalProperties: false,
    },
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const label = ensureString(params?.label, "label", 1);
        const description = typeof params?.description === "string" ? params.description : undefined;
        const data = await crystalRequest(getPluginConfig(api, ctx), "/api/mcp/checkpoint", {
          label,
          description,
        });
        return toToolResult({ ok: Boolean(data?.ok), id: data?.id, label });
      } catch (err) {
        return toToolError(err);
      }
    },
  });

  api.logger?.info?.(
    "[crystal-memory] hooks registered: before_agent_start + message_received + llm_output + message_sent + command:new + command:reset; tools registered: memory_search, memory_get, crystal_recall, crystal_remember, crystal_what_do_i_know, crystal_why_did_we, crystal_checkpoint"
  );
};
