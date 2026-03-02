"use client";

import { useState } from "react";
import Link from "next/link";
import CrystalIcon from "../components/CrystalIcon";
import Header from "../components/Header";
import Footer from "../components/Footer";

const pricingPlans = [
  {
    name: "FREE",
    price: "$0 forever",
    button: "START FREE",
    features: [
      "500 memories stored",
      "7-day message history",
      "1 AI session / channel",
      "Community support",
      "OpenClaw plugin access",
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
      "All channels (Discord, Telegram, Signal, etc.)",
      "Spreading activation recall",
      "API access + API keys",
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
      "Knowledge graph (typed entities + relations)",
      "Wake briefings + prospective memory",
      "Custom retention policies",
      "Dedicated support + SLA",
    ],
    borderClass: "border-border/50",
  },
];

const faqs = [
  {
    question: "What counts as a memory?",
    answer:
      "Any fact, decision, lesson, or event extracted from your conversations and stored in the long-term vault.",
  },
  {
    question: "Can I export my memories?",
    answer: "Yes, Pro and Ultra include Obsidian vault sync for human-readable export and archival workflows.",
  },
  {
    question: "Which AI agents are supported?",
    answer: "Any OpenClaw-compatible agent. More integrations are in active development.",
  },
  {
    question: "Is there a free trial?",
    answer: "Free plan is permanent, no credit card required.",
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
  const [annualBilling, setAnnualBilling] = useState(true);

  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <BracketHeading>PRICING</BracketHeading>
        <div className="flex flex-wrap items-center gap-5 justify-between">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl">Start free. Scale when ready.</h1>
          <div className="inline-flex border border-border/45">
            <button
              type="button"
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-2 text-[11px] font-mono ${
                annualBilling ? "bg-accent text-white" : "text-secondary"
              }`}
            >
              ANNUAL
            </button>
            <button
              type="button"
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-2 text-[11px] font-mono ${
                !annualBilling ? "bg-accent text-white" : "text-secondary"
              }`}
            >
              MONTHLY
            </button>
          </div>
        </div>
        <div className="mt-3 text-xs font-mono text-accent">
          {annualBilling ? "Save ~30% by going annual" : "Monthly billing"}
        </div>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
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
              <h3 className="font-logo text-2xl">{plan.name}</h3>
              <div className="mt-5">
                <p className="text-4xl font-mono neon-text">
                  {annualBilling ? plan.priceAnnual ?? plan.price : plan.price}
                </p>
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
        </section>

        <section className="mt-16 glass-card border border-border/45 p-8">
          <BracketHeading>FAQ</BracketHeading>
          <h2 className="font-heading text-3xl">Answers to common questions.</h2>
          <div className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <article key={faq.question} className="border-l-2 border-accent/45 pl-6">
                <h3 className="font-heading text-xl">{faq.question}</h3>
                <p className="mt-2 text-secondary leading-relaxed">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
