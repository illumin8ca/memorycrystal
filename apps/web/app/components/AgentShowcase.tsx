"use client";

import { useState } from "react";
import CrystalIcon from "./CrystalIcon";

interface ShowcaseCard {
  label: string;
  scenario: string;
  agentMessage: string;
  highlight: string;
}

const showcaseCards: ShowcaseCard[] = [
  {
    label: "POST-COMPACTION",
    scenario: "Session just compacted — agent reloads context from Memory Crystal",
    agentMessage:
      "Post-compaction refresh — this is #memorycrystal channel, not main session. Let me grab today's context and the recent conversation.\n\nGood — I have full context. Andy wants to execute on the competitive response plan from my LCM analysis, broken into subagent-ready work packages.",
    highlight: "Agent recovered full project context after compaction in seconds.",
  },
  {
    label: "NEW SESSION",
    scenario: "Fresh session — agent wakes up with zero conversation history",
    agentMessage:
      "Good morning. Gerald here — fresh session. Let me check what's active.\n\nFrom Memory Crystal: Memory Crystal sprint is active — graph enrichment at 72%, 13 integration tests passing, MCP server healthy. Piper was briefed for X promotion. Website DNS resolved.",
    highlight: "No re-explaining. Agent knew the full project state from memory.",
  },
  {
    label: "CROSS-AGENT RECALL",
    scenario: "Different agent recalls decisions made by another agent",
    agentMessage:
      "Checking Memory Crystal for prior decisions on this...\n\nFound it — Gerald decided on 2026-03-14 to switch all embeddings to Gemini (gemini-embedding-2-preview, 3072 dims) and eliminate the OpenAI dependency entirely. Commit 5db5892.",
    highlight: "One agent's decisions are instantly available to another.",
  },
  {
    label: "SEMANTIC RECALL",
    scenario: "Agent searches for relevant context using natural language",
    agentMessage:
      "Let me recall what we know about the Convex read limits...\n\nMemory Crystal returned 3 relevant memories: (1) 16MB read limit per function execution, (2) single paginated query per function constraint, (3) .take() with .filter() on _creationTime as the workaround for chunked counting.",
    highlight: "Semantic search — not keyword matching. Found exactly what was needed.",
  },
  {
    label: "KNOWLEDGE GRAPH",
    scenario: "Agent uses graph relationships to connect context",
    agentMessage:
      "Checking graph status for your account...\n\n1,293 enriched memories, 3,829 nodes, 4,906 relations. The graph links people → projects → decisions → code changes. When I recall 'Memory Crystal pricing', I also get the related decisions about free tier channels and Gemini Flash enrichment.",
    highlight: "Graph connects memories — recall pulls related context automatically.",
  },
];

export default function AgentShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const card = showcaseCards[activeIndex];

  return (
    <div className="mt-8">
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {showcaseCards.map((c, i) => (
          <button
            key={c.label}
            onClick={() => setActiveIndex(i)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.15em] transition-all ${
              i === activeIndex
                ? "bg-[#2180D6]/20 border border-[#2180D6]/50 text-primary"
                : "border border-white/[0.08] text-secondary hover:text-primary hover:border-white/20"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Card content */}
      <div className="glass-card border border-white/[0.08] overflow-hidden">
        {/* Scenario header */}
        <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <p className="text-xs font-mono text-secondary tracking-wide">{card.scenario}</p>
        </div>

        {/* Agent message - Discord-style */}
        <div className="p-5 md:p-6">
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="h-9 w-9 rounded-full bg-[#2180D6]/20 border border-[#2180D6]/30 flex items-center justify-center">
                <CrystalIcon size={16} glow />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">Memory Crystal Agent</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-[#5865F2] text-white">
                  APP
                </span>
                <span className="text-xs text-secondary/70">Today</span>
              </div>
              <div className="mt-1.5 text-sm text-[#DCDDDE] leading-relaxed whitespace-pre-line">
                {card.agentMessage}
              </div>
            </div>
          </div>
        </div>

        {/* Highlight bar */}
        <div className="px-5 py-3 border-t border-[#2180D6]/15 bg-[#2180D6]/[0.04]">
          <div className="flex items-center gap-2">
            <CrystalIcon size={12} glow className="shrink-0" />
            <p className="text-xs text-primary/90 font-medium">{card.highlight}</p>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-5">
        {showcaseCards.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIndex ? "w-6 bg-[#2180D6]" : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Show example ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
