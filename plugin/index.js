const DEFAULT_CONVEX_URL = "https://rightful-mockingbird-389.convex.site";

const pendingUserMessages = new Map();
const wakeInjectedSessions = new Set();

async function request(config, method, path, body) {
  const apiKey = config?.apiKey;
  if (!apiKey) return null;

  const convexUrl = config?.convexUrl || DEFAULT_CONVEX_URL;
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

  api.logger?.info?.("[crystal-memory] hooks registered: message_received + llm_output");
};
