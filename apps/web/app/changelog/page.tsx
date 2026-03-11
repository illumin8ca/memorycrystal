import Header from "../components/Header";
import Footer from "../components/Footer";

const changelogEntries = [
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

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <BracketHeading>CHANGELOG</BracketHeading>
        <h1 className="font-heading text-5xl md:text-6xl">What we shipped.</h1>

        <section className="mt-10 space-y-5">
          {changelogEntries.map((entry) => (
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
