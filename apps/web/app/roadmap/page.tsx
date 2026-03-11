import { type ComponentType } from "react";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

type RoadmapItem = {
  title: string;
  description?: string;
};

const shippedItems: RoadmapItem[] = [
  { title: "MCP API with vector search" },
  { title: "OpenClaw real-time hook integration" },
  { title: "Tiered billing (Free / Pro / Contact)" },
  { title: "Dashboard with memories, messages, checkpoints" },
  { title: "Email verification + branded SendGrid" },
  { title: "PWA support" },
];

const inProgressItems: RoadmapItem[] = [
  { title: "Custom higher-usage contact plan" },
  { title: "Claude Desktop / Cursor MCP integration" },
  {
    title: "Memory consolidation engine",
    description: "Compress old memories into distilled knowledge.",
  },
  { title: "Multi-agent memory isolation" },
];

const plannedItems: RoadmapItem[] = [
  { title: "Obsidian vault sync" },
  { title: "Knowledge graph visualization" },
  { title: "Memory analytics and insights" },
  { title: "Team/shared memory spaces" },
  { title: "Data export (JSON/CSV)" },
  { title: "Webhook notifications on memory events" },
  { title: "Custom memory retention policies" },
  { title: "MCP server marketplace listing" },
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

function TimelineSection({
  title,
  items,
  icon: Icon,
  iconClass,
}: {
  title: string;
  items: RoadmapItem[];
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
}) {
  return (
    <section className="glass-card border border-border/35 bg-white/[0.02] p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <h2 className="font-heading text-2xl text-primary">{title}</h2>
      </div>

      <ol className="relative ml-1 space-y-5 border-l border-white/10 pl-6">
        {items.map((item) => (
          <li key={item.title} className="relative">
            <span className="absolute -left-[2.02rem] top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#131E26] ring-1 ring-white/10">
              <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
            </span>
            <p className="text-base text-primary">{item.title}</p>
            {item.description ? <p className="mt-1 text-sm text-secondary">{item.description}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <header className="max-w-3xl">
          <BracketLabel label="ROADMAP" />
          <h1 className="mt-3 font-heading text-[clamp(2.25rem,7vw,4.5rem)] leading-tight">Product roadmap</h1>
          <p className="mt-4 text-lg text-secondary">Focused delivery across platform, memory intelligence, and integrations.</p>
        </header>

        <div className="mt-12 space-y-6">
          <TimelineSection title="SHIPPED" items={shippedItems} icon={CheckCircle2} iconClass="text-[#2ed38f]" />
          <TimelineSection title="IN PROGRESS" items={inProgressItems} icon={Clock3} iconClass="text-accent" />
          <TimelineSection title="PLANNED" items={plannedItems} icon={Circle} iconClass="text-white/70" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
