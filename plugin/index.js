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
  const sessionKey = ctx?.sessionKey;
  if (!sessionKey || wakeInjectedSessions.has(sessionKey)) return;

  const wake = await request(ctx?.config, "POST", "/api/mcp/wake", {
    channel: ctx?.messageProvider || event?.channel || "openclaw",
  });

  const briefing = wake?.briefing || wake?.summary || wake?.text;
  if (briefing && typeof ctx?.injectSystemPrompt === "function") {
    await ctx.injectSystemPrompt(String(briefing));
  }

  wakeInjectedSessions.add(sessionKey);
}

module.exports = (api) => {
  api.on("message_received", async (event, ctx) => {
    const text = event?.text || event?.content || "";
    const sessionKey = ctx?.sessionKey;

    if (text && sessionKey) {
      pendingUserMessages.set(sessionKey, String(text));
    }

    await injectWakeBriefing(api, event, ctx);
  });

  api.on("llm_output", async (event, ctx) => {
    const assistantText = (event?.assistantTexts || []).join("\n").trim() || String(event?.outputText || "").trim();
    if (!assistantText) return;

    const sessionKey = ctx?.sessionKey || "";
    const userMessage = sessionKey ? pendingUserMessages.get(sessionKey) || "" : "";
    if (sessionKey) pendingUserMessages.delete(sessionKey);

    const content = [
      userMessage ? `User: ${userMessage}` : null,
      `Assistant: ${assistantText}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    await request(ctx?.config, "POST", "/api/mcp/capture", {
      title: `OpenClaw turn ${new Date().toISOString()}`,
      content,
      store: "sensory",
      category: "conversation",
      tags: ["openclaw", "auto-capture"],
    });
  });

  api.logger?.info?.("[crystal-memory] hooks registered: message_received, llm_output");
};
