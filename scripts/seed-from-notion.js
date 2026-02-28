#!/usr/bin/env node
/**
 * seed-from-notion.js
 * Pulls Notion databases and seeds into VexClaw (Convex + Obsidian).
 * Usage:
 *   node scripts/seed-from-notion.js           # full run
 *   node scripts/seed-from-notion.js --dry-run  # preview only
 *   node scripts/seed-from-notion.js --db people # single database
 */

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

// ── Config ────────────────────────────────────────────────────────────────────

const HOME = process.env.HOME || "";
const REPO_ROOT = path.resolve(__dirname, "..");
const ENV_FILE = path.resolve(REPO_ROOT, "mcp-server", ".env");

const EXTRACTION_MODEL = "gpt-4o-mini";
const EMBEDDING_MODEL = "text-embedding-3-small";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_EMBED_URL = "https://api.openai.com/v1/embeddings";
const CONVEX_MUTATION_PATH = "vexclaw/memories:createMemory";
const NOTION_API_VERSION = "2025-09-03";
const DEDUPE_THRESHOLD = 0.92;

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const DB_FILTER = (() => { const i = args.indexOf("--db"); return i >= 0 ? args[i + 1] : null; })();
const PAGE_OFFSET = (() => { const i = args.indexOf("--offset"); return i >= 0 ? parseInt(args[i + 1], 10) : 0; })();
const PAGE_LIMIT = (() => { const i = args.indexOf("--limit"); return i >= 0 ? parseInt(args[i + 1], 10) : Infinity; })();

// ── Env loading ───────────────────────────────────────────────────────────────

function readEnvFile(fp) {
  const v = {};
  if (!fs.existsSync(fp)) return v;
  for (const line of fs.readFileSync(fp, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const [k, ...rest] = t.split("=");
    v[k.trim()] = rest.join("=").trim().replace(/^"+|"+$/g, "");
  }
  return v;
}

const env = { ...readEnvFile(ENV_FILE), ...process.env };
const CONVEX_URL = env.CONVEX_URL;
const OPENAI_API_KEY = (env.OPENAI_API_KEY || "").replace(/^"+|"+$/g, "");
const OBSIDIAN_VAULT = env.OBSIDIAN_VAULT_PATH || path.join(HOME, "Documents", "Gerald", "Memory");
const NOTION_KEY = (() => {
  const keyFile = path.join(HOME, ".config/notion/api_key");
  if (fs.existsSync(keyFile)) return fs.readFileSync(keyFile, "utf8").trim();
  return env.NOTION_API_KEY || "";
})();

if (!CONVEX_URL || !OPENAI_API_KEY) { console.error("❌ Missing CONVEX_URL or OPENAI_API_KEY"); process.exit(1); }
if (!NOTION_KEY) { console.error("❌ Missing Notion API key"); process.exit(1); }

// ── Database map (from TOOLS.md / notion-databases.json) ──────────────────────

const DATABASES = [
  { key: "people",        id: "2e64a47d-9780-80d9-a2b4-000b5e88cd26", store: "semantic",    category: "person"   },
  { key: "memories",      id: "2ed4a47d-9780-809c-8c1c-000b19454cf1", store: "semantic",    category: "fact"     },
  { key: "journal",       id: "2eb4a47d-9780-80af-8b99-000bd9a5be68", store: "episodic",    category: "event"    },
  { key: "meetings",      id: "2dc4a47d-9780-80ab-9bde-000b4e10a690", store: "episodic",    category: "event"    },
  { key: "ideas",         id: "2e64a47d-9780-801d-bdd1-000b6980b25a", store: "semantic",    category: "fact"     },
  { key: "projects",      id: "2e64a47d-9780-80f8-aea4-000b02db0606", store: "semantic",    category: "fact"     },
  { key: "project_tasks", id: "2e74a47d-9780-8139-9f9e-000b263cfbfa", store: "episodic",    category: "event"    },
  { key: "admin",         id: "2e64a47d-9780-8031-9497-000bfb9c66d6", store: "episodic",    category: "event"    },
  { key: "inbox_log",     id: "2e64a47d-9780-80e1-9b44-000bab1ed646", store: "sensory",     category: "event"    },
  { key: "recurring",     id: "2ea4a47d-9780-8136-9a13-000b32cfbfd2", store: "procedural",  category: "workflow" },
];

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function httpPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...headers },
    }, (res) => {
      let buf = "";
      res.on("data", c => buf += c);
      res.on("end", () => { try { resolve(JSON.parse(buf)); } catch { resolve({ _raw: buf }); } });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// ── Notion helpers ────────────────────────────────────────────────────────────

const NOTION_HEADERS = {
  Authorization: `Bearer ${NOTION_KEY}`,
  "Notion-Version": NOTION_API_VERSION,
  "Content-Type": "application/json",
};

async function queryNotionDB(databaseId) {
  const pages = [];
  let cursor = undefined;
  let safety = 0;
  while (safety++ < 20) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const resp = await httpPost(`https://api.notion.com/v1/data_sources/${databaseId}/query`, NOTION_HEADERS, body);
    if (resp.results) pages.push(...resp.results);
    if (!resp.has_more) break;
    cursor = resp.next_cursor;
  }
  return pages;
}

function extractNotionText(page) {
  const parts = [];
  const props = page.properties || {};
  for (const [key, val] of Object.entries(props)) {
    let text = "";
    if (val.type === "title" && val.title) {
      text = val.title.map(t => t.plain_text).join("");
    } else if (val.type === "rich_text" && val.rich_text) {
      text = val.rich_text.map(t => t.plain_text).join("");
    } else if (val.type === "select" && val.select) {
      text = val.select.name;
    } else if (val.type === "multi_select" && val.multi_select) {
      text = val.multi_select.map(s => s.name).join(", ");
    } else if (val.type === "date" && val.date) {
      text = val.date.start || "";
    } else if (val.type === "email") {
      text = val.email || "";
    } else if (val.type === "phone_number") {
      text = val.phone_number || "";
    } else if (val.type === "number") {
      text = val.number != null ? String(val.number) : "";
    } else if (val.type === "url") {
      text = val.url || "";
    } else if (val.type === "checkbox") {
      text = val.checkbox ? "yes" : "no";
    } else if (val.type === "status" && val.status) {
      text = val.status.name || "";
    } else if (val.type === "relation" && val.relation) {
      text = `(${val.relation.length} relations)`;
    }
    if (text) parts.push(`${key}: ${text}`);
  }
  return parts.join("\n");
}

// ── OpenAI helpers ────────────────────────────────────────────────────────────

const AUTH = { Authorization: `Bearer ${OPENAI_API_KEY}` };

async function extractMemories(content, store, category) {
  const resp = await httpPost(OPENAI_CHAT_URL, AUTH, {
    model: EXTRACTION_MODEL,
    response_format: { type: "json_object" },
    messages: [{
      role: "system",
      content: `You are a memory extraction AI. Extract key memories from this Notion page data and return JSON: {"memories": [...]}. Each memory: {title (string, 5-10 word summary), content (string, full detail), store ("${store}"), category ("${category}"), tags (string[]), importance (0-1), confidence (0-1)}. Extract 1-5 concise factual memories. Merge related fields. Skip empty/trivial data.`
    }, { role: "user", content: content.slice(0, 6000) }]
  });
  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p.memories) ? p.memories : Array.isArray(p) ? p : [];
  } catch { return []; }
}

async function embed(text) {
  const resp = await httpPost(OPENAI_EMBED_URL, AUTH, {
    model: EMBEDDING_MODEL, input: text.slice(0, 8000),
  });
  return resp.data?.[0]?.embedding || null;
}

// ── Convex + Obsidian ─────────────────────────────────────────────────────────

async function convexMutation(fnPath, args) {
  const resp = await httpPost(`${CONVEX_URL}/api/mutation`, {}, { path: fnPath, args });
  if (resp && typeof resp === "object" && resp.status === "error") {
    return null;
  }
  const value = (resp && typeof resp === "object" && Object.prototype.hasOwnProperty.call(resp, "value")) ? resp.value : resp;
  return value ?? null;
}

function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60); }

function writeObsidian(mem) {
  const dir = path.join(OBSIDIAN_VAULT, mem.store);
  fs.mkdirSync(dir, { recursive: true });
  const fname = `${Date.now()}-${slugify(mem.content)}.md`;
  const fm = [
    "---", `store: ${mem.store}`, `category: ${mem.category}`,
    `strength: ${mem.importance || mem.strength || 0.5}`, `confidence: ${mem.confidence}`,
    `tags: [${(mem.tags || []).join(", ")}]`, `source: notion`, `seeded: true`,
    `createdAt: ${new Date().toISOString()}`, "---", "", mem.content,
  ].join("\n");
  fs.writeFileSync(path.join(dir, fname), fm);
}

function cosine(a, b) {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; ma += a[i] ** 2; mb += b[i] ** 2; }
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🧠 VexClaw Notion Seed${DRY_RUN ? " [DRY RUN]" : ""}`);
  console.log(`   Convex: ${CONVEX_URL}`);
  console.log(`   Obsidian: ${OBSIDIAN_VAULT}\n`);

  const dbs = DATABASES.filter(d => d.id && (!DB_FILTER || d.key === DB_FILTER));
  console.log(`📦 ${dbs.length} databases to process\n`);

  let totalPages = 0, totalSaved = 0, totalSkipped = 0, totalErrors = 0;
  const allEmbeddings = []; // for cross-db dedup

  for (const db of dbs) {
    console.log(`\n📂 ${db.key} (${db.id.slice(0, 8)}...) → ${db.store}/${db.category}`);
    try {
      const pages = await queryNotionDB(db.id);
      console.log(`   ${pages.length} pages found`);
      totalPages += pages.length;

      if (DRY_RUN) {
        for (const p of pages.slice(0, 5)) {
          const text = extractNotionText(p);
          const title = text.split("\n")[0]?.slice(0, 80) || "(untitled)";
          console.log(`   📄 ${title}`);
        }
        if (pages.length > 5) console.log(`   ... and ${pages.length - 5} more`);
        continue;
      }

      const slicedPages = pages.slice(PAGE_OFFSET, PAGE_OFFSET + PAGE_LIMIT);
      console.log(`   Processing pages ${PAGE_OFFSET}–${PAGE_OFFSET + slicedPages.length} of ${pages.length}`);
      for (const page of slicedPages) {
        const text = extractNotionText(page);
        if (text.trim().length < 15) { totalSkipped++; continue; }

        const title = text.split("\n")[0]?.slice(0, 60) || "(untitled)";
        try {
          const memories = await extractMemories(text, db.store, db.category);
          if (!memories.length) { continue; }

          for (const mem of memories) {
            if (!mem.content || typeof mem.content !== "string") continue;
            const embedding = await embed(mem.content);
            if (!embedding) { totalErrors++; continue; }

            const isDupe = allEmbeddings.some(e => cosine(e, embedding) >= DEDUPE_THRESHOLD);
            if (isDupe) { totalSkipped++; continue; }

            const saved = await convexMutation(CONVEX_MUTATION_PATH, {
              title: (typeof mem.title === "string" && mem.title.trim()) ? mem.title.trim().slice(0, 120) : mem.content.slice(0, 80),
              content: mem.content,
              store: mem.store || db.store,
              category: mem.category || db.category,
              tags: Array.isArray(mem.tags) ? mem.tags : [],
              strength: typeof mem.importance === "number" ? Math.min(1, Math.max(0, mem.importance)) : 0.5,
              confidence: typeof mem.confidence === "number" ? Math.min(1, Math.max(0, mem.confidence)) : 0.8,
              embedding,
              source: "external",
            });

            if (!saved) {
              totalErrors++;
              continue;
            }

            writeObsidian(mem);
            allEmbeddings.push(embedding);
            totalSaved++;
          }
          process.stdout.write(`   ✅ ${title}\n`);
        } catch (e) {
          console.warn(`   ❌ ${title}: ${e.message}`);
          totalErrors++;
        }
      }
    } catch (e) {
      console.warn(`   ❌ DB query failed: ${e.message}`);
      totalErrors++;
    }
  }

  console.log(`\n📊 Notion seed complete:`);
  console.log(`   📄 Pages:   ${totalPages}`);
  console.log(`   ✅ Saved:   ${totalSaved}`);
  console.log(`   ♻️  Skipped: ${totalSkipped}`);
  console.log(`   ❌ Errors:  ${totalErrors}`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
