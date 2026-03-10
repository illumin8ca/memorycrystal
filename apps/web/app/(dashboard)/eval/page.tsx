"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import BarChart from "./BarChart";

type MemoryHealthStats = {
  totalMemories: number;
  graphEnrichedCount: number;
  graphEnrichedPercent: number;
  staleCount30d: number;
  staleCount60d: number;
  staleCount90d: number;
  neverRecalledCount: number;
  avgStrength: number;
  byStore: {
    sensory: number;
    episodic: number;
    semantic: number;
    procedural: number;
    prospective: number;
  };
};

type TopRecallRow = {
  memoryId: string;
  title: string;
  store: string;
  category: string;
  accessCount: number;
  strength: number;
  lastAccessedAt: number;
};

type NeverRecalledRow = {
  memoryId: string;
  title: string;
  store: string;
  category: string;
  createdAt: number;
  strength: number;
};

type TrendPoint = {
  date: string;
  count: number;
};

const UI = {
  bg: "#141414",
  elevated: "#1e1e1e",
  border: "#2a2a2a",
  accent: "#0066ff",
  primary: "#f0f0f0",
  secondary: "#888888",
};

const STORES = [
  { key: "sensory", label: "Sensory" },
  { key: "episodic", label: "Episodic" },
  { key: "semantic", label: "Semantic" },
  { key: "procedural", label: "Procedural" },
  { key: "prospective", label: "Prospective" },
] as const;

function formatStrength(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function formatDate(value: number): string {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value: number): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatStore(store: string): string {
  return store.toUpperCase();
}

export default function EvalPage() {
  const healthStats = useQuery(api.crystal.evalStats.getMemoryHealthStats) as MemoryHealthStats | undefined;
  const topRecalled = useQuery(api.crystal.evalStats.getTopRecalledMemories, { limit: 10 }) as TopRecallRow[] | undefined;
  const neverRecalled = useQuery(api.crystal.evalStats.getNeverRecalledMemories, { limit: 10 }) as NeverRecalledRow[] | undefined;
  const captureTrend = useQuery(api.crystal.evalStats.getCaptureTrend) as TrendPoint[] | undefined;

  const isLoadingHealth = healthStats === undefined;
  const isLoadingTop = topRecalled === undefined;
  const isLoadingNever = neverRecalled === undefined;
  const isLoadingTrend = captureTrend === undefined;

  const totalMemories = healthStats?.totalMemories ?? 0;
  const distributionTotal = totalMemories > 0 ? totalMemories : 0;

  return (
    <div style={{ color: UI.primary }}>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-2 tracking-wide" style={{ color: UI.primary }}>
        MEMORY EVAL
      </h1>
      <p className="text-sm mb-6" style={{ color: UI.secondary }}>
        Recall quality, health, and capture trend over the last 14 days.
      </p>

      {/* Section 1: Health score card */}
      <section
        className="border border-[#2a2a2a] p-5 sm:p-6 mb-6"
        style={{ backgroundColor: UI.bg, borderColor: UI.border, borderRadius: 0 }}
      >
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: UI.secondary }}>
          Memory Health Score
        </p>

        {isLoadingHealth ? (
          <p className="text-sm" style={{ color: UI.secondary }}>Loading...</p>
        ) : (
          <>
            <p className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ color: UI.accent }}>
              {healthStats.graphEnrichedPercent}% graph-enriched
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="border border-[#2a2a2a] p-3" style={{ borderColor: UI.border, borderRadius: 0 }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: UI.secondary }}>Total memories</p>
                <p className="font-mono text-lg" style={{ color: UI.primary }}>{healthStats.totalMemories.toLocaleString()}</p>
              </div>

              <div className="border border-[#2a2a2a] p-3" style={{ borderColor: UI.border, borderRadius: 0 }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: UI.secondary }}>Never recalled</p>
                <p className="font-mono text-lg" style={{ color: UI.primary }}>{healthStats.neverRecalledCount.toLocaleString()}</p>
              </div>

              <div className="border border-[#2a2a2a] p-3" style={{ borderColor: UI.border, borderRadius: 0 }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: UI.secondary }}>Stale memories</p>
                <p className="font-mono text-sm" style={{ color: UI.primary }}>
                  30d: {healthStats.staleCount30d.toLocaleString()} / 60d: {healthStats.staleCount60d.toLocaleString()} / 90d: {healthStats.staleCount90d.toLocaleString()}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs" style={{ color: UI.secondary }}>
              Avg strength: <span style={{ color: UI.primary }}>{formatStrength(healthStats.avgStrength)}</span>
            </p>
          </>
        )}
      </section>

      {/* Section 2: Memory distribution */}
      <section
        className="border p-5 sm:p-6 mb-6"
        style={{ backgroundColor: UI.elevated, borderColor: UI.border, borderRadius: 0 }}
      >
        <p className="text-xs tracking-widest uppercase mb-4" style={{ color: UI.secondary }}>
          Memory Distribution by Store
        </p>

        {isLoadingHealth ? (
          <p className="text-sm" style={{ color: UI.secondary }}>Loading...</p>
        ) : distributionTotal === 0 ? (
          <p className="text-sm" style={{ color: UI.secondary }}>No active memories yet.</p>
        ) : (
          <div className="space-y-3">
            {STORES.map((store) => {
              const count = healthStats.byStore[store.key];
              const percent = distributionTotal > 0 ? Math.round((count / distributionTotal) * 100) : 0;

              return (
                <div key={store.key}>
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest mb-1">
                    <span style={{ color: UI.secondary }}>{store.label}</span>
                    <span style={{ color: UI.primary }}>
                      {count.toLocaleString()} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 border border-[#2a2a2a]" style={{ borderColor: UI.border }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: UI.accent,
                        transition: "width 0.2s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Capture trend */}
      <section
        className="border p-5 sm:p-6 mb-6"
        style={{ backgroundColor: UI.bg, borderColor: UI.border, borderRadius: 0 }}
      >
        <p className="text-xs tracking-widest uppercase mb-4" style={{ color: UI.secondary }}>
          Capture Trend (last 14 days)
        </p>

        {isLoadingTrend ? (
          <p className="text-sm" style={{ color: UI.secondary }}>Loading...</p>
        ) : (
          <>
            <BarChart
              data={(captureTrend ?? []).map((point) => ({ label: point.date, value: point.count }))}
              height={190}
            />
          </>
        )}
      </section>

      {/* Section 4: Top recalled memories */}
      <section
        className="border p-5 sm:p-6 mb-6"
        style={{ backgroundColor: UI.elevated, borderColor: UI.border, borderRadius: 0 }}
      >
        <p className="text-xs tracking-widest uppercase mb-4" style={{ color: UI.secondary }}>
          Top Recalled Memories
        </p>

        {isLoadingTop ? (
          <p className="text-sm" style={{ color: UI.secondary }}>Loading...</p>
        ) : topRecalled.length === 0 ? (
          <p className="text-sm" style={{ color: UI.secondary }}>No recalls yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${UI.border}` }}>
                  <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest" style={{ color: UI.secondary }}>Title</th>
                  <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest" style={{ color: UI.secondary }}>Store</th>
                  <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest" style={{ color: UI.secondary }}>Category</th>
                  <th className="text-right py-2 pr-3 font-normal uppercase tracking-widest" style={{ color: UI.secondary }}>Recalled</th>
                  <th className="text-right py-2 font-normal uppercase tracking-widest" style={{ color: UI.secondary }}>Strength</th>
                </tr>
              </thead>
              <tbody>
                {topRecalled.map((row) => (
                  <tr key={row.memoryId} style={{ borderBottom: `1px solid ${UI.border}` }}>
                    <td className="py-2 pr-3 break-words max-w-0">
                      <p className="font-mono" style={{ color: UI.primary }}>{row.title || "Untitled"}</p>
                      <p className="text-[11px]" style={{ color: UI.secondary }}>
                        Last accessed: {formatDate(row.lastAccessedAt)}
                      </p>
                    </td>
                    <td className="py-2 pr-3" style={{ color: UI.primary }}>{formatStore(row.store)}</td>
                    <td className="py-2 pr-3" style={{ color: UI.primary }}>{row.category}</td>
                    <td className="py-2 pr-3 text-right" style={{ color: UI.primary }}>{row.accessCount}</td>
                    <td className="py-2 text-right" style={{ color: UI.primary }}>{formatStrength(row.strength)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 5: Never recalled memories */}
      <section
        className="border p-5 sm:p-6"
        style={{ backgroundColor: UI.bg, borderColor: UI.border, borderRadius: 0 }}
      >
        <p className="text-xs tracking-widest uppercase mb-4" style={{ color: UI.secondary }}>
          Never Recalled Memories
        </p>

        {isLoadingNever ? (
          <p className="text-sm" style={{ color: UI.secondary }}>Loading...</p>
        ) : neverRecalled.length === 0 ? (
          <p className="text-sm" style={{ color: UI.secondary }}>No never-recalled memories.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${UI.border}` }}>
                  <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest" style={{ color: UI.secondary }}>Title</th>
                  <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest" style={{ color: UI.secondary }}>Store</th>
                  <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest" style={{ color: UI.secondary }}>Created</th>
                  <th className="text-right py-2 font-normal uppercase tracking-widest" style={{ color: UI.secondary }}>Strength</th>
                </tr>
              </thead>
              <tbody>
                {neverRecalled.map((row) => (
                  <tr key={row.memoryId} style={{ borderBottom: `1px solid ${UI.border}` }}>
                    <td className="py-2 pr-3 break-words max-w-0">
                      <p className="font-mono" style={{ color: UI.primary }}>{row.title || "Untitled"}</p>
                    </td>
                    <td className="py-2 pr-3" style={{ color: UI.primary }}>{formatStore(row.store)}</td>
                    <td className="py-2 pr-3" style={{ color: UI.primary }}>{formatShortDate(row.createdAt)}</td>
                    <td className="py-2 text-right" style={{ color: UI.primary }}>{formatStrength(row.strength)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs mt-3" style={{ color: UI.secondary }}>
          These memories have never been surfaced in recall. Consider reviewing or archiving.
        </p>
      </section>
    </div>
  );
}
