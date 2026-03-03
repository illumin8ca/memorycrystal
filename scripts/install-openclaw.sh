#!/usr/bin/env bash
set -e
# Check openclaw exists
which openclaw || { echo "OpenClaw not installed. Get it at https://openclaw.ai"; exit 1; }
# Download plugin (placeholder URL, override with CRYSTAL_PLUGIN_URL)
PLUGIN_URL="${CRYSTAL_PLUGIN_URL:-https://github.com/illumin8ca/memorycrystal/releases/latest/download/crystal-memory-plugin.tar.gz}"
TMP=$(mktemp -d)
curl -fsSL "$PLUGIN_URL" -o "$TMP/plugin.tar.gz"
tar -xzf "$TMP/plugin.tar.gz" -C "$TMP"
openclaw plugin install "$TMP/crystal-memory"
read -rp "Enter your Memory Crystal API key: " API_KEY
openclaw config set plugins.crystal-memory.apiKey "$API_KEY"
echo "✓ Memory Crystal installed. Your AI will now remember everything."
