#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR%/scripts}"
OPENCLAW_DIR="${OPENCLAW_DIR:-$HOME/.openclaw}"
OPENCLAW_CONFIG="$OPENCLAW_DIR/openclaw.json"
HOOK_MAP_PATH="$OPENCLAW_DIR/extensions/internal-hooks/openclaw-hook.json"
MCP_DIST="$REPO_ROOT/mcp-server/dist/index.js"
PASS_COUNT=0
FAIL_COUNT=0

run_step() {
  local label="$1"
  shift
  echo "==== ${label} ===="
  if "$@"; then
    PASS_COUNT=$((PASS_COUNT + 1))
    echo "PASS: ${label}"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "FAIL: ${label}"
  fi
  echo
}

verify_files_contain_expected_keys() {
  python3 - "$OPENCLAW_CONFIG" "$HOOK_MAP_PATH" "$MCP_DIST" <<'PY'
import json
import os
import re
import sys

config_path, map_path, mcp_dist = sys.argv[1:4]
required = [
  "CONVEX_URL",
  "OPENAI_API_KEY",
  "OBSIDIAN_VAULT_PATH",
  "VEXCLAW_MCP_MODE",
  "VEXCLAW_MCP_HOST",
  "VEXCLAW_MCP_PORT",
]

if not os.path.exists(config_path):
    raise SystemExit(1)
if not os.path.exists(map_path):
    raise SystemExit(1)


def load(path):
    with open(path, "r", encoding="utf-8") as f:
        raw = f.read()
    raw = re.sub(r",(\s*[}\]])", r"\1", raw)
    return json.loads(raw or "{}")


config = load(config_path)
entry = config.get("hooks", {}).get("internal", {}).get("entries", {}).get("vexclaw-memory")
if not isinstance(entry, dict) or not entry.get("enabled"):
    raise SystemExit(1)
entry_env = entry.get("env", {})
if not isinstance(entry_env, dict):
    raise SystemExit(1)
if any(not entry_env.get(key) for key in required):
    raise SystemExit(1)

hooks = load(map_path)
cmd = hooks.get("commands", {}).get("vexclaw-memory")
if not isinstance(cmd, dict):
    raise SystemExit(1)
command = cmd.get("command")
if not command:
    raise SystemExit(1)
args = cmd.get("args", [])
if not isinstance(args, list) or not args:
    raise SystemExit(1)
if mcp_dist not in [command, *args]:
    raise SystemExit(1)
PY
}

run_step "init" bash "$REPO_ROOT/scripts/vexclaw-init.sh"
run_step "doctor (pre-enable)" bash "$REPO_ROOT/scripts/vexclaw-doctor.sh" --dry-run
run_step "enable --dry-run" bash "$REPO_ROOT/scripts/vexclaw-enable.sh" --dry-run
run_step "enable (live)" bash "$REPO_ROOT/scripts/vexclaw-enable.sh"
run_step "verify config keys" verify_files_contain_expected_keys
run_step "disable --dry-run" bash "$REPO_ROOT/scripts/vexclaw-disable.sh" --dry-run

if [ $FAIL_COUNT -eq 0 ]; then
  echo "PASS: $PASS_COUNT / $((PASS_COUNT + FAIL_COUNT))"
  exit 0
else
  echo "FAIL: $FAIL_COUNT"
  echo "PASS: $PASS_COUNT"
  exit 1
fi
