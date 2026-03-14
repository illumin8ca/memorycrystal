import Header from "../components/Header";
import Footer from "../components/Footer";

const releaseEntries = [
  {
    version: "v0.2.5",
    date: "March 14, 2026",
    items: [
      "Streamable HTTP MCP server — connect Claude Code, Codex, Factory, and any MCP client via https://api.memorycrystal.ai/mcp",
      "Cross-platform install: tabbed setup commands for OpenClaw, Claude Code, Codex, and Factory with platform badges",
      "Browser-based device auth — installer opens your browser, you log in, API key is provisioned automatically",
      "Memory migration tool — import existing OpenClaw markdown memories during install",
      "Gemini-native backend — all embeddings and graph enrichment now run on Gemini (zero OpenAI dependency)",
      "Graph enrichment uses Gemini 2.5 Flash (Pro/Ultra) and Gemini 2.0 Flash (Starter) for entity and relation extraction",
      "Improved recall performance — indexed message queries replace full table scans",
      "Homepage redesign — Factory-style hero with one-command install above the fold",
      "About page with team info",
      "Blog and eval dashboard color consistency — brand accent applied throughout",
    ],
  },
  {
    version: "v0.2.4",
    date: "March 14, 2026",
    items: [
      "Improved recall accuracy — channel filter no longer blocks cross-session memory retrieval",
      "OpenClaw v2026.3.12 compatibility — verified plugin loads under new security model",
      "Install script cleans legacy hook entries for smoother upgrades",
      "Product demo video and updated homepage visuals",
      "Blog section launched with 10 articles covering use cases, guides, and best practices",
      "First GitHub release published — install script now pulls versioned plugin tarballs",
    ],
  },
  {
    version: "v0.2.3",
    date: "March 12, 2026",
    items: [
      "Gemini Embedding 2 support (3072-dimensional vectors) for richer semantic recall",
      "Multimodal asset support: images, audio, video, PDF, and text can now be embedded and searched",
      "New API endpoint: /api/mcp/asset for storing and embedding media with automatic background processing",
      "Short-term message search: /api/mcp/search-messages and /api/mcp/recent-messages for conversation-level recall",
      "crystal_search_messages tool — search exact past conversation turns, not just long-term memories",
      "Wake briefing now injects relevant memories and recent message matches at session start",
      "OpenClaw plugin upgraded to v0.2.3 — more reliable hook registration, better assistant text extraction",
      "Installer is now idempotent — safe to re-run, skips restart if nothing changed",
      "API key validation added to installer before any changes are made",
      "Dashboard: split settings into API Keys and Billing tabs",
      "Dashboard: new Get Started onboarding tab with install docs",
      "Contact form for sales and enterprise inquiries",
    ],
  },
  {
    version: "v0.1.0",
    date: "March 3, 2026",
    items: [
      "Memory Crystal beta launched",
      "MCP HTTP API (capture, recall, checkpoint, wake, stats)",
      "OpenClaw one-liner installer: curl -fsSL https://memorycrystal.ai/install | bash",
      "Semantic search with vector embeddings",
      "Per-API-key rate limiting (60 req/min)",
      "Polar billing integration (Free / Pro plans + custom contact sales)",
      "PWA support — installable on iOS and Android",
    ],
  },
];

function BracketHeading({ children }: { children: string }) {
  return (
    <p className="text-xs font-mono text-secondary tracking-[0.28em] uppercase mb-4">
      <span className="text-accent">[ </span>
      {children}
      <span className="text-accent"> ]</span>
    </p>
  );
}

export default function ReleasesPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <BracketHeading>RELEASES</BracketHeading>
        <h1 className="font-heading text-5xl md:text-6xl">Release notes.</h1>

        <section className="mt-10 space-y-5">
          {releaseEntries.map((entry) => (
            <article key={entry.version} className="glass-card border border-border/45 p-6">
              <div className="font-mono text-accent text-sm">{entry.version} — {entry.date}</div>
              <ul className="mt-4 space-y-2 text-secondary leading-relaxed list-disc pl-5">
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
