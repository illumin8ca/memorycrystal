import Link from "next/link";
import CrystalIcon from "../components/CrystalIcon";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { formatLimit, formatTtlDays, TIER_LIMITS } from "@shared/tierLimits";

type PricingPlan = {
  name: string;
  price: string;
  button: string;
  checkoutHref: string;
  features: string[];
  borderClass: string;
  badge?: string;
};

const formatChannels = (channels: number | null): string =>
  channels === null ? "Unlimited channels" : `${channels} channels`;

const planFeatureFromTier = (name: keyof typeof TIER_LIMITS) => {
  const limits = TIER_LIMITS[name];
  const memories = `${formatLimit(limits.memories)} memories`;
  const stm = limits.stmMessages === null ? "Unlimited messages" : `${formatLimit(limits.stmMessages)} messages`;
  const ttl = `${formatTtlDays(limits.stmTtlDays)} message retention`;
  const channels = formatChannels(limits.channels);
  return { memories, stm, ttl, channels };
};

const pricingPlans: PricingPlan[] = [
  {
    name: "FREE",
    price: "$0/mo",
    button: "START FREE",
    checkoutHref: "/api/polar/checkout?plan=free",
    features: [
      planFeatureFromTier("free").memories,
      planFeatureFromTier("free").stm,
      planFeatureFromTier("free").ttl,
      planFeatureFromTier("free").channels,
      "Knowledge Graph Enrichment — Not included",
      "Adaptive Recall Modes — Not included (general only)",
      "Relationship Graph Tools — Not included",
      "Memory Health Dashboard — Not included",
      "Salience-Based Memory Filtering — Basic filtering only",
    ],
    borderClass: "border-border/25",
  },
  {
    name: "STARTER",
    price: "$10/mo",
    button: "START STARTER",
    checkoutHref: "/api/polar/checkout?plan=starter",
    features: [
      planFeatureFromTier("starter").memories,
      planFeatureFromTier("starter").stm,
      planFeatureFromTier("starter").ttl,
      planFeatureFromTier("starter").channels,
      "Knowledge Graph Enrichment — Basic (gpt-4o-mini)",
      "Adaptive Recall Modes — All 6 modes: general, decision, project, people, workflow, conversation",
      "Relationship Graph Tools — Included (crystal_who_owns, crystal_explain_connection, crystal_dependency_chain)",
      "Memory Health Dashboard — Basic (graph coverage %, stale memory counts)",
      "Salience-Based Memory Filtering — Heuristic salience scoring",
    ],
    borderClass: "border-border/45",
  },
  {
    name: "PRO",
    price: "$20/mo",
    button: "START PRO",
    checkoutHref: "/api/polar/checkout?plan=pro",
    badge: "MOST POPULAR",
    features: [
      planFeatureFromTier("pro").memories,
      planFeatureFromTier("pro").stm,
      planFeatureFromTier("pro").ttl,
      planFeatureFromTier("pro").channels,
      "Knowledge Graph Enrichment — Enhanced (gpt-4o)",
      "Adaptive Recall Modes — All 6 modes included",
      "Relationship Graph Tools — Included",
      "Memory Health Dashboard — Full dashboard",
      "Salience-Based Memory Filtering — Heuristic + LLM promotion pass",
      "Reflection pipeline",
    ],
    borderClass: "neon-border glow-pulse",
  },
  {
    name: "ULTRA",
    price: "$100/mo",
    button: "START ULTRA",
    checkoutHref: "/api/polar/checkout?plan=ultra",
    features: [
      planFeatureFromTier("ultra").memories,
      planFeatureFromTier("ultra").stm,
      planFeatureFromTier("ultra").ttl,
      planFeatureFromTier("ultra").channels,
      "Knowledge Graph Enrichment — Premium (o4-mini, best quality)",
      "Adaptive Recall Modes — All 6 modes included",
      "Relationship Graph Tools — Included",
      "Memory Health Dashboard — Full dashboard",
      "Salience-Based Memory Filtering — Heuristic + LLM promotion pass",
      "Priority recall + API access",
    ],
    borderClass: "border-border/50",
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

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <BracketHeading>PRICING</BracketHeading>
        <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl">Simple pricing. Built to scale.</h1>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`glass-card p-8 border ${plan.borderClass} flex flex-col relative`}
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
              <Link
                href={plan.checkoutHref!}
                className="mt-7 inline-flex items-center justify-center px-5 py-3 text-xs font-mono border border-border/50 bg-border/5 hover:bg-accent/12 hover:border-accent transition-colors"
              >
                {plan.button}
              </Link>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
