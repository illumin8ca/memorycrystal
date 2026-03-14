import Header from "../components/Header";
import Footer from "../components/Footer";

const releaseEntries = [
  {
    version: "v0.2.4",
    date: "March 13, 2026",
    items: [
      "OpenClaw v2026.3.12 compatibility — cleaned stale hook entries, verified plugin loads under new security model",
      "Install script now cleans legacy cortex-mcp hook entries for smoother upgrades",
      "Fixed signup auth flow — synced missing SENDGRID_API_KEY and AUTH_SECRET to production Convex deployment",
      "Added Remotion video project for programmatic product demo generation (video/)",
      "Homepage placeholders replaced with generated product visuals and autoplay demo video",
      "Added mandatory release workflow to repo AGENTS.md — version bumps require What&apos;s New + docs updates",
      "Daily OpenClaw release monitor cron — automatically checks for upstream changes affecting Memory Crystal",
      "Blog section launched with 10 articles covering use cases, guides, and best practices",
    ],
  },
  {
    version: "v0.2.3",
    date: "March 12, 2026",
    items: [
      "Switched to Gemini Embedding 2 (3072-dimensional vectors) — richer, faster semantic recall",
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
      "Real-time semantic search with OpenAI embeddings",
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

export default function WhatsNewPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <BracketHeading>WHAT&apos;S NEW</BracketHeading>
        <h1 className="font-heading text-5xl md:text-6xl">What we shipped.</h1>

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
