"use client";

import { useState } from "react";
import Link from "next/link";

const DEFAULT_INSTALL_COMMAND = "curl -fsSL https://memorycrystal.ai/install | bash";

export function InstallCommandCard({
  title = "Install Memory Crystal",
  description = "Copy this one-liner into your terminal to install the OpenClaw plugin and connect your account.",
  command = DEFAULT_INSTALL_COMMAND,
  compact = false,
  showDocsLink = true,
}: {
  title?: string;
  description?: string;
  command?: string;
  compact?: boolean;
  showDocsLink?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="bg-surface border border-accent/45 p-4 sm:p-6">
      <div className={`flex ${compact ? "flex-col gap-4" : "flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-5"}`}>
        <div className="min-w-0">
          <p className="text-accent text-[11px] tracking-[0.22em] uppercase mb-2">Install</p>
          <h2 className="font-mono font-bold text-lg sm:text-xl text-primary">{title}</h2>
          <p className="text-secondary text-sm mt-2 max-w-3xl">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="btn-primary px-4 py-2 text-xs min-h-10"
            style={{ borderRadius: 0 }}
          >
            {copied ? "COPIED" : "COPY COMMAND"}
          </button>
          {showDocsLink ? (
            <Link href="/dashboard/docs" className="btn-secondary px-4 py-2 text-xs min-h-10 inline-flex items-center" style={{ borderRadius: 0 }}>
              OPEN DOCS
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border border-white/[0.09] bg-white/[0.03] overflow-x-auto">
        <pre className="p-4 sm:p-5 text-sm sm:text-base font-mono text-primary whitespace-pre-wrap break-all">{command}</pre>
      </div>
    </section>
  );
}

export { DEFAULT_INSTALL_COMMAND };
