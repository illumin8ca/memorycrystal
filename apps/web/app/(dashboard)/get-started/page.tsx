"use client";

import Link from "next/link";
import { InstallCommandCard } from "../../components/InstallCommandCard";

const firstRunSteps = [
  "Open a terminal on the machine where OpenClaw is already installed.",
  "Copy and run the installer below.",
  "When prompted, paste the API key from Settings.",
  "Let the installer finish wiring Memory Crystal into OpenClaw.",
  "Restart the OpenClaw gateway if the installer asks you to, then send a few messages to generate your first captures.",
];

const afterInstallChecks = [
  "Settings shows an active API key for this account.",
  "The installer finishes without any missing dependency or auth errors.",
  "Fresh turns begin appearing in Messages.",
  "Extracted long-term memories begin appearing in Memories.",
  "The Dashboard activity cards start reflecting recent captures.",
];

const nextStops = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "See live stats, recent captures, and overall account health.",
  },
  {
    title: "Docs",
    href: "/dashboard/docs",
    description: "Reference install details, verification notes, and how the installer works.",
  },
  {
    title: "Settings",
    href: "/settings",
    description: "Create or rotate API keys for the machines you want connected.",
  },
];

export default function GetStartedPage() {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8">
        <div>
          <p className="text-accent text-[11px] tracking-[0.22em] uppercase mb-2">Onboarding</p>
          <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary tracking-wide">GET STARTED</h1>
          <p className="text-secondary text-sm mt-2 max-w-3xl">
            Install Memory Crystal on your OpenClaw client, connect it to this account, and verify your first messages and memories are flowing.
          </p>
        </div>
        <Link href="/settings" className="text-accent text-xs font-mono hover:underline">
          NEED AN API KEY?
        </Link>
      </div>

      <div className="space-y-6">
        <InstallCommandCard
          title="Install on your OpenClaw client"
          description="Paste this into a terminal on the machine where OpenClaw is installed, then enter your Memory Crystal API key when prompted."
        />

        <section className="bg-surface border border-white/[0.07] p-5 sm:p-6">
          <h2 className="font-mono font-bold text-base sm:text-lg text-primary">First-run checklist</h2>
          <ol className="mt-4 space-y-3 text-sm text-secondary list-decimal pl-5">
            {firstRunSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="bg-surface border border-white/[0.07] p-5 sm:p-6">
          <h2 className="font-mono font-bold text-base sm:text-lg text-primary">Verify everything is wired correctly</h2>
          <ul className="mt-4 space-y-3 text-sm text-secondary list-disc pl-5">
            {afterInstallChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
        </section>

        <section className="bg-surface border border-white/[0.07] p-5 sm:p-6">
          <h2 className="font-mono font-bold text-base sm:text-lg text-primary">Where to go next</h2>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            {nextStops.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block border border-white/[0.07] bg-white/[0.02] p-4 hover:border-accent/60 transition-colors"
              >
                <p className="font-mono text-sm text-primary">{item.title}</p>
                <p className="text-secondary text-xs mt-2 leading-5">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
