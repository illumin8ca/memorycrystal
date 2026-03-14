"use client";

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { formatLimit, formatTtlDays, TIER_LIMITS } from "@shared/tierLimits";

const sections = [
  { id: "release-notes", label: "Release Notes" },
  { id: "what-is-memory-crystal", label: "What is Memory Crystal?" },
  { id: "getting-started", label: "Getting Started" },
  { id: "memory-architecture", label: "Memory Architecture" },
  { id: "memory-stores", label: "Memory Stores" },
  { id: "memory-categories", label: "Memory Categories" },
  { id: "wake-briefing", label: "Wake Briefing" },
  { id: "reflection-pipeline", label: "Reflection Pipeline" },
  { id: "storage-decay", label: "Storage-Based Decay" },
  { id: "mcp-api-reference", label: "MCP API Reference" },
  { id: "openclaw-integration", label: "OpenClaw Integration" },
  { id: "dashboard-guide", label: "Dashboard Guide" },
  { id: "pricing-limits", label: "Pricing & Limits" },
  { id: "faq", label: "FAQ" },
];

const formatChannels = (channels: number | null): string =>
  channels === null ? "Unlimited" : channels.toLocaleString();

const PRICING_ROWS: string[][] = [
  ["FREE", "$0/mo", formatLimit(TIER_LIMITS.free.memories), formatLimit(TIER_LIMITS.free.stmMessages), formatTtlDays(TIER_LIMITS.free.stmTtlDays), formatChannels(TIER_LIMITS.free.channels)],
  [
    "PRO",
    "$20/mo",
    formatLimit(TIER_LIMITS.pro.memories),
    formatLimit(TIER_LIMITS.pro.stmMessages),
    formatTtlDays(TIER_LIMITS.pro.stmTtlDays),
    formatChannels(TIER_LIMITS.pro.channels),
  ],
  [
    "CONTACT",
    "Custom",
    "Need higher usage?",
    "Contact us",
    "Custom retention",
    "Custom channels",
  ],
];

function BracketHeading({ children }: { children: string }) {
  return <p className="text-xs font-mono text-secondary tracking-[0.28em] uppercase mb-4"><span className="text-accent">[ </span>{children}<span className="text-accent"> ]</span></p>;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 border border-white/[0.09] bg-white/[0.03]">
      <div className="flex items-center justify-end border-b border-white/[0.08] px-3 py-2">
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="text-[11px] font-mono text-accent hover:text-white"
        >
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm"><code className="whitespace-pre text-primary font-mono">{code}</code></pre>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <BracketHeading>DOCUMENTATION</BracketHeading>
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl">Memory Crystal Docs</h1>
        <p className="mt-4 text-secondary max-w-3xl">Everything you need to use Memory Crystal in production.</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 h-fit border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-xs font-mono text-secondary mb-3 tracking-widest">ON THIS PAGE</p>
            <nav className="space-y-2">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block text-sm text-secondary hover:text-accent">{s.label}</a>
              ))}
            </nav>
          </aside>

          <div className="space-y-8">
            <section id="release-notes" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">Release Notes</h2>
              <p className="mt-4 text-secondary">Latest release: <span className="text-primary">v0.2.4</span> (March 13, 2026).</p>
              <ul className="mt-4 space-y-2 text-secondary list-disc pl-5">
                <li>OpenClaw v2026.3.12 compatibility updates for the plugin and installer</li>
                <li>Install script now cleans legacy hook entries to make upgrades safer</li>
                <li>Signup auth flow fixed in production deployment</li>
                <li>Homepage visuals, demo video, blog launch, and release workflow updates</li>
              </ul>
              <p className="mt-4 text-secondary">For the full changelog, see <a href="/whats-new" className="text-accent hover:text-white">What&apos;s New</a>.</p>
            </section>

            <section id="what-is-memory-crystal" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">1. What is Memory Crystal?</h2>
              <p className="mt-4 text-secondary">Memory Crystal is an MCP-compatible memory layer for agents. It captures, stores, and recalls context so your model can continue across sessions with less loss of continuity.</p>
              <p className="mt-3 text-secondary">The system has two memory domains: short-term messages and long-term memories. Short-term keeps active conversation context with tier-based retention. Long-term stores durable facts, events, decisions, and summaries that can be recalled much later.</p>
              <p className="mt-3 text-secondary">Use it to power wake-up briefings, semantic recall, checkpointer snapshots, and automated reflection outputs.</p>
              <ul className="mt-4 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary">Fast setup</span>: drop-in MCP endpoints and existing OpenClaw integrations</li>
                <li><span className="text-primary">Production-ready</span>: rate limits, auth, tiers, and decay controls</li>
                <li><span className="text-primary">Search-oriented</span>: vector + lexical memory retrieval</li>
                <li><span className="text-primary">Action-oriented</span>: memory tools exposed as functions your system can call</li>
              </ul>
            </section>

            <section id="getting-started" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">2. Getting Started</h2>
              <ol className="mt-4 space-y-2 text-secondary list-decimal pl-5">
                <li>Create an API key in <span className="text-primary">Settings → API Keys</span></li>
                <li>Keep your key available for Authorization header calls to <span className="text-primary">https://memorycrystal.ai/api/mcp</span></li>
                <li>Call <span className="text-primary">POST /wake</span> to begin a session and get the initial briefing</li>
                <li>Use <span className="text-primary">POST /capture</span> for durable context and <span className="text-primary">POST /log</span> for turn-level messages</li>
                <li>Test recall with <span className="text-primary">POST /recall</span> and verify results in Dashboard</li>
              </ol>

              <p className="mt-4 text-secondary">All requests include the same auth header:</p>
              <CodeBlock code={`Authorization: Bearer <api-key>`} />
              <p className="mt-3 text-secondary">Every endpoint validates your API key and routes to your account&apos;s plan limits.</p>
            </section>

            <section id="memory-architecture" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">3. Memory Architecture (short-term messages + long-term memories)</h2>
              <p className="mt-4 text-secondary"><span className="text-primary">Short-term memory</span> stores raw conversation turns through <span className="text-primary">/log</span> and is useful for ongoing context in the current interaction window.</p>
              <p className="mt-2 text-secondary">When message retention is reached, older short-term entries are managed according to your tier&apos;s configured TTL.</p>
              <p className="mt-3 text-secondary"><span className="text-primary">Long-term memory</span> is written with <span className="text-primary">/capture</span> and is optimized for retrieval and reuse across sessions.</p>
              <ul className="mt-3 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary">/recall</span> performs semantic search first (OpenAI text-embedding-3-small) then lexical fallback</li>
                <li><span className="text-primary">/checkpoint</span> creates structured snapshots for continuity and auditability</li>
                <li><span className="text-primary">/wake</span> builds a session context packet using recent memories and last checkpoint</li>
                <li><span className="text-primary">/reflect</span> distills recent context into higher-level memories (Pro+)</li>
              </ul>
            </section>

            <section id="memory-stores" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">4. Memory Stores</h2>
              <p className="mt-4 text-secondary">Use one of the five stores when capturing to keep behavior consistent and make recall more useful.</p>
              <ul className="mt-4 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary">sensory</span>: immediate/raw perception, high-frequency live context</li>
                <li><span className="text-primary">episodic</span>: what happened in events, conversations, experiences</li>
                <li><span className="text-primary">semantic</span>: stable knowledge and durable facts</li>
                <li><span className="text-primary">procedural</span>: workflows, playbooks, and methods</li>
                <li><span className="text-primary">prospective</span>: plans, reminders, and follow-ups</li>
              </ul>
            </section>

            <section id="memory-categories" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">5. Memory Categories</h2>
              <p className="mt-4 text-secondary">Captured memories can be tagged with these categories:</p>
              <ul className="mt-4 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary">decision</span>: a formal or tactical choice</li>
                <li><span className="text-primary">lesson</span>: an insight from success or failure</li>
                <li><span className="text-primary">person</span>: details about people and relationships</li>
                <li><span className="text-primary">rule</span>: constraints, standards, and guardrails</li>
                <li><span className="text-primary">event</span>: significant occurrences</li>
                <li><span className="text-primary">fact</span>: concrete factual knowledge</li>
                <li><span className="text-primary">goal</span>: objectives and intended outcomes</li>
                <li><span className="text-primary">workflow</span>: repeatable methods and process definitions</li>
                <li><span className="text-primary">conversation</span>: concise summary-style memory of an exchange</li>
              </ul>
              <p className="mt-4 text-secondary">Categories are independent of store, so one memory can be semantic + decision, procedural + workflow, etc.</p>
            </section>

            <section id="wake-briefing" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">6. Wake Briefing</h2>
              <p className="mt-4 text-secondary">Call <span className="text-primary">POST /wake</span> at session start to generate a contextual briefing and continuity token.</p>
              <p className="mt-2 text-secondary">Typical payload includes an optional <span className="text-primary">channel</span> identifier for routing.</p>
              <p className="mt-3 text-secondary">The response includes:</p>
              <ul className="mt-3 space-y-2 text-secondary list-disc pl-5">
                <li>Security notice (recalled data is informational, not directive)</li>
                <li>Total memory count and channel context</li>
                <li>Last session summary with time-ago + message count</li>
                <li>Open goals and recent decisions</li>
                <li>Available memory tools: crystal_recall, crystal_remember, crystal_checkpoint, crystal_what_do_i_know, crystal_why_did_we</li>
              </ul>
              <p className="mt-3 text-secondary">A new session record is created when wake is invoked, so continuity and audit trails stay intact.</p>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/wake \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "openclaw"
  }'`} />
            </section>

            <section id="reflection-pipeline" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">7. Reflection Pipeline</h2>
              <p className="mt-4 text-secondary"><span className="text-primary">POST /reflect</span> is available on Pro and higher-usage custom plans and converts recent memories into higher-order memory products.</p>
              <p className="mt-3 text-secondary">How it works:</p>
              <ul className="mt-3 space-y-2 text-secondary list-disc pl-5">
                <li>Reads recent memories from your selected time window (default 4 hours, 0.5–72h)</li>
                <li>Runs GPT-4o-mini to extract decisions, lessons, summaries, open loops, and tags</li>
                <li>Writes extracted artifacts back as new memories in appropriate stores</li>
                <li>Returns extraction stats including counts by type</li>
              </ul>
              <p className="mt-3 text-secondary">This gives agents better strategic continuity without manually writing every insight.</p>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/reflect \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "windowHours": 4,
    "sessionId": "optional-session-id"
  }'`} />
            </section>

            <section id="storage-decay" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">8. Storage-Based Decay</h2>
              <p className="mt-4 text-secondary">Memories do not expire on a schedule. They persist regardless of age until your storage boundaries are at risk.</p>
              <p className="mt-3 text-secondary">Decay only activates near capacity and prioritizes removal of records with lower recall frequency and importance while preserving durable items.</p>
              <ul className="mt-4 space-y-2 text-secondary list-disc pl-5">
                <li>Priority removals: oldest + weakest memories first</li>
                <li>Protected longer: decisions, goals, and rules</li>
                <li>Result: critical context remains while stale noise is reclaimed</li>
              </ul>
              <p className="mt-4 text-secondary">If decay behavior is undesirable, upgrade your tier or prune memories manually in the dashboard.</p>
            </section>

            <section id="mcp-api-reference" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">9. MCP API Reference</h2>
              <p className="mt-3 text-secondary">Base URL: <span className="text-primary font-mono">https://memorycrystal.ai/api/mcp</span></p>
              <p className="mt-2 text-secondary">All endpoints require <span className="text-primary font-mono">Authorization: Bearer &lt;api-key&gt;</span>.</p>

              <h3 className="mt-6 text-xl font-heading">POST /capture — store a memory</h3>
              <p className="mt-2 text-secondary">Required: <span className="text-primary">title</span> (max 500 chars), <span className="text-primary">content</span> (max 50KB). Optional: <span className="text-primary">store</span> (default episodic), <span className="text-primary">category</span> (default conversation), <span className="text-primary">tags</span>, <span className="text-primary">channel</span>.</p>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/capture \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deployment decision",
    "content": "Team approved shipping at 7:00 PM after QA clearance.",
    "store": "episodic",
    "category": "decision",
    "tags": ["deploy", "release"],
    "channel": "openclaw"
  }'`} />
              <p className="mt-2 text-xs text-secondary">Response: <span className="font-mono">{`{ ok: true, id }`}</span> or <span className="font-mono">{`{ error, limit }`}</span> (403 if at memory limit).</p>

              <h3 className="mt-6 text-xl font-heading">POST /recall — vector + lexical memory search</h3>
              <p className="mt-2 text-secondary">Required: <span className="text-primary">query</span>. Optional: <span className="text-primary">store</span>, <span className="text-primary">limit</span> (1–50, default 10).</p>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/recall \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"query":"what did we decide about deploy timing?","store":"episodic","limit":10}'`} />
              <p className="mt-2 text-xs text-secondary">Response: <span className="font-mono">{`{ memories: [{ _id, title, content, store, category, tags, createdAt, score }] }`}</span>.</p>

              <h3 className="mt-6 text-xl font-heading">POST /checkpoint — create a snapshot</h3>
              <p className="mt-2 text-secondary">Required: <span className="text-primary">label</span> or <span className="text-primary">title</span>. Optional: <span className="text-primary">description</span> or <span className="text-primary">content</span>.</p>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/checkpoint \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Pre-Launch Summary",
    "content": "Monitoring ready, release notes complete, hold on QA final check."
  }'`} />
              <p className="mt-2 text-xs text-secondary">Response: <span className="font-mono">{`{ ok: true, id }`}</span>.</p>

              <h3 className="mt-6 text-xl font-heading">POST /log — log a message to short-term memory</h3>
              <p className="mt-2 text-secondary">Required: <span className="text-primary">content</span>. Optional: <span className="text-primary">role</span> (user|assistant|system, default assistant), <span className="text-primary">channel</span>, <span className="text-primary">sessionKey</span>.</p>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/log \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "assistant",
    "content": "Updated docs page and opened pricing table validation.",
    "channel": "openclaw",
    "sessionKey": "session-123"
  }'`} />
              <p className="mt-2 text-xs text-secondary">Response: <span className="font-mono">{`{ ok: true, id }`}</span> or 403 if message limit reached.</p>

              <h3 className="mt-6 text-xl font-heading">POST /reflect — trigger reflection pipeline (Pro+)</h3>
              <p className="mt-2 text-secondary">Optional: <span className="text-primary">windowHours</span> (0.5–72, default 4), <span className="text-primary">sessionId</span>.</p>
              <p className="mt-1 text-secondary">Pro and higher-usage custom plans can use this endpoint.</p>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/reflect \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "windowHours": 4
  }'`} />
              <p className="mt-2 text-xs text-secondary">Response: <span className="font-mono">{`{ ok: true, stats }`}</span> containing extraction counts.</p>

              <h3 className="mt-6 text-xl font-heading">GET|POST /stats — memory statistics</h3>
              <p className="mt-2 text-secondary">Returns totals, store breakdown, and key label information for the current API key.</p>
              <CodeBlock code={`curl -X GET https://memorycrystal.ai/api/mcp/stats \
  -H "Authorization: Bearer <api-key>"

curl -X POST https://memorycrystal.ai/api/mcp/stats \
  -H "Authorization: Bearer <api-key>"`} />
              <p className="mt-2 text-xs text-secondary">Response: <span className="font-mono">{`{ total, byStore: { episodic, semantic, ... }, apiKeyLabel }`}</span>.</p>

              <h3 className="mt-6 text-xl font-heading">GET|POST /auth — validate API key</h3>
              <p className="mt-2 text-secondary">Checks API key validity and resolves account identity.</p>
              <CodeBlock code={`curl -X GET https://memorycrystal.ai/api/mcp/auth \
  -H "Authorization: Bearer <api-key>"`} />
              <p className="mt-2 text-xs text-secondary">Response: <span className="font-mono">{`{ ok: true, userId }`}</span>.</p>

              <h3 className="mt-6 text-xl font-heading">GET|POST /wake — wake briefing and session start</h3>
              <p className="mt-2 text-secondary">Optional POST body: <span className="text-primary">channel</span> (string). Returns briefing metadata, recent memories, and last checkpoint.</p>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/wake \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "openclaw"
  }'`} />
            </section>

            <section id="openclaw-integration" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">10. OpenClaw Integration</h2>
              <p className="mt-4 text-secondary">The <span className="text-primary font-mono">crystal-capture</span> plugin hooks interaction flow in real time; no cron job needed.</p>
              <ul className="mt-3 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary font-mono">message_received</span>: buffers inbound user messages</li>
                <li><span className="text-primary font-mono">llm_output</span>: logs each conversation turn and captures to sensory memory</li>
              </ul>
              <p className="mt-3 text-secondary">Troubleshooting log location: <span className="text-primary font-mono">/tmp/crystal-hook-log.txt</span></p>
            </section>

            <section id="dashboard-guide" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">11. Dashboard Guide</h2>
              <ul className="mt-4 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary">Dashboard</span>: usage stats + recent activity (8 recent memories, 8 recent messages)</li>
                <li><span className="text-primary">Memories</span>: browse/search, filter by store, infinite scroll pagination</li>
                <li><span className="text-primary">Messages</span>: raw conversation feed, role filtering, infinite scroll pagination</li>
                <li><span className="text-primary">Checkpoints</span>: create and review snapshots</li>
                <li><span className="text-primary">Settings</span>: API keys + subscription management</li>
              </ul>
            </section>

            <section id="pricing-limits" className="glass-card border border-white/[0.08] p-6 sm:p-8 overflow-x-auto">
              <h2 className="font-heading text-3xl">12. Pricing & Limits</h2>
              <div className="mt-4 min-w-[680px] border border-white/[0.08]">
                <div className="grid grid-cols-6 text-xs font-mono border-b border-white/[0.08] bg-white/[0.03]">
                  <div className="p-3">Tier</div><div className="p-3">Price</div><div className="p-3">Memories</div><div className="p-3">Messages</div><div className="p-3">Retention</div><div className="p-3">Channels</div>
                </div>
                {PRICING_ROWS.map((row) => (
                  <div key={row[0]} className="grid grid-cols-6 text-sm border-b last:border-b-0 border-white/[0.06]">
                    {row.map((cell, i) => <div key={i} className="p-3 text-secondary">{cell}</div>)}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-secondary">Additional features by tier:</p>
              <ul className="mt-2 space-y-1 text-secondary list-disc pl-5">
                <li><span className="text-primary">Pro</span>: Includes a 14-day free trial, reflection pipeline, and higher limits</li>
                <li><span className="text-primary">Contact</span>: Need higher usage, custom retention, or larger deployment support? Contact us.</li>
              </ul>
              <p className="mt-4 text-secondary">Global API rate limit: <span className="text-primary">60 requests/minute per API key</span> (returns 429 with <span className="text-primary">Retry-After</span>).</p>
            </section>

            <section id="faq" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">13. FAQ</h2>
              <div className="mt-5 space-y-5">
                <div><h3 className="font-heading text-xl">Do I have to use OpenClaw?</h3><p className="text-secondary mt-1">No. Any MCP-compatible client can call these endpoints directly.</p></div>
                <div><h3 className="font-heading text-xl">How does search work?</h3><p className="text-secondary mt-1">/<span className="text-primary">recall</span> uses semantic search with OpenAI text-embedding-3-small and falls back to lexical matching when needed.</p></div>
                <div><h3 className="font-heading text-xl">What happens if I hit limits?</h3><p className="text-secondary mt-1">Storage and message caps are enforced by tier. New captures can return 403 with a limit field, and near-capacity decay handles cleanup for memories when needed.</p></div>
                <div><h3 className="font-heading text-xl">When do memories decay?</h3><p className="text-secondary mt-1">Only when near storage limits. Critical memories (decision/goal/rule) are protected longer.</p></div>
                <div><h3 className="font-heading text-xl">Can I get a wake briefing without /wake?</h3><p className="text-secondary mt-1">Current implementation generates wake briefings through the /wake endpoint. It is intended as the first call for a new session.</p></div>
                <div><h3 className="font-heading text-xl">Can I query /auth with POST too?</h3><p className="text-secondary mt-1">Yes. <span className="text-primary">/auth</span> and <span className="text-primary">/stats</span> support GET and POST.</p></div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
