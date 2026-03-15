"use client";

import { useState } from "react";
import CrystalIcon from "./CrystalIcon";

interface Screenshot {
  id: string;
  label: string;
  src: string;
  alt: string;
  caption: string;
}

const screenshots: Screenshot[] = [
  {
    id: "terminal-compaction",
    label: "Terminal",
    src: "/images/screenshots/terminal-recall.webp",
    alt: "macOS terminal showing an AI agent recovering full project context from Memory Crystal after session compaction",
    caption: "Agent recovers full project context after session compaction — no re-explaining needed.",
  },
  {
    id: "discord-recall",
    label: "Discord",
    src: "/images/screenshots/discord-recall.webp",
    alt: "Discord channel showing an AI agent recalling architecture decisions from Memory Crystal",
    caption: "Agent recalls prior decisions in a Discord channel using semantic search.",
  },
  {
    id: "telegram-memory",
    label: "Telegram",
    src: "/images/screenshots/telegram-recall.webp",
    alt: "Telegram chat showing an AI agent referencing yesterday's conversation from Memory Crystal",
    caption: "Agent references yesterday's conversation from Telegram — cross-platform memory.",
  },
];

export default function MockScreenshots() {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = screenshots[activeIndex];

  return (
    <div className="mt-8">
      {/* Platform tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {screenshots.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveIndex(i)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.15em] transition-all ${
              i === activeIndex
                ? "bg-[#2180D6]/20 border border-[#2180D6]/50 text-primary"
                : "border border-white/[0.08] text-secondary hover:text-primary hover:border-white/20"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Screenshot image */}
      <div className="glass-card border border-white/[0.08] overflow-hidden rounded-lg">
        <img
          src={current.src}
          alt={current.alt}
          className="w-full h-auto"
          loading={activeIndex === 0 ? "eager" : "lazy"}
        />
      </div>

      {/* Caption */}
      <div className="mt-4 flex items-center gap-2">
        <CrystalIcon size={12} glow className="shrink-0" />
        <p className="text-xs text-primary/80">{current.caption}</p>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {screenshots.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIndex ? "w-6 bg-[#2180D6]" : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Show ${screenshots[i].label} screenshot`}
          />
        ))}
      </div>
    </div>
  );
}
