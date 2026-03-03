import Header from "../components/Header";
import Footer from "../components/Footer";

type RoadmapItem = {
  status: "done" | "next";
  title: string;
};

const roadmapItems: RoadmapItem[] = [
  { status: "done", title: "MCP API + OpenClaw plugin" },
  { status: "done", title: "Semantic vector search" },
  { status: "done", title: "Polar billing" },
  { status: "next", title: "Multi-agent memory isolation (Ultra)" },
  { status: "next", title: "Obsidian vault sync" },
  { status: "next", title: "Knowledge graph UI" },
  { status: "next", title: "Claude Desktop / Cursor MCP integration" },
  { status: "next", title: "Memory analytics dashboard" },
  { status: "next", title: "Team/shared memory spaces" },
];

function BracketLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-mono text-secondary tracking-[0.25em] uppercase">
      <span className="text-accent">[ </span>
      {label}
      <span className="text-accent"> ]</span>
    </p>
  );
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <header className="max-w-3xl">
          <BracketLabel label="ROADMAP" />
          <h1 className="mt-3 font-heading text-[clamp(2.25rem,7vw,4.5rem)] leading-tight">What&apos;s shipping next.</h1>
          <p className="mt-4 text-lg text-secondary">Built in public. Prioritized for real users.</p>
        </header>

        <section className="mt-12 glass-card border border-border/35 p-6 md:p-8">
          <ul className="space-y-3">
            {roadmapItems.map((item) => (
              <li key={item.title} className="flex items-start gap-3 text-base">
                <span className={item.status === "done" ? "text-[#00cc88]" : "text-accent"}>
                  {item.status === "done" ? "✅" : "🔜"}
                </span>
                <span className="text-primary">{item.title}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
