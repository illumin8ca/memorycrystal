#!/usr/bin/env bash
set -e

echo ""
echo "  ◈ Memory Crystal Installer"
echo "  Persistent memory for your AI agents"
echo ""

# ── Check OpenClaw ────────────────────────────────────────────────────────────
if ! command -v openclaw &> /dev/null; then
  echo "  ✗ OpenClaw not found."
  echo "  Install it first: https://openclaw.ai"
  echo ""
  exit 1
fi
echo "  ✓ OpenClaw detected ($(openclaw --version 2>/dev/null || echo 'version unknown'))"

# ── Get API key ───────────────────────────────────────────────────────────────
echo ""
echo "  Get your API key at: https://memorycrystal.ai/dashboard/settings"
echo ""
read -rp "  Enter your Memory Crystal API key: " API_KEY
echo ""

if [ -z "$API_KEY" ]; then
  echo "  ✗ No API key provided. Exiting."
  exit 1
fi

# Validate key against the API
echo "  → Validating API key..."
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST \
  https://rightful-mockingbird-389.convex.site/api/mcp/stats \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null || echo "000")

if [ "$STATUS" != "200" ]; then
  echo "  ✗ Invalid API key (HTTP $STATUS). Check https://memorycrystal.ai/dashboard/settings"
  exit 1
fi
echo "  ✓ API key valid"

# ── Install the crystal-stm hook ──────────────────────────────────────────────
HOOK_DIR="$HOME/.openclaw/hooks/crystal-stm"
echo "  → Installing crystal-stm hook to $HOOK_DIR..."
mkdir -p "$HOOK_DIR"

# hook.json
cat > "$HOOK_DIR/hook.json" << 'HOOKJSON'
{
  "openclaw": {
    "emoji": "◈",
    "description": "Capture conversations to Memory Crystal STM",
    "events": ["message_received", "message_sent", "llm_output"]
  }
}
HOOKJSON

# HOOK.md
cat > "$HOOK_DIR/HOOK.md" << 'HOOKMD'
---
name: crystal-stm
description: "Capture conversation turns to Memory Crystal in real-time"
metadata:
  {
    "openclaw":
      {
        "emoji": "◈",
        "events": ["message:received", "message:sent"],
      },
  }
---

# Crystal STM Hook

Captures every inbound message and outbound AI response to Memory Crystal
short-term memory (Messages tab) and long-term sensory memory in real-time.

- User messages → crystalMessages (role: user)
- AI responses  → crystalMessages (role: assistant) + sensory memory capture
HOOKMD

# handler.js — single-quoted heredoc prevents shell interpolation
cat > "$HOOK_DIR/handler.js" << 'HANDLEREOF'
const { appendFileSync, readFileSync, writeFileSync } = require("node:fs");

const log = (m) => appendFileSync("/tmp/crystal-hook-log.txt", `[${new Date().toISOString()}] ${m}\n`);
const API_KEY = "__MC_API_KEY__";
const BASE_URL = "https://rightful-mockingbird-389.convex.site";
const PENDING_FILE = "/tmp/crystal-pending.json";

function loadPending() {
  try { return JSON.parse(readFileSync(PENDING_FILE, "utf8")); } catch { return {}; }
}
function savePending(p) {
  try { writeFileSync(PENDING_FILE, JSON.stringify(p)); } catch (e) { log("savePending error: " + e.message); }
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
  }).catch(e => ({ ok: false, status: "error:" + e.message }));
}

async function captureAssistant(text, sessionKey, channel) {
  const userMessage = getPending(sessionKey);
  deletePending(sessionKey);
  const r1 = await post("/api/mcp/log", { role: "assistant", content: text, channel, sessionKey });
  log("log assistant: " + r1.status);
  const content = [userMessage ? "User: " + userMessage : null, "Assistant: " + text].filter(Boolean).join("\n\n");
  const r2 = await post("/api/mcp/capture", {
    title: "Conversation — " + new Date().toISOString().slice(0, 16).replace("T", " "),
    content, store: "sensory", category: "conversation",
    tags: ["openclaw", "auto-capture", channel], channel,
  });
  log("capture: " + r2.status);
}

module.exports = async function handler(event, ctx) {
  const action = event?.action;
  const type = event?.type;
  const sessionKey = event?.sessionKey || ctx?.sessionKey || "";
  const channel = event?.context?.channelId || event?.channelId || "openclaw";

  if (action === "received" || type === "message_received") {
    const text = (event?.context?.content || event?.content || "").trim();
    if (!text || !sessionKey) return;
    setPending(sessionKey, text);
    const r = await post("/api/mcp/log", { role: "user", content: text, channel, sessionKey });
    log("log user: " + r.status);
    return;
  }

  if (type === "llm_output" || action === "llm_output") {
    const texts = event?.assistantTexts || event?.texts || [];
    const text = (Array.isArray(texts) ? texts.join("\n") : event?.lastAssistant || event?.content || "").trim();
    if (!text || !sessionKey) return;
    await captureAssistant(text, sessionKey, channel);
    return;
  }

  if (action === "sent" || type === "message_sent") {
    const text = (event?.content || event?.context?.content || "").trim();
    if (!text || event?.success === false) return;
    if (!hasPending(sessionKey)) { log("sent: skipping (already captured)"); return; }
    await captureAssistant(text, sessionKey, channel);
  }
};
HANDLEREOF

# Inject the actual API key
node -e '
const fs = require("fs");
const p = process.argv[1];
const k = process.argv[2];
fs.writeFileSync(p, fs.readFileSync(p, "utf8").replaceAll("__MC_API_KEY__", k));
' "$HOOK_DIR/handler.js" "$API_KEY"

echo "  ✓ Hook files written"

# ── Enable internal hooks in openclaw.json ────────────────────────────────────
echo "  → Enabling internal hook system..."
node -e "
const fs = require('fs');
const p = require('os').homedir() + '/.openclaw/openclaw.json';
let c = {};
try { c = JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
c.hooks = c.hooks || {};
c.hooks.internal = c.hooks.internal || {};
c.hooks.internal.enabled = true;
fs.writeFileSync(p, JSON.stringify(c, null, 2));
console.log('  ✓ Internal hooks enabled');
"

echo ""
echo "  → Hook installed. Restart your gateway to activate:"
echo "    openclaw gateway restart"
echo ""
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │  ◈  Memory Crystal is active!                       │"
echo "  │                                                     │"
echo "  │  Every conversation is now captured to:             │"
echo "  │    • Messages tab  — short-term memory (14 days)    │"
echo "  │    • Memories tab  — sensory long-term memory       │"
echo "  │                                                     │"
echo "  │  View your memory:  https://memorycrystal.ai        │"
echo "  │  Hook logs:         /tmp/crystal-hook-log.txt       │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""
