import Image from "next/image";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CrystalIcon from "./components/CrystalIcon";
import TabbedInstallCommand from "./components/TabbedInstallCommand";

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



export default function HomePage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />

      <main>
        <section className="relative border-b border-white/[0.07] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="gradient-pulse" />
            <div className="crystal-lattice opacity-70" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
            <div className="flex flex-col items-center">
              <BracketHeading>PERSISTENT MEMORY FOR AI AGENTS</BracketHeading>
              <h1 className="mt-4 font-heading text-[clamp(2.4rem,7vw,5.5rem)] leading-[0.98] tracking-[-0.03em] max-w-4xl">
                Your AI forgets everything.
                <br />
                Fix that.
              </h1>
              <p className="mt-5 max-w-2xl text-base md:text-lg text-secondary leading-relaxed">
                Persistent memory for OpenClaw, MCP, and agent workflows that should not reset every session.
              </p>

              <div className="mt-10 w-full max-w-3xl text-left">
                <TabbedInstallCommand />
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/pricing" className="btn-primary px-6 py-3 text-xs inline-flex items-center justify-center">
                  START FREE
                </Link>
                <Link href="/docs" className="btn-secondary px-6 py-3 text-xs inline-flex items-center justify-center">
                  READ DOCS
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="install" className="border-b border-white/[0.07] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>WHY TEAMS SWITCH</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Stop losing context between sessions.</h2>
            <p className="mt-3 max-w-3xl text-secondary">
              The install is above. This is why people keep it: once memory is persistent, your agent stops making you repeat yourself.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {whyItMatters.map((point) => (
                <article key={point} className="glass-card border border-white/[0.08] p-5">
                  <CrystalIcon size={18} glow />
                  <p className="mt-3 text-sm text-primary leading-relaxed">{point}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.07] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>WORKS EVERYWHERE YOUR AGENTS DO</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">One memory layer. Every platform.</h2>
            <p className="mt-3 max-w-3xl text-secondary">
              Memory Crystal connects via MCP — the open standard for AI tool integration.
              Your memories are shared across every agent and client that supports it.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: "OpenClaw", desc: "Native plugin with deep integration — auto-capture, recall hooks, and wake briefings.", platforms: "macOS · Linux" },
                { name: "Claude Code", desc: "Add as a Streamable HTTP MCP server. Claude gets persistent memory across coding sessions.", platforms: "macOS · Linux · Windows" },
                { name: "Codex CLI", desc: "Register as an MCP server in config.toml. Memory persists across Codex sessions and IDE.", platforms: "macOS · Linux · Windows" },
                { name: "Factory / Droid", desc: "Add via /mcp or the Droid CLI. Your agent's memory travels between Factory projects.", platforms: "macOS · Linux · Windows" },
              ].map((client) => (
                <article key={client.name} className="glass-card border border-white/[0.08] p-5">
                  <p className="font-mono text-accent text-sm">{client.name}</p>
                  <p className="mt-2 text-sm text-primary leading-relaxed">{client.desc}</p>
                  <p className="mt-3 text-xs text-secondary font-mono">{client.platforms}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-secondary text-sm">
              Switching agents? Your memories come with you. Memory Crystal is the shared layer underneath.
              Already using OpenClaw&apos;s built-in memory? The installer migrates your existing memories automatically.
            </p>
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
            <BracketHeading>SEE IT IN ACTION</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Memory that works across every session.</h2>
            <div className="mt-8 glass-card border border-white/[0.08] overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                poster="/images/crystal-demo-poster.webp"
                className="w-full aspect-video object-cover"
              >
                <source src="/images/demo-loop.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.07] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>INSIDE THE PRODUCT</BracketHeading>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card border border-white/[0.08] overflow-hidden">
                <Image
                  src="/images/dashboard-preview.webp"
                  alt="Memory Crystal dashboard showing memories, stats, and recall accuracy"
                  width={768}
                  height={512}
                  className="w-full h-auto"
                />
                <div className="p-5">
                  <h3 className="font-heading text-xl">Memory dashboard</h3>
                  <p className="mt-2 text-secondary text-sm">Track memories, confidence scores, and recall health at a glance.</p>
                </div>
              </div>
              <div className="glass-card border border-white/[0.08] overflow-hidden">
                <Image
                  src="/images/install-recall-preview.webp"
                  alt="Terminal showing Memory Crystal install flow and agent recall"
                  width={768}
                  height={512}
                  className="w-full h-auto"
                />
                <div className="p-5">
                  <h3 className="font-heading text-xl">Install + recall in action</h3>
                  <p className="mt-2 text-secondary text-sm">One command to install. Context flows into every session automatically.</p>
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
