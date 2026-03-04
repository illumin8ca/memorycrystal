const { appendFileSync } = require("node:fs");

const log = (m) => appendFileSync("/tmp/crystal-hook-log.txt", `[${new Date().toISOString()}] ${m}\n`);
const API_KEY = "5116fcb6e36c622e412cb09c1209e4322e129190c4725c6afe6a53e78905c06e";
const BASE_URL = "https://rightful-mockingbird-389.convex.site";
const pending = new Map();

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(e => ({ ok: false, status: `error:${e.message}` }));
  return res;
}

module.exports = async function handler(event, ctx) {
  const action = event?.action;
  const sessionKey = event?.sessionKey || ctx?.sessionKey || "";
  const channel = event?.context?.channelId || event?.channelId || "openclaw";

  // message:received — text is in event.context.content
  if (action === "received") {
    const text = (event?.context?.content || event?.content || "").trim();
    if (!text || !sessionKey) return;
    pending.set(sessionKey, text);

    // Log user message to STM
    const r = await post("/api/mcp/log", {
      role: "user",
      content: text,
      channel,
      sessionKey,
    });
    log(`log user: ${r.status}`);
  }

  // message:sent — text is directly in event.content
  if (action === "sent") {
    const text = (event?.content || "").trim();
    if (!text || event?.success === false) return;

    const userMessage = pending.get(sessionKey) || "";
    if (sessionKey) pending.delete(sessionKey);

    // Log assistant message to STM
    const r1 = await post("/api/mcp/log", {
      role: "assistant",
      content: text,
      channel,
      sessionKey,
    });
    log(`log assistant: ${r1.status}`);

    // Also capture full turn to sensory memory (LTM)
    const content = [
      userMessage ? `User: ${userMessage}` : null,
      `Assistant: ${text}`,
    ].filter(Boolean).join("\n\n");

    const r2 = await post("/api/mcp/capture", {
      title: `Conversation — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
      content,
      store: "sensory",
      category: "conversation",
      tags: ["openclaw", "auto-capture", channel],
      channel,
    });
    log(`capture: ${r2.status}`);
  }
};
