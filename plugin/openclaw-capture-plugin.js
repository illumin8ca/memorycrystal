/**
 * Crystal Capture plugin — captures conversation turns via MCP API
 * Uses correct OpenClaw hook events: message:received + message:sent
 */

const DEFAULT_CONVEX_URL = "https://rightful-mockingbird-389.convex.site";
const pendingUserMessages = new Map();

async function captureToMCP(apiKey, convexUrl, payload) {
  try {
    const res = await fetch(`${convexUrl}/api/mcp/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = (api) => {
  const getConfig = (ctx) => ({
    apiKey: ctx?.config?.apiKey || process.env.CRYSTAL_API_KEY || api.config?.apiKey,
    convexUrl: ctx?.config?.convexUrl || process.env.CRYSTAL_CONVEX_URL || DEFAULT_CONVEX_URL,
  });

  // Capture inbound user message
  api.registerHook(
    "message:received",
    async (event, ctx) => {
      const text = event?.content || event?.text || "";
      const sessionKey = ctx?.sessionKey || event?.conversationId || "";
      if (text && sessionKey) {
        pendingUserMessages.set(sessionKey, String(text));
      }
    },
    { name: "crystal-capture.message-received", description: "Buffer user messages for crystal capture" }
  );

  // Capture outbound AI response — full turn
  api.registerHook(
    "message:sent",
    async (event, ctx) => {
      const assistantText = (event?.content || event?.text || "").trim();
      if (!assistantText) return;

      const { apiKey, convexUrl } = getConfig(ctx);
      if (!apiKey) return;

      const sessionKey = ctx?.sessionKey || event?.conversationId || "";
      const channel = event?.channelId || ctx?.messageProvider || "openclaw";
      const userMessage = sessionKey ? (pendingUserMessages.get(sessionKey) || "") : "";
      if (sessionKey) pendingUserMessages.delete(sessionKey);

      const content = [
        userMessage ? `User: ${userMessage}` : null,
        `Assistant: ${assistantText}`,
      ].filter(Boolean).join("\n\n");

      await captureToMCP(apiKey, convexUrl, {
        title: `Conversation — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
        content,
        store: "sensory",
        category: "conversation",
        tags: ["openclaw", "auto-capture", channel],
        channel,
      });
    },
    { name: "crystal-capture.message-sent", description: "Capture AI responses to Memory Crystal" }
  );

  api.logger?.info?.("[crystal] capture hooks registered (message:received + message:sent)");
};
