const { appendFileSync } = require("node:fs");

const log = (m) => appendFileSync("/tmp/crystal-hook-log.txt", `[${new Date().toISOString()}] ${m}\n`);
const API_KEY = "5116fcb6e36c622e412cb09c1209e4322e129190c4725c6afe6a53e78905c06e";
const BASE_URL = "https://rightful-mockingbird-389.convex.site";
const pending = new Map();

module.exports = async function handler(event, ctx) {
  // Log EVERYTHING - full payload every time
  log(`EVENT: action=${event?.action} type=${event?.type} keys=${Object.keys(event||{}).join(",")} ctxKeys=${Object.keys(ctx||{}).join(",")}`);
  log(`FULL: ${JSON.stringify(event).slice(0, 600)}`);

  const action = event?.action;
  const sessionKey = event?.sessionKey || ctx?.sessionKey || "";

  if (action === "received") {
    const text = (event?.context?.content || event?.content || "").trim();
    if (text && sessionKey) {
      pending.set(sessionKey, text);
      log(`BUFFERED user text: "${text.slice(0, 80)}"`);
    }
  }

  if (action === "sent") {
    const text = (event?.content || event?.context?.content || "").trim();
    if (!text || event?.success === false) return;
    const userMessage = pending.get(sessionKey) || "";
    if (sessionKey) pending.delete(sessionKey);
    const content = [userMessage ? `User: ${userMessage}` : null, `Assistant: ${text}`].filter(Boolean).join("\n\n");
    const res = await fetch(`${BASE_URL}/api/mcp/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Conversation — ${new Date().toISOString().slice(0,16).replace("T"," ")}`, content, store: "sensory", category: "conversation", tags: ["openclaw","auto-capture"] }),
    }).catch(e => ({ status: `error:${e.message}` }));
    log(`CAPTURED: ${res.status}`);
  }
};
