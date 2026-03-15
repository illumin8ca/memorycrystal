"use client";

import { useState, useEffect, useRef } from "react";
import CrystalIcon from "./CrystalIcon";

/* ────────────────────────────────────────────────
   System Flow Steps
   ──────────────────────────────────────────────── */

interface Step {
  id: string;
  title: string;
  description: string;
  detail: string;
  icon: string;
  duration: number; // ms to show this step
}

const steps: Step[] = [
  {
    id: "capture",
    title: "1. Capture",
    description: "Your agent has a conversation",
    detail: "Every message, decision, and piece of context flows through the capture hook. Memory Crystal watches for important information — architecture decisions, preferences, project context, action items.",
    icon: "💬",
    duration: 4000,
  },
  {
    id: "embed",
    title: "2. Embed",
    description: "Memories are semantically embedded",
    detail: "Each captured memory is converted into a 3072-dimension vector using Gemini embeddings. This enables semantic search — finding memories by meaning, not just keywords.",
    icon: "🧬",
    duration: 4000,
  },
  {
    id: "enrich",
    title: "3. Enrich",
    description: "Knowledge graph extracts relationships",
    detail: "Graph enrichment identifies people, projects, decisions, and tools mentioned in each memory. It creates nodes and relations — connecting 'Andy decided to use Redis' to both the person and the technology.",
    icon: "🕸️",
    duration: 4000,
  },
  {
    id: "store",
    title: "4. Store",
    description: "Durable cloud storage",
    detail: "Memories persist in a cloud database with vector indexes. They survive compaction, session resets, agent restarts, and even switching between different AI platforms.",
    icon: "💎",
    duration: 4000,
  },
  {
    id: "recall",
    title: "5. Recall",
    description: "Agent queries memory before responding",
    detail: "When your agent gets a new message, the recall hook fires automatically. It embeds the query, searches for semantically similar memories, and injects relevant context — before the agent even starts thinking.",
    icon: "🔍",
    duration: 4000,
  },
  {
    id: "respond",
    title: "6. Respond",
    description: "Agent answers with full context",
    detail: "Your agent responds as if it remembers everything — because it does. Past decisions, project state, team preferences, technical choices. No re-explaining. No context loss.",
    icon: "✨",
    duration: 4000,
  },
];

/* ────────────────────────────────────────────────
   Flow Diagram (visual)
   ──────────────────────────────────────────────── */

function FlowNode({ step, isActive, isPast }: { step: Step; isActive: boolean; isPast: boolean }) {
  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-500 ${
        isActive
          ? "border-[#2180D6]/50 bg-[#2180D6]/[0.08] scale-[1.02]"
          : isPast
          ? "border-white/[0.12] bg-white/[0.03] opacity-70"
          : "border-white/[0.06] bg-transparent opacity-40"
      }`}
    >
      <span className="text-xl">{step.icon}</span>
      <div className="min-w-0">
        <p className={`text-[13px] font-mono font-semibold ${isActive ? "text-[#2180D6]" : "text-primary/80"}`}>
          {step.title}
        </p>
        <p className="text-[12px] text-secondary truncate">{step.description}</p>
      </div>
      {isActive && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#2180D6] animate-pulse" />
      )}
    </div>
  );
}

function DataFlowLine({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex justify-center py-1">
      <div className={`w-0.5 h-4 transition-colors duration-500 ${isActive ? "bg-[#2180D6]/60" : "bg-white/[0.08]"}`} />
    </div>
  );
}

/* ────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────── */

export default function ExplainerAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-start when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          setIsPlaying(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  // Auto-advance steps
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      setActiveStep((prev) => {
        if (prev >= steps.length - 1) {
          // Loop back after a pause
          setTimeout(() => {
            setActiveStep(0);
          }, 2000);
          return prev;
        }
        return prev + 1;
      });
    }, steps[activeStep].duration);
    return () => clearTimeout(timer);
  }, [isPlaying, activeStep]);

  const current = steps[activeStep];

  return (
    <div ref={containerRef} className="mt-8">
      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Flow diagram - left side */}
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.id}>
              <FlowNode step={step} isActive={i === activeStep} isPast={i < activeStep} />
              {i < steps.length - 1 && <DataFlowLine isActive={i < activeStep || i === activeStep} />}
            </div>
          ))}
        </div>

        {/* Detail panel - right side */}
        <div className="glass-card border border-white/[0.08] p-6 md:p-8 min-h-[320px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{current.icon}</span>
              <div>
                <p className="font-mono text-xs text-[#2180D6] tracking-[0.2em] uppercase">{current.title}</p>
                <h3 className="font-heading text-xl md:text-2xl mt-1">{current.description}</h3>
              </div>
            </div>
            <p className="text-secondary text-sm md:text-[15px] leading-relaxed">
              {current.detail}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-[11px] text-secondary mb-2">
              <span>Step {activeStep + 1} of {steps.length}</span>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-secondary hover:text-primary transition"
              >
                {isPlaying ? "⏸ Pause" : "▶ Play"}
              </button>
            </div>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i === activeStep
                      ? "bg-[#2180D6]"
                      : i < activeStep
                      ? "bg-[#2180D6]/40"
                      : "bg-white/[0.08]"
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
