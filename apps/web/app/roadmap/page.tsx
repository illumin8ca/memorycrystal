import Link from "next/link";
import CrystalIcon from "../components/CrystalIcon";
import Header from "../components/Header";
import Footer from "../components/Footer";

type Status = "SHIPPED" | "IN PROGRESS" | "PLANNED";

type RoadmapItem = {
  quarter: string;
  status: Status;
  title: string;
  description: string;
  features: string[];
};

const roadmapItems: RoadmapItem[] = [
  {
    quarter: "Q1 2026",
    status: "SHIPPED",
    title: "Launch",
    description: "Persistent memory for AI agents. Free, Pro, and Ultra tiers.",
    features: [
      "OpenClaw native plugin with auto-capture",
      "Claude Code MCP server integration",
      "Codex CLI MCP server integration",
      "5 memory stores: episodic, semantic, procedural, prospective, sensory",
      "Spreading activation recall",
      "Obsidian vault sync",
      "Wake briefings at session start",
    ],
  },
  {
    quarter: "Q2 2026",
    status: "IN PROGRESS",
    title: "Memory Caching",
    description: "Recall performance at the speed of thought.",
    features: [
      "Warm cache of top-N memories per session",
      "Prompt-cache-style pre-loading before session start",
      "Sub-100ms recall for hot memories",
      "Intelligent cache invalidation based on recency + relevance",
    ],
  },
  {
    quarter: "Q3 2026",
    status: "PLANNED",
    title: "True Knowledge Graph",
    description: "Your AI understands relationships, not just facts.",
    features: [
      "Typed entity resolution (people, projects, decisions, concepts)",
      "Relation inference from conversation patterns",
      "Graph traversal queries: \"what did we decide about X?\"",
      "Visual graph explorer in dashboard",
    ],
  },
  {
    quarter: "Q4 2026",
    status: "PLANNED",
    title: "Team Memory",
    description: "Shared context across agents and collaborators.",
    features: [
      "Org-level memory spaces",
      "Role-based memory access",
      "Cross-agent context sharing",
      "Memory merge and conflict resolution",
    ],
  },
  {
    quarter: "2027",
    status: "PLANNED",
    title: "Memory Marketplace",
    description: "The ecosystem for AI memory.",
    features: [
      "Share skill packs, policy packs, persona bundles",
      "Community memory templates",
      "One-click memory imports",
      "Developer SDK for custom memory integrations",
    ],
  },
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

function statusClasses(status: Status) {
  if (status === "SHIPPED") {
    return {
      badge: "bg-[#00cc88]/15 text-[#00cc88] border border-[#00cc88]/40",
      card: "border-l border-l-[#00cc88]/70",
    };
  }

  if (status === "IN PROGRESS") {
    return {
      badge: "bg-accent/15 text-accent border border-accent/40",
      card: "border-l border-l-accent glow-pulse",
    };
  }

  return {
    badge: "bg-secondary/25 text-secondary border border-secondary",
    card: "",
  };
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8">
        <header className="max-w-3xl">
          <BracketLabel label="ROADMAP" />
          <h1 className="mt-3 font-heading text-[clamp(2.25rem,7vw,4.5rem)] leading-tight">
            Where Memory Crystal is going.
          </h1>
          <p className="mt-4 text-lg text-secondary">Built in public. Shipping fast.</p>
        </header>

        <section className="relative mt-16 md:mt-20">
          <div className="absolute top-0 bottom-0 left-4 w-px bg-accent/20 md:left-1/2 md:-translate-x-1/2" />

          <div className="space-y-10 md:space-y-14">
            {roadmapItems.map((item, index) => {
              const isLeft = index % 2 === 0;
              const sideClass = isLeft
                ? "md:justify-start md:pr-[calc(50%+2rem)]"
                : "md:justify-end md:pl-[calc(50%+2rem)]";
              const animationClass = isLeft ? "slide-in-left" : "slide-in-right";
              const statusStyle = statusClasses(item.status);

              return (
                <article key={`${item.quarter}-${item.title}`} className={`relative flex ${sideClass}`}>
                  <div className="absolute left-4 top-8 h-3 w-3 rotate-45 bg-accent shadow-[0_0_20px_rgba(33,128,214,0.3)] md:left-1/2 md:top-10 md:-translate-x-1/2" />

                  <div
                    className={`w-full md:max-w-[calc(50%-2rem)] ${animationClass} glass-card border border-border/25 p-6 md:p-7 ${statusStyle.card}`}
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{item.quarter}</p>
                      <span className={`px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em] ${statusStyle.badge}`}>
                        {item.status}
                      </span>
                    </div>

                    <h2 className="mt-4 font-heading text-2xl">{item.title}</h2>
                    <p className="mt-3 text-secondary leading-relaxed">{item.description}</p>

                    <ul className="mt-5 space-y-2 text-sm text-primary">
                      {item.features.map((feature) => (
                        <li key={feature} className="flex gap-3">
                          <CrystalIcon size={14} glow className="shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-20 border border-border/25 bg-border/8 p-8 backdrop-blur-[12px] md:mt-24 md:p-10">
          <h2 className="font-heading text-3xl">Have a feature request?</h2>
          <p className="mt-3 text-secondary">We build in public. Join our Discord to shape what we ship next.</p>
          <Link
            href="https://discord.com"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex px-6 py-3 font-mono text-xs tracking-[0.16em] text-white bg-accent shadow-[0_0_20px_rgba(33,128,214,0.3)] hover:brightness-110 transition"
          >
            JOIN DISCORD
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
