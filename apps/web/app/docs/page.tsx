"use client";

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const sections = [
  { id: "what-is-memory-crystal", label: "What is Memory Crystal?" },
  { id: "getting-started", label: "Getting Started" },
  { id: "memory-architecture", label: "Memory Architecture" },
  { id: "mcp-api-reference", label: "MCP API Reference" },
  { id: "openclaw-integration", label: "OpenClaw Integration" },
  { id: "dashboard-guide", label: "Dashboard Guide" },
  { id: "pricing-limits", label: "Pricing & Limits" },
  { id: "faq", label: "FAQ" },
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
            <section id="what-is-memory-crystal" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">1. What is Memory Crystal?</h2>
              <p className="mt-4 text-secondary">Memory Crystal is persistent memory infrastructure for AI agents. Instead of forgetting everything between sessions, your agent captures context, stores it in a structured memory system, and recalls relevant details later.</p>
              <p className="mt-3 text-secondary">Memory cycle: <span className="text-primary">capture → store → recall</span>.</p>
              <ul className="mt-4 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary">Episodic</span>: what happened (events, conversations, experiences)</li>
                <li><span className="text-primary">Semantic</span>: what you know (facts, concepts, stable knowledge)</li>
                <li><span className="text-primary">Procedural</span>: how to do things (workflows, playbooks, methods)</li>
                <li><span className="text-primary">Sensory</span>: immediate/raw perception (live context, fresh signal)</li>
                <li><span className="text-primary">Prospective</span>: what you plan to do (intentions, reminders, follow-ups)</li>
              </ul>
            </section>

            <section id="getting-started" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">2. Getting Started</h2>
              <ol className="mt-4 space-y-2 text-secondary list-decimal pl-5">
                <li>Sign up at <span className="text-primary">memorycrystal.ai</span></li>
                <li>Create an API key in <span className="text-primary">Settings → API Keys</span></li>
                <li>Install OpenClaw hook:</li>
              </ol>
              <CodeBlock code={`curl -fsSL https://memorycrystal.ai/install | bash`} />
              <p className="mt-4 text-secondary">Verify by sending messages through your agent, then check Dashboard → Messages and Dashboard → Memories for new entries.</p>
            </section>

            <section id="memory-architecture" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">3. Memory Architecture</h2>
              <p className="mt-4 text-secondary"><span className="text-primary">Short-term memory (Messages tab)</span>: raw conversation turns with automatic expiration based on plan.</p>
              <p className="mt-2 text-secondary"><span className="text-primary">Long-term memory (Memories tab)</span>: persisted captures with embeddings for semantic recall.</p>
              <p className="mt-4 text-secondary">Use stores intentionally:</p>
              <ul className="mt-2 space-y-2 text-secondary list-disc pl-5">
                <li>Episodic: events and conversation history</li>
                <li>Semantic: durable factual knowledge</li>
                <li>Procedural: repeatable processes and tactics</li>
                <li>Sensory: high-frequency, near-real-time context</li>
                <li>Prospective: tasks, commitments, future intent</li>
              </ul>
            </section>

            <section id="mcp-api-reference" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">4. MCP API Reference</h2>
              <p className="mt-3 text-secondary">All endpoints require: <span className="text-primary font-mono">Authorization: Bearer &lt;api-key&gt;</span></p>
              <p className="mt-2 text-secondary">Base URL: <span className="text-primary font-mono">https://memorycrystal.ai/api/mcp</span></p>

              <h3 className="mt-6 text-xl font-heading">POST /capture — store a memory</h3>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/capture \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Decision: deploy at 7pm",
    "content":"Deploy window approved after QA signoff.",
    "store":"episodic",
    "category":"decision",
    "tags":["deploy","release"],
    "channel":"openclaw"
  }'`} />
              <p className="mt-2 text-xs text-secondary">Stores: episodic, semantic, procedural, sensory, prospective</p>

              <h3 className="mt-6 text-xl font-heading">POST /recall — vector + text memory search</h3>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/recall \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"query":"what did we decide about deploy timing?","store":"episodic","limit":10}'`} />

              <h3 className="mt-6 text-xl font-heading">POST /checkpoint — create a snapshot</h3>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/checkpoint \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Pre-Launch","content":"Feature flags locked, waiting on monitoring checks."}'`} />

              <h3 className="mt-6 text-xl font-heading">POST /log — log to short-term memory</h3>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/log \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"role":"assistant","content":"Implemented Starter tier and updated docs.","channel":"openclaw","sessionKey":"session-123"}'`} />

              <h3 className="mt-6 text-xl font-heading">GET /stats and POST /stats — memory statistics</h3>
              <CodeBlock code={`curl -X GET https://memorycrystal.ai/api/mcp/stats \
  -H "Authorization: Bearer <api-key>"

curl -X POST https://memorycrystal.ai/api/mcp/stats \
  -H "Authorization: Bearer <api-key>"`} />

              <h3 className="mt-6 text-xl font-heading">GET /auth — validate API key</h3>
              <CodeBlock code={`curl -X GET https://memorycrystal.ai/api/mcp/auth \
  -H "Authorization: Bearer <api-key>"`} />

              <h3 className="mt-6 text-xl font-heading">POST /wake — wake/ping memory system</h3>
              <CodeBlock code={`curl -X POST https://memorycrystal.ai/api/mcp/wake \
  -H "Authorization: Bearer <api-key>"`} />
            </section>

            <section id="openclaw-integration" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">5. OpenClaw Integration</h2>
              <p className="mt-4 text-secondary">The <span className="text-primary font-mono">crystal-stm</span> hook captures interaction flow automatically.</p>
              <ul className="mt-3 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary font-mono">message:received</span> → log user message to STM</li>
                <li><span className="text-primary font-mono">message:sent</span> → log AI response + capture to sensory memory</li>
              </ul>
              <p className="mt-3 text-secondary">Troubleshooting log: <span className="text-primary font-mono">/tmp/crystal-hook-log.txt</span></p>
            </section>

            <section id="dashboard-guide" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">6. Dashboard Guide</h2>
              <ul className="mt-4 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary">Dashboard</span>: usage stats + recent activity</li>
                <li><span className="text-primary">Memories</span>: browse/search memories, filter by store</li>
                <li><span className="text-primary">Messages</span>: raw conversation feed, role filtering</li>
                <li><span className="text-primary">Checkpoints</span>: create and review snapshots</li>
                <li><span className="text-primary">Settings</span>: API keys + subscription management</li>
              </ul>
            </section>

            <section id="pricing-limits" className="glass-card border border-white/[0.08] p-6 sm:p-8 overflow-x-auto">
              <h2 className="font-heading text-3xl">7. Pricing & Limits</h2>
              <div className="mt-4 min-w-[680px] border border-white/[0.08]">
                <div className="grid grid-cols-5 text-xs font-mono border-b border-white/[0.08] bg-white/[0.03]">
                  <div className="p-3">Tier</div><div className="p-3">Price</div><div className="p-3">Memories</div><div className="p-3">Messages</div><div className="p-3">Message TTL</div>
                </div>
                {[
                  ["FREE", "$0", "500", "500", "30 days"],
                  ["STARTER", "$10/mo", "10,000", "5,000", "60 days"],
                  ["PRO", "$25/mo", "25,000", "25,000", "90 days"],
                  ["ULTRA", "$50/mo", "Unlimited", "Unlimited", "365 days"],
                ].map((row) => (
                  <div key={row[0]} className="grid grid-cols-5 text-sm border-b last:border-b-0 border-white/[0.06]">
                    {row.map((cell, i) => <div key={i} className="p-3 text-secondary">{cell}</div>)}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-secondary">Rate limit: <span className="text-primary">60 requests/minute per API key</span>.</p>
              <p className="mt-1 text-secondary">Storage limits are enforced on capture.</p>
            </section>

            <section id="faq" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">8. FAQ</h2>
              <div className="mt-5 space-y-5">
                <div><h3 className="font-heading text-xl">Is my data private?</h3><p className="text-secondary mt-1">Yes. Data is user-scoped with no cross-user access.</p></div>
                <div><h3 className="font-heading text-xl">Can I use this without OpenClaw?</h3><p className="text-secondary mt-1">Yes. Any tool that can make HTTP requests can use the MCP API.</p></div>
                <div><h3 className="font-heading text-xl">How does vector search work?</h3><p className="text-secondary mt-1">Embeddings are generated on capture, then cosine similarity ranks recall results.</p></div>
                <div><h3 className="font-heading text-xl">What happens when I hit my limit?</h3><p className="text-secondary mt-1">You receive a 403 response with an upgrade link.</p></div>
                <div><h3 className="font-heading text-xl">Can I export my data?</h3><p className="text-secondary mt-1">Coming soon.</p></div>
                <div><h3 className="font-heading text-xl">What models are supported?</h3><p className="text-secondary mt-1">Any model/tooling stack that can make HTTP requests (Claude, GPT, Gemini, and more).</p></div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
