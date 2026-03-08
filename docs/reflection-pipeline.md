# Memory Crystal — Reflection & Distillation Pipeline

## Overview

The reflection pipeline adds **LLM-assisted memory distillation** to Memory Crystal. Where the existing
consolidation step blindly clusters sensory memories by vector similarity, reflection runs a language
model over recent sensory + episodic memories and writes back structured, human-readable insights as
high-confidence `semantic` or `episodic` memories tagged `["reflection", "distilled"]`.

---

## Architecture

### 1. Reflection Triggers

| Trigger | Mechanism | When |
|---|---|---|
| **Session boundary** | `command:new` / `command:reset` hook in `index.js` | Fires when the MCP client starts a new conversation |
| **Periodic cron** | Daily cron at 04:30 UTC | Catches any sessions that ended without a clean command hook |
| **Manual MCP tool call** | `POST /api/mcp/reflect` | Operator or developer-triggered, useful during testing |

### 2. Input — Memory Window

- Query `crystalMemories` for the requesting user filtered to `store IN (sensory, episodic)` and `archived = false`.
- Filter by `createdAt >= now - windowHours * 3600 * 1000` (default: 4 hours, configurable).
- Cap at `MAX_MEMORIES_FOR_REFLECTION = 30` to stay within token budget.
- If fewer than **3 memories** are found, skip (not enough signal).

### 3. Processing — LLM Reflection

1. Build a compact context string from the memory window (title + first 300 chars of content).
2. Call **OpenAI Chat Completions** (`gpt-4o-mini`, temperature 0.3) with the structured prompt below.
3. Parse the JSON response.
4. For each `decision` → write a memory with `store: "episodic"`, `category: "decision"`.
5. For each `lesson` → write a memory with `store: "semantic"`, `category: "lesson"`.
6. Summary → write one memory with `store: "episodic"`, `category: "event"` titled `"Reflection summary: <date>"`.
7. Each open loop → write a memory with `store: "prospective"`, `category: "goal"`.
8. All written memories get `source: "inference"`, `tags: ["reflection", "distilled", ...llm_tags]`.

### 4. Output — Distilled Memories

Each written memory:
```
{
  userId,
  store: "semantic" | "episodic" | "prospective",
  category: "decision" | "lesson" | "event" | "goal",
  title: <string>,
  content: <string>,
  embedding: [],           // scheduled for async backfill via embedMemory
  strength: 0.85,
  confidence: 0.8,
  valence: 0,
  arousal: 0.2,
  source: "inference",
  tags: ["reflection", "distilled", ...llm_tags],
  archived: false,
}
```

Embeddings are empty on write and backfilled via the existing `embedMemory` scheduler job.

---

## Convex Action Design

### `runReflectionForUser` (internalAction)

```
args: {
  userId: string,
  sessionId?: Id<"crystalSessions">,
  windowHours?: number,       // default 4
  openaiApiKey: string,
}
returns: {
  memoriesRead: number,
  decisionsWritten: number,
  lessonsWritten: number,
  summaryWritten: boolean,
  openLoopsWritten: number,
  summary: string,
  skipped?: string,           // reason if skipped
}
```

Internal steps:
1. `ctx.runQuery(internal.crystal.reflection.getRecentMemoriesForReflection, { userId, windowMs })` — fetch up to 30 recent sensory+episodic memories.
2. If < 3, return early with `{ skipped: "not enough context" }`.
3. `buildReflectionPrompt(memories)` — build the structured prompt.
4. `fetch("https://api.openai.com/v1/chat/completions", ...)` — call gpt-4o-mini.
5. Parse JSON from `choices[0].message.content`.
6. For each extracted item, call `ctx.runMutation(internal.crystal.memories.createMemoryInternal, { ... })`.
7. Schedule embedding for each new memory via `ctx.scheduler.runAfter(0, internal.crystal.mcp.embedMemory, { memoryId })`.
8. Return stats.

### `runReflection` (action — for cron and manual calls)

```
args: {
  windowHours?: number,
  sessionId?: Id<"crystalSessions">,
}
```

Iterates all user IDs via `internal.crystal.userProfiles.listAllUserIds`, calls `runReflectionForUser` for each. Reads `OPENAI_API_KEY` from `process.env`.

---

## Plugin Hook Design

In `index.js` (MCP plugin entry point):

```javascript
server.setRequestHandler(/* command:new */, async (request) => {
  // ... existing logic ...
  // Fire-and-forget reflection call
  fetch(`${CONVEX_SITE_URL}/api/mcp/reflect`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ windowHours: 4 }),
  }).catch(() => {}); // non-blocking
});
```

The `/api/mcp/reflect` HTTP endpoint:
- Authenticates via API key (same `requireAuth` pattern as `/api/mcp/capture`).
- Extracts `windowHours` and optional `sessionId` from body.
- Calls `ctx.runAction(internal.crystal.reflection.runReflectionForUser, { userId, windowHours, openaiApiKey })`.
- Returns `{ ok: true, stats: { ... } }`.

---

## Prompt Template

```
You are a memory distillation assistant. Analyze these recent AI agent memories and extract structured insights.

MEMORIES:
${numbered_memory_list}

Respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "decisions": ["decision made 1", "decision made 2"],
  "lessons": ["lesson or pattern learned 1", "lesson or pattern learned 2"],
  "summary": "2-3 sentence summary of what was worked on in this session",
  "openLoops": ["unresolved question or pending task 1", "unresolved question or pending task 2"],
  "tags": ["relevant", "topic", "tags", "for", "indexing"]
}

Rules:
- decisions: concrete choices or commitments made (e.g., "Decided to use Convex for persistence")
- lessons: reusable insights, patterns, or things to remember (e.g., "Rate limiting must be per-user not global")
- summary: what was actually worked on, 2-3 sentences, past tense
- openLoops: tasks started but not finished, questions unanswered, todos
- tags: 3-8 concise topic tags, lowercase, no spaces
- Omit any category if it has 0 entries (use empty array [])
- Keep each item to 1-2 sentences max
```

---

## Cron Schedule

```typescript
// Daily reflection at 04:30 UTC (after stm-expire at 04:00)
crons.daily("crystal-reflect", { hourUTC: 4, minuteUTC: 30 }, internal.crystal.reflection.runReflection, {});
```

---

## Error Handling & Edge Cases

| Case | Behaviour |
|---|---|
| No OpenAI API key | Skip silently, log warning |
| < 3 memories in window | Skip, return `{ skipped: "not enough context" }` |
| OpenAI returns non-JSON | Log parse error, skip writing |
| OpenAI returns invalid structure | Write only fields present, skip malformed fields |
| User over storage limit | `createMemoryInternal` will handle dedup; limit not checked here (reflection memories are high value) |
| Network error | Log and return error stats |

---

## Security

- The `/api/mcp/reflect` endpoint uses the same API key auth as all other MCP endpoints.
- `openaiApiKey` is read from `process.env.OPENAI_API_KEY` server-side — never passed from the client.
- Reflection memories are scoped to `userId` — no cross-user data access.

---

## Production Readiness Checklist

- [ ] Wire `command:new` and `command:reset` hooks in `index.js`
- [ ] Add `OPENAI_API_KEY` to Convex environment variables (already used by embedder, likely set)
- [ ] Set `windowHours` per-user or per-tier if desired (power users may want longer windows)
- [ ] Add reflection count to `mcpStats` response
- [ ] Consider rate-limiting reflection calls per user (max 1 per hour) to avoid runaway LLM costs
- [ ] Add a `reflectionEnabled` flag to `crystalUserProfiles` for opt-out
- [ ] Monitor OpenAI costs — `gpt-4o-mini` is cheap but daily cron over all users can add up
- [ ] Test prompt with real memory data; tune if summaries are too generic
