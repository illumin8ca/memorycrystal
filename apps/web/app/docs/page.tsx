import Header from "../components/Header";
import Footer from "../components/Footer";

const docsSections = [
  {
    title: "Installation",
    code: `npm run crystal:bootstrap`,
    details:
      "Bootstraps the plugin into your OpenClaw workspace and writes baseline captures and session hooks.",
  },
  {
    title: "Configuration",
    code: `# mcp.json
{
  "plugins": [
    "crystal-memory",
    "crystal-capture"
  ],
  "crystal": {
    "session_ttl_days": 14,
    "memory_limit": 500
  }
}`,
    details:
      "Keep plugin values explicit so recall and capture remain predictable across environments.",
  },
  {
    title: "MCP Tools",
    code: `crystal_remember
crystal_recall
crystal_wake
crystal_checkpoint
crystal_stats
crystal_forget
crystal_why_did_we
crystal_what_do_i_know`,
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
    code: `POST /crystal/remember
POST /crystal/recall
GET  /crystal/stats
POST /crystal/wake`,
    details:
      "Use token-authenticated requests with your project-specific Memory Crystal API key.",
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

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <BracketHeading>DOCUMENTATION</BracketHeading>
        <h1 className="font-heading text-5xl md:text-6xl">Get started in minutes.</h1>
        <p className="mt-5 max-w-2xl text-secondary">
          Deploy Memory Crystal with the required pieces in place and start feeding persistent memory immediately.
        </p>

        <section className="mt-10 space-y-6">
          {docsSections.map((section) => (
            <article key={section.title} className="glass-card border border-border/45 p-7">
              <h2 className="font-heading text-3xl">{section.title}</h2>
              <p className="mt-3 text-secondary max-w-3xl">{section.details}</p>
              <pre className="mt-5 bg-border/5 border border-border/30 p-4 overflow-x-auto text-sm">
                <code className="text-primary font-mono leading-relaxed">{section.code}</code>
              </pre>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
