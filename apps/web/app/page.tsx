import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CrystalIcon from "./components/CrystalIcon";
import TabbedInstallCommand from "./components/TabbedInstallCommand";
import TerminalAnimation from "./components/TerminalAnimation";
import MockScreenshots from "./components/MockScreenshots";
import ExplainerAnimation from "./components/ExplainerAnimation";

const whyItMatters = [
  "OpenClaw sessions compact and reset. Your context should not.",
  "Stop repeating architecture decisions and team conventions every day.",
  "Give every agent the same shared memory layer across sessions.",
];

const contextManagerLimits = [
  "Session-scoped only",
  "Single platform",
  "Regex/keyword search",
  "Gone when session resets",
  "No semantic understanding",
];

const memoryCrystalAdvantages = [
  "Cross-session persistence",
  "Works with OpenClaw + Claude Code + Codex + any MCP client",
  "Semantic embedding search",
  "Knowledge graph with 3,800+ nodes",
  "Survives compaction/restarts/new sessions",
];

const platformBadges = ["OpenClaw", "Claude Code", "Codex CLI", "Cursor", "Any MCP Client"];

function BracketHeading({ children }: { children: string }) {
  return (
    <p className="text-xs font-mono text-secondary tracking-[0.25em] uppercase">
      <span className="text-accent">[ </span>
      {children}
      <span className="text-accent"> ]</span>
    </p>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />

      <main>
        {/* ── 1. INSTALL (with SEO H1) ── */}
        <section id="install" className="relative border-b border-white/[0.07] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="gradient-pulse" />
            <div className="crystal-lattice opacity-70" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
              <div>
                <h1 className="text-[clamp(2rem,7vw,4.6rem)] leading-[1.02] tracking-wide">
                  Persistent Memory
                  <br />
                  <span className="font-bold">for AI Agents</span>
                </h1>
                <p className="mt-4 font-heading text-xl md:text-2xl text-secondary">
                  Install in one command.
                </p>
                <p className="mt-3 max-w-xl text-secondary">
                  Pick your platform. Run the command. Approve in your browser. Done.
                </p>
                <div className="mt-6">
                  <TabbedInstallCommand />
                </div>
              </div>
              <div>
                <TerminalAnimation />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. VALUE PROP ── */}
        <section className="border-b border-white/[0.07] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
              <div>
                <BracketHeading>WHY MEMORY CRYSTAL</BracketHeading>
                <h2 className="mt-3 font-heading text-3xl md:text-5xl leading-[1.05]">
                  Stop re-explaining.
                  <br />
                  Start shipping.
                </h2>
                <p className="mt-6 text-base md:text-lg text-primary max-w-2xl">
                  Memory Crystal gives your AI agents durable memory across compactions, restarts, and new
                  sessions. Decisions, workflows, and context stay available exactly when your agent needs
                  them.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-secondary">
                  <span className="text-secondary/80">Works with</span>
                  {platformBadges.map((platform) => (
                    <span key={platform} className="rounded-full border border-[#2180D6]/30 bg-white/[0.03] px-3 py-1 text-primary/90">
                      {platform}
                    </span>
                  ))}
                </div>
                <div className="mt-5 glass-card border border-[#2180D6]/20 px-4 py-3 max-w-3xl">
                  <p className="text-sm md:text-[15px] text-primary/95">
                    1,800+ memories • 3,800+ graph nodes • 4,900+ relations • Semantic recall across every session
                  </p>
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

        {/* ── 3. CONTEXT VS MEMORY ── */}
        <section className="border-b border-white/[0.07] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>CONTEXT VS MEMORY</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl max-w-5xl">
              Context management keeps your conversation. Memory Crystal keeps your knowledge.
            </h2>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <article className="glass-card border border-white/[0.08] p-6 md:p-7">
                <h3 className="font-heading text-2xl">Context Managers</h3>
                <ul className="mt-5 space-y-3">
                  {contextManagerLimits.map((point) => (
                    <li key={point} className="flex gap-3 text-sm text-primary leading-relaxed">
                      <span className="mt-1 h-2 w-2 rounded-full bg-white/35 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="glass-card border border-[#2180D6]/30 bg-[#2180D6]/[0.05] p-6 md:p-7">
                <h3 className="font-heading text-2xl text-primary">Memory Crystal</h3>
                <ul className="mt-5 space-y-3">
                  {memoryCrystalAdvantages.map((point) => (
                    <li key={point} className="flex gap-3 text-sm text-primary leading-relaxed">
                      <CrystalIcon size={14} glow className="shrink-0 mt-1 text-[#2180D6]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ── 4. SCREENSHOTS ── */}
        <section className="border-b border-white/[0.07] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>MEMORY IN ACTION</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl max-w-5xl">
              See what happens when your agent actually remembers.
            </h2>
            <p className="mt-3 max-w-3xl text-secondary">
              Real examples across terminal, Discord, and Telegram — your agent recalls context no matter where the conversation happens.
            </p>
            <MockScreenshots />
          </div>
        </section>

        {/* ── 5. HOW IT WORKS ── */}
        <section className="border-b border-white/[0.07] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>HOW IT WORKS</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl max-w-4xl">
              From conversation to persistent knowledge in six steps.
            </h2>
            <p className="mt-3 max-w-3xl text-secondary">
              Memory Crystal captures, embeds, enriches, and stores your agent&apos;s context — then recalls it automatically when needed.
            </p>
            <ExplainerAnimation />
          </div>
        </section>

        {/* ── 6. CTA ── */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <BracketHeading>READY TO STOP LOSING CONTEXT?</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Install now. Start free.</h2>
            <p className="mt-4 text-secondary">
              Free plan includes 500 memories, semantic search, graph enrichment, and 3 platform channels.
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
