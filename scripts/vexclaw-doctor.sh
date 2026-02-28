#!/usr/bin/env bash
set -u

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
OPENCLAW_CONFIG="$OPENCLAW_DIR/openclaw.json"
HOOK_MAP_PATH="$OPENCLAW_DIR/extensions/internal-hooks/openclaw-hook.json"
REQ_KEYS=(CONVEX_URL OPENAI_API_KEY OBSIDIAN_VAULT_PATH VEXCLAW_MCP_MODE VEXCLAW_MCP_HOST VEXCLAW_MCP_PORT)

DRY_RUN=false
SMOKE=false
LIVE=false
for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    --smoke)
      SMOKE=true
      ;;
    --live)
      LIVE=true
      ;;
    *)
      echo "WARN: unknown flag '$arg'"
      ;;
  esac
done

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "🩺 VexClaw doctor running in dry-run mode."
fi

fail() {
  local message="$1"
  echo "ERROR: $message"
  exit 1
}

warn() {
  local message="$1"
  echo "WARN: $message"
}

check_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "Missing required command: $command_name"
  fi
}

check_file() {
  local path="$1"
  if [ ! -f "$path" ]; then
    fail "Missing required file: $path"
  fi
}

check_executable() {
  local path="$1"
  if [ ! -x "$path" ]; then
    fail "Missing required executable permission: $path"
  fi
}

echo "Checking required tooling..."
check_command node
check_command npm
check_command npx

echo "Checking plugin metadata files..."
check_file "$REPO_ROOT/package.json"
check_file "$REPO_ROOT/mcp-server/package.json"
check_file "$REPO_ROOT/plugin/openclaw-hook.json"
check_file "$REPO_ROOT/plugin/HOOK.md"
check_file "$REPO_ROOT/plugin/handler.js"
check_file "$REPO_ROOT/docs/INSTALL.md"
check_file "$REPO_ROOT/docs/OPERATIONS.md"

check_executable "$REPO_ROOT/scripts/vexclaw-init.sh"
check_executable "$REPO_ROOT/scripts/vexclaw-doctor.sh"
check_executable "$REPO_ROOT/scripts/vexclaw-enable.sh"
check_executable "$REPO_ROOT/scripts/vexclaw-disable.sh"

if [ -f "$REPO_ROOT/.env" ]; then
  echo "Checking runtime env..."
  # shellcheck disable=SC1091
  set -a
  # shellcheck disable=SC1090
  source "$REPO_ROOT/.env"
  set +a

  if [ -z "${CONVEX_URL:-}" ] || [ "$CONVEX_URL" = "https://your-deployment.convex.cloud" ]; then
    warn "CONVEX_URL is missing or still set to the template value."
  fi
  if [ -z "${OPENAI_API_KEY:-}" ] || [ "$OPENAI_API_KEY" = "sk-..." ]; then
    warn "OPENAI_API_KEY is missing or still set to a placeholder."
  fi
  if [ -z "${VEXCLAW_MCP_MODE:-}" ] || [ -z "${VEXCLAW_MCP_HOST:-}" ] || [ -z "${VEXCLAW_MCP_PORT:-}" ]; then
    warn "VEXCLAW_MCP_* is not configured in .env."
  fi
else
  warn ".env file missing. Run scripts/vexclaw-init.sh to generate from .env.example."
fi

if [ ! -f "$REPO_ROOT/.env.example" ]; then
  fail "Missing .env.example template."
fi

if [ ! -d "$REPO_ROOT/node_modules" ]; then
  warn "Root node_modules missing. Run npm install or scripts/vexclaw-init.sh."
fi

if [ ! -d "$REPO_ROOT/mcp-server/node_modules" ]; then
  warn "mcp-server/node_modules missing. Run (cd mcp-server && npm install)."
fi

if [ ! -f "$REPO_ROOT/mcp-server/dist/index.js" ]; then
  warn "mcp-server build artifact missing. Run (cd mcp-server && npm run build)."
else
  echo "Found mcp-server dist artifact at $REPO_ROOT/mcp-server/dist/index.js"
fi

NODE_PATH="$(command -v node || true)"
if [ -z "${NODE_PATH:-}" ] || [ ! -x "$NODE_PATH" ]; then
  fail "Could not resolve executable node path."
else
  echo "Node executable path: $NODE_PATH"
fi

echo "Checking OpenClaw integration points..."
if [ -f "$OPENCLAW_CONFIG" ] && [ -f "$HOOK_MAP_PATH" ]; then
  if ! python3 - "$OPENCLAW_CONFIG" "$HOOK_MAP_PATH" "${REQ_KEYS[*]}" <<'PY'
import json
import re
import sys


def load_tolerant_json(path):
    raw = open(path, "r", encoding="utf-8").read()
    raw = re.sub(r",(\s*[}\]])", r"\1", raw)
    return json.loads(raw or "{}")


config_path = sys.argv[1]
hook_map_path = sys.argv[2]
required = sys.argv[3].split()

openclaw = load_tolerant_json(config_path)
hooks = openclaw.get("hooks", {})
internal = hooks.get("internal", {}) if isinstance(hooks, dict) else {}
entries = internal.get("entries", {}) if isinstance(internal, dict) else {}
entry = entries.get("vexclaw-memory") if isinstance(entries, dict) else None
if not isinstance(entry, dict):
    print("ERROR: hooks.internal.entries.vexclaw-memory is missing.")
    raise SystemExit(1)
if not entry.get("enabled"):
    print("ERROR: hooks.internal.entries.vexclaw-memory is not enabled.")
    raise SystemExit(1)

entry_env = entry.get("env", {})
if not isinstance(entry_env, dict):
    print("ERROR: hooks.internal.entries.vexclaw-memory.env is missing.")
    raise SystemExit(1)

missing = [key for key in required if not entry_env.get(key)]
if missing:
    print("ERROR: hooks.internal.entries.vexclaw-memory.env missing: " + ", ".join(missing))
    raise SystemExit(1)

hook_map = load_tolerant_json(hook_map_path)
commands = hook_map.get("commands", {})
if not isinstance(commands, dict):
    print("ERROR: openclaw-hook.json commands block missing.")
    raise SystemExit(1)

command_entry = commands.get("vexclaw-memory")
if not isinstance(command_entry, dict):
    print("ERROR: command map entry for vexclaw-memory is missing.")
    raise SystemExit(1)

if not command_entry.get("command"):
    print("ERROR: command map entry for vexclaw-memory missing command field.")
    raise SystemExit(1)

if not command_entry.get("args"):
    print("ERROR: command map entry for vexclaw-memory missing args.")
    raise SystemExit(1)

entry_env = command_entry.get("env", {})
if isinstance(entry_env, dict):
    print("MODE=" + entry_env.get("VEXCLAW_MCP_MODE", "sse"))
    print("HOST=" + entry_env.get("VEXCLAW_MCP_HOST", "127.0.0.1"))
    print("PORT=" + entry_env.get("VEXCLAW_MCP_PORT", "8788"))
else:
    print("MODE=sse")
    print("HOST=127.0.0.1")
    print("PORT=8788")
PY
  then
    warn "OpenClaw integration is not fully configured. Run scripts/vexclaw-enable.sh to wire hooks."
  fi
else
  warn "OpenClaw runtime wiring files not present yet. Run vexclaw-enable.sh when ready."
fi

read -r MCP_MODE MCP_HOST MCP_PORT < <(
  python3 - "$OPENCLAW_CONFIG" "$HOOK_MAP_PATH" <<'PY'
import json
import re
import sys

if not __import__('os').path.exists(sys.argv[1]) or not __import__('os').path.exists(sys.argv[2]):
  print("sse 127.0.0.1 8788")
  raise SystemExit(0)

with open(sys.argv[2], "r", encoding="utf-8") as f:
    raw = f.read()

raw = re.sub(r",(\s*[}\]])", r"\1", raw)
payload = json.loads(raw or "{}")
env = {}
if isinstance(payload.get("commands"), dict):
    command = payload["commands"].get("vexclaw-memory", {})
    if isinstance(command, dict):
        env = command.get("env", {})
if not isinstance(env, dict):
    env = {}
print(
    env.get("VEXCLAW_MCP_MODE", "sse"),
    env.get("VEXCLAW_MCP_HOST", "127.0.0.1"),
    env.get("VEXCLAW_MCP_PORT", "8788"),
)
PY
)

if [ "${SMOKE:-false}" == "true" ]; then
  echo "Smoke mode active."
fi

if [ "${LIVE:-false}" == "true" ] && [ "${MCP_MODE}" == "sse" ]; then
  echo "Running live health probe at ${MCP_HOST}:${MCP_PORT}/health"
  if ! python3 - "$MCP_HOST" "$MCP_PORT" <<'PY'
import sys
import urllib.request

host = sys.argv[1]
port = sys.argv[2]
url = f"http://{host}:{port}/health"
try:
    with urllib.request.urlopen(url, timeout=3) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}")
except Exception as exc:  # noqa: BLE001
    print(f"ERROR: health check failed: {exc}")
    raise SystemExit(1)
PY
  then
    fail "health endpoint unavailable."
  fi
fi

if [ -n "${OPENCLAW_PLUGIN_DIR:-}" ]; then
  echo "OPENCLAW_PLUGIN_DIR is set to $OPENCLAW_PLUGIN_DIR"
fi

if [ -n "${OPENCLAW_DIR:-}" ] && [ -d "$OPENCLAW_DIR" ]; then
  echo "OPENCLAW_DIR found: $OPENCLAW_DIR"
fi

echo "✅ VexClaw doctor finished."
