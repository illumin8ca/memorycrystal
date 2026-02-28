import Link from "next/link";

const docsSections = [
  {
    title: "Installation",
    code: `npm run vexclaw:bootstrap`,
    details:
      "Bootstraps the plugin into your OpenClaw workspace and writes baseline captures and session hooks.",
  },
  {
    title: "Configuration",
    code: `# mcp.json
{
  "plugins": [
    "vexclaw-memory",
    "vexclaw-capture"
  ],
  "vexclaw": {
    "session_ttl_days": 14,
    "memory_limit": 500
  }
}`,
    details:
      "Keep plugin values explicit so recall and capture remain predictable across environments.",
  },
  {
    title: "MCP Tools",
    code: `vexclaw_remember
vexclaw_recall
vexclaw_wake
vexclaw_checkpoint
vexclaw_stats
vexclaw_forget
vexclaw_why_did_we
vexclaw_what_do_i_know`,
    details:
      "Tools are exposed through the MCP server and can be invoked by your orchestrators.",
  },
  {
    title: "Memory Stores",
    code: `sensory
episodic
semantic
procedural
prospective`,
    details:
      "Each store supports targeted writes and recall behavior tuned for different memory lifecycles.",
  },
  {
    title: "API Reference",
    code: `POST /vexclaw/remember
POST /vexclaw/recall
GET  /vexclaw/stats
POST /vexclaw/wake`,
    details:
      "Use token-authenticated requests with your project-specific MEMORY CRYSTAL API key.",
  },
];

function DocsNav() {
  return (
    <header className="border-b border-[rgba(255,255,255,0.08)] bg-[#050508]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-heading text-lg tracking-wide neon-text">
          MEMORY CRYSTAL
        </Link>
        <nav className="flex items-center gap-6 text-sm text-[#8899bb]">
          <Link href="/" className="hover:text-[#00aaff]">
            Home
          </Link>
          <Link href="/pricing" className="hover:text-[#00aaff]">
            Pricing
          </Link>
          <Link href="/changelog" className="hover:text-[#00aaff]">
            Changelog
          </Link>
        </nav>
      </div>
    </header>
  );
}

function BracketHeading({ children }: { children: string }) {
  return (
    <p className="text-xs font-mono text-[#8899bb] tracking-[0.28em] uppercase mb-4">
      <span className="text-[#00aaff]">[ </span>
      {children}
      <span className="text-[#00aaff]"> ]</span>
    </p>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-[#f0f4ff]">
      <DocsNav />

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <BracketHeading children="DOCUMENTATION" />
        <h1 className="font-heading text-5xl md:text-6xl">Get started in minutes.</h1>
        <p className="mt-5 max-w-2xl text-[#8899bb]">
          Deploy MEMORY CRYSTAL with the required pieces in place and start feeding persistent memory immediately.
        </p>

        <section className="mt-10 space-y-6">
          {docsSections.map((section) => (
            <article key={section.title} className="glass-card border border-[rgba(255,255,255,0.16)] p-7">
              <h2 className="font-heading text-3xl">{section.title}</h2>
              <p className="mt-3 text-[#8899bb] max-w-3xl">{section.details}</p>
              <pre className="mt-5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] p-4 overflow-x-auto text-sm">
                <code className="text-[#f0f4ff] font-mono leading-relaxed">{section.code}</code>
              </pre>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-[rgba(255,255,255,0.08)] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-wrap justify-between text-[#8899bb] text-sm">
          <p className="neon-text font-heading">MEMORY CRYSTAL</p>
          <p>Built on OpenClaw</p>
          <p>© {new Date().getFullYear()} MEMORY CRYSTAL</p>
        </div>
      </footer>
    </div>
  );
}
