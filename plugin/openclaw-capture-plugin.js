const { appendFileSync, readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const log = (m) => appendFileSync("/tmp/crystal-hook-log.txt", `[${new Date().toISOString()}] ${m}\n`);

// Resolve API key: env var first, then fall back to reading .env file
function resolveApiKey() {
  if (process.env.CRYSTAL_API_KEY) {
    return process.env.CRYSTAL_API_KEY;
  }
  try {
    const envFile = path.resolve(__dirname, "..", "mcp-server", ".env");
    const raw = readFileSync(envFile, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key.trim() === "CRYSTAL_API_KEY") {
        return rest.join("=").trim().replace(/^"+|"+$/g, "");
      }
    }
  } catch {
    // .env file not found or unreadable
  }
  log("WARNING: CRYSTAL_API_KEY not set in env or mcp-server/.env — capture will be skipped");
  return null;
}

const API_KEY = resolveApiKey();
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

async function post(urlPath, body) {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    log("WARNING: No API key available, skipping post");
    return { ok: false, status: "no-api-key" };
  }
  return fetch(`${BASE_URL}${urlPath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
  if (!resolveApiKey()) {
    log("WARNING: No API key — skipping capture handler");
    return;
  }
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
