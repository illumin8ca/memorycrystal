import { NextResponse } from "next/server";

export async function GET() {
  const script = `#!/usr/bin/env bash
set -e

echo ""
echo "  ◈ Memory Crystal Installer"
echo "  Persistent memory for your AI agents"
echo ""

# Check openclaw
if ! command -v openclaw &> /dev/null; then
  echo "  ✗ OpenClaw not found."
  echo "  Install it first: https://openclaw.ai"
  echo ""
  exit 1
fi

echo "  ✓ OpenClaw detected"

# Temp dir
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Download plugin
PLUGIN_URL="\${CRYSTAL_PLUGIN_URL:-https://github.com/illumin8ca/memorycrystal/releases/latest/download/crystal-memory-plugin.tar.gz}"

echo "  → Downloading Memory Crystal plugin..."
if ! curl -fsSL "$PLUGIN_URL" -o "$TMP/plugin.tar.gz" 2>/dev/null; then
  # Fallback: clone from GitHub
  echo "  → Fetching from GitHub..."
  curl -fsSL https://github.com/illumin8ca/memorycrystal/archive/refs/heads/main.tar.gz -o "$TMP/repo.tar.gz"
  tar -xzf "$TMP/repo.tar.gz" -C "$TMP"
  PLUGIN_DIR="$TMP/memorycrystal-main/plugin"
else
  tar -xzf "$TMP/plugin.tar.gz" -C "$TMP"
  PLUGIN_DIR="$TMP/crystal-memory"
fi

echo "  → Installing plugin..."
openclaw plugin install "$PLUGIN_DIR"

echo ""
read -rp "  Enter your Memory Crystal API key: " API_KEY
echo ""

if [ -z "$API_KEY" ]; then
  echo "  ✗ No API key provided. Run this again with your key."
  exit 1
fi

openclaw config set plugins.crystal-memory.apiKey "$API_KEY"

echo "  ✓ Memory Crystal installed successfully!"
echo ""
echo "  Your AI will now remember everything across every session."
echo "  Get your API key at: https://memorycrystal.ai/dashboard/settings"
echo ""
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
