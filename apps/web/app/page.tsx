"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const navItems = [
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/changelog", label: "Changelog" },
  { href: "/roadmap", label: "Roadmap" },
];

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
    borderClass: "border-[rgba(255,255,255,0.08)]",
  },
  {
    name: "PRO",
    price: "$20/mo",
    priceAnnual: "$240/yr",
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
    priceAnnual: "$1,200/yr",
    button: "START ULTRA",
    features: [
      "Everything in Pro",
      "Multi-agent memory isolation",
      "Knowledge graph",
      "Wake briefings",
      "Custom retention policies",
      "Dedicated support + SLA",
    ],
    borderClass: "border-[rgba(255,255,255,0.2)]",
  },
];

const formatLinks = (href: string, children: string) => (
  <Link href={href} className="font-mono text-xs uppercase tracking-[0.16em] text-[#00aaff] hover:text-[#f0f4ff]">
    {children}
  </Link>
);

function BracketHeading({ children }: { children: string }) {
  return (
    <p className="text-xs font-mono text-[#8899bb] tracking-[0.25em] uppercase">
      <span className="text-[#00aaff]">[ </span>
      {children}
      <span className="text-[#00aaff]"> ]</span>
    </p>
  );
}

function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#00aaff]">
      <span className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-60">Scroll</span>
      <svg
        className="w-5 h-5 animate-bounce opacity-80"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 7L10 13L16 7" stroke="#00aaff" strokeWidth="1.5" strokeLinecap="square"/>
      </svg>
    </div>
  );
}

function CrystalLattice() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.07]"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="lattice" x="0" y="0" width="80" height="92" patternUnits="userSpaceOnUse">
          {/* Hexagonal crystal lattice cell */}
          {/* Top triangle */}
          <path
            d="M40 0 L80 23 L80 69 L40 92 L0 69 L0 23 Z"
            fill="none"
            stroke="#00aaff"
            strokeWidth="0.6"
          />
          {/* Inner facet lines */}
          <line x1="40" y1="0" x2="40" y2="46" stroke="#00aaff" strokeWidth="0.4" />
          <line x1="0" y1="23" x2="40" y2="46" stroke="#00aaff" strokeWidth="0.4" />
          <line x1="80" y1="23" x2="40" y2="46" stroke="#00aaff" strokeWidth="0.4" />
          <line x1="40" y1="92" x2="40" y2="46" stroke="#00aaff" strokeWidth="0.3" />
          <line x1="0" y1="69" x2="40" y2="46" stroke="#00aaff" strokeWidth="0.3" />
          <line x1="80" y1="69" x2="40" y2="46" stroke="#00aaff" strokeWidth="0.3" />
        </pattern>
        <radialGradient id="lattice-fade" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="lattice-mask">
          <rect width="100%" height="100%" fill="url(#lattice-fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#lattice)" mask="url(#lattice-mask)" />
    </svg>
  );
}

export default function HomePage() {
  const [annualBilling, setAnnualBilling] = useState(false);

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
    <div className="relative min-h-screen overflow-hidden bg-[#050508] text-[#f0f4ff]">
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[rgba(255,255,255,0.08)] bg-[#050508]/90">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-heading text-lg tracking-wide neon-text">
            MEMORY CRYSTAL
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[#8899bb]">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-[#00aaff] transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-mono border border-[rgba(255,255,255,0.12)] hover:border-[#00aaff] hover:shadow-[0_0_10px_rgba(0,170,255,0.3)] transition"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-xs font-mono bg-[#00aaff] text-[#050508] shadow-[0_0_20px_rgba(0,170,255,0.45)] hover:brightness-110 transition"
            >
              GET STARTED
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[100vh] overflow-hidden border-b border-[rgba(255,255,255,0.08)] pt-16">
          <div className="crystal-bg">
            <CrystalLattice />
            <div className="shimmer-line" />
            <div className="parallax-hero absolute inset-0">
              <svg
                viewBox="0 0 90 140"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-[8%] top-[15%] w-20 h-32 shard-1 opacity-50"
              >
                {/* Outer silhouette — irregular multi-point crystal */}
                <path
                  d="M38 4 L55 0 L72 18 L78 45 L68 72 L74 98 L60 130 L44 136 L28 128 L18 100 L22 72 L12 48 L20 22 Z"
                  fill="rgba(0,120,220,0.12)"
                  stroke="#00aaff"
                  strokeWidth="1"
                />
                {/* Primary light face — top left */}
                <path d="M38 4 L55 0 L44 32 Z" fill="rgba(180,230,255,0.25)" />
                {/* Secondary face */}
                <path d="M55 0 L72 18 L44 32 Z" fill="rgba(0,150,255,0.18)" />
                {/* Shadow face right */}
                <path d="M72 18 L78 45 L68 72 L44 32 Z" fill="rgba(0,60,160,0.22)" />
                {/* Mid body light */}
                <path d="M38 4 L44 32 L22 72 L12 48 L20 22 Z" fill="rgba(100,180,255,0.10)" />
                {/* Lower dark face */}
                <path d="M44 32 L68 72 L60 130 L44 136 L28 128 L18 100 L22 72 Z" fill="rgba(0,40,120,0.15)" />
                {/* Internal facet lines */}
                <line x1="44" y1="32" x2="55" y2="0" stroke="rgba(0,170,255,0.4)" strokeWidth="0.7" />
                <line x1="44" y1="32" x2="38" y2="4" stroke="rgba(0,170,255,0.3)" strokeWidth="0.5" />
                <line x1="44" y1="32" x2="72" y2="18" stroke="rgba(0,170,255,0.3)" strokeWidth="0.5" />
                <line x1="44" y1="32" x2="22" y2="72" stroke="rgba(0,170,255,0.25)" strokeWidth="0.4" />
                <line x1="44" y1="32" x2="68" y2="72" stroke="rgba(0,170,255,0.25)" strokeWidth="0.4" />
                <line x1="22" y1="72" x2="18" y2="100" stroke="rgba(0,170,255,0.2)" strokeWidth="0.4" />
                <line x1="68" y1="72" x2="74" y2="98" stroke="rgba(0,170,255,0.2)" strokeWidth="0.4" />
                {/* Highlight glint */}
                <ellipse
                  cx="48"
                  cy="8"
                  rx="4"
                  ry="2.5"
                  fill="rgba(255,255,255,0.55)"
                  transform="rotate(-18 48 8)"
                />
              </svg>
              <svg
                viewBox="0 0 120 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute right-[12%] top-[22%] w-28 h-24 shard-2 opacity-40"
              >
                {/* Silhouette — wider than tall, 3 peaks */}
                <path
                  d="M30 6 L50 0 L62 8 L78 2 L96 12 L104 38 L98 65 L82 88 L60 94 L38 88 L20 64 L14 38 Z"
                  fill="rgba(0,100,200,0.10)"
                  stroke="#00aaff"
                  strokeWidth="0.9"
                />
                {/* Left peak face */}
                <path d="M30 6 L50 0 L52 30 Z" fill="rgba(160,220,255,0.22)" />
                {/* Center peak face */}
                <path d="M50 0 L62 8 L78 2 L64 28 L52 30 Z" fill="rgba(0,140,255,0.20)" />
                {/* Right peak face */}
                <path d="M78 2 L96 12 L74 34 L64 28 Z" fill="rgba(0,80,180,0.18)" />
                {/* Main body */}
                <path
                  d="M52 30 L64 28 L74 34 L98 65 L82 88 L60 94 L38 88 L20 64 L14 38 L30 6 Z"
                  fill="rgba(0,50,150,0.12)"
                />
                {/* Facet lines */}
                <line x1="52" y1="30" x2="50" y2="0" stroke="rgba(0,170,255,0.35)" strokeWidth="0.6" />
                <line x1="64" y1="28" x2="78" y2="2" stroke="rgba(0,170,255,0.3)" strokeWidth="0.5" />
                <line x1="52" y1="30" x2="64" y2="28" stroke="rgba(0,170,255,0.4)" strokeWidth="0.7" />
                <line x1="52" y1="30" x2="20" y2="64" stroke="rgba(0,170,255,0.2)" strokeWidth="0.4" />
                <line x1="64" y1="28" x2="98" y2="65" stroke="rgba(0,170,255,0.2)" strokeWidth="0.4" />
                {/* Highlight */}
                <ellipse
                  cx="52"
                  cy="5"
                  rx="5"
                  ry="2"
                  fill="rgba(255,255,255,0.5)"
                  transform="rotate(-10 52 5)"
                />
                <ellipse
                  cx="80"
                  cy="8"
                  rx="3"
                  ry="1.5"
                  fill="rgba(255,255,255,0.35)"
                  transform="rotate(15 80 8)"
                />
              </svg>
              <svg
                viewBox="0 0 70 110"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-[55%] top-[55%] w-14 h-24 shard-3 opacity-35"
              >
                <path
                  d="M32 0 L48 6 L58 22 L62 50 L55 78 L42 102 L28 106 L16 98 L10 72 L14 44 L8 18 L22 4 Z"
                  fill="rgba(0,90,190,0.13)"
                  stroke="#00aaff"
                  strokeWidth="0.8"
                />
                {/* Top light face */}
                <path d="M32 0 L48 6 L38 28 Z" fill="rgba(180,225,255,0.28)" />
                {/* Right mid face */}
                <path d="M48 6 L58 22 L62 50 L38 28 Z" fill="rgba(0,100,200,0.18)" />
                {/* Left dark face */}
                <path d="M32 0 L38 28 L14 44 L8 18 L22 4 Z" fill="rgba(0,50,140,0.20)" />
                {/* Bottom body */}
                <path
                  d="M38 28 L62 50 L55 78 L42 102 L28 106 L16 98 L10 72 L14 44 Z"
                  fill="rgba(0,35,110,0.15)"
                />
                <line x1="38" y1="28" x2="32" y2="0" stroke="rgba(0,170,255,0.45)" strokeWidth="0.6" />
                <line x1="38" y1="28" x2="48" y2="6" stroke="rgba(0,170,255,0.3)" strokeWidth="0.5" />
                <line x1="38" y1="28" x2="14" y2="44" stroke="rgba(0,170,255,0.2)" strokeWidth="0.4" />
                <line x1="38" y1="28" x2="62" y2="50" stroke="rgba(0,170,255,0.2)" strokeWidth="0.4" />
                <ellipse
                  cx="36"
                  cy="4"
                  rx="3.5"
                  ry="2"
                  fill="rgba(255,255,255,0.6)"
                  transform="rotate(-22 36 4)"
                />
              </svg>
              <svg
                viewBox="0 0 55 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute right-[28%] top-[60%] w-10 h-16 shard-1 opacity-30"
              >
                <path
                  d="M24 0 L38 4 L46 18 L44 42 L36 66 L22 72 L10 62 L8 38 L12 16 Z"
                  fill="rgba(0,80,180,0.12)"
                  stroke="#00aaff"
                  strokeWidth="0.8"
                />
                <path d="M24 0 L38 4 L28 22 Z" fill="rgba(180,230,255,0.30)" />
                <path d="M38 4 L46 18 L44 42 L28 22 Z" fill="rgba(0,120,220,0.18)" />
                <path d="M24 0 L28 22 L12 16 Z" fill="rgba(0,60,160,0.22)" />
                <line x1="28" y1="22" x2="24" y2="0" stroke="rgba(0,170,255,0.5)" strokeWidth="0.6" />
                <line x1="28" y1="22" x2="38" y2="4" stroke="rgba(0,170,255,0.35)" strokeWidth="0.5" />
                <line x1="28" y1="22" x2="44" y2="42" stroke="rgba(0,170,255,0.2)" strokeWidth="0.4" />
                <ellipse
                  cx="28"
                  cy="3"
                  rx="3"
                  ry="1.5"
                  fill="rgba(255,255,255,0.55)"
                  transform="rotate(-15 28 3)"
                />
              </svg>
            </div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 h-[calc(100vh-4rem)] flex flex-col justify-center">
            <p className="text-xs font-mono tracking-[0.24em] text-[#00aaff]">[ MEMORY CRYSTAL ]</p>
            <h1 className="mt-3 font-heading text-[clamp(2.5rem,10vw,5.2rem)] leading-tight tracking-wide">
              Your AI Never Forgets.
            </h1>
            <p className="mt-6 max-w-2xl text-[#f0f4ff] text-lg">
              Persistent semantic memory for OpenClaw, Claude Code, and Codex. Never lose context when compacting.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 text-xs font-mono bg-[#00aaff] text-[#050508] shadow-[0_0_30px_rgba(0,170,255,0.35)] hover:shadow-[0_0_46px_rgba(0,170,255,0.55)] transition-all"
              >
                GET STARTED FREE
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center px-6 py-3 text-xs font-mono glass-card neon-border text-[#00aaff] hover:bg-[rgba(0,170,255,0.08)] transition-colors"
              >
                VIEW DOCS
              </Link>
            </div>
          </div>
          <ScrollIndicator />
        </section>

        <section className="border-y border-[rgba(255,255,255,0.08)] py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <BracketHeading children="THE PROBLEM" />
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Context dies. Every. Single. Session.</h2>
            <p className="mt-4 text-[#8899bb] max-w-2xl">No matter how smart your model gets, compaction still erases the thread.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {problemCards.map((card) => (
                <article key={card.title} className="glass-card border-[#2a2a2a] p-7">
                  <div className="text-[#00aaff] text-2xl">◈</div>
                  <h3 className="mt-3 font-heading text-2xl">{card.title}</h3>
                  <p className="mt-3 text-[#8899bb] leading-relaxed">{card.copy}</p>
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
              <div className="hidden md:block absolute left-24 right-24 top-11 h-[1px] bg-[rgba(0,170,255,0.28)]" />
              <div className="grid gap-4 md:grid-cols-3 relative">
                {workflowSteps.map((step, index) => (
                  <article
                    key={step.number}
                    className="glass-card border-[rgba(255,255,255,0.14)] p-7 relative"
                  >
                    <div className="text-xs font-mono text-[#00aaff]">{step.number}</div>
                    <h3 className="mt-3 font-heading text-2xl">{step.title}</h3>
                    <p className="mt-3 text-[#8899bb]">{step.copy}</p>
                    {index < workflowSteps.length - 1 ? (
                      <span className="hidden md:block absolute -right-5 top-8 w-5 h-px bg-[rgba(0,170,255,0.28)]" />
                    ) : null}
                    {index < workflowSteps.length - 1 ? (
                      <span className="hidden md:block absolute right-[-0.5rem] top-[2.05rem] w-2 h-2 border border-[#00aaff] bg-[#050508]" />
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[rgba(255,255,255,0.08)] py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <BracketHeading children="SUPPORTED PLATFORMS" />
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Works where you work.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {platformCards.map((platform) => (
                <article key={platform.name} className="glass-card border-[rgba(255,255,255,0.14)] p-6">
                  <h3 className="font-heading text-2xl">{platform.name}</h3>
                  <p className="mt-3 text-[#8899bb]">{platform.copy}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-sm font-mono text-[#8899bb]">More integrations coming. Any MCP-compatible agent supported.</p>
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
                <article key={feature.title} className="glass-card border-[rgba(255,255,255,0.16)] p-6">
                  <p className="text-[#00aaff] text-2xl">◈</p>
                  <h3 className="mt-3 font-heading text-2xl">{feature.title}</h3>
                  <p className="mt-3 text-[#8899bb] leading-relaxed">{feature.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="relative border-y border-[rgba(255,255,255,0.08)] py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <BracketHeading children="PRICING" />
            <div className="mt-2 flex flex-wrap items-center gap-5 justify-between">
              <h2 className="font-heading text-3xl md:text-5xl">Start free. Scale when ready.</h2>
              <div className="inline-flex border border-[rgba(255,255,255,0.16)]">
                <button
                  type="button"
                  onClick={() => setAnnualBilling(false)}
                  className={`px-4 py-2 text-[11px] font-mono ${
                    !annualBilling ? "bg-[#00aaff] text-[#050508]" : "text-[#8899bb]"
                  }`}
                >
                  MONTHLY
                </button>
                <button
                  type="button"
                  onClick={() => setAnnualBilling(true)}
                  className={`px-4 py-2 text-[11px] font-mono ${
                    annualBilling ? "bg-[#00aaff] text-[#050508]" : "text-[#8899bb]"
                  }`}
                >
                  ANNUAL
                </button>
              </div>
            </div>
            <div className="mt-3 text-xs font-mono text-[#00aaff]">
              {annualBilling ? "2 months free included" : "Monthly"}
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <article
                  key={plan.name}
                  className={`glass-card p-8 border ${plan.borderClass} flex flex-col relative`}
                >
                  {plan.isFeatured ? (
                    <span className="absolute top-0 right-0 -translate-y-1/2 bg-[#00aaff] px-3 py-1 text-[10px] font-mono text-[#050508]">
                      RECOMMENDED
                    </span>
                  ) : null}
                  <h3 className="font-heading text-2xl">{plan.name}</h3>
                  <div className="mt-5">
                    <p className="text-4xl font-mono">{annualBilling ? plan.priceAnnual ?? plan.price : plan.price}</p>
                  </div>
                  <ul className="mt-7 space-y-3 text-sm text-[#8899bb] flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <span className="text-[#00aaff]">◈</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className="mt-7 inline-flex items-center justify-center px-5 py-3 text-xs font-mono border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(0,170,255,0.12)] hover:border-[#00aaff] transition-colors"
                  >
                    {plan.button}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-b border-[rgba(255,255,255,0.08)] py-20">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_25%,rgba(0,170,255,0.2),transparent_60%)]" />
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
            <BracketHeading children="ROADMAP" />
            <h2 className="mt-2 font-heading text-3xl md:text-5xl">Where we&apos;re going.</h2>
            <div className="mt-8 overflow-x-auto">
              <div className="flex gap-4 min-w-[760px] pb-2">
                {roadmapItems.map((item) => (
                  <article key={item} className="glass-card p-6 border border-[rgba(255,255,255,0.16)] min-w-[320px]">
                    <p className="text-[#f0f4ff] font-heading text-xl">{item}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,170,255,0.28)_0%,_rgba(5,5,8,0.95)_65%)]" />
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-heading text-4xl md:text-5xl">Your AI deserves a memory.</h2>
            <p className="mt-4 text-[#8899bb]">Start free. No credit card required.</p>
            <Link
              href="/signup"
              className="mt-8 inline-flex px-10 py-3 bg-[#00aaff] text-[#050508] text-xs font-mono shadow-[0_0_40px_rgba(0,170,255,0.45)] hover:brightness-110"
            >
              GET STARTED FREE
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[rgba(255,255,255,0.08)] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <Link href="/" className="font-heading text-lg tracking-wide neon-text">
              MEMORY CRYSTAL
            </Link>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#8899bb]">
              <Link href="/docs">Docs</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/changelog">Changelog</Link>
              <a href="https://github.com" target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer">
                Discord
              </a>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-[#8899bb] text-xs">
            <span>Built on OpenClaw</span>
            <span>•</span>
            <span>© 2026 Memory Crystal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
