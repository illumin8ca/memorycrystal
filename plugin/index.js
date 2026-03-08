const DEFAULT_CONVEX_URL = "https://rightful-mockingbird-389.convex.site";

const pendingUserMessages = new Map();
const wakeInjectedSessions = new Set();

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
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
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

async function injectWakeBriefing(api, event, ctx) {
  const sessionKey = ctx?.sessionKey || event?.conversationId;
  if (!sessionKey || wakeInjectedSessions.has(sessionKey)) return;

  const wake = await request(ctx?.config, "POST", "/api/mcp/wake", {
    channel: ctx?.messageProvider || "openclaw",
  });

  const briefing = wake?.briefing || wake?.summary || wake?.text;
  if (briefing && typeof ctx?.injectSystemPrompt === "function") {
    await ctx.injectSystemPrompt(String(briefing));
  }

  wakeInjectedSessions.add(sessionKey);
}

module.exports = (api) => {
  // Buffer inbound message + inject wake briefing on first turn
  api.registerHook(
    "message_received",
    async (event, ctx) => {
      const text = event?.content || event?.text || "";
      const sessionKey = ctx?.sessionKey || event?.conversationId || "";
      if (text && sessionKey) {
        pendingUserMessages.set(sessionKey, String(text));
      }
      await injectWakeBriefing(api, event, ctx);
    },
    { name: "crystal-memory.message-received", description: "Buffer messages + inject wake briefing" }
  );

  // Capture full turn after LLM responds
  api.registerHook(
    "llm_output",
    async (event, ctx) => {
      const assistantText = (event?.assistantTexts || []).join("\n").trim()
        || String(event?.lastAssistant || "").trim();
      if (!assistantText) return;

      const sessionKey = ctx?.sessionKey || event?.sessionId || "";
      const userMessage = sessionKey ? (pendingUserMessages.get(sessionKey) || "") : "";
      if (sessionKey) pendingUserMessages.delete(sessionKey);

      if (!shouldCapture(userMessage, assistantText)) return;

      const content = [
        userMessage ? `User: ${userMessage}` : null,
        `Assistant: ${assistantText}`,
      ].filter(Boolean).join("\n\n");

      await request(ctx?.config, "POST", "/api/mcp/capture", {
        title: `OpenClaw — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
        content,
        store: "sensory",
        category: "conversation",
        tags: ["openclaw", "auto-capture"],
        channel: ctx?.messageProvider || "openclaw",
      });
    },
    { name: "crystal-memory.llm-output", description: "Capture AI response to Memory Crystal" }
  );

  // Trigger memory reflection on session boundary
  api.registerHook(
    'command:new',
    async (event, ctx) => {
      await triggerReflection(ctx?.config, ctx?.sessionKey);
    },
    { name: 'crystal-memory.command-new', description: 'Trigger memory reflection on /new' }
  );

  api.registerHook(
    'command:reset',
    async (event, ctx) => {
      await triggerReflection(ctx?.config, ctx?.sessionKey);
    },
    { name: 'crystal-memory.command-reset', description: 'Trigger memory reflection on /reset' }
  );

  api.logger?.info?.("[crystal-memory] hooks registered: message_received + llm_output + command:new + command:reset");
};
