"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CrystalIcon from "./components/CrystalIcon";
import Header from "./components/Header";
import Footer from "./components/Footer";

const problemCards = [
  {
    title: "Context Compaction Kills",
    copy: "Claude Code compacts. Codex resets. Your hard-won context vanishes.",
  },
  {
    title: "Every Session Starts Cold",
    copy: "Your AI knows nothing about past decisions, preferences, or work.",
  },
  {
    title: "Repeat Yourself Forever",
    copy: "Explaining the same architecture choices, preferences, and constraints. Again.",
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "CAPTURE",
    copy: "Every message, decision, fact automatically extracted and stored.",
  },
  {
    number: "02",
    title: "CRYSTALLIZE",
    copy: "Semantic indexing, spreading activation builds memory connections.",
  },
  {
    number: "03",
    title: "RECALL",
    copy: "Relevant memories surface before you ask. Context always available.",
  },
];

const platformCards = [
  {
    name: "OpenClaw",
    copy: "Native plugin, deepest integration. Wake briefings, auto-capture.",
  },
  {
    name: "Claude Code",
    copy: "MCP server. Persistent memory across compactions. Never lose context.",
  },
  {
    name: "Codex / Codex CLI",
    copy: "MCP server. Full memory layer for your coding agent.",
  },
];

const featureCards = [
  { icon: "◈", title: "Semantic Search", copy: "Find anything by meaning, not keywords" },
  { icon: "◈", title: "Spreading Activation", copy: "Related memories surface automatically" },
  { icon: "◈", title: "5 Memory Stores", copy: "Episodic, semantic, procedural, prospective, sensory" },
  { icon: "◈", title: "Knowledge Graph", copy: "Typed entities, relations, graph traversal (Ultra)" },
  { icon: "◈", title: "Wake Briefings", copy: "Session kickoffs with your most relevant context" },
  { icon: "◈", title: "Obsidian Sync", copy: "Human-readable vault, always in sync (Pro+)" },
];

const roadmapItems = [
  "Q1 2026 — Launch: OpenClaw, Claude Code, Codex. 3 tiers.",
  "Q2 2026 — Memory Caching: warm cache of top memories per session (like prompt caching, for memory)",
  "Q3 2026 — True Knowledge Graph: entity resolution, relation inference, graph queries",
  "Q4 2026 — Team Memory: shared memory spaces across agents and users",
  "2027 — Memory Marketplace: share skill packs, policy packs, persona bundles",
];

const pricingPlans = [
  {
    name: "FREE",
    price: "$0 forever",
    button: "START FREE",
    features: [
      "500 memories stored",
      "7-day message history",
      "1 channel",
      "Community support",
      "OpenClaw plugin",
    ],
    borderClass: "border-border/25",
  },
  {
    name: "PRO",
    price: "$20/mo",
    priceAnnual: "$168/yr",
    button: "START PRO",
    isFeatured: true,
    features: [
      "Unlimited memories",
      "90-day message history",
      "All channels",
      "Spreading activation recall",
      "API access + keys",
      "Obsidian vault sync",
      "Priority support",
    ],
    borderClass: "neon-border glow-pulse",
  },
  {
    name: "ULTRA",
    price: "$100/mo",
    priceAnnual: "$840/yr",
    button: "START ULTRA",
    features: [
      "Everything in Pro",
      "Multi-agent memory isolation",
      "Knowledge graph",
      "Wake briefings",
      "Custom retention policies",
      "Dedicated support + SLA",
    ],
    borderClass: "border-border/50",
  },
];

const formatLinks = (href: string, children: string) => (
  <Link href={href} className="font-mono text-xs uppercase tracking-[0.16em] text-accent hover:text-primary">
    {children}
  </Link>
);

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
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-accent">
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
    <div className="absolute right-[8%] top-1/2 -translate-y-1/2 pointer-events-none select-none">
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
  const [annualBilling, setAnnualBilling] = useState(true);

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
        <section className="relative min-h-[100vh] overflow-hidden border-b border-border/25 pt-16">
          <div className="crystal-bg">
            <div className="gradient-pulse" />
            <div className="crystal-lattice" />
            <div className="shimmer-line" />
            <BouncingCrystals />
            {/* Main hero crystal — large, slowly rotating */}
            <HeroCrystal />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 h-[calc(100vh-4rem)] flex flex-col justify-center">
            <p className="text-xs font-mono tracking-[0.24em] text-accent">[ MEMORY CRYSTAL ]</p>
            <h1 className="mt-3 font-heading text-[clamp(2.5rem,10vw,5.2rem)] leading-tight tracking-wide">
              Say Goodbye to Forgetful AI
            </h1>
            <p className="mt-6 max-w-2xl text-primary text-lg">
              Persistent semantic memory for OpenClaw, Claude Code, and Codex. Never lose context when compacting.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 text-xs font-mono bg-accent text-white shadow-[0_0_30px_rgba(33,128,214,0.35)] hover:shadow-[0_0_46px_rgba(33,128,214,0.55)] transition-all"
              >
                GET STARTED FREE
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center px-6 py-3 text-xs font-mono glass-card neon-border text-accent hover:bg-accent/8 transition-colors"
              >
                VIEW DOCS
              </Link>
            </div>
          </div>
          <ScrollIndicator />
        </section>

        <section className="border-y border-border/25 py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <BracketHeading children="THE PROBLEM" />
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Context dies. Every. Single. Session.</h2>
            <p className="mt-4 text-secondary max-w-2xl">No matter how smart your model gets, compaction still erases the thread.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {problemCards.map((card) => (
                <article key={card.title} className="glass-card border-border p-7">
                  <CrystalIcon size={28} glow />
                  <h3 className="mt-3 font-heading text-2xl">{card.title}</h3>
                  <p className="mt-3 text-secondary leading-relaxed">{card.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-20">
          <div className="absolute inset-0 pointer-events-none">
            <div className="crystal-grid h-full w-full opacity-35" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
            <BracketHeading children="HOW IT WORKS" />
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Memory that works like a brain.</h2>
            <div className="mt-10 relative">
              <div className="hidden md:block absolute left-24 right-24 top-11 h-[1px] bg-[rgba(33,128,214,0.28)]" />
              <div className="grid gap-4 md:grid-cols-3 relative">
                {workflowSteps.map((step, index) => (
                  <article
                    key={step.number}
                    className="glass-card border-border/40 p-7 relative"
                  >
                    <div className="text-xs font-mono neon-text">{step.number}</div>
                    <h3 className="mt-3 font-heading text-2xl">{step.title}</h3>
                    <p className="mt-3 text-secondary">{step.copy}</p>
                    {index < workflowSteps.length - 1 ? (
                      <span className="hidden md:block absolute -right-5 top-8 w-5 h-px bg-[rgba(33,128,214,0.28)]" />
                    ) : null}
                    {index < workflowSteps.length - 1 ? (
                      <span className="hidden md:block absolute right-[-0.5rem] top-[2.05rem] w-2 h-2 border border-accent bg-void" />
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/25 py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <BracketHeading children="SUPPORTED PLATFORMS" />
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Works where you work.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {platformCards.map((platform) => (
                <article key={platform.name} className="glass-card border-border/40 p-6">
                  <h3 className="font-heading text-2xl">{platform.name}</h3>
                  <p className="mt-3 text-secondary">{platform.copy}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-sm font-mono text-secondary">More integrations coming. Any MCP-compatible agent supported.</p>
          </div>
        </section>

        <section className="relative py-20">
          <div className="absolute inset-0 pointer-events-none">
            <div className="crystal-grid h-full w-full opacity-25" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
            <BracketHeading children="WHAT YOU GET" />
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Everything memory should be.</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((feature) => (
                <article key={feature.title} className="glass-card border-border/45 p-6">
                  <CrystalIcon size={28} glow />
                  <h3 className="mt-3 font-heading text-2xl">{feature.title}</h3>
                  <p className="mt-3 text-secondary leading-relaxed">{feature.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="relative border-y border-border/25 py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <BracketHeading children="PRICING" />
            <div className="mt-2 flex flex-wrap items-center gap-5 justify-between">
              <h2 className="font-heading text-3xl md:text-5xl">Start free. Scale when ready.</h2>
              <div className="inline-flex border border-border/45">
                <button
                  type="button"
                  onClick={() => setAnnualBilling(false)}
                  className={`px-4 py-2 text-[11px] font-mono ${
                    !annualBilling ? "bg-accent text-white" : "text-secondary"
                  }`}
                >
                  MONTHLY
                </button>
                <button
                  type="button"
                  onClick={() => setAnnualBilling(true)}
                  className={`px-4 py-2 text-[11px] font-mono ${
                    annualBilling ? "bg-accent text-white" : "text-secondary"
                  }`}
                >
                  ANNUAL
                </button>
              </div>
            </div>
            <div className="mt-3 text-xs font-mono text-accent">
              {annualBilling ? "Save ~30% by going annual" : "Monthly billing"}
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <article
                  key={plan.name}
                  className={`glass-card p-8 border ${plan.borderClass} flex flex-col relative`}
                >
                  {plan.isFeatured ? (
                    <span className="absolute top-0 right-0 -translate-y-1/2 bg-accent px-3 py-1 text-[10px] font-mono text-white">
                      RECOMMENDED
                    </span>
                  ) : null}
                  <h3 className="font-heading text-2xl">{plan.name}</h3>
                  <div className="mt-5">
                    <p className="text-4xl font-mono neon-text">{annualBilling ? plan.priceAnnual ?? plan.price : plan.price}</p>
                  </div>
                  <ul className="mt-7 space-y-3 text-sm text-secondary flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <CrystalIcon size={14} glow className="shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className="mt-7 inline-flex items-center justify-center px-5 py-3 text-xs font-mono border border-border/50 bg-border/5 hover:bg-accent/12 hover:border-accent transition-colors"
                  >
                    {plan.button}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-b border-border/25 py-20">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_25%,rgba(33,128,214,0.2),transparent_60%)]" />
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
            <BracketHeading children="ROADMAP" />
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Where we&apos;re going.</h2>
            <div className="mt-8 grid gap-4">
              {roadmapItems.map((item) => (
                <article key={item} className="glass-card p-6 border border-border/45">
                  <p className="text-primary font-heading text-xl">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(33,128,214,0.28)_0%,_rgba(28,39,47,0.95)_65%)]" />
          {/* Decorative crystal in CTA */}
          <div className="absolute left-1/2 top-6 -translate-x-1/2 opacity-20 crystal-drift">
            <CrystalIcon size={64} />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-heading text-4xl md:text-5xl">Your AI Deserves to Remember</h2>
            <p className="mt-4 text-secondary">Start free. No credit card required.</p>
            <Link
              href="/signup"
              className="mt-8 inline-flex px-10 py-3 bg-accent text-white text-xs font-mono shadow-[0_0_40px_rgba(33,128,214,0.45)] hover:brightness-110"
            >
              GET STARTED FREE
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
