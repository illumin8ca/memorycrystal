"use client";

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const sections = [
  { id: "what-is-memory-crystal", label: "What is Memory Crystal?" },
  { id: "getting-started", label: "Getting Started" },
  { id: "memory-architecture", label: "Memory Architecture" },
  { id: "memory-categories", label: "Memory Categories" },
  { id: "wake-briefing", label: "Wake Briefing" },
  { id: "storage-decay", label: "Storage-Based Decay" },
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

            <section id="memory-categories" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">4. Memory Categories</h2>
              <p className="mt-4 text-secondary">When capturing a memory, you can assign a <span className="text-primary">category</span> to help with filtering, recall, and organization. Supported categories:</p>
              <ul className="mt-4 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary">decision</span>: a choice made — architecture, tooling, process, etc.</li>
                <li><span className="text-primary">lesson</span>: something learned the hard way or worth remembering</li>
                <li><span className="text-primary">person</span>: information about a person (collaborator, stakeholder, etc.)</li>
                <li><span className="text-primary">rule</span>: a standing constraint, policy, or convention</li>
                <li><span className="text-primary">event</span>: a notable occurrence — a launch, incident, meeting, etc.</li>
                <li><span className="text-primary">fact</span>: stable factual knowledge about a system, domain, or entity</li>
                <li><span className="text-primary">goal</span>: an intention or objective to pursue</li>
                <li><span className="text-primary">workflow</span>: a repeatable process or standard operating procedure</li>
                <li><span className="text-primary">conversation</span>: a distilled summary of a notable exchange</li>
              </ul>
              <p className="mt-4 text-secondary">Categories can be combined with any memory store. For example, a <span className="text-primary">decision</span> is commonly stored as <span className="text-primary">episodic</span> or <span className="text-primary">semantic</span> depending on whether it&apos;s event-based or enduring.</p>
            </section>

            <section id="wake-briefing" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">5. Wake Briefing</h2>
              <p className="mt-4 text-secondary">At the start of each session, Memory Crystal generates a <span className="text-primary">wake briefing</span> — a contextual summary delivered to your AI agent before any conversation begins.</p>
              <p className="mt-3 text-secondary">The briefing includes:</p>
              <ul className="mt-3 space-y-2 text-secondary list-disc pl-5">
                <li>What you were working on in recent sessions</li>
                <li>Pending decisions or open questions</li>
                <li>Recent goals and follow-ups</li>
                <li>Key facts and rules relevant to the current context</li>
              </ul>
              <p className="mt-4 text-secondary">This means your AI agent is already oriented when you start typing — no re-briefing, no catching up. It just knows.</p>
              <p className="mt-3 text-secondary">Wake briefings are triggered automatically by the <span className="text-primary font-mono">POST /wake</span> endpoint, which the OpenClaw plugin calls at session start. MCP clients can call it manually.</p>
            </section>

            <section id="storage-decay" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">6. Storage-Based Decay</h2>
              <p className="mt-4 text-secondary">Memory Crystal does <span className="text-primary">not</span> expire memories by time. Your memories persist indefinitely — until you approach your storage limit.</p>
              <p className="mt-3 text-secondary">When you&apos;re near your tier&apos;s memory limit, the decay system activates:</p>
              <ul className="mt-4 space-y-2 text-secondary list-disc pl-5">
                <li>Oldest memories are evaluated first</li>
                <li>Weakest memories (low recall frequency, low importance score) are pruned</li>
                <li>Critical memories — decisions, goals, rules — are protected longer</li>
                <li>Decay only fires when you&apos;re near the limit, not on a schedule</li>
              </ul>
              <p className="mt-4 text-secondary">This means your most-used and most-important context stays forever. Stale, low-signal memories make room when needed.</p>
              <p className="mt-3 text-secondary">To avoid decay entirely, upgrade to a higher tier or delete unused memories manually from the Dashboard.</p>
            </section>

            <section id="mcp-api-reference" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">7. MCP API Reference</h2>
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
              <h2 className="font-heading text-3xl">8. OpenClaw Integration</h2>
              <p className="mt-4 text-secondary">The <span className="text-primary font-mono">crystal-stm</span> hook captures interaction flow automatically.</p>
              <ul className="mt-3 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary font-mono">message:received</span> → log user message to STM</li>
                <li><span className="text-primary font-mono">message:sent</span> → log AI response + capture to sensory memory</li>
              </ul>
              <p className="mt-3 text-secondary">Troubleshooting log: <span className="text-primary font-mono">/tmp/crystal-hook-log.txt</span></p>
            </section>

            <section id="dashboard-guide" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">9. Dashboard Guide</h2>
              <ul className="mt-4 space-y-2 text-secondary list-disc pl-5">
                <li><span className="text-primary">Dashboard</span>: usage stats + recent activity</li>
                <li><span className="text-primary">Memories</span>: browse/search memories, filter by store</li>
                <li><span className="text-primary">Messages</span>: raw conversation feed, role filtering</li>
                <li><span className="text-primary">Checkpoints</span>: create and review snapshots</li>
                <li><span className="text-primary">Settings</span>: API keys + subscription management</li>
              </ul>
            </section>

            <section id="pricing-limits" className="glass-card border border-white/[0.08] p-6 sm:p-8 overflow-x-auto">
              <h2 className="font-heading text-3xl">10. Pricing & Limits</h2>
              <div className="mt-4 min-w-[680px] border border-white/[0.08]">
                <div className="grid grid-cols-6 text-xs font-mono border-b border-white/[0.08] bg-white/[0.03]">
                  <div className="p-3">Tier</div><div className="p-3">Price</div><div className="p-3">Memories</div><div className="p-3">Messages</div><div className="p-3">Retention</div><div className="p-3">Channels</div>
                </div>
                {[
                  ["FREE", "$0", "500", "500", "30 days", "1"],
                  ["STARTER", "$9/mo", "2,500", "5,000", "90 days", "5"],
                  ["PRO", "$19/mo", "10,000", "25,000", "1 year", "Unlimited"],
                  ["ULTRA", "$49/mo", "50,000", "Unlimited", "Unlimited", "Unlimited"],
                ].map((row) => (
                  <div key={row[0]} className="grid grid-cols-6 text-sm border-b last:border-b-0 border-white/[0.06]">
                    {row.map((cell, i) => <div key={i} className="p-3 text-secondary">{cell}</div>)}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-secondary">Additional features by tier:</p>
              <ul className="mt-2 space-y-1 text-secondary list-disc pl-5">
                <li><span className="text-primary">Pro</span>: Reflection pipeline — automatic conversation distillation into lasting memories</li>
                <li><span className="text-primary">Ultra</span>: Priority recall + full API access</li>
              </ul>
              <p className="mt-4 text-secondary">Rate limit: <span className="text-primary">60 requests/minute per API key</span>.</p>
              <p className="mt-1 text-secondary">Storage limits are enforced on capture. Memory decay only activates when you approach your limit — memories do not expire by time.</p>
            </section>

            <section id="faq" className="glass-card border border-white/[0.08] p-6 sm:p-8">
              <h2 className="font-heading text-3xl">11. FAQ</h2>
              <div className="mt-5 space-y-5">
                <div><h3 className="font-heading text-xl">Is my data private?</h3><p className="text-secondary mt-1">Yes. Data is user-scoped with no cross-user access.</p></div>
                <div><h3 className="font-heading text-xl">Can I use this without OpenClaw?</h3><p className="text-secondary mt-1">Yes. Any tool that can make HTTP requests can use the MCP API.</p></div>
                <div><h3 className="font-heading text-xl">How does vector search work?</h3><p className="text-secondary mt-1">Embeddings are generated on capture, then cosine similarity ranks recall results.</p></div>
                <div><h3 className="font-heading text-xl">What happens when I hit my limit?</h3><p className="text-secondary mt-1">Storage-based decay activates: oldest and weakest memories are pruned to make room. You can also upgrade your tier or delete memories manually. New captures receive a 403 if the limit is hard-capped.</p></div>
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
