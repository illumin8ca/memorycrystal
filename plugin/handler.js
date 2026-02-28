const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const PLUGIN_ROOT = path.resolve(__dirname);
const HANDLER_MANIFEST = path.join(PLUGIN_ROOT, "openclaw-hook.json");
const CAPTURE_HOOK = path.join(PLUGIN_ROOT, "capture-hook.js");
const RECALL_HOOK = path.join(PLUGIN_ROOT, "recall-hook.js");

const readJson = (filePath) => {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
};

const manifest = readJson(HANDLER_MANIFEST);

const status = () => ({
  name: manifest.name,
  version: manifest.version,
  state: "ready",
  timestamp: new Date().toISOString(),
});

const parseCaptureResult = (rawOutput) => {
  if (!rawOutput) {
    return { attempted: 0, saved: 0 };
  }
  try {
    return JSON.parse(rawOutput);
  } catch {
    return { attempted: 0, saved: 0 };
  }
};

const parseRecallResult = (rawOutput) => {
  if (!rawOutput) {
    return { injectionBlock: "", memories: [] };
  }
  try {
    const parsed = JSON.parse(rawOutput);
    if (!parsed || typeof parsed !== "object") {
      return { injectionBlock: String(rawOutput), memories: [] };
    }
    if (typeof parsed.injectionBlock === "string") {
      return {
        injectionBlock: parsed.injectionBlock,
        memories: Array.isArray(parsed.memories) ? parsed.memories : [],
      };
    }
  } catch {
    return { injectionBlock: String(rawOutput).trim(), memories: [] };
  }
  return { injectionBlock: "", memories: [] };
};

const captureHooks = new Set([
  "message",
  "turn",
  "postTurn",
  "post_turn",
  "message_received",
  "llm_output",
  "llm-output",
  "llmOutput",
]);

const recallHooks = new Set(["pre-response", "before_model_resolve", "beforeModelResolve"]);

const runCaptureHook = (payload = {}) => {
  const input = JSON.stringify({
    userMessage: payload.userMessage ?? "",
    agentResponse: payload.agentResponse ?? payload.response ?? "",
    channel: payload.channel ?? "",
    sessionId: payload.sessionId ?? "",
  });
  const result = childProcess.spawnSync(process.execPath, [CAPTURE_HOOK], {
    encoding: "utf8",
    input,
  });
  if (result.error || result.status !== 0) {
    const stderr = result.stderr?.toString() || result.error?.message || "";
    console.error(stderr);
    return {
      ok: false,
      message: "Memory Crystal hook failed",
      error: true,
      stderr,
    };
  }
  const capture = parseCaptureResult((result.stdout || "").trim());
  return {
    ok: true,
    message: "Memory Crystal capture hook executed.",
    payload: {
      hook: "crystal-capture",
      inputSummary: capture,
      rawPayload: payload,
    },
  };
};

const runRecallHook = (payload = {}) => {
  const query =
    typeof payload.query === "string"
      ? payload.query
      : typeof payload.userMessage === "string"
        ? payload.userMessage
        : typeof payload.message === "string"
          ? payload.message
          : "";
  const result = childProcess.spawnSync(process.execPath, [RECALL_HOOK], {
    encoding: "utf8",
    input: JSON.stringify({
      query,
      channel: payload.channel ?? "",
      sessionId: payload.sessionId ?? "",
    }),
  });
  if (result.error || result.status !== 0) {
    const stderr = result.stderr?.toString() || result.error?.message || "";
    console.error(stderr);
    return {
      ok: false,
      message: "Memory Crystal hook failed",
      error: true,
      stderr,
    };
  }
  const recall = parseRecallResult((result.stdout || "").trim());
  const injection = recall.injectionBlock;
  return {
    ok: true,
    message: "Memory Crystal recall hook executed.",
    payload: {
      hook: "crystal-recall",
      memories: recall.memories,
      injection,
    },
    injection,
  };
};

const runHook = async (hookName, payload = {}) => {
  if (captureHooks.has(hookName)) {
    return runCaptureHook(payload);
  }

  if (recallHooks.has(hookName)) {
    return runRecallHook(payload);
  }

  if (hookName === "startup") {
    return {
      ok: true,
      message: "Memory Crystal startup hook executed.",
      payload,
    };
  }

  console.error(`[crystal-handler] Unsupported hook name: ${hookName}`);
  return {
    ok: false,
    message: `Memory Crystal hook '${hookName}' is not recognized. Expected: startup, message, turn, postTurn, pre-response, message_received, llm_output, before_model_resolve.`,
    payload: {
      ...payload,
      supportedHooks: [
        "startup",
        "message",
        "turn",
        "postTurn",
        "pre-response",
        "message_received",
        "llm_output",
        "before_model_resolve",
      ],
    },
    stderr: `Unsupported hook name: ${hookName}`,
    error: true,
  };
};

module.exports = {
  manifest,
  status,
  startup: async (payload) => runHook("startup", payload),
  postTurn: async (payload) => runHook("postTurn", payload),
  message: async (payload) => runHook("message", payload),
  turn: async (payload) => runHook("turn", payload),
  "pre-response": async (payload) => runHook("pre-response", payload),
  before_model_resolve: async (payload) => runHook("before_model_resolve", payload),
  message_received: async (payload) => runHook("message_received", payload),
  llm_output: async (payload) => runHook("llm_output", payload),
  "llm-output": async (payload) => runHook("llm_output", payload),
  llmOutput: async (payload) => runHook("llmOutput", payload),
  beforeModelResolve: async (payload) => runHook("beforeModelResolve", payload),
};

if (require.main === module) {
  console.log(JSON.stringify(status(), null, 2));
}
