#!/usr/bin/env node
import assert from 'node:assert/strict';

const API_KEY = process.env.MEMORY_CRYSTAL_API_KEY || '17ccc2f1a19bb08fcdd1958148ba69f51af511a5b348a4ba1ad8b02d6de01949';
const BACKEND_URL = process.env.MEMORY_CRYSTAL_BACKEND_URL || 'https://rightful-mockingbird-389.convex.site';
const MCP_URL = process.env.MEMORY_CRYSTAL_MCP_URL || 'https://api.memorycrystal.ai/mcp';
const WAIT_MS = Number(process.env.MEMORY_CRYSTAL_ASYNC_WAIT_MS || 25000);

const authHeaders = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

const testResults = [];
const observations = [];

function log(msg = '') {
  process.stdout.write(`${msg}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(method, path, body) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: authHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  return { response, payload };
}

function parseSseJson(text) {
  const lines = String(text).split(/\r?\n/);
  const dataLines = lines.filter((line) => line.startsWith('data: ')).map((line) => line.slice(6));
  assert.ok(dataLines.length > 0, `Expected SSE data lines, got: ${text}`);
  return JSON.parse(dataLines.join('\n'));
}

async function mcp(method, params) {
  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  const text = await response.text();
  return { response, text, payload: parseSseJson(text) };
}

async function run(name, fn) {
  const started = Date.now();
  try {
    await fn();
    const ms = Date.now() - started;
    testResults.push({ name, status: 'PASS', ms });
    log(`PASS ${name} (${ms}ms)`);
  } catch (error) {
    const ms = Date.now() - started;
    testResults.push({ name, status: 'FAIL', ms, error: error?.stack || String(error) });
    log(`FAIL ${name} (${ms}ms)`);
    log(String(error?.stack || error));
    process.exitCode = 1;
  }
}

const stamp = Date.now();
const uniqueTitle = `Gemini integration test ${stamp}`;
const uniqueContent = [
  `Gerald deployed the MCP server on Railway for Andy during live Gemini integration testing ${stamp}.`,
  'Ray Fernando asked about importing memories and self-hosting.',
  'This memory exists to verify async Gemini embeddings and graph enrichment.',
].join(' ');
const semanticQuery = 'Railway deployment self-hosting import memories question';
let capturedMemoryId = null;
let recallPayload = null;
let memoryPayload = null;
let statsPayload = null;
let graphStatusPayload = null;

await run('1. capture memory through /api/mcp/capture', async () => {
  const { response, payload } = await api('POST', '/api/mcp/capture', {
    title: uniqueTitle,
    content: uniqueContent,
    store: 'semantic',
    category: 'fact',
    tags: ['integration-test', 'gemini', String(stamp)],
  });

  assert.equal(response.status, 200, `capture status ${response.status}: ${JSON.stringify(payload)}`);
  assert.equal(payload?.ok, true, `capture payload: ${JSON.stringify(payload)}`);
  assert.equal(typeof payload?.id, 'string');
  capturedMemoryId = payload.id;
});

await run(`2. wait ${WAIT_MS}ms for async embedding + graph jobs`, async () => {
  assert.ok(capturedMemoryId, 'memoryId missing before wait');
  await sleep(WAIT_MS);
});

await run('3. recall semantically related memory through /api/mcp/recall', async () => {
  const { response, payload } = await api('POST', '/api/mcp/recall', {
    query: semanticQuery,
    limit: 10,
  });

  assert.equal(response.status, 200, `recall status ${response.status}: ${JSON.stringify(payload)}`);
  assert.ok(Array.isArray(payload?.memories), `recall payload: ${JSON.stringify(payload)}`);
  const match = payload.memories.find((memory) => memory._id === capturedMemoryId || memory.title === uniqueTitle);
  assert.ok(match, `Expected captured memory in recall results. Payload: ${JSON.stringify(payload)}`);
  assert.equal(typeof match.score, 'number');
  assert.ok(match.score > 0, `Expected positive semantic score, got ${match.score}`);
  recallPayload = payload;
});

await run('4. inspect raw memory through /api/mcp/memory', async () => {
  const { response, payload } = await api('POST', '/api/mcp/memory', { memoryId: capturedMemoryId });
  assert.equal(response.status, 200, `memory status ${response.status}: ${JSON.stringify(payload)}`);
  assert.equal(payload?.memory?.id, capturedMemoryId);
  assert.equal(payload?.memory?.title, uniqueTitle);
  memoryPayload = payload;

  const memory = payload.memory || {};
  assert.equal(memory.graphEnriched, true, `Expected graphEnriched=true, got ${JSON.stringify(memory)}`);
  assert.equal(typeof memory.graphEnrichedAt, 'number', `Expected graphEnrichedAt number, got ${JSON.stringify(memory)}`);
  assert.ok(memory.graphEnrichedAt > 0, `Expected graphEnrichedAt > 0, got ${memory.graphEnrichedAt}`);

  observations.push({
    endpoint: '/api/mcp/memory',
    hasEmbeddingField: Object.prototype.hasOwnProperty.call(memory, 'embedding'),
    hasGraphEnrichedField: Object.prototype.hasOwnProperty.call(memory, 'graphEnriched'),
    hasGraphEnrichedAtField: Object.prototype.hasOwnProperty.call(memory, 'graphEnrichedAt'),
    graphEnriched: memory.graphEnriched,
    graphEnrichedAt: memory.graphEnrichedAt,
  });
});

await run('5. embedding verification via externally visible API behavior', async () => {
  const match = recallPayload?.memories?.find((memory) => memory._id === capturedMemoryId || memory.title === uniqueTitle);
  assert.ok(match, 'Captured memory missing from recall payload');

  const recallMemory = match || {};
  const directEmbedding = recallMemory.embedding ?? memoryPayload?.memory?.embedding;
  if (Array.isArray(directEmbedding) && directEmbedding.length > 0) {
    assert.equal(directEmbedding.length, 3072, `Expected 3072-dim embedding, got ${directEmbedding.length}`);
    assert.ok(directEmbedding.some((value) => typeof value === 'number' && Number.isFinite(value) && value !== 0));
    observations.push({ endpoint: 'direct-memory-surface', embeddingExposed: true, embeddingLength: directEmbedding.length });
    return;
  }

  observations.push({
    endpoint: 'public-memory-surfaces',
    embeddingExposed: false,
    conclusion: 'Embedding is not exposed on /api/mcp/recall or /api/mcp/memory; verified indirectly by semantic recall score > 0.',
  });

  assert.ok(match.score > 0, 'Positive semantic vector score is required when embedding is hidden');
});

await run('6. graph enrichment verification via /api/mcp/graph-status', async () => {
  const { response, payload } = await api('GET', '/api/mcp/graph-status');
  assert.equal(response.status, 200, `graph-status status ${response.status}: ${JSON.stringify(payload)}`);
  assert.equal(payload?.ok, true, `graph-status payload: ${JSON.stringify(payload)}`);
  assert.equal(typeof payload?.totalNodes, 'number');
  assert.equal(typeof payload?.totalRelations, 'number');
  assert.equal(typeof payload?.enrichedMemories, 'number');
  assert.equal(typeof payload?.totalMemories, 'number');
  assert.equal(typeof payload?.enrichmentPercent, 'number');
  assert.ok(payload.totalNodes > 0, `Expected totalNodes > 0, got ${JSON.stringify(payload)}`);
  assert.ok(payload.totalRelations > 0, `Expected totalRelations > 0, got ${JSON.stringify(payload)}`);
  assert.ok(payload.enrichedMemories > 0, `Expected enrichedMemories > 0, got ${JSON.stringify(payload)}`);
  graphStatusPayload = payload;
  observations.push({ endpoint: '/api/mcp/graph-status', ...payload });
});

await run('7. GET /api/mcp/stats', async () => {
  const { response, payload } = await api('GET', '/api/mcp/stats');
  assert.equal(response.status, 200, `stats status ${response.status}: ${JSON.stringify(payload)}`);
  assert.equal(typeof payload?.total, 'number');
  assert.equal(typeof payload?.byStore, 'object');
  for (const key of ['sensory', 'episodic', 'semantic', 'procedural', 'prospective']) {
    assert.equal(typeof payload?.byStore?.[key], 'number', `Missing byStore.${key}`);
  }
  statsPayload = payload;
});

await run('8. POST /api/mcp/recent-messages', async () => {
  const { response, payload } = await api('POST', '/api/mcp/recent-messages', { limit: 5 });
  assert.equal(response.status, 200, `recent-messages status ${response.status}: ${JSON.stringify(payload)}`);
  assert.ok(Array.isArray(payload?.messages), `recent-messages payload: ${JSON.stringify(payload)}`);
});

await run('9. POST /api/mcp/search-messages', async () => {
  const { response, payload } = await api('POST', '/api/mcp/search-messages', { query: 'test', limit: 5 });
  assert.equal(response.status, 200, `search-messages status ${response.status}: ${JSON.stringify(payload)}`);
  assert.ok(Array.isArray(payload?.messages), `search-messages payload: ${JSON.stringify(payload)}`);
});

await run('10. POST /api/mcp/reflect', async () => {
  const { response, payload } = await api('POST', '/api/mcp/reflect', { windowHours: 1 });
  assert.equal(response.status, 200, `reflect status ${response.status}: ${JSON.stringify(payload)}`);
  assert.equal(payload?.ok, true, `reflect payload: ${JSON.stringify(payload)}`);
  assert.equal(typeof payload?.stats, 'object');
});

await run('11. MCP initialize through https://api.memorycrystal.ai/mcp', async () => {
  const { response, payload } = await mcp('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'gemini-integration-test', version: '1.0.0' },
  });
  assert.equal(response.status, 200, `MCP initialize status ${response.status}`);
  assert.equal(payload?.result?.protocolVersion, '2025-03-26');
  assert.equal(typeof payload?.result?.capabilities, 'object');
});

await run('12. MCP tools/list', async () => {
  const { response, payload } = await mcp('tools/list', {});
  assert.equal(response.status, 200, `MCP tools/list status ${response.status}`);
  const tools = payload?.result?.tools;
  assert.ok(Array.isArray(tools), `tools/list payload: ${JSON.stringify(payload)}`);
  assert.ok(tools.length >= 5, `Expected at least 5 tools, got ${tools?.length}`);
});

await run('13. MCP tools/call memory_stats', async () => {
  const { response, payload } = await mcp('tools/call', {
    name: 'memory_stats',
    arguments: {},
  });
  assert.equal(response.status, 200, `MCP tools/call status ${response.status}`);
  assert.ok(!payload?.error, `MCP tools/call error payload: ${JSON.stringify(payload)}`);
  const text = payload?.result?.content?.[0]?.text || '';
  assert.match(text, /"total"/);
  assert.match(text, /"byStore"/);
});

log('\n=== SUMMARY ===');
for (const result of testResults) {
  log(`${result.status} ${result.name}${result.error ? `\n${result.error}` : ''}`);
}

log('\n=== OBSERVATIONS ===');
for (const item of observations) {
  log(JSON.stringify(item));
}

if (statsPayload) {
  log('\n=== FINAL STATS SNAPSHOT ===');
  log(JSON.stringify(statsPayload, null, 2));
}

if (capturedMemoryId) {
  log(`\nCaptured memory ID: ${capturedMemoryId}`);
}

if (process.exitCode) {
  log('\nIntegration test suite failed.');
} else {
  log('\nIntegration test suite passed.');
}
