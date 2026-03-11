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

function getConfig(ctx) {
  return ctx?.config || {};
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

async function injectWakeBriefing(api, event, ctx) {
  const sessionKey = ctx?.sessionKey || event?.conversationId;
  if (!sessionKey || wakeInjectedSessions.has(sessionKey)) return;

  const wake = await request(getConfig(ctx), "POST", "/api/mcp/wake", {
    channel: ctx?.messageProvider || "openclaw",
  });

  const briefing = wake?.briefing || wake?.summary || wake?.text;
  if (briefing && typeof ctx?.injectSystemPrompt === "function") {
    await ctx.injectSystemPrompt(String(briefing));
  }

  wakeInjectedSessions.add(sessionKey);
}

async function logMessage(ctx, payload) {
  await request(getConfig(ctx), "POST", "/api/mcp/log", payload);
}

async function captureTurn(ctx, userMessage, assistantText) {
  if (!shouldCapture(userMessage, assistantText)) return;

  const content = [userMessage ? `User: ${userMessage}` : null, `Assistant: ${assistantText}`]
    .filter(Boolean)
    .join("\n\n");

  await request(getConfig(ctx), "POST", "/api/mcp/capture", {
    title: `OpenClaw — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
    content,
    store: "sensory",
    category: "conversation",
    tags: ["openclaw", "auto-capture"],
    channel: ctx?.messageProvider || "openclaw",
  });
}

module.exports = (api) => {
  // Buffer inbound message + inject wake briefing on first turn
  api.registerHook(
    "message_received",
    async (event, ctx) => {
      const text = event?.content || event?.text || "";
      const sessionKey = ctx?.sessionKey || event?.conversationId || "";
      const defaultMode = ctx?.config?.defaultRecallMode || "general";
      const defaultLimit = ctx?.config?.defaultRecallLimit || 8;

      if (text && sessionKey) {
        const normalized = String(text);
        pendingUserMessages.set(sessionKey, normalized);
        await logMessage(ctx, {
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

      await injectWakeBriefing(api, event, ctx);
    },
    { name: "crystal-memory.message-received", description: "Buffer messages + inject wake briefing" }
  );

  // Capture full turn after LLM responds
  api.registerHook(
    "llm_output",
    async (event, ctx) => {
      const assistantText =
        (event?.assistantTexts || []).join("\n").trim() || String(event?.lastAssistant || "").trim();
      if (!assistantText) return;

      const sessionKey = ctx?.sessionKey || event?.sessionId || "";
      const userMessage = sessionKey ? pendingUserMessages.get(sessionKey) || "" : "";
      const sessionDefaults = sessionKey ? sessionConfigs.get(sessionKey) : null;
      // sessionDefaults is currently reserved for future recall-hook wiring (e.g., mode/limit defaults).
      void sessionDefaults;

      await logMessage(ctx, {
        role: "assistant",
        content: assistantText,
        channel: ctx?.messageProvider || "openclaw",
        sessionKey: sessionKey || undefined,
      });

      if (sessionKey) pendingUserMessages.delete(sessionKey);
      await captureTurn(ctx, userMessage, assistantText);
    },
    { name: "crystal-memory.llm-output", description: "Capture AI response to Memory Crystal" }
  );

  // Fallback when llm_output is not emitted by a provider/runtime.
  // If there's no pending user message, llm_output likely already handled this turn.
  api.registerHook(
    "message_sent",
    async (event, ctx) => {
      const sessionKey = ctx?.sessionKey || event?.sessionId || "";
      if (!sessionKey || !pendingUserMessages.has(sessionKey)) return;

      const assistantText = String(event?.content || event?.text || "").trim();
      if (!assistantText) return;

      const userMessage = pendingUserMessages.get(sessionKey) || "";

      await logMessage(ctx, {
        role: "assistant",
        content: assistantText,
        channel: ctx?.messageProvider || "openclaw",
        sessionKey,
      });

      pendingUserMessages.delete(sessionKey);
      await captureTurn(ctx, userMessage, assistantText);
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
      await triggerReflection(getConfig(ctx), ctx?.sessionKey);
    },
    { name: "crystal-memory.command-new", description: "Trigger memory reflection on /new" }
  );

  api.registerHook(
    "command:reset",
    async (event, ctx) => {
      await triggerReflection(getConfig(ctx), ctx?.sessionKey);
    },
    { name: "crystal-memory.command-reset", description: "Trigger memory reflection on /reset" }
  );

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
        const data = await crystalRequest(getConfig(ctx), "/api/mcp/recall", {
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
        const data = await crystalRequest(getConfig(ctx), "/api/mcp/capture", {
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
        const data = await crystalRequest(getConfig(ctx), "/api/mcp/recall", {
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
        const data = await crystalRequest(getConfig(ctx), "/api/mcp/recall", {
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
        const data = await crystalRequest(getConfig(ctx), "/api/mcp/checkpoint", {
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
    "[crystal-memory] hooks registered: message_received + llm_output + message_sent + command:new + command:reset; tools registered: crystal_recall, crystal_remember, crystal_what_do_i_know, crystal_why_did_we, crystal_checkpoint"
  );
};
