"use client";

import Link from "next/link";
import { DEFAULT_INSTALL_COMMAND } from "../../../components/InstallCommandCard";

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
          <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary tracking-wide">DOCS</h1>
          <p className="text-secondary text-sm mt-2 max-w-3xl">
            Reference documentation for installation, verification, and what the Memory Crystal installer changes on an OpenClaw client.
          </p>
        </div>
        <Link href="/settings" className="text-accent text-xs font-mono hover:underline">
          NEED AN API KEY?
        </Link>
      </div>

      <div className="space-y-6">
        <section className="bg-surface border border-white/[0.07] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-mono font-bold text-base sm:text-lg text-primary">Install command reference</h2>
              <p className="text-secondary text-sm mt-2 max-w-3xl">
                The primary onboarding flow now lives in Get Started. Keep this page handy when you need the exact one-line installer or a quick reminder of the verification steps.
              </p>
            </div>
            <Link href="/get-started" className="text-accent text-xs font-mono hover:underline shrink-0">
              OPEN GET STARTED
            </Link>
          </div>

          <div className="mt-4 border border-white/[0.09] bg-white/[0.03] overflow-x-auto">
            <pre className="p-4 sm:p-5 text-sm sm:text-base font-mono text-primary whitespace-pre-wrap break-all">{DEFAULT_INSTALL_COMMAND}</pre>
          </div>
        </section>

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
