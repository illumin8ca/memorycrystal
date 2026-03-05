const { appendFileSync, readFileSync, writeFileSync } = require("node:fs");

const log = (m) => appendFileSync("/tmp/crystal-hook-log.txt", `[${new Date().toISOString()}] ${m}\n`);
const API_KEY = "5116fcb6e36c622e412cb09c1209e4322e129190c4725c6afe6a53e78905c06e";
const BASE_URL = "https://rightful-mockingbird-389.convex.site";
const PENDING_FILE = "/tmp/crystal-pending.json";

// Persist pending user messages to disk so they survive across hook invocations
function loadPending() {
  try { return JSON.parse(readFileSync(PENDING_FILE, "utf8")); } catch { return {}; }
}
function savePending(p) {
  try { writeFileSync(PENDING_FILE, JSON.stringify(p)); } catch (e) { log(`savePending error: ${e.message}`); }
}
function getPending(key) { return loadPending()[key] || ""; }
function setPending(key, val) { const p = loadPending(); p[key] = val; savePending(p); }
function deletePending(key) { const p = loadPending(); delete p[key]; savePending(p); }
function hasPending(key) { return !!loadPending()[key]; }

async function post(path, body) {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(e => ({ ok: false, status: `error:${e.message}` }));
}

async function captureAssistant(text, sessionKey, channel) {
  const userMessage = getPending(sessionKey);
  deletePending(sessionKey);

  const r1 = await post("/api/mcp/log", { role: "assistant", content: text, channel, sessionKey });
  log(`log assistant: ${r1.status}`);

  const content = [
    userMessage ? `User: ${userMessage}` : null,
    `Assistant: ${text}`,
  ].filter(Boolean).join("\n\n");

  const r2 = await post("/api/mcp/capture", {
    title: `Conversation — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
    content, store: "sensory", category: "conversation",
    tags: ["openclaw", "auto-capture", channel], channel,
  });
  log(`capture: ${r2.status}`);
}

module.exports = async function handler(event, ctx) {
  const action = event?.action;
  const type = event?.type;
  const sessionKey = event?.sessionKey || ctx?.sessionKey || "";
  const channel = event?.context?.channelId || event?.channelId || "openclaw";

  // User message arrives
  if (action === "received" || type === "message_received") {
    const text = (event?.context?.content || event?.content || "").trim();
    if (!text || !sessionKey) return;
    setPending(sessionKey, text);
    const r = await post("/api/mcp/log", { role: "user", content: text, channel, sessionKey });
    log(`log user: ${r.status}`);
    return;
  }

  // llm_output — best signal, fires right after AI generates response
  if (type === "llm_output" || action === "llm_output") {
    const texts = event?.assistantTexts || event?.texts || [];
    const text = (Array.isArray(texts) ? texts.join("\n") : event?.lastAssistant || event?.content || "").trim();
    if (!text || !sessionKey) return;
    log(`llm_output fired`);
    await captureAssistant(text, sessionKey, channel);
    return;
  }

  // message:sent — fallback when llm_output doesn't fire
  // If pending still has entry → llm_output never fired → capture now
  // If pending is empty → llm_output already handled it → skip
  if (action === "sent" || type === "message_sent") {
    const text = (event?.content || event?.context?.content || "").trim();
    if (!text || event?.success === false) return;
    if (!hasPending(sessionKey)) {
      log(`sent: skipping (already captured)`);
      return;
    }
    log(`sent: capturing (llm_output did not fire)`);
    await captureAssistant(text, sessionKey, channel);
  }
};
