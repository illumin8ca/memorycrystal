# Config Guide — openclaw.json

VexClaw registers two components with OpenClaw. Both require entries in `~/.openclaw/openclaw.json`.

## Rule: Never Edit Config at Runtime

Config edits must be applied outside the OpenClaw runtime. Always use `jq` surgically, validate after, then restart the gateway manually.

---

## Component 1 — Recall Hook (already applied)

Registered under `hooks.internal.entries`. This fires before every model response via `before_model_resolve`.

No action needed — this was applied during initial setup.

---

## Component 2 — Capture Plugin

Registered under `plugins.entries`. This fires after every AI response via `llm_output`.

### Files required

```
~/.openclaw/extensions/vexclaw-capture/
  index.js      ← copy of plugin/plugin.js from this repo
```

### Setup commands (run outside OpenClaw runtime)

```bash
# 1. Create extension dir and copy plugin
mkdir -p ~/.openclaw/extensions/vexclaw-capture
cp /path/to/openclaw-vexclaw/plugin/plugin.js ~/.openclaw/extensions/vexclaw-capture/index.js

# 2. Add to plugins.allow
jq '.plugins.allow += ["vexclaw-capture"]' ~/.openclaw/openclaw.json > /tmp/oc.json \
  && mv /tmp/oc.json ~/.openclaw/openclaw.json

# 3. Add to plugins.entries
jq '.plugins.entries["vexclaw-capture"] = {"enabled": true}' ~/.openclaw/openclaw.json > /tmp/oc.json \
  && mv /tmp/oc.json ~/.openclaw/openclaw.json

# 4. Validate
jq empty ~/.openclaw/openclaw.json && echo "JSON valid"
openclaw doctor --non-interactive

# 5. Restart gateway
openclaw gateway restart
```

### Verification

After restart, check the gateway log for:
```
[vexclaw] capture hooks registered (message_received + llm_output)
```

---

## Environment Variables

VexClaw reads env vars from `mcp-server/.env`. These must also be present in OpenClaw's environment for the plugin to work.

Required vars in `openclaw.json` under `hooks.internal.entries.vexclaw-memory.env` (or system env):

| Variable | Purpose |
|---|---|
| `CONVEX_URL` | `https://rightful-mockingbird-389.convex.cloud` |
| `OPENAI_API_KEY` | For embeddings (text-embedding-3-small) and extraction (gpt-4o-mini) |
| `OBSIDIAN_VAULT_PATH` | Absolute path to your Obsidian vault |
| `VEXCLAW_ROOT` | Absolute path to the openclaw-vexclaw repo |
| `VEXCLAW_ENV_FILE` | Absolute path to mcp-server/.env |

---

## What Each Config Key Does

```jsonc
{
  "hooks": {
    "internal": {
      "entries": {
        "vexclaw-memory": {
          // Loads handler.js from ~/.openclaw/extensions/vexclaw-memory/
          // Registers before_model_resolve recall hook
          // Runs recall-hook.js as a subprocess before each AI response
          "enabled": true
        }
      }
    }
  },
  "plugins": {
    "allow": ["vexclaw-capture"],   // Trusts the plugin as local code
    "entries": {
      "vexclaw-capture": {
        // Loads index.js from ~/.openclaw/extensions/vexclaw-capture/
        // Registers message_received + llm_output hooks
        // Runs capture-hook.js as a subprocess after each AI response
        "enabled": true
      }
    }
  }
}
```

---

## Troubleshooting

**Config reload skipped (invalid config)** — you used an unrecognized key like `source` or `path` in `plugins.entries`. Only `enabled` and plugin-specific known keys are valid.

**Plugin not listed in gateway log** — the extension directory doesn't exist or `index.js` is missing.

**Capture not firing** — check `plugins.allow` includes `"vexclaw-capture"` and gateway was restarted after config change.
