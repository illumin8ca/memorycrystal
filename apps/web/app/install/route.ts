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

# Fetch plugin from GitHub
echo "  → Fetching Memory Crystal plugin..."
curl -fsSL https://github.com/illumin8ca/memorycrystal/archive/refs/heads/main.tar.gz -o "$TMP/repo.tar.gz"
tar -xzf "$TMP/repo.tar.gz" -C "$TMP"
PLUGIN_DIR="$TMP/memorycrystal-main/plugin"

# Ask for API key up front
echo ""
read -rp "  Enter your Memory Crystal API key: " API_KEY
echo ""

if [ -z "$API_KEY" ]; then
  echo "  ✗ No API key provided."
  echo "  Get one at: https://memorycrystal.ai/dashboard/settings"
  exit 1
fi

# Patch the API key into plugin config before install
node -e "
const fs = require('fs');
const p = '$PLUGIN_DIR/openclaw.plugin.json';
const m = JSON.parse(fs.readFileSync(p, 'utf8'));
m.configSchema = m.configSchema || {};
m.configSchema.required = [];
fs.writeFileSync(p, JSON.stringify(m, null, 2));
" 2>/dev/null || true

# Create package.json if missing
if [ ! -f "$PLUGIN_DIR/package.json" ]; then
  echo '{"name":"crystal-memory","version":"0.1.0","main":"index.js","openclaw":{"extensions":["./index.js"]}}' > "$PLUGIN_DIR/package.json"
fi

echo "  → Installing plugin..."
openclaw plugins install --link "$PLUGIN_DIR"

# Set the API key in config
echo "  → Configuring API key..."
node -e "
const fs = require('fs');
const p = require('os').homedir() + '/.openclaw/openclaw.json';
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
c.plugins = c.plugins || {};
c.plugins.entries = c.plugins.entries || {};
c.plugins.entries['crystal-memory'] = c.plugins.entries['crystal-memory'] || { enabled: true };
c.plugins.entries['crystal-memory'].config = {
  apiKey: '$API_KEY',
  convexUrl: 'https://rightful-mockingbird-389.convex.site'
};
fs.writeFileSync(p, JSON.stringify(c, null, 2));
console.log('  ✓ API key configured');
"

echo ""
echo "  ✓ Memory Crystal installed successfully!"
echo ""
echo "  Your AI will now remember everything across every session."
echo "  Restart your OpenClaw gateway to activate:"
echo ""
echo "    openclaw gateway restart"
echo ""
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
