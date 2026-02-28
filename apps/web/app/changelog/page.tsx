import Link from "next/link";

const changelogEntries = [
  {
    version: "v1.0.0",
    title: "Phase 5: Spreading activation, vexclaw_wake, MEMORY.md migration",
    details:
      "Introduced graph-aware scoring for recall plus session wake-up briefings and full migration tooling for MEMORY.md stores.",
  },
  {
    version: "v0.9.0",
    title: "Phase 4: Auth, dashboard, Railway deployment, Polar billing",
    details:
      "Production dashboard workflows, Stripe-ready pricing paths, and stable deployment path for hosted rollout.",
  },
  {
    version: "v0.8.0",
    title: "Phase 3: Knowledge graph foundation, typed entities and relations",
    details:
      "Added type-aware relation tables and graph hydration during memory ingestion and recall scoring.",
  },
  {
    version: "v0.7.0",
    title: "Phase 2: Obsidian sync, Notion integration, 1,525 seed memories",
    details:
      "Expanded connector ecosystem and seeded synthetic memory sets for realistic baseline behavior.",
  },
  {
    version: "v0.6.0",
    title: "Phase 1: Core MCP tools, Convex backend, plugin wiring",
    details:
      "Shipped initial memory pipeline, schema contracts, and plugin hooks for capture and recall capture.",
  },
];

function BracketHeading({ children }: { children: string }) {
  return (
    <p className="text-xs font-mono text-[#8899bb] tracking-[0.28em] uppercase mb-4">
      <span className="text-[#00aaff]">[ </span>
      {children}
      <span className="text-[#00aaff]"> ]</span>
    </p>
  );
}

function ChangelogHeader() {
  return (
    <header className="border-b border-[rgba(255,255,255,0.08)] bg-[#050508]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-heading text-lg tracking-wide neon-text">
          MEMORY CRYSTAL
        </Link>
        <nav className="flex items-center gap-6 text-sm text-[#8899bb]">
          <Link href="/docs" className="hover:text-[#00aaff]">
            Docs
          </Link>
          <Link href="/pricing" className="hover:text-[#00aaff]">
            Pricing
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-[#f0f4ff]">
      <ChangelogHeader />
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <BracketHeading children="CHANGELOG" />
        <h1 className="font-heading text-5xl md:text-6xl">What we shipped.</h1>

        <section className="mt-10 space-y-5">
          {changelogEntries.map((entry) => (
            <article key={entry.version} className="glass-card border border-[rgba(255,255,255,0.16)] p-6">
              <div className="font-mono text-[#00aaff] text-sm">{entry.version}</div>
              <h2 className="mt-2 text-2xl font-heading">{entry.title}</h2>
              <p className="mt-3 text-[#8899bb] leading-relaxed">{entry.details}</p>
            </article>
          ))}
        </section>
      </main>
      <footer className="border-t border-[rgba(255,255,255,0.08)] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between text-[#8899bb] text-sm">
          <p className="font-heading text-lg neon-text">MEMORY CRYSTAL</p>
          <p>Built on OpenClaw</p>
          <p>© {new Date().getFullYear()} MEMORY CRYSTAL</p>
        </div>
      </footer>
    </div>
  );
}
