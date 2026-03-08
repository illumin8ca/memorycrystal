import Link from "next/link";
import CrystalIcon from "../components/CrystalIcon";
import Header from "../components/Header";
import Footer from "../components/Footer";

const pricingPlans = [
  {
    name: "FREE",
    price: "$0/forever",
    button: "START FREE",
    checkoutHref: "/api/polar/checkout?plan=free",
    features: ["500 memories", "500 messages", "30-day message retention", "1 channel"],
    borderClass: "border-border/25",
  },
  {
    name: "STARTER",
    price: "$9/mo",
    button: "START STARTER",
    checkoutHref: "/api/polar/checkout?plan=starter",
    features: ["2,500 memories", "5,000 messages", "90-day message retention", "5 channels"],
    borderClass: "border-border/45",
  },
  {
    name: "PRO",
    price: "$19/mo",
    button: "START PRO",
    checkoutHref: "/api/polar/checkout?plan=pro",
    badge: "MOST POPULAR",
    features: ["10,000 memories", "25,000 messages", "1-year message retention", "Unlimited channels", "Reflection pipeline"],
    borderClass: "neon-border glow-pulse",
  },
  {
    name: "ULTRA",
    price: "$49/mo",
    button: "START ULTRA",
    checkoutHref: "/api/polar/checkout?plan=ultra",
    features: ["50,000 memories", "Unlimited messages", "Unlimited retention", "Unlimited channels", "Priority recall + API access"],
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
