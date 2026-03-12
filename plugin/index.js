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
  try {
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
  } catch {
    return null;
  }
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

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

function joinStringArray(values) {
  if (!Array.isArray(values)) return "";
  return values
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .join("\n")
    .trim();
}

function extractAssistantText(event) {
  const direct = firstString(
    joinStringArray(event?.assistantTexts),
    joinStringArray(event?.texts),
    joinStringArray(event?.outputs),
    event?.lastAssistant,
    event?.outputText,
    event?.content,
    event?.text,
    event?.message?.content,
    event?.message?.text,
    event?.response?.content,
    event?.response?.text,
    event?.result?.content,
    event?.result?.text
  );

  if (direct) {
    return direct;
  }

  const candidates = [
    event?.response?.messages,
    event?.result?.messages,
    event?.messages,
    event?.response?.parts,
    event?.result?.parts,
    event?.parts,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const text = candidate
      .map((item) =>
        firstString(
          item?.content,
          item?.text,
          item?.message?.content,
          item?.message?.text
        )
      )
      .filter(Boolean)
      .join("\n")
      .trim();
    if (text) {
      return text;
    }
  }

  return "";
}

function extractUserText(event) {
  return firstString(
    event?.context?.content,
    event?.content,
    event?.text,
    event?.message?.content,
    event?.message?.text,
    event?.input,
    event?.prompt
  );
}

function getSessionKey(ctx, event) {
  return (
    ctx?.sessionKey ||
    ctx?.sessionId ||
    event?.sessionKey ||
    event?.conversationId ||
    event?.sessionId ||
    ""
  );
}

function getChannelKey(ctx, event) {
  const provider = firstString(
    event?.messageProvider,
    ctx?.messageProvider,
    event?.provider,
    ctx?.provider,
    "openclaw"
  );
  const workspaceId = firstString(event?.context?.workspaceId, event?.workspaceId, ctx?.workspaceId);
  const guildId = firstString(event?.context?.guildId, event?.guildId, ctx?.guildId);
  const channelId = firstString(
    event?.context?.channelId,
    event?.channelId,
    ctx?.channelId
  );
  const threadId = firstString(event?.context?.threadId, event?.threadId, ctx?.threadId);
  const parts = [provider, workspaceId, guildId, channelId, threadId].filter(Boolean);
  return parts.length > 1 ? parts.join(":") : provider;
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

function formatMessageMatch(message) {
  const role = typeof message?.role === "string" ? message.role : "unknown";
  const content = trimSnippet(message?.content || "", 220);
  const timestamp =
    typeof message?.timestamp === "number"
      ? new Date(message.timestamp).toLocaleString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          month: "short",
          day: "numeric",
        })
      : "unknown time";
  return `- [${role}] ${content} (${timestamp})`;
}

async function buildBeforeAgentContext(api, event, ctx) {
  const config = getPluginConfig(api, ctx);
  if (!config?.apiKey) return "";
  const channel = getChannelKey(ctx, event);

  const sections = [
    [
      "## Active Memory Backend",
      "IMPORTANT: Memory Crystal is the active OpenClaw memory backend for this session.",
      "Override any generic OpenClaw wording about MEMORY.md, memory/*.md, or file-backed workspace memory for this run.",
      "- `memory_search` and `memory_get` are backed by Memory Crystal's remote memory store in this session.",
      "- `crystal_recall`, `crystal_remember`, `crystal_checkpoint`, `crystal_what_do_i_know`, and `crystal_why_did_we` are extended Memory Crystal tools.",
      "- If the user asks whether Memory Crystal is the active memory backend, answer yes.",
      "- Do not describe local/workspace file memory as the active backend unless crystal-memory is disabled.",
      "- If the user asks where recalled information came from, attribute it to one of: current conversation, Memory Crystal recent messages, Memory Crystal saved memories, or an explicit Memory Crystal tool lookup.",
      "- Never claim you read local transcript files, `.jsonl.reset` files, hidden session logs, or reset artifacts unless the user directly provided them in the current conversation.",
      "- For requests about exact prior wording or verbatim recent messages, prefer `crystal_search_messages` instead of guessing.",
    ].join("\n"),
  ];

  const sessionKey = getSessionKey(ctx, event);
  if (sessionKey && !wakeInjectedSessions.has(sessionKey)) {
    const wake = await request(config, "POST", "/api/mcp/wake", {
      channel,
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
      channel,
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

    const messageSearch = await request(config, "POST", "/api/mcp/search-messages", {
      query: prompt,
      limit: 5,
      channel,
    });
    const messages = Array.isArray(messageSearch?.messages) ? messageSearch.messages.slice(0, 5) : [];
    if (messages.length > 0) {
      sections.push(
        [
          "## Memory Crystal Recent Message Matches",
          `Prompt: ${trimSnippet(prompt, 180)}`,
          ...messages.map(formatMessageMatch),
        ].join("\n")
      );
    }
  }

  return sections.filter(Boolean).join("\n\n").trim();
}

async function logMessage(api, ctx, payload) {
  const result = await request(getPluginConfig(api, ctx), "POST", "/api/mcp/log", payload);
  if (result === null) {
    api.logger?.warn?.(
      `[crystal-memory] log request failed for role=${payload?.role || "unknown"} channel=${payload?.channel || "unknown"}`
    );
  }
}

async function captureTurn(api, event, ctx, userMessage, assistantText) {
  if (!shouldCapture(userMessage, assistantText)) return;

  const content = [userMessage ? `User: ${userMessage}` : null, `Assistant: ${assistantText}`]
    .filter(Boolean)
    .join("\n\n");

  const result = await request(getPluginConfig(api, ctx), "POST", "/api/mcp/capture", {
    title: `OpenClaw — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
    content,
    store: "sensory",
    category: "conversation",
    tags: ["openclaw", "auto-capture"],
    channel: getChannelKey(ctx, event),
  });

  if (result === null) {
    api.logger?.warn?.("[crystal-memory] capture request failed for completed turn");
  }
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
      try {
        const text = extractUserText(event);
        const sessionKey = getSessionKey(ctx, event);
        const pluginConfig = getPluginConfig(api, ctx);
        const defaultMode = pluginConfig?.defaultRecallMode || "general";
        const defaultLimit = pluginConfig?.defaultRecallLimit || 8;

        if (text) {
          const normalized = String(text);
          if (sessionKey) {
            pendingUserMessages.set(sessionKey, normalized);
          }
          await logMessage(api, ctx, {
            role: "user",
            content: normalized,
            channel: getChannelKey(ctx, event),
            sessionKey: sessionKey || undefined,
          });
        } else if (!text) {
          api.logger?.warn?.(
            `[crystal-memory] message_received missing user text; keys=${Object.keys(event || {}).join(",") || "none"}`
          );
        }

        // Store resolved recall defaults per-session for future recall-API wiring.
        // Recall occurs in recall-hook.js, but these defaults are captured here for consistency.
        if (sessionKey) {
          sessionConfigs.set(sessionKey, {
            mode: defaultMode,
            limit: defaultLimit,
          });
        }
      } catch (err) {
        api.logger?.warn?.(`[crystal-memory] message_received failed: ${err?.message || String(err)}`);
      }
    },
    { name: "crystal-memory.message-received", description: "Buffer messages + persist user-side turn context" }
  );

  // Capture full turn after LLM responds
  api.registerHook(
    "llm_output",
    async (event, ctx) => {
      try {
        const assistantText = extractAssistantText(event);
        if (!assistantText) {
          api.logger?.warn?.(
            `[crystal-memory] llm_output missing assistant text; keys=${Object.keys(event || {}).join(",") || "none"}`
          );
          return;
        }

        const sessionKey = getSessionKey(ctx, event);
        const userMessage = sessionKey ? pendingUserMessages.get(sessionKey) || "" : "";
        const sessionDefaults = sessionKey ? sessionConfigs.get(sessionKey) : null;
        // sessionDefaults is currently reserved for future recall-hook wiring (e.g., mode/limit defaults).
        void sessionDefaults;

        await logMessage(api, ctx, {
          role: "assistant",
          content: assistantText,
          channel: getChannelKey(ctx, event),
          sessionKey: sessionKey || undefined,
        });

        if (sessionKey) pendingUserMessages.delete(sessionKey);
        await captureTurn(api, event, ctx, userMessage, assistantText);
      } catch (err) {
        api.logger?.warn?.(`[crystal-memory] llm_output failed: ${err?.message || String(err)}`);
      }
    },
    { name: "crystal-memory.llm-output", description: "Capture AI response to Memory Crystal" }
  );

  // Fallback when llm_output is not emitted by a provider/runtime.
  // If there's no pending user message, llm_output likely already handled this turn.
  api.registerHook(
    "message_sent",
    async (event, ctx) => {
      try {
        const sessionKey = getSessionKey(ctx, event);
        if (!sessionKey || !pendingUserMessages.has(sessionKey)) return;

        const assistantText = extractAssistantText(event);
        if (!assistantText) {
          api.logger?.warn?.(
            `[crystal-memory] message_sent missing assistant text; keys=${Object.keys(event || {}).join(",") || "none"}`
          );
          return;
        }

        const userMessage = pendingUserMessages.get(sessionKey) || "";

        await logMessage(api, ctx, {
          role: "assistant",
          content: assistantText,
          channel: getChannelKey(ctx, event),
          sessionKey,
        });

        pendingUserMessages.delete(sessionKey);
        await captureTurn(api, event, ctx, userMessage, assistantText);
      } catch (err) {
        api.logger?.warn?.(`[crystal-memory] message_sent fallback failed: ${err?.message || String(err)}`);
      }
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
      try {
        await triggerReflection(getPluginConfig(api, ctx), ctx?.sessionKey);
      } catch (err) {
        api.logger?.warn?.(`[crystal-memory] command:new reflection failed: ${err?.message || String(err)}`);
      }
    },
    { name: "crystal-memory.command-new", description: "Trigger memory reflection on /new" }
  );

  api.registerHook(
    "command:reset",
    async (event, ctx) => {
      try {
        await triggerReflection(getPluginConfig(api, ctx), ctx?.sessionKey);
      } catch (err) {
        api.logger?.warn?.(`[crystal-memory] command:reset reflection failed: ${err?.message || String(err)}`);
      }
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
          channel: getChannelKey(ctx),
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
    name: "crystal_search_messages",
    label: "Crystal Search Messages",
    description: "Search short-term conversation logs in Memory Crystal.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2 },
        limit: { type: "number", minimum: 1, maximum: 20 },
        sinceMs: { type: "number", minimum: 0 },
        channel: { type: "string" },
      },
      required: ["query"],
      additionalProperties: false,
    },
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const query = ensureString(params?.query, "query", 2);
        const limit = Number.isFinite(Number(params?.limit)) ? Number(params.limit) : 5;
        const sinceMs = Number.isFinite(Number(params?.sinceMs)) ? Number(params.sinceMs) : undefined;
        const resolvedChannel = typeof params?.channel === "string" ? params.channel : getChannelKey(ctx);
        const requestedLimit = Math.max(1, Math.min(limit, 20));

        let data = await crystalRequest(getPluginConfig(api, ctx), "/api/mcp/search-messages", {
          query,
          limit: requestedLimit,
          sinceMs,
          channel: resolvedChannel,
        });

        let messages = Array.isArray(data?.messages) ? data.messages : [];
        let searchScope = resolvedChannel ? "channel" : "global";

        if (messages.length === 0 && typeof params?.channel !== "string" && resolvedChannel) {
          data = await crystalRequest(getPluginConfig(api, ctx), "/api/mcp/search-messages", {
            query,
            limit: requestedLimit,
            sinceMs,
          });
          messages = Array.isArray(data?.messages) ? data.messages : [];
          if (messages.length > 0) {
            searchScope = "global-fallback";
          }
        }

        const summary = {
          query,
          messageCount: messages.length,
          searchScope,
          channel: resolvedChannel || null,
          topMessages: messages.slice(0, 10),
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
          channel: getChannelKey(ctx),
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
          channel: typeof params?.channel === "string" ? params.channel : getChannelKey(ctx),
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
          channel: getChannelKey(ctx),
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
          channel: getChannelKey(ctx),
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
    "[crystal-memory] hooks registered: before_agent_start + message_received + llm_output + message_sent + command:new + command:reset; tools registered: memory_search, crystal_search_messages, memory_get, crystal_recall, crystal_remember, crystal_what_do_i_know, crystal_why_did_we, crystal_checkpoint"
  );
};
