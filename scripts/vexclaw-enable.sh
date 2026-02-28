#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR%/scripts}"
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
PLUGIN_PATH="${OPENCLAW_PLUGIN_DIR:-$OPENCLAW_DIR/extensions/vexclaw-memory}"
OPENCLAW_CONFIG="$OPENCLAW_DIR/openclaw.json"
HOOK_MAP_PATH="$OPENCLAW_DIR/extensions/internal-hooks/openclaw-hook.json"
REQUIRED_ENV_KEYS=(CONVEX_URL OPENAI_API_KEY OBSIDIAN_VAULT_PATH VEXCLAW_MCP_MODE VEXCLAW_MCP_HOST VEXCLAW_MCP_PORT)
REQUIRED_RUNTIME_ENV_KEYS=(CONVEX_URL OPENAI_API_KEY)
MCP_DIST="$REPO_ROOT/mcp-server/dist/index.js"
NODE_PATH="${NODE_PATH:-$(command -v node || true)}"

DRY_RUN=false
if [[ "${1-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo "⚙️  VexClaw enable (dry-run)."
  echo "Would copy plugin bundle:"
  echo "  $REPO_ROOT/plugin -> $PLUGIN_PATH"
  echo "Would merge hook entry into:"
  echo "  $OPENCLAW_CONFIG"
  echo "Would merge internal hook command into:"
  echo "  $HOOK_MAP_PATH"
  echo "Would restart gateway: openclaw gateway restart (if available)."
  exit 0
fi

if [ ! -d "$REPO_ROOT/plugin" ]; then
  echo "ERROR: plugin source missing at $REPO_ROOT/plugin"
  exit 1
fi

mkdir -p "$PLUGIN_PATH"
rm -rf "$PLUGIN_PATH"
mkdir -p "$PLUGIN_PATH"
cp -R "$REPO_ROOT/plugin/"* "$PLUGIN_PATH/"
echo "Copied plugin bundle to $PLUGIN_PATH"

if [ ! -f "$MCP_DIST" ]; then
  echo "ERROR: MCP server artifact missing at $MCP_DIST. Run: (cd mcp-server && npm run build)"
  exit 1
fi

if [ -z "$NODE_PATH" ]; then
  echo "ERROR: node was not found in PATH."
  exit 1
fi

mkdir -p "$OPENCLAW_DIR"
mkdir -p "$OPENCLAW_DIR/extensions/internal-hooks"

python3 - "$OPENCLAW_CONFIG" "$REPO_ROOT/.env" "${OPENCLAW_DIR}" "$MCP_DIST" "$NODE_PATH" "${REQUIRED_ENV_KEYS[*]}" "${REQUIRED_RUNTIME_ENV_KEYS[*]}" <<'PY'
import json
import os
import re
import sys


def load_tolerant_json(path):
    if not os.path.exists(path):
        return {}
    raw = open(path, "r", encoding="utf-8").read()
    raw = re.sub(r",(\s*[}\]])", r"\1", raw)
    return json.loads(raw or "{}")


def load_env(path):
    values = {}
    if not os.path.exists(path):
        return values
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key] = value
    return values


config_path, env_path, openclaw_dir, mcp_dist, node_path, keys_csv, runtime_keys_csv = sys.argv[1:8]
required_keys = keys_csv.split()
required_runtime_keys = runtime_keys_csv.split()
env_values = load_env(env_path)
missing_runtime_keys = [key for key in required_runtime_keys if not env_values.get(key)]
if missing_runtime_keys:
    print("ERROR: missing required keys in .env: " + ", ".join(missing_runtime_keys))
    raise SystemExit(1)

data = load_tolerant_json(config_path)
hooks = data.setdefault("hooks", {})
if not isinstance(hooks, dict):
    hooks = {}
    data["hooks"] = hooks
internal = hooks.setdefault("internal", {})
if not isinstance(internal, dict):
    internal = {}
    hooks["internal"] = internal
entries = internal.setdefault("entries", {})
if not isinstance(entries, dict):
    entries = {}
    internal["entries"] = entries

entry = entries.get("vexclaw-memory", {})
if not isinstance(entry, dict):
    entry = {}

entry_env = entry.get("env", {})
if not isinstance(entry_env, dict):
    entry_env = {}

for key in required_keys:
    value = env_values.get(key)
    if value:
        entry_env[key] = value

entry["enabled"] = True
entry["env"] = entry_env
entries["vexclaw-memory"] = entry

with open(config_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

hook_path = os.path.join(openclaw_dir, "extensions", "internal-hooks", "openclaw-hook.json")
hook_data = load_tolerant_json(hook_path)
commands = hook_data.setdefault("commands", {})
if not isinstance(commands, dict):
    commands = {}
    hook_data["commands"] = commands

commands["vexclaw-memory"] = {
    "command": node_path,
    "args": [mcp_dist],
    "env": {
        "VEXCLAW_MCP_MODE": "stdio",
    },
}
commands["vexclaw-memory"]["env"].update(entry_env)

repo_root = os.path.dirname(os.path.dirname(mcp_dist))
capture_script = os.path.join(repo_root, "plugin", "capture-hook.js")
recall_script = os.path.join(repo_root, "plugin", "recall-hook.js")

commands["vexclaw-capture"] = {
    "command": node_path,
    "args": [capture_script],
    "env": {
        "VEXCLAW_MCP_MODE": "stdio",
    },
}
commands["vexclaw-capture"]["env"].update(entry_env)

commands["vexclaw-recall"] = {
    "command": node_path,
    "args": [recall_script],
    "env": {
        "VEXCLAW_MCP_MODE": "stdio",
    },
}
commands["vexclaw-recall"]["env"].update(entry_env)

with open(hook_path, "w", encoding="utf-8") as f:
    json.dump(hook_data, f, indent=2)
PY

echo "Skipping auto-restart — caller is responsible for restarting the gateway."

echo "Enabled VexClaw wiring for $OPENCLAW_DIR"
