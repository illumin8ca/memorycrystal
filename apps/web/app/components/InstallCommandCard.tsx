"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";

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
        {showDocsLink ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link href="/dashboard/docs" className="btn-secondary px-4 py-2 text-xs min-h-10 inline-flex items-center" style={{ borderRadius: 0 }}>
              OPEN DOCS
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-4 border border-white/[0.09] bg-white/[0.03] overflow-x-auto">
        <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <pre className="min-w-0 flex-1 pr-4 text-sm sm:text-base font-mono text-primary whitespace-pre-wrap break-all">{command}</pre>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy install command"}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-white/[0.12] text-primary transition hover:border-accent hover:text-accent"
            style={{ borderRadius: 0 }}
          >
            {copied ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={2} />}
          </button>
        </div>
      </div>
    </section>
  );
}

export { DEFAULT_INSTALL_COMMAND };
