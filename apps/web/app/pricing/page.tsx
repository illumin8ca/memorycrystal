import Link from "next/link";

const tiers = [
  {
    name: "Free",
    price: "$0",
    note: "Permanent plan",
    features: [
      "500 memories stored",
      "7-day message history",
      "1 AI session / channel",
      "Community support",
      "OpenClaw plugin access",
    ],
  },
  {
    name: "Pro",
    price: "$20",
    note: "Recommended for teams",
    features: [
      "Unlimited memories",
      "90-day message history",
      "All channels (Discord, Telegram, Signal, etc.)",
      "Spreading activation recall",
      "API access + API keys",
      "Priority support",
    ],
    badge: "RECOMMENDED",
  },
  {
    name: "Ultra",
    price: "$100",
    note: "For operators and AI platforms",
    features: [
      "Everything in Pro",
      "Multi-agent memory isolation",
      "Knowledge graph (typed entities + relations)",
      "Wake briefings + prospective memory",
      "Obsidian vault sync",
      "Custom retention policies",
      "Dedicated support + SLA",
    ],
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
    <p className="text-xs font-mono text-[#8899bb] tracking-[0.28em] uppercase mb-4">
      <span className="text-[#00aaff]">[ </span>
      {children}
      <span className="text-[#00aaff]"> ]</span>
    </p>
  );
}

function PricingHeader() {
  return (
    <header className="border-b border-[rgba(255,255,255,0.08)] bg-[#050508]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-heading text-lg tracking-wide neon-text">
          MEMORY CRYSTAL
        </Link>
        <nav className="flex items-center gap-6 text-sm text-[#8899bb]">
          <Link href="/docs" className="hover:text-[#00aaff]">
            Docs
          </Link>
          <Link href="/changelog" className="hover:text-[#00aaff]">
            Changelog
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-[#f0f4ff]">
      <PricingHeader />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <BracketHeading children="PRICING" />
        <h1 className="font-heading text-5xl md:text-6xl">Everything you need to scale memory infrastructure.</h1>
        <p className="mt-5 max-w-3xl text-[#8899bb]">
          Choose the level of memory depth that fits your environment. Upgrade at any time, no migration required.
        </p>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.name} className={`glass-card border border-[rgba(255,255,255,0.16)] p-8 relative ${
              tier.badge ? "neon-border glow-pulse" : ""
            }`}>
              {tier.badge ? (
                <span className="absolute top-0 right-0 px-3 py-1 bg-[#00aaff] text-[#050508] text-xs font-mono -translate-y-1/2">
                  {tier.badge}
                </span>
              ) : null}
              <p className="font-mono text-xs tracking-[0.2em] text-[#00aaff]">{tier.name.toUpperCase()}</p>
              <p className="mt-2 text-5xl font-mono">
                {tier.price}
                <span className="text-sm text-[#8899bb]">/month</span>
              </p>
              <p className="mt-2 text-[#00aaff] font-mono text-sm">{tier.note}</p>
              <ul className="mt-6 space-y-3 text-[#8899bb]">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="text-[#00aaff] mt-1">◈</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 inline-flex px-5 py-3 font-mono glass-card border border-[rgba(255,255,255,0.12)] text-[#00aaff] hover:border-[#00aaff] transition-colors"
              >
                Get started
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-16 glass-card border border-[rgba(255,255,255,0.16)] p-8">
          <BracketHeading children="FAQ" />
          <h2 className="font-heading text-3xl">Answers to common questions.</h2>
          <div className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <article key={faq.question} className="border-l-2 border-[rgba(0,170,255,0.45)] pl-6">
                <h3 className="font-heading text-xl">{faq.question}</h3>
                <p className="mt-2 text-[#8899bb] leading-relaxed">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[rgba(255,255,255,0.08)] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between text-[#8899bb] text-sm">
          <p className="font-heading text-lg neon-text">MEMORY CRYSTAL</p>
          <p>Built on OpenClaw</p>
          <p>© {new Date().getFullYear()} MEMORY CRYSTAL</p>
        </div>
      </footer>
    </div>
  );
}
