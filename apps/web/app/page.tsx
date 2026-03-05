"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import CrystalIcon from "./components/CrystalIcon";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { FadeIn, FadeInItem, FadeInStagger } from "./components/FadeIn";

const problemCards = [
  {
    title: "Compaction Erases Everything",
    copy: "You spend an hour building shared context — naming conventions, architecture decisions, open questions. Then Claude Code compacts. It's gone. You're back to square one.",
  },
  {
    title: "Every Session Is Groundhog Day",
    copy: "\"We use pnpm, not npm.\" \"The auth lives in /lib/auth.ts.\" \"We decided against Redux last month.\" You've said it ten times. Your AI has no idea.",
  },
  {
    title: "You're Training Your AI Every Day",
    copy: "Instead of moving fast, you spend the first 10 minutes of every session re-briefing your AI. That's not a workflow. That's a tax on your productivity.",
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "CAPTURE",
    copy: "Memory Crystal hooks into your AI agent and automatically extracts facts, decisions, and context from every session. No manual note-taking. No CLAUDE.md maintenance. It just works.",
  },
  {
    number: "02",
    title: "CRYSTALLIZE",
    copy: "Extracted memories are semantically indexed and linked using spreading activation — the same mechanism your brain uses. Related memories cluster together. Context builds on itself.",
  },
  {
    number: "03",
    title: "RECALL",
    copy: "Before your AI responds, Memory Crystal surfaces the most relevant memories for that moment. Your agent walks into every session already briefed. Compaction becomes irrelevant.",
  },
];

const platformCards = [
  {
    name: "OpenClaw",
    copy: "Native plugin with the deepest integration. Auto-capture, wake briefings, full memory lifecycle. Memory Crystal was built here first.",
  },
  {
    name: "Claude Code",
    copy: "Connect via MCP server in under 5 minutes. Memory persists across compactions, session resets, and restarts. Your context survives everything Claude Code throws at it.",
  },
  {
    name: "Codex / Codex CLI",
    copy: "Full persistent memory for OpenAI Codex via MCP. Your coding agent remembers your codebase, your conventions, your decisions — across every run.",
  },
];

const featureCards = [
  { icon: "◈", title: "Semantic Search", copy: "Ask \"what did we decide about the auth flow?\" and get the answer. Memory Crystal searches by meaning, not keywords — so you find what you meant, not just what you typed." },
  { icon: "◈", title: "Spreading Activation", copy: "Pull one memory and related context surfaces automatically. Ask about your database schema and your migration decisions come with it. Memory works in clusters, not isolation." },
  { icon: "◈", title: "5 Memory Stores", copy: "Not all memory is equal. Episodic (what happened), semantic (what you know), procedural (how you work), prospective (what you planned), sensory (recent messages). Each stored and recalled appropriately." },
  { icon: "◈", title: "Knowledge Graph", copy: "Typed entities and relationships — people, projects, decisions, concepts — stored as a queryable graph. Ask \"what decisions did we make about Project X?\" and get a real answer. (Ultra)" },
  { icon: "◈", title: "Wake Briefings", copy: "Every session starts with a memory briefing: what you were working on, what decisions are pending, what changed. Your AI is already up to speed before you type a word." },
  { icon: "◈", title: "Obsidian Sync", copy: "Every memory synced to a human-readable Obsidian vault. You own your memory. Browse it, edit it, search it without touching the app. (Pro+)" },
];

const roadmapItems = [
  "Q1 2026 — Launch. OpenClaw, Claude Code, and Codex support. Free, Starter, Pro, and Ultra tiers. The memory layer your AI was missing.",
  "Q2 2026 — Memory Caching. Hot memories pre-loaded before your session starts. Sub-100ms recall. Like prompt caching, but for everything your AI knows about you.",
  "Q3 2026 — True Knowledge Graph. Typed entity resolution. Relation inference from conversation patterns. Ask \"what did we decide about X?\" and get the real answer.",
  "Q4 2026 — Team Memory. Shared memory spaces across agents and collaborators. One team, one context, no repeated explanations.",
  "2027 — Memory Marketplace. Share skill packs, policy bundles, persona configs. The ecosystem for AI memory.",
];

const pricingPlans = [
  {
    name: "FREE",
    price: "$0/forever",
    button: "START FREE",
    checkoutHref: "/api/polar/checkout?plan=free",
    features: ["500 memories", "500 messages", "30-day message retention"],
    borderClass: "border-white/[0.06]",
  },
  {
    name: "STARTER",
    price: "$10/mo",
    button: "COMING SOON",
    comingSoon: true,
    badge: "COMING SOON!",
    features: ["10,000 memories", "5,000 messages", "60-day message retention"],
    borderClass: "border-white/[0.07]",
  },
  {
    name: "PRO",
    price: "$25/mo",
    button: "START PRO",
    checkoutHref: "/api/polar/checkout?plan=pro",
    badge: "MOST POPULAR",
    isFeatured: true,
    features: ["25,000 memories", "25,000 messages", "90-day message retention"],
    borderClass: "neon-border glow-pulse",
  },
  {
    name: "ULTRA",
    price: "$50/mo",
    button: "START ULTRA",
    checkoutHref: "/api/polar/checkout?plan=ultra",
    features: ["Unlimited memories", "Unlimited messages", "365-day message retention"],
    borderClass: "border-white/[0.07]",
  },
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

function ScrollIndicator() {
  return (
    <div className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-accent">
      <span className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-60">Scroll</span>
      <svg
        className="w-5 h-5 animate-bounce opacity-80"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 7L10 13L16 7" stroke="#2180D6" strokeWidth="1.5" strokeLinecap="square"/>
      </svg>
    </div>
  );
}

function HeroCrystal() {
  return (
    <div className="hidden lg:block absolute right-[8%] top-1/2 -translate-y-1/2 pointer-events-none select-none">
      {/* Glow aura behind the crystal */}
      <div
        className="crystal-aura absolute inset-0 -inset-x-20 -inset-y-16"
        style={{
          background: "radial-gradient(ellipse at center, rgba(33,128,214,0.25) 0%, rgba(76,193,233,0.08) 40%, transparent 70%)",
        }}
      />
      <div className="hero-crystal">
        <CrystalIcon size={420} />
      </div>
    </div>
  );
}

const CRYSTAL_COUNT = 10;
const CRYSTAL_CONFIGS = Array.from({ length: CRYSTAL_COUNT }, (_, i) => ({
  size: 14 + (i % 5) * 6,
  opacity: 0.06 + (i % 4) * 0.03,
}));

function BouncingCrystals() {
  const containerRef = useRef<HTMLDivElement>(null);
  const elsRef = useRef<(HTMLDivElement | null)[]>([]);
  const stateRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const initRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (!initRef.current) {
      stateRef.current = CRYSTAL_CONFIGS.map((c) => ({
        x: Math.random() * (rect.width - c.size),
        y: Math.random() * (rect.height - c.size),
        vx: (0.3 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1),
        vy: (0.3 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1),
      }));
      initRef.current = true;
    }

    let raf: number;
    const animate = () => {
      const { width: w, height: h } = container.getBoundingClientRect();
      stateRef.current.forEach((p, i) => {
        const size = CRYSTAL_CONFIGS[i].size;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0) { p.vx = Math.abs(p.vx); p.x = 0; }
        if (p.x >= w - size) { p.vx = -Math.abs(p.vx); p.x = w - size; }
        if (p.y <= 0) { p.vy = Math.abs(p.vy); p.y = 0; }
        if (p.y >= h - size) { p.vy = -Math.abs(p.vy); p.y = h - size; }
        const el = elsRef.current[i];
        if (el) el.style.transform = `translate(${p.x}px,${p.y}px)`;
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {CRYSTAL_CONFIGS.map((c, i) => (
        <div
          key={i}
          ref={(el) => { elsRef.current[i] = el; }}
          className="absolute"
          style={{ opacity: c.opacity, willChange: "transform" }}
        >
          <CrystalIcon size={c.size} />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {

  useEffect(() => {
    const handleScroll = () => {
      document.documentElement.style.setProperty("--scroll-y", String(window.scrollY));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-void text-primary">
      <div className="fixed top-0 inset-x-0 z-50">
        <Header />
      </div>

      <main>
        <section className="relative min-h-[100vh] overflow-hidden border-b border-white/[0.06] pt-16">
          <div className="crystal-bg">
            <div className="gradient-pulse" />
            <div className="crystal-lattice" />
            <div className="shimmer-line" />
            <BouncingCrystals />
            {/* Main hero crystal — large, slowly rotating */}
            <HeroCrystal />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-4rem)] flex flex-col justify-center">
            <p className="text-xs font-mono tracking-[0.24em] text-accent">[ PERSISTENT MEMORY FOR AI AGENTS ]</p>
            <h1 className="mt-3 text-[clamp(2rem,10vw,5.2rem)] leading-tight tracking-wide">
              Say Goodbye to<br />
              <span className="font-bold">Forgetful AI</span>
            </h1>
            <p className="mt-6 max-w-2xl text-primary text-base sm:text-lg">
              Memory Crystal is the MCP server that gives Claude Code, Codex, and OpenClaw agents persistent memory across every session, compaction, and restart. No more re-explaining your codebase. No more lost context. Your AI picks up exactly where you left off.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/api/polar/checkout?plan=free"
                className="btn-primary inline-flex items-center justify-center px-6 py-3 text-xs"
              >
                START FOR FREE
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary inline-flex items-center justify-center px-6 py-3 text-xs"
              >
                SEE HOW IT WORKS
              </a>
            </div>
          </div>
          <ScrollIndicator />
        </section>

        <section className="border-y border-white/[0.06] py-20">
          <FadeIn className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>THE PROBLEM</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Your AI is brilliant in the moment.<br/>And completely amnesiac the next.</h2>
            <p className="mt-4 text-secondary max-w-2xl">Context compaction, session resets, workspace switches — every one of them erases the shared understanding you built. The model hasn&apos;t gotten dumber. It just can&apos;t remember. Memory Crystal fixes that.</p>
            <FadeInStagger className="mt-10 grid gap-4 md:grid-cols-3">
              {problemCards.map((card) => (
                <FadeInItem key={card.title}>
                <article className="glass-card border border-white/[0.07] p-7">
                  <CrystalIcon size={28} glow />
                  <h3 className="mt-3 font-heading text-2xl">{card.title}</h3>
                  <p className="mt-3 text-secondary leading-relaxed">{card.copy}</p>
                </article>
                </FadeInItem>
              ))}
            </FadeInStagger>
          </FadeIn>
        </section>

        <section id="how-it-works" className="relative py-20">
          <div className="absolute inset-0 pointer-events-none">
            <div className="crystal-grid h-full w-full opacity-35" />
          </div>
          <FadeIn className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>HOW IT WORKS</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Persistent memory that survives everything.</h2>
            <div className="mt-10 relative">
              <div className="hidden md:block absolute left-24 right-24 top-11 h-[1px] bg-[rgba(33,128,214,0.28)]" />
              <FadeInStagger className="grid gap-4 md:grid-cols-3 relative">
                {workflowSteps.map((step, index) => (
                  <FadeInItem key={step.number}><article
                    className="glass-card border border-white/[0.07] p-7 relative"
                  >
                    <div className="text-xs font-mono neon-text">{step.number}</div>
                    <h3 className="mt-3 font-logo text-2xl text-[#4CC1E9]">{step.title}</h3>
                    <p className="mt-3 text-secondary">{step.copy}</p>
                    {index < workflowSteps.length - 1 ? (
                      <span className="hidden md:block absolute -right-5 top-8 w-5 h-px bg-[rgba(33,128,214,0.28)]" />
                    ) : null}
                    {index < workflowSteps.length - 1 ? (
                      <span className="hidden md:block absolute right-[-0.5rem] top-[2.05rem] w-2 h-2 border border-accent bg-void" />
                    ) : null}
                  </article></FadeInItem>
                ))}
              </FadeInStagger>
            </div>
          </FadeIn>
        </section>

        <section className="border-y border-white/[0.06] py-20">
          <FadeIn className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>SUPPORTED PLATFORMS</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">One memory layer. Every AI coding agent.</h2>
            <FadeInStagger className="mt-10 grid gap-4 md:grid-cols-3">
              {platformCards.map((platform) => (
                <FadeInItem key={platform.name}><article className="glass-card border border-white/[0.07] p-6">
                  <h3 className="font-heading text-2xl">{platform.name}</h3>
                  <p className="mt-3 text-secondary">{platform.copy}</p>
                </article></FadeInItem>
              ))}
            </FadeInStagger>
            <p className="mt-6 text-sm font-mono text-secondary">Any MCP-compatible agent is supported. More native integrations shipping in Q2 2026.</p>
          </FadeIn>
        </section>

        <section className="relative py-20">
          <div className="absolute inset-0 pointer-events-none">
            <div className="crystal-grid h-full w-full opacity-25" />
          </div>
          <FadeIn className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>WHAT YOU GET</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Not just storage — a complete memory system.</h2>
            <FadeInStagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((feature) => (
                <FadeInItem key={feature.title}><article className="glass-card border border-white/[0.07] p-6">
                  <CrystalIcon size={28} glow />
                  <h3 className="mt-3 font-heading text-2xl">{feature.title}</h3>
                  <p className="mt-3 text-secondary leading-relaxed">{feature.copy}</p>
                </article></FadeInItem>
              ))}
            </FadeInStagger>
          </FadeIn>
        </section>

        <section id="pricing" className="relative border-y border-white/[0.06] py-20">
          <FadeIn className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>PRICING</BracketHeading>
            <div className="mt-2 flex flex-wrap items-center gap-5 justify-between">
              <h2 className="font-heading text-3xl md:text-5xl">Simple pricing. Built to scale.</h2>
            </div>

            <FadeInStagger className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {pricingPlans.map((plan, index) => (
                <FadeInItem key={plan.name} className="h-full"><article
                  className={`glass-card p-8 border ${plan.borderClass} flex flex-col relative h-full`}
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  {plan.badge ? (
                    <span className="absolute top-0 right-0 -translate-y-1/2 bg-accent px-3 py-1 text-[10px] font-mono text-white">
                      {plan.badge}
                    </span>
                  ) : null}
                  <h3 className="font-logo text-2xl">{plan.name}</h3>
                  <div className="mt-5">
                    <p className="text-4xl font-mono neon-text">{plan.price}</p>
                  </div>
                  <ul className="mt-7 space-y-3 text-sm text-secondary flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <CrystalIcon size={14} glow className="shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.comingSoon ? (
                    <div className="mt-7 inline-flex items-center justify-center px-5 py-3 text-xs font-mono border border-accent/60 text-accent bg-accent/10">
                      COMING SOON!
                    </div>
                  ) : (
                    <Link
                      href={plan.checkoutHref!}
                      className="btn-primary mt-7 inline-flex items-center justify-center px-5 py-3 text-xs"
                    >
                      {plan.button}
                    </Link>
                  )}
                </article></FadeInItem>
              ))}
            </FadeInStagger>
          </FadeIn>
        </section>

        <section className="relative border-b border-white/[0.06] py-20">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_25%,rgba(33,128,214,0.2),transparent_60%)]" />
          <FadeIn className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BracketHeading>ROADMAP</BracketHeading>
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Where we&apos;re going.</h2>
            <FadeInStagger className="mt-8 grid gap-4">
              {roadmapItems.map((item) => (
                <FadeInItem key={item}><article className="glass-card p-6 border border-white/[0.07]">
                  <p className="text-primary font-heading text-xl">{item}</p>
                </article></FadeInItem>
              ))}
            </FadeInStagger>
          </FadeIn>
        </section>

        <FadeIn className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(33,128,214,0.28)_0%,_rgba(28,39,47,0.95)_65%)]" />
          {/* Decorative crystal in CTA */}
          <div className="absolute left-1/2 top-6 -translate-x-1/2 opacity-20 crystal-drift">
            <CrystalIcon size={64} />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-heading text-4xl md:text-5xl">Your AI Deserves to Remember</h2>
            <p className="mt-4 text-secondary">Start free. No credit card required.</p>
            <Link
              href="/api/polar/checkout?plan=free"
              className="btn-primary mt-8 inline-flex px-10 py-3 text-xs"
            >
              GET STARTED FREE
            </Link>
          </div>
        </FadeIn>
      </main>

      <Footer />
    </div>
  );
}
