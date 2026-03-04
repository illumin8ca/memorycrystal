/**
 * Crystal Capture plugin — captures conversation turns via MCP API
 * Writes to crystalMemories (sensory store) with proper userId via API key auth
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
  // Get API key from config or env
  const getConfig = (ctx) => {
    const apiKey =
      ctx?.config?.apiKey ||
      process.env.CRYSTAL_API_KEY ||
      api.config?.apiKey;
    const convexUrl =
      ctx?.config?.convexUrl ||
      process.env.CRYSTAL_CONVEX_URL ||
      DEFAULT_CONVEX_URL;
    return { apiKey, convexUrl };
  };

  // Capture user message before each turn
  api.on("message_received", (event, ctx) => {
    const text = event?.text || event?.content || "";
    if (text && ctx?.sessionKey) {
      pendingUserMessages.set(ctx.sessionKey, String(text));
    }
  });

  // Fire capture after each LLM response
  api.on("llm_output", async (event, ctx) => {
    const assistantText = (event?.assistantTexts || []).join("\n").trim()
      || String(event?.outputText || "").trim();
    if (!assistantText) return;

    const { apiKey, convexUrl } = getConfig(ctx);
    if (!apiKey) return;

    const sessionKey = ctx?.sessionKey || "";
    const channel = ctx?.messageProvider || "openclaw";
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
  });

  api.logger?.info?.("[crystal] capture hooks registered (message_received + llm_output)");
};
