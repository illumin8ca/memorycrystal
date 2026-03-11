"use client";

import Link from "next/link";
import { InstallCommandCard, DEFAULT_INSTALL_COMMAND } from "../../../components/InstallCommandCard";

const installSteps = [
  "Open a terminal on the machine where OpenClaw is installed.",
  "Run the install command below.",
  "When prompted, paste the API key from Settings.",
  "Restart the OpenClaw gateway if the installer asks you to.",
  "Come back here and confirm messages and memories are flowing into the dashboard.",
];

const verificationChecks = [
  "Your API key is active in Settings.",
  "The installer completes without errors.",
  "OpenClaw shows Memory Crystal as active after restart.",
  "New messages appear in the Messages tab.",
  "New long-term memories appear in the Memories tab.",
];

export default function DashboardDocsPage() {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8">
        <div>
          <p className="text-accent text-[11px] tracking-[0.22em] uppercase mb-2">Documentation</p>
          <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary tracking-wide">INSTALL DOCS</h1>
          <p className="text-secondary text-sm mt-2 max-w-3xl">
            Everything your client needs to install Memory Crystal on OpenClaw and verify it is working.
          </p>
        </div>
        <Link href="/settings" className="text-accent text-xs font-mono hover:underline">
          NEED AN API KEY?
        </Link>
      </div>

      <div className="space-y-6">
        <InstallCommandCard
          title="One-line install"
          description="Use this on the target OpenClaw machine. It installs the plugin, validates the API key, and finishes the basic wiring for you."
          command={DEFAULT_INSTALL_COMMAND}
          showDocsLink={false}
        />

        <section className="bg-surface border border-white/[0.07] p-5 sm:p-6">
          <h2 className="font-mono font-bold text-base sm:text-lg text-primary">Quick install steps</h2>
          <ol className="mt-4 space-y-3 text-sm text-secondary list-decimal pl-5">
            {installSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="bg-surface border border-white/[0.07] p-5 sm:p-6">
          <h2 className="font-mono font-bold text-base sm:text-lg text-primary">What the installer does</h2>
          <ul className="mt-4 space-y-3 text-sm text-secondary list-disc pl-5">
            <li>Checks that OpenClaw is installed.</li>
            <li>Prompts for your Memory Crystal API key.</li>
            <li>Validates the key against the Memory Crystal API.</li>
            <li>Installs the Memory Crystal hook files into your OpenClaw setup.</li>
            <li>Updates OpenClaw config so capture starts flowing into your dashboard.</li>
          </ul>
        </section>

        <section className="bg-surface border border-white/[0.07] p-5 sm:p-6">
          <h2 className="font-mono font-bold text-base sm:text-lg text-primary">Verify the install</h2>
          <ul className="mt-4 space-y-3 text-sm text-secondary list-disc pl-5">
            {verificationChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
