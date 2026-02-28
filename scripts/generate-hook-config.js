#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const args = process.argv.slice(2);
const isHelp = args.includes("--help") || args.includes("-h");
const isDryRun = args.includes("--dry-run");

const unknownArgs = args.filter((arg) => !["--help", "-h", "--dry-run"].includes(arg));

const usage = () => {
  console.log(`Usage:
  node scripts/generate-hook-config.js [--dry-run] [--help]

Reads from:
  mcp-server/.env

Writes:
  plugin/openclaw-hook.json
  ~/.openclaw/extensions/internal-hooks/openclaw-hook.json

Options:
  --dry-run  Show generated JSON without writing files.
  --help     Show this usage message.`);
};

if (isHelp) {
  usage();
  process.exit(0);
}

if (unknownArgs.length > 0) {
  console.error(`Unknown argument(s): ${unknownArgs.join(", ")}`);
  usage();
  process.exit(1);
}

const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exit(1);
};

const stripQuotes = (value) => {
  if (typeof value !== "string") {
    return "";
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
};

const readEnv = (envPath) => {
  const values = {};
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const value = stripQuotes(trimmed.slice(idx + 1).trim());
    if (key) {
      values[key] = value;
    }
  }
  return values;
};

const writeJson = (targetPath, payload, dryRun) => {
  const text = `${JSON.stringify(payload, null, 2)}\n`;
  if (dryRun) {
    console.log(`\n[DRY RUN] ${targetPath}`);
    console.log(text);
    return;
  }
  fs.writeFileSync(targetPath, text, "utf8");
};

const SCRIPT_DIR = path.resolve(__dirname);
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const PLUGIN_DIR = path.resolve(REPO_ROOT, "plugin");
const MCP_DIST_DIR = path.resolve(REPO_ROOT, "mcp-server", "dist");
const MCP_DIST = path.join(MCP_DIST_DIR, "index.js");
const MCP_ENV_FILE = path.resolve(REPO_ROOT, "mcp-server", ".env");
const INTERNAL_HOOK_PATH = path.join(os.homedir(), ".openclaw", "extensions", "internal-hooks", "openclaw-hook.json");
const PLUGIN_HOOK_PATH = path.join(PLUGIN_DIR, "openclaw-hook.json");

if (!fs.existsSync(PLUGIN_DIR)) {
  fail(`Plugin directory is missing: ${PLUGIN_DIR}`);
}
if (!fs.existsSync(MCP_DIST)) {
  fail(`MCP dist entrypoint not found: ${MCP_DIST}`);
}
if (!fs.existsSync(MCP_ENV_FILE)) {
  fail(`mcp-server/.env not found: ${MCP_ENV_FILE}`);
}

const NODE_PATH = process.execPath;
if (!fs.existsSync(NODE_PATH)) {
  fail(`Node executable not found at ${NODE_PATH}`);
}

const env = readEnv(MCP_ENV_FILE);
const requiredEnv = ["CONVEX_URL", "OPENAI_API_KEY", "OBSIDIAN_VAULT_PATH"];
const missingEnv = requiredEnv.filter((key) => !env[key]);
if (missingEnv.length > 0) {
  fail(`Missing required env keys in mcp-server/.env: ${missingEnv.join(", ")}`);
}

const captureHookPath = path.join(PLUGIN_DIR, "capture-hook.js");
const recallHookPath = path.join(PLUGIN_DIR, "recall-hook.js");

const commandEnv = {
  CONVEX_URL: stripQuotes(env.CONVEX_URL),
  OPENAI_API_KEY: stripQuotes(env.OPENAI_API_KEY),
  OBSIDIAN_VAULT_PATH: stripQuotes(env.OBSIDIAN_VAULT_PATH),
  VEXCLAW_MCP_HOST: stripQuotes(env.VEXCLAW_MCP_HOST || "127.0.0.1"),
  VEXCLAW_MCP_PORT: stripQuotes(env.VEXCLAW_MCP_PORT || "8788"),
  VEXCLAW_ENV_FILE: MCP_ENV_FILE,
  // Portability vars — injected so hooks/manifest can resolve paths without hardcoding
  VEXCLAW_NODE: NODE_PATH,
  VEXCLAW_PLUGIN_DIR: PLUGIN_DIR,
  VEXCLAW_ROOT: REPO_ROOT,
};

const pluginManifestTools = [
  "vexclaw_remember",
  "vexclaw_recall",
  "vexclaw_what_do_i_know",
  "vexclaw_why_did_we",
  "vexclaw_forget",
  "vexclaw_stats",
  "vexclaw_checkpoint",
  "vexclaw_wake",
];

const pluginConfig = {
  schemaVersion: 1,
  id: "vexclaw",
  name: "VexClaw",
  version: "0.1.0",
  description: "Drop-in OpenClaw memory plugin using Convex + MCP tools.",
  entry: "./handler.js",
  hooks: {
    postTurn: {
      enabled: false,
      description: "Reserved for future memory auto-write flows.",
    },
    startup: {
      enabled: true,
      description: "Load plugin metadata on OpenClaw startup.",
    },
  },
  capabilities: {
    tools: pluginManifestTools,
    mcpCommand: NODE_PATH,
    mcpArgs: [MCP_DIST],
  },
  commands: {
    "vexclaw-capture": {
      command: NODE_PATH,
      args: [captureHookPath],
      env: {
        ...commandEnv,
        VEXCLAW_MCP_MODE: "stdio",
      },
    },
    "vexclaw-recall": {
      command: NODE_PATH,
      args: [recallHookPath],
      env: {
        ...commandEnv,
        VEXCLAW_MCP_MODE: "stdio",
      },
    },
  },
  env: {
    VEXCLAW_MCP_MODE: stripQuotes(env.VEXCLAW_MCP_MODE || "sse"),
    VEXCLAW_MCP_HOST: commandEnv.VEXCLAW_MCP_HOST,
    VEXCLAW_MCP_PORT: commandEnv.VEXCLAW_MCP_PORT,
    VEXCLAW_ENV_FILE: MCP_ENV_FILE,
  },
};

const internalHookConfig = {
  commands: {
    "vexclaw-memory": {
      command: NODE_PATH,
      args: [MCP_DIST],
      env: {
        ...commandEnv,
        VEXCLAW_MCP_MODE: "stdio",
      },
    },
    "vexclaw-capture": {
      command: NODE_PATH,
      args: [captureHookPath],
      env: {
        ...commandEnv,
        VEXCLAW_MCP_MODE: "stdio",
      },
    },
    "vexclaw-recall": {
      command: NODE_PATH,
      args: [recallHookPath],
      env: {
        ...commandEnv,
        VEXCLAW_MCP_MODE: "stdio",
      },
    },
  },
};

console.log("Detected configuration:");
console.log(`  node: ${NODE_PATH}`);
console.log(`  plugin: ${PLUGIN_DIR}`);
console.log(`  mcp dist: ${MCP_DIST}`);
console.log(`  env file: ${MCP_ENV_FILE}`);

fs.mkdirSync(path.dirname(INTERNAL_HOOK_PATH), { recursive: true });
writeJson(PLUGIN_HOOK_PATH, pluginConfig, isDryRun);
writeJson(INTERNAL_HOOK_PATH, internalHookConfig, isDryRun);

if (isDryRun) {
  console.log("\n[DRY RUN] No files were written.");
  process.exit(0);
}

console.log(`Wrote plugin manifest: ${PLUGIN_HOOK_PATH}`);
console.log(`Wrote OpenClaw internal hook map: ${INTERNAL_HOOK_PATH}`);
