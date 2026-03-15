"use client";

import { useState, useEffect, useRef } from "react";

interface TerminalLine {
  text: string;
  type: "command" | "info" | "success" | "arrow" | "dim" | "brand" | "box" | "blank";
  delay: number; // ms after previous line
}

const terminalLines: TerminalLine[] = [
  { text: "$ curl -fsSL https://memorycrystal.ai/install | bash", type: "command", delay: 0 },
  { text: "", type: "blank", delay: 400 },
  { text: "  ◆ Memory Crystal Installer", type: "brand", delay: 300 },
  { text: "    Persistent memory for your AI agents", type: "dim", delay: 150 },
  { text: "", type: "blank", delay: 300 },
  { text: "  ✓ OpenClaw detected (2026.2.13)", type: "success", delay: 500 },
  { text: "", type: "blank", delay: 200 },
  { text: "  → Starting browser authorization flow", type: "arrow", delay: 600 },
  { text: "  → Open browser to authorize this install", type: "arrow", delay: 300 },
  { text: "    Code: GX9C-TL", type: "dim", delay: 200 },
  { text: "", type: "blank", delay: 400 },
  { text: "  ✓ Browser opened. Approve the install, then come back here.", type: "success", delay: 800 },
  { text: "  → Waiting for authorization (up to 3 minutes)...", type: "arrow", delay: 500 },
  { text: "  ✓ Device authorized", type: "success", delay: 1000 },
  { text: "  → Validating API key...", type: "arrow", delay: 300 },
  { text: "  ✓ API key valid", type: "success", delay: 500 },
  { text: "  → Installing crystal-memory plugin...", type: "arrow", delay: 400 },
  { text: "  ✓ Plugin files written", type: "success", delay: 600 },
  { text: "  → Updating OpenClaw config...", type: "arrow", delay: 300 },
  { text: "  ✓ OpenClaw config updated", type: "success", delay: 400 },
  { text: "", type: "blank", delay: 200 },
  { text: "  → Restarting OpenClaw gateway...", type: "arrow", delay: 500 },
  { text: "  ✓ OpenClaw gateway restarted", type: "success", delay: 800 },
  { text: "  → Verifying Memory Crystal activation...", type: "arrow", delay: 400 },
  { text: "  ✓ Verified plugins.slots.memory = crystal-memory", type: "success", delay: 300 },
  { text: "  ✓ Verified crystal-memory plugin is loaded", type: "success", delay: 200 },
  { text: "", type: "blank", delay: 400 },
  { text: "  ┌──────────────────────────────────────────┐", type: "box", delay: 300 },
  { text: "  │                                          │", type: "box", delay: 50 },
  { text: "  │  ◆ Memory Crystal is active!             │", type: "box", delay: 100 },
  { text: "  │                                          │", type: "box", delay: 50 },
  { text: "  │  View your memory:                       │", type: "box", delay: 50 },
  { text: "  │  https://memorycrystal.ai                │", type: "box", delay: 50 },
  { text: "  │                                          │", type: "box", delay: 50 },
  { text: "  └──────────────────────────────────────────┘", type: "box", delay: 100 },
];

function colorize(line: TerminalLine): React.ReactNode {
  switch (line.type) {
    case "command":
      return (
        <span>
          <span className="text-[#6B7280]">$</span>{" "}
          <span className="text-[#E5E7EB]">{line.text.slice(2)}</span>
        </span>
      );
    case "success":
      return (
        <span>
          <span className="text-[#10B981]">  ✓</span>
          <span className="text-[#D1D5DB]">{line.text.slice(3)}</span>
        </span>
      );
    case "arrow":
      return (
        <span>
          <span className="text-[#2180D6]">  →</span>
          <span className="text-[#9CA3AF]">{line.text.slice(3)}</span>
        </span>
      );
    case "brand":
      return <span className="text-[#2180D6] font-semibold">{line.text}</span>;
    case "dim":
      return <span className="text-[#6B7280]">{line.text}</span>;
    case "box":
      return <span className="text-[#2180D6]">{line.text}</span>;
    case "blank":
      return <span>&nbsp;</span>;
    default:
      return <span className="text-[#9CA3AF]">{line.text}</span>;
  }
}

export default function TerminalAnimation() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Intersection observer to trigger animation when visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  // Animate lines sequentially
  useEffect(() => {
    if (!hasStarted) return;
    if (visibleCount >= terminalLines.length) return;

    const nextLine = terminalLines[visibleCount];
    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, nextLine.delay);

    return () => clearTimeout(timer);
  }, [hasStarted, visibleCount]);

  // Auto-scroll to bottom as lines appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  // Restart animation when it completes
  useEffect(() => {
    if (visibleCount >= terminalLines.length) {
      const restartTimer = setTimeout(() => {
        setVisibleCount(0);
        setTimeout(() => setVisibleCount(1), 100);
      }, 5000);
      return () => clearTimeout(restartTimer);
    }
  }, [visibleCount]);

  return (
    <div ref={containerRef} className="w-full">
      {/* Terminal window chrome */}
      <div className="rounded-lg border border-white/[0.08] overflow-hidden bg-[#0D1117] shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161B22] border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
            <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
            <div className="h-3 w-3 rounded-full bg-[#28C840]" />
          </div>
          <span className="ml-2 text-[11px] text-[#6B7280] font-mono">Terminal — bash</span>
        </div>

        {/* Terminal content */}
        <div
          ref={scrollRef}
          className="p-4 font-mono text-[12px] md:text-[13px] leading-[1.7] overflow-y-auto max-h-[360px] md:max-h-[420px]"
        >
          {terminalLines.slice(0, visibleCount).map((line, i) => (
            <div
              key={i}
              className="animate-in fade-in duration-150"
              style={{ minHeight: line.type === "blank" ? "0.5em" : undefined }}
            >
              {colorize(line)}
            </div>
          ))}
          {/* Blinking cursor */}
          {visibleCount < terminalLines.length && (
            <span className="inline-block w-2 h-4 bg-[#2180D6] animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
