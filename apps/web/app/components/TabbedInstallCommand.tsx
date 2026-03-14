"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

type InstallTab = {
  label: string;
  platforms: string[];
  command: string;
  note: string;
};

const INSTALL_TABS: InstallTab[] = [
  {
    label: "OpenClaw",
    platforms: ["macOS", "Linux"],
    command: "curl -fsSL https://memorycrystal.ai/install | bash",
    note: "Requires OpenClaw installed. macOS and Linux.",
  },
  {
    label: "Claude Code",
    platforms: ["macOS", "Linux", "Windows"],
    command:
      'claude mcp add memory-crystal --transport http https://api.memorycrystal.ai/mcp -- --header "Authorization: Bearer YOUR_API_KEY"',
    note: "Get your API key at memorycrystal.ai/dashboard",
  },
  {
    label: "Codex",
    platforms: ["macOS", "Linux", "Windows"],
    command: 'codex mcp add memory-crystal --transport http https://api.memorycrystal.ai/mcp',
    note: 'Then add bearer_token_env_var = "MEMORY_CRYSTAL_API_KEY" to ~/.codex/config.toml and export your API key.',
  },
  {
    label: "Factory",
    platforms: ["macOS", "Linux", "Windows"],
    command: "droid mcp add memory-crystal https://api.memorycrystal.ai/mcp",
    note: "Set MEMORY_CRYSTAL_API_KEY in your environment. Get your key at memorycrystal.ai/dashboard",
  },
];

export default function TabbedInstallCommand() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentTab = INSTALL_TABS[activeTab];

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentTab.command);
    setCopied(true);
  };

  return (
    <section className="border border-white/[0.08] bg-surface">
      <div className="border-b border-white/[0.08] px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap gap-5">
          {INSTALL_TABS.map((tab, index) => {
            const isActive = index === activeTab;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => {
                  setActiveTab(index);
                  setCopied(false);
                }}
                className={`border-b pb-3 text-sm font-mono transition ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-secondary hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {currentTab.platforms.map((platform) => (
            <span
              key={platform}
              className="border border-white/[0.12] bg-void px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-secondary"
            >
              {platform}
            </span>
          ))}
        </div>

        <div className="mt-4 border border-white/[0.09] bg-void overflow-x-auto">
          <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
            <pre className="min-w-0 flex-1 pr-4 text-sm sm:text-base font-mono text-primary whitespace-pre-wrap break-all">
              {currentTab.command}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : `Copy ${currentTab.label} install command`}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-white/[0.12] text-primary transition hover:border-accent hover:text-accent"
            >
              {copied ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={2} />}
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-secondary">{currentTab.note}</p>
      </div>
    </section>
  );
}
