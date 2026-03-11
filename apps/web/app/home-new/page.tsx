import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CrystalIcon from "../components/CrystalIcon";
import { InstallCommandCard, DEFAULT_INSTALL_COMMAND } from "../components/InstallCommandCard";

const coreFeatures = [
  {
    title: "Graph Enrichment",
    copy: "Memory Crystal links memories to people, projects, decisions, and tools so your agent recalls connected context, not isolated snippets.",
  },
  {
    title: "Adaptive Recall Modes",
    copy: "Switch between general, decision, project, people, workflow, and conversation recall to pull exactly the context needed for each task.",
  },
  {
    title: "Relationship Tools",
    copy: "Trace ownership, dependencies, and cross-project links with built-in graph tools that keep your AI grounded in reality.",
  },
  {
    title: "Memory Health Dashboard",
    copy: "See coverage, staleness, and memory quality at a glance so you can trust what your agent remembers.",
  },
  {
    title: "Salience Filtering",
    copy: "Important memories are promoted. Low-value noise stays out of the way. Recall stays sharp as your history grows.",
  },
];

const whyItMatters = [
  "OpenClaw sessions compact and reset. Your context should not.",
  "Stop repeating architecture decisions and team conventions every day.",
  "Give every agent the same shared memory layer across sessions.",
];

function BracketHeading({ children }: { children: string }) {
  return (
    <p className="text-xs font-mono text-secondary tracking-[0.25em] uppercase">
      <span className="text-accent">[ </span>
      {children}
      <span className="text-accent"> ]</span>
    </p>
  );
}

function ActionTile({
  title,
  copy,
  cta,
  href,
  variant = "secondary",
}: {
  title: string;
  copy: string;
  cta: string;
  href: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <article className="glass-card border border-white/[0.08] p-5 flex flex-col justify-between min-h-[200px]">
      <div>
        <h3 className="font-heading text-2xl">{title}</h3>
        <p className="mt-3 text-secondary text-sm leading-relaxed">{copy}</p>
      </div>
      <Link
        href={href}
        className={`${variant === "primary" ? "btn-primary" : "btn-secondary"} mt-5 inline-flex items-center justify-center px-4 py-3 text-xs`}
      >
        {cta}
      </Link>
    </article>
  );
}

export default function HomeNewPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />

      <main>
        <section className="relative border-b border-white/[0.07] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="gradient-pulse" />
            <div className="crystal-lattice opacity-70" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
              <div>
                <BracketHeading>PERSISTENT MEMORY FOR AI AGENTS</BracketHeading>
                <h1 className="mt-3 text-[clamp(2rem,7vw,4.6rem)] leading-[1.02] tracking-wide">
                  Stop re-explaining.
                  <br />
                  <span className="font-bold">Start shipping.</span>
                </h1>
                <p className="mt-6 text-base md:text-lg text-primary max-w-2xl">
                  Memory Crystal gives OpenClaw and MCP-based agents durable memory across compactions,
                  restarts, and new sessions. Decisions, workflows, and context stay available exactly when
                  your agent needs them.
                </p>

                <div className="mt-7 grid sm:grid-cols-3 gap-3 max-w-3xl">
                  <ActionTile
                    title="Quick Start"
                    copy="Read the fast setup flow and get your first memory-backed agent live in minutes."
                    cta="OPEN DOCS"
                    href="/docs"
                  />
                  <ActionTile
                    title="Copy Install"
                    copy="Use the one-line install command and connect without changing your workflow."
                    cta="COPY INSTALL"
                    href="#install"
                  />
                  <ActionTile
                    title="Get a Free API Key"
                    copy="Start on the free tier now. Upgrade only when your memory graph grows."
                    cta="VIEW FREE PLAN"
                    href="/pricing"
                    variant="primary"
                  />
                </div>
              </div>

              <aside className="glass-card border border-white/[0.08] p-6 md:p-8">
                <p className="text-xs font-mono text-accent tracking-[0.2em] uppercase">Why teams switch</p>
                <ul className="mt-4 space-y-4">
                  {whyItMatters.map((point) => (
                    <li key={point} className="flex gap-3 text-sm text-primary leading-relaxed">
                      <CrystalIcon size={14} glow className="shrink-0 mt-1" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-white/[0.08]">
                  <p className="text-secondary text-sm">
                    Works with OpenClaw, Claude Code, Codex CLI, and any MCP-compatible client.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/pricing" className="btn-primary px-4 py-3 text-xs inline-flex items-center justify-center">
                      START FREE
                    </Link>
                    <Link href="/dashboard" className="btn-secondary px-4 py-3 text-xs inline-flex items-center justify-center">
                      OPEN DASHBOARD
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="install" className="border-b border-white/[0.07] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>GET STARTED</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Install in one command. Connect in minutes.</h2>
            <p className="mt-3 max-w-3xl text-secondary">
              This is the fastest path: copy install, link your account, and let Memory Crystal begin capturing and recalling context immediately.
            </p>
            <div className="mt-7">
              <InstallCommandCard
                title="Quick Install for OpenClaw + MCP"
                description="Copy this command, run it once, then activate your free API key from pricing."
                command={DEFAULT_INSTALL_COMMAND}
                showDocsLink
              />
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.07] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>WHAT MEMORY CRYSTAL DOES</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">A memory system built for serious AI work.</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coreFeatures.map((feature) => (
                <article key={feature.title} className="glass-card border border-white/[0.08] p-6">
                  <CrystalIcon size={20} glow />
                  <h3 className="mt-3 font-heading text-2xl">{feature.title}</h3>
                  <p className="mt-3 text-secondary text-sm leading-relaxed">{feature.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.07] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>DEMO VIDEO</BracketHeading>
            <div className="glass-card border border-dashed border-accent/40 p-8 md:p-10">
              <h3 className="font-heading text-2xl md:text-3xl">Live product demo coming soon</h3>
              <p className="mt-3 text-secondary max-w-2xl">
                Andy will add a walkthrough video here showing installation, recall, and graph enrichment in action.
              </p>
              <div className="mt-6 h-48 md:h-64 border border-white/[0.09] bg-white/[0.02] flex items-center justify-center text-secondary text-sm font-mono tracking-[0.16em] uppercase">
                Video Placeholder
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.07] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>SCREENSHOTS / WALKTHROUGH</BracketHeading>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card border border-dashed border-white/[0.18] p-6">
                <h3 className="font-heading text-xl">Dashboard and graph views</h3>
                <div className="mt-4 h-56 border border-white/[0.09] bg-white/[0.02] flex items-center justify-center text-secondary text-sm font-mono tracking-[0.14em] uppercase">
                  Screenshot Placeholder A
                </div>
              </div>
              <div className="glass-card border border-dashed border-white/[0.18] p-6">
                <h3 className="font-heading text-xl">Install + recall flow visuals</h3>
                <div className="mt-4 h-56 border border-white/[0.09] bg-white/[0.02] flex items-center justify-center text-secondary text-sm font-mono tracking-[0.14em] uppercase">
                  Screenshot Placeholder B
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <BracketHeading>READY TO STOP LOSING CONTEXT?</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Install now. Start free. Keep your agent aligned.</h2>
            <p className="mt-4 text-secondary">
              Get the free plan, copy install, and turn Memory Crystal on before your next coding session.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/pricing" className="btn-primary px-6 py-3 text-xs inline-flex items-center justify-center">
                GET FREE API KEY
              </Link>
              <a href="#install" className="btn-secondary px-6 py-3 text-xs inline-flex items-center justify-center">
                COPY INSTALL COMMAND
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
