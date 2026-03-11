#!/usr/bin/env bash
set -euo pipefail

CONVEX_URL="https://rightful-mockingbird-389.convex.site"
PLUGIN_REPO_BASE="https://raw.githubusercontent.com/illumin8ca/memorycrystal/main/plugin"

DETECT_OPENCLAW_DIR() {
  if [ -n "${OPENCLAW_DIR:-}" ]; then
    echo "$OPENCLAW_DIR"
    return
  fi

  if [ -d "$HOME/.openclaw" ]; then
    echo "$HOME/.openclaw"
    return
  fi

  if [ -d "$HOME/.config/openclaw" ]; then
    echo "$HOME/.config/openclaw"
    return
  fi

  if [ -n "${XDG_CONFIG_HOME:-}" ] && [ -d "$XDG_CONFIG_HOME/openclaw" ]; then
    echo "$XDG_CONFIG_HOME/openclaw"
    return
  fi

  if [ -d "$HOME/Library/Application Support/openclaw" ]; then
    echo "$HOME/Library/Application Support/openclaw"
    return
  fi

  echo "$HOME/.openclaw"
}

OPENCLAW_DIR="$(DETECT_OPENCLAW_DIR)"
OPENCLAW_CONFIG="$OPENCLAW_DIR/openclaw.json"
HOOK_DIR="$OPENCLAW_DIR/hooks/crystal-stm"
EXT_DIR="$OPENCLAW_DIR/extensions/crystal-memory"

fetch_plugin_file() {
  local file="$1"
  local target="$2"
  local url="$PLUGIN_REPO_BASE/$file"

  if ! curl -fsSL "$url" -o "$target"; then
    echo "  ✗ Failed to download plugin file: $url"
    exit 1
  fi
}

echo ""
echo "  ◈ Memory Crystal Installer"
echo "  Persistent memory for your AI agents"
echo ""

# ── Check prerequisites ───────────────────────────────────────────────────────
if ! command -v openclaw >/dev/null 2>&1; then
  echo "  ✗ OpenClaw not found."
  echo "  Install it first: https://openclaw.ai"
  echo ""
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "  ✗ Node.js is required but was not found."
  exit 1
fi

echo "  ✓ OpenClaw detected ($(openclaw --version 2>/dev/null || echo 'version unknown'))"

# ── Get API key ───────────────────────────────────────────────────────────────
echo ""
echo "  Get your API key at: https://memorycrystal.ai/dashboard/settings"
echo "  This installer always asks for your API key on every run."
echo ""

if [ ! -r /dev/tty ]; then
  echo "  ✗ Interactive terminal required to enter your API key."
  exit 1
fi

IFS= read -r -p "  Enter your Memory Crystal API key: " API_KEY < /dev/tty
echo ""

if [ -z "$API_KEY" ]; then
  echo "  ✗ No API key provided. Exiting."
  exit 1
fi

# Validate key against the API
echo "  → Validating API key..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET \
  "$CONVEX_URL/api/mcp/auth" \
  -H "Authorization: Bearer $API_KEY" \
  2>/dev/null)

if [ "$STATUS" != "200" ]; then
  echo "  ✗ Invalid API key (HTTP $STATUS). Check https://memorycrystal.ai/dashboard/settings"
  exit 1
fi
echo "  ✓ API key valid"

mkdir -p "$OPENCLAW_DIR"

# ── Install the crystal-stm hook (capture) ───────────────────────────────────
echo "  → Installing crystal-stm hook to $HOOK_DIR..."
mkdir -p "$HOOK_DIR"

cat > "$HOOK_DIR/hook.json" << 'HOOKJSON'
{
  "openclaw": {
    "emoji": "◈",
    "description": "Capture conversations to Memory Crystal STM",
    "events": ["message_received", "message_sent", "llm_output"]
  }
}
HOOKJSON

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
    content, store: "sensory", category: "event",
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

node -e '
const fs = require("fs");
const p = process.argv[1];
const k = process.argv[2];
fs.writeFileSync(p, fs.readFileSync(p, "utf8").replaceAll("__MC_API_KEY__", k));
' "$HOOK_DIR/handler.js" "$API_KEY"

echo "  ✓ Hook files written"

# ── Install crystal-memory extension (tools) ─────────────────────────────────
echo "  → Installing crystal-memory extension to $EXT_DIR..."
mkdir -p "$EXT_DIR"

fetch_plugin_file "index.js" "$EXT_DIR/index.js"
fetch_plugin_file "openclaw.plugin.json" "$EXT_DIR/openclaw.plugin.json"
fetch_plugin_file "package.json" "$EXT_DIR/package.json"
fetch_plugin_file "recall-hook.js" "$EXT_DIR/recall-hook.js"
fetch_plugin_file "capture-hook.js" "$EXT_DIR/capture-hook.js"
fetch_plugin_file "handler.js" "$EXT_DIR/handler.js"
fetch_plugin_file "openclaw-hook.json" "$EXT_DIR/openclaw-hook.json"

echo "  ✓ Extension files written"

# ── Configure OpenClaw ────────────────────────────────────────────────────────
echo "  → Updating OpenClaw config at $OPENCLAW_CONFIG..."
node - "$OPENCLAW_CONFIG" "$API_KEY" "$CONVEX_URL" "$EXT_DIR" <<'NODE'
const fs = require('node:fs');
const path = process.argv[2];
const apiKey = process.argv[3];
const convexUrl = process.argv[4];
const extDir = process.argv[5];

let cfg = {};
try {
  cfg = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch {
  cfg = {};
}

cfg.hooks ??= {};
cfg.hooks.internal ??= {};
cfg.hooks.internal.enabled = true;

cfg.plugins ??= {};

cfg.plugins.allow = Array.isArray(cfg.plugins.allow) ? cfg.plugins.allow : [];
if (!cfg.plugins.allow.includes('crystal-memory')) cfg.plugins.allow.push('crystal-memory');

cfg.plugins.load ??= {};
cfg.plugins.load.paths = Array.isArray(cfg.plugins.load.paths) ? cfg.plugins.load.paths : [];
if (!cfg.plugins.load.paths.includes(extDir)) cfg.plugins.load.paths.push(extDir);

cfg.plugins.entries ??= {};
const existingEntry = (cfg.plugins.entries['crystal-memory'] && typeof cfg.plugins.entries['crystal-memory'] === 'object')
  ? cfg.plugins.entries['crystal-memory']
  : {};
const existingConfig = (existingEntry.config && typeof existingEntry.config === 'object')
  ? existingEntry.config
  : {};

cfg.plugins.entries['crystal-memory'] = {
  ...existingEntry,
  enabled: true,
  config: {
    ...existingConfig,
    apiKey,
    convexUrl,
  },
};

cfg.plugins.installs ??= {};
cfg.plugins.installs['crystal-memory'] = {
  source: 'path',
  sourcePath: extDir,
  installPath: extDir,
  version: '0.1.0',
  installedAt: new Date().toISOString(),
};

fs.mkdirSync(require('node:path').dirname(path), { recursive: true });
fs.writeFileSync(path, JSON.stringify(cfg, null, 2));
NODE

echo "  ✓ OpenClaw config updated"

echo ""
echo "  → Installed. Restart your gateway to activate:"
echo "    openclaw gateway restart"
echo ""
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │  ◈  Memory Crystal is active!                       │"
echo "  │                                                     │"
echo "  │  Installed paths:                                   │"
echo "  │    • $HOOK_DIR                            │"
echo "  │    • $EXT_DIR                    │"
echo "  │                                                     │"
echo "  │  View your memory:  https://memorycrystal.ai        │"
echo "  │  Hook logs:         /tmp/crystal-hook-log.txt       │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""