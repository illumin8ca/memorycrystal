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

function MemoryPills({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-none border border-[#2a2a2a] px-2 py-1 text-[11px] uppercase tracking-wide text-[#f0f0f0]">{children}</span>;
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
    <div className="text-[#f0f0f0]">
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-[#f0f0f0] mb-2 tracking-wide">
        MEMORY EVAL
      </h1>
      <p className="text-sm mb-6 text-[#888888]">
        Recall quality, health, and capture trend over the last 14 days.
      </p>

      {/* Section 1: Health score card */}
      <section className="border border-[#2a2a2a] rounded-none bg-[#141414] p-5 sm:p-6 mb-6">
        <p className="text-xs tracking-widest uppercase mb-3 text-[#888888]">
          Memory Health Score
        </p>

        {isLoadingHealth ? (
          <p className="text-sm text-[#888888]">Loading...</p>
        ) : (
          <>
            <p className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-[#0066ff]">
              {healthStats.graphEnrichedPercent}% graph-enriched
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="border border-[#2a2a2a] rounded-none p-3">
                <p className="text-xs uppercase tracking-widest mb-1 text-[#888888]">Total memories</p>
                <p className="font-mono text-lg text-[#f0f0f0]">{healthStats.totalMemories.toLocaleString()}</p>
              </div>

              <div className="border border-[#2a2a2a] rounded-none p-3">
                <p className="text-xs uppercase tracking-widest mb-1 text-[#888888]">Never recalled</p>
                <p className="font-mono text-lg text-[#f0f0f0]">{healthStats.neverRecalledCount.toLocaleString()}</p>
              </div>

              <div className="border border-[#2a2a2a] rounded-none p-3">
                <p className="text-xs uppercase tracking-widest mb-1 text-[#888888]">Stale memories</p>
                <p className="font-mono text-sm text-[#f0f0f0]">
                  30d: {healthStats.staleCount30d.toLocaleString()} / 60d: {healthStats.staleCount60d.toLocaleString()} / 90d: {healthStats.staleCount90d.toLocaleString()}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-[#888888]">
              Avg strength: <span className="text-[#f0f0f0]">{formatStrength(healthStats.avgStrength)}</span>
            </p>
          </>
        )}
      </section>

      {/* Section 2: Memory distribution */}
      <section className="border border-[#2a2a2a] rounded-none bg-[#1e1e1e] p-5 sm:p-6 mb-6">
        <p className="text-xs tracking-widest uppercase mb-4 text-[#888888]">
          Memory Distribution by Store
        </p>

        {isLoadingHealth ? (
          <p className="text-sm text-[#888888]">Loading...</p>
        ) : distributionTotal === 0 ? (
          <p className="text-sm text-[#888888]">No active memories yet.</p>
        ) : (
          <div className="space-y-3">
            {STORES.map((store) => {
              const count = healthStats.byStore[store.key];
              const percent = distributionTotal > 0 ? Math.round((count / distributionTotal) * 100) : 0;

              return (
                <div key={store.key}>
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest mb-1">
                    <span className="text-[#888888]">{store.label}</span>
                    <span className="text-[#f0f0f0]">
                      {count.toLocaleString()} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 border border-[#2a2a2a] rounded-none">
                    <div
                      className="h-full bg-[#0066ff] transition-[width] duration-200"
                      style={{
                        width: `${percent}%`,
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
      <section className="border border-[#2a2a2a] rounded-none bg-[#141414] p-5 sm:p-6 mb-6">
        <p className="text-xs tracking-widest uppercase mb-4 text-[#888888]">
          Capture Trend (last 14 days)
        </p>

        {isLoadingTrend ? (
          <p className="text-sm text-[#888888]">Loading...</p>
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
      <section className="border border-[#2a2a2a] rounded-none bg-[#1e1e1e] p-5 sm:p-6 mb-6">
        <p className="text-xs tracking-widest uppercase mb-4 text-[#888888]">
          Top Recalled Memories
        </p>

        {isLoadingTop ? (
          <p className="text-sm text-[#888888]">Loading...</p>
        ) : topRecalled.length === 0 ? (
          <p className="text-sm text-[#888888]">No recalls yet.</p>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {topRecalled.map((row) => (
                <article
                  key={row.memoryId}
                  className="border border-[#2a2a2a] rounded-none bg-[#090909] p-3"
                >
                  <p className="font-mono text-[#f0f0f0] line-clamp-2 break-words">{row.title || "Untitled"}</p>
                  <p className="text-[11px] text-[#888888] mt-1">
                    Last accessed: {formatDate(row.lastAccessedAt)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <MemoryPills>Store: {formatStore(row.store)}</MemoryPills>
                    <MemoryPills>Category: {row.category}</MemoryPills>
                    <MemoryPills>Recalled: {row.accessCount}</MemoryPills>
                    <MemoryPills>Strength: {formatStrength(row.strength)}</MemoryPills>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest min-w-0 text-[#888888]">
                      Title
                    </th>
                    <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest text-[#888888]">Store</th>
                    <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest text-[#888888]">Category</th>
                    <th className="text-right py-2 pr-3 font-normal uppercase tracking-widest text-[#888888]">Recalled</th>
                    <th className="text-right py-2 font-normal uppercase tracking-widest text-[#888888]">Strength</th>
                  </tr>
                </thead>
                <tbody>
                  {topRecalled.map((row) => (
                    <tr key={row.memoryId} className="border-b border-[#2a2a2a]">
                      <td className="py-2 pr-3 min-w-0">
                        <p className="font-mono text-[#f0f0f0] truncate">{row.title || "Untitled"}</p>
                        <p className="mt-1 text-[11px] text-[#888888]">Last accessed: {formatDate(row.lastAccessedAt)}</p>
                      </td>
                      <td className="py-2 pr-3 text-[#f0f0f0]">{formatStore(row.store)}</td>
                      <td className="py-2 pr-3 text-[#f0f0f0]">{row.category}</td>
                      <td className="py-2 pr-3 text-right text-[#f0f0f0]">{row.accessCount}</td>
                      <td className="py-2 text-right text-[#f0f0f0]">{formatStrength(row.strength)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Section 5: Never recalled memories */}
      <section className="border border-[#2a2a2a] rounded-none bg-[#141414] p-5 sm:p-6">
        <p className="text-xs tracking-widest uppercase mb-4 text-[#888888]">
          Never Recalled Memories
        </p>

        {isLoadingNever ? (
          <p className="text-sm text-[#888888]">Loading...</p>
        ) : neverRecalled.length === 0 ? (
          <p className="text-sm text-[#888888]">No never-recalled memories.</p>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {neverRecalled.map((row) => (
                <article key={row.memoryId} className="border border-[#2a2a2a] rounded-none bg-[#090909] p-3">
                  <p className="font-mono text-[#f0f0f0] line-clamp-2 break-words">{row.title || "Untitled"}</p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <MemoryPills>Store: {formatStore(row.store)}</MemoryPills>
                    <MemoryPills>Category: {row.category}</MemoryPills>
                    <MemoryPills>Created: {formatShortDate(row.createdAt)}</MemoryPills>
                    <MemoryPills>Strength: {formatStrength(row.strength)}</MemoryPills>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest min-w-0 text-[#888888]">Title</th>
                    <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest text-[#888888]">Store</th>
                    <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest text-[#888888]">Category</th>
                    <th className="text-left py-2 pr-3 font-normal uppercase tracking-widest text-[#888888]">Created</th>
                    <th className="text-right py-2 font-normal uppercase tracking-widest text-[#888888]">Strength</th>
                  </tr>
                </thead>
                <tbody>
                  {neverRecalled.map((row) => (
                    <tr key={row.memoryId} className="border-b border-[#2a2a2a]">
                      <td className="py-2 pr-3 min-w-0">
                        <p className="font-mono text-[#f0f0f0] truncate">{row.title || "Untitled"}</p>
                      </td>
                      <td className="py-2 pr-3 text-[#f0f0f0]">{formatStore(row.store)}</td>
                      <td className="py-2 pr-3 text-[#f0f0f0]">{row.category}</td>
                      <td className="py-2 pr-3 text-[#f0f0f0]">{formatShortDate(row.createdAt)}</td>
                      <td className="py-2 text-right text-[#f0f0f0]">{formatStrength(row.strength)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="text-xs mt-3 text-[#888888]">
          These memories have never been surfaced in recall. Consider reviewing or archiving.
        </p>
      </section>
    </div>
  );
}
