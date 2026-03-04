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
    channel: event?.channelId || ctx?.messageProvider || "openclaw",
  });

  const briefing = wake?.briefing || wake?.summary || wake?.text;
  if (briefing && typeof ctx?.injectSystemPrompt === "function") {
    await ctx.injectSystemPrompt(String(briefing));
  }

  wakeInjectedSessions.add(sessionKey);
}

module.exports = (api) => {
  // Buffer inbound user message + inject wake briefing on first turn
  api.registerHook(
    "message:received",
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

  // Capture AI response as memory
  api.registerHook(
    "message:sent",
    async (event, ctx) => {
      const assistantText = (event?.content || event?.text || "").trim();
      if (!assistantText) return;

      const sessionKey = ctx?.sessionKey || event?.conversationId || "";
      const userMessage = sessionKey ? (pendingUserMessages.get(sessionKey) || "") : "";
      if (sessionKey) pendingUserMessages.delete(sessionKey);

      const content = [
        userMessage ? `User: ${userMessage}` : null,
        `Assistant: ${assistantText}`,
      ].filter(Boolean).join("\n\n");

      await request(ctx?.config, "POST", "/api/mcp/capture", {
        title: `OpenClaw turn ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
        content,
        store: "sensory",
        category: "conversation",
        tags: ["openclaw", "auto-capture"],
        channel: event?.channelId || ctx?.messageProvider || "openclaw",
      });
    },
    { name: "crystal-memory.message-sent", description: "Capture AI response to Memory Crystal" }
  );

  api.logger?.info?.("[crystal-memory] hooks registered: message:received + message:sent");
};
