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
  neverRecalledPercent: number;
  avgStrength: number;
  totalAccessCount: number;
  avgRecallsPerMemory: number;
  scannedSample: number;
  byStore: {
    sensory: number;
    episodic: number;
    semantic: number;
    procedural: number;
    prospective: number;
  };
};

type CategoryBreakdownRow = {
  category: string;
  count: number;
  percent: number;
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
  { key: "sensory", label: "Sensory", description: "Raw observations and immediate inputs." },
  { key: "episodic", label: "Episodic", description: "Specific events, conversations, and moments." },
  { key: "semantic", label: "Semantic", description: "Facts, concepts, and distilled knowledge." },
  { key: "procedural", label: "Procedural", description: "How-to knowledge, workflows, and habits." },
  { key: "prospective", label: "Prospective", description: "Future reminders, plans, and commitments." },
] as const;

function formatStrength(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function formatRecalls(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
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

function formatCategory(category: string): string {
  return category
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function MemoryPills({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-none border border-[#2a2a2a] px-2 py-1 text-[11px] uppercase tracking-wide text-[#f0f0f0]">{children}</span>;
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="border border-[#2a2a2a] rounded-none bg-[#090909] p-4">
      <p className="text-[11px] uppercase tracking-widest mb-2 text-[#888888]">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-[#f0f0f0]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#888888]">{helper}</p>
    </div>
  );
}

function RecommendationItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-[#2a2a2a] rounded-none bg-[#090909] p-4">
      <p className="text-sm font-semibold text-[#f0f0f0]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#888888]">{body}</p>
    </div>
  );
}

export default function EvalPage() {
  const healthStats = useQuery(api.crystal.evalStats.getMemoryHealthStats) as MemoryHealthStats | undefined;
  const categoryBreakdown = useQuery(api.crystal.evalStats.getCategoryBreakdown, { limit: 8 }) as CategoryBreakdownRow[] | undefined;
  const topRecalled = useQuery(api.crystal.evalStats.getTopRecalledMemories, { limit: 10 }) as TopRecallRow[] | undefined;
  const neverRecalled = useQuery(api.crystal.evalStats.getNeverRecalledMemories, { limit: 10 }) as NeverRecalledRow[] | undefined;
  const captureTrend = useQuery(api.crystal.evalStats.getCaptureTrend) as TrendPoint[] | undefined;

  const isLoadingHealth = healthStats === undefined;
  const isLoadingCategories = categoryBreakdown === undefined;
  const isLoadingTop = topRecalled === undefined;
  const isLoadingNever = neverRecalled === undefined;
  const isLoadingTrend = captureTrend === undefined;

  const totalMemories = healthStats?.totalMemories ?? 0;
  const distributionTotal = totalMemories > 0 ? totalMemories : 0;
  const topStore = !healthStats
    ? null
    : STORES.map((store) => ({ ...store, count: healthStats.byStore[store.key] }))
        .sort((a, b) => b.count - a.count)[0];

  const recommendations: Array<{ title: string; body: string }> = [];

  if (healthStats) {
    if (healthStats.graphEnrichedPercent < 70) {
      recommendations.push({
        title: "Improve graph enrichment coverage",
        body: "Less than 70% of sampled memories have been graph-enriched. Tighten structured extraction or background enrichment so more memories are connected and easier to recall later.",
      });
    }

    if (healthStats.neverRecalledPercent > 55) {
      recommendations.push({
        title: "Too much captured memory is going unused",
        body: "A large share of memories have never been recalled. That usually means capture is broad but not selective enough, or the system needs more pruning and stronger retrieval cues.",
      });
    }

    const episodicShare = totalMemories > 0 ? (healthStats.byStore.episodic / totalMemories) * 100 : 0;
    if (episodicShare > 60) {
      recommendations.push({
        title: "Distill more episodic memory into reusable knowledge",
        body: "Episodic memories dominate the store. Consider turning repeated events and conversations into semantic facts or procedural patterns so the system retains what matters, not just what happened.",
      });
    }

    if (healthStats.avgRecallsPerMemory < 1) {
      recommendations.push({
        title: "Recall volume per memory is still low",
        body: "On average, memories are being accessed less than once across the sampled store. That suggests recall is still underpowered or the saved memories are not yet aligned with the most common prompts and workflows.",
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: "Memory quality looks healthy",
        body: "Enrichment, recall usage, and store balance are all in a reasonable range for the sampled data. The next benchmark to watch is whether higher-quality semantic and procedural memory continues to grow with usage.",
      });
    }
  }

  return (
    <div className="text-[#f0f0f0]">
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-[#f0f0f0] mb-2 tracking-wide">
        MEMORY TELEMETRY
      </h1>
      <p className="text-sm mb-2 text-[#888888]">
        Internal benchmarks for what the agent stores, what gets used, and where recall quality can improve.
      </p>
      <p className="text-xs mb-6 text-[#666666]">
        Metrics below are computed from active memories and sampled records in the current store, so this page stays fast while still showing useful usage patterns.
      </p>

      <section className="border border-[#2a2a2a] rounded-none bg-[#141414] p-5 sm:p-6 mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs tracking-widest uppercase mb-3 text-[#888888]">
              Telemetry Summary
            </p>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-accent">
              {isLoadingHealth ? "Loading..." : `${healthStats.graphEnrichedPercent}% graph-enriched`}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#888888]">
              Graph-enriched memories have gone through extra structure extraction, so they are easier to relate, rank, and reuse during recall. High coverage usually means better retrieval quality and more explainable memory behavior.
            </p>
          </div>

          {!isLoadingHealth && (
            <div className="border border-[#2a2a2a] rounded-none bg-[#090909] px-4 py-3 min-w-[220px]">
              <p className="text-[11px] uppercase tracking-widest text-[#888888]">Scanned sample</p>
              <p className="mt-1 font-mono text-lg text-[#f0f0f0]">{healthStats.scannedSample.toLocaleString()}</p>
              <p className="mt-2 text-xs leading-5 text-[#888888]">
                Aggregate counts use dashboard totals where available. Per-memory quality metrics are estimated from a safe sample of active records.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Total memories"
          value={isLoadingHealth ? "..." : totalMemories.toLocaleString()}
          helper="Active memories currently stored across all memory systems."
        />
        <StatCard
          label="Graph-enriched"
          value={isLoadingHealth ? "..." : `${healthStats.graphEnrichedPercent}%`}
          helper="Share of sampled memories that have extra graph structure for better linking and recall."
        />
        <StatCard
          label="Never recalled"
          value={isLoadingHealth ? "..." : `${healthStats.neverRecalledPercent}%`}
          helper="Memories that have never been surfaced during recall. High values often signal capture without reuse."
        />
        <StatCard
          label="Avg recalls / memory"
          value={isLoadingHealth ? "..." : formatRecalls(healthStats.avgRecallsPerMemory)}
          helper="Average access count across the sampled store. A simple benchmark for actual usage, not just storage."
        />
        <StatCard
          label="Avg strength"
          value={isLoadingHealth ? "..." : formatStrength(healthStats.avgStrength)}
          helper="Average memory strength in the sampled store. Stronger memories should be more likely to survive and rank well."
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 mb-6">
        <div className="border border-[#2a2a2a] rounded-none bg-[#1e1e1e] p-5 sm:p-6">
          <p className="text-xs tracking-widest uppercase mb-4 text-[#888888]">
            Store Mix
          </p>

          {isLoadingHealth ? (
            <p className="text-sm text-[#888888]">Loading...</p>
          ) : distributionTotal === 0 ? (
            <p className="text-sm text-[#888888]">No active memories yet.</p>
          ) : (
            <>
              <p className="text-sm leading-6 text-[#888888] mb-4">
                This shows what kind of memory the system is accumulating. If one store dominates too heavily, it can be a sign the agent is capturing lots of raw history but not enough distilled knowledge.
              </p>
              <div className="space-y-4">
                {STORES.map((store) => {
                  const count = healthStats.byStore[store.key];
                  const percent = distributionTotal > 0 ? Math.round((count / distributionTotal) * 100) : 0;

                  return (
                    <div key={store.key}>
                      <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-widest mb-1.5">
                        <span className="text-[#f0f0f0]">{store.label}</span>
                        <span className="text-[#888888]">
                          {count.toLocaleString()} ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 border border-[#2a2a2a] rounded-none bg-[#090909]">
                        <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${percent}%` }} />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[#666666]">{store.description}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="border border-[#2a2a2a] rounded-none bg-[#141414] p-5 sm:p-6">
          <p className="text-xs tracking-widest uppercase mb-4 text-[#888888]">
            Benchmark Callouts
          </p>

          {isLoadingHealth ? (
            <p className="text-sm text-[#888888]">Loading...</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((item) => (
                <RecommendationItem key={item.title} title={item.title} body={item.body} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 mb-6">
        <div className="border border-[#2a2a2a] rounded-none bg-[#141414] p-5 sm:p-6">
          <p className="text-xs tracking-widest uppercase mb-4 text-[#888888]">
            Capture Trend (last 14 days)
          </p>

          {isLoadingTrend ? (
            <p className="text-sm text-[#888888]">Loading...</p>
          ) : (
            <>
              <p className="text-sm leading-6 text-[#888888] mb-4">
                Daily memory creation volume. Spikes usually reflect busy sessions, imports, or broad capture. Flat usage with rising capture often means the system is storing more than it is learning from.
              </p>
              <BarChart
                data={(captureTrend ?? []).map((point) => ({ label: point.date, value: point.count }))}
                height={190}
              />
            </>
          )}
        </div>

        <div className="border border-[#2a2a2a] rounded-none bg-[#1e1e1e] p-5 sm:p-6">
          <p className="text-xs tracking-widest uppercase mb-4 text-[#888888]">
            Category Breakdown
          </p>

          {isLoadingCategories ? (
            <p className="text-sm text-[#888888]">Loading...</p>
          ) : !categoryBreakdown || categoryBreakdown.length === 0 ? (
            <p className="text-sm text-[#888888]">No category data available yet.</p>
          ) : (
            <>
              <p className="text-sm leading-6 text-[#888888] mb-4">
                Top categories in the sampled store. This helps show what the agent is actually remembering most often, beyond broad memory-store labels.
              </p>
              <div className="space-y-3">
                {categoryBreakdown.map((row) => (
                  <div key={row.category}>
                    <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-widest mb-1.5">
                      <span className="text-[#f0f0f0]">{formatCategory(row.category)}</span>
                      <span className="text-[#888888]">{row.count.toLocaleString()} ({row.percent}%)</span>
                    </div>
                    <div className="h-2 border border-[#2a2a2a] rounded-none bg-[#090909]">
                      <div className="h-full bg-accent" style={{ width: `${Math.max(row.percent, 2)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="border border-[#2a2a2a] rounded-none bg-[#1e1e1e] p-5 sm:p-6">
          <p className="text-xs tracking-widest uppercase mb-4 text-[#888888]">
            Most Recalled Memories
          </p>
          <p className="text-sm leading-6 text-[#888888] mb-4">
            These are the memories the system is using most often during recall. Repeated use is a good signal that the stored information is relevant and well connected to real prompts.
          </p>

          {isLoadingTop ? (
            <p className="text-sm text-[#888888]">Loading...</p>
          ) : !topRecalled || topRecalled.length === 0 ? (
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
        </div>

        <div className="border border-[#2a2a2a] rounded-none bg-[#141414] p-5 sm:p-6">
          <p className="text-xs tracking-widest uppercase mb-4 text-[#888888]">
            Ignored or Unused Memories
          </p>
          <p className="text-sm leading-6 text-[#888888] mb-4">
            These memories have never been surfaced in recall. Some will be useful later, but a high unused share is often a sign that capture is too noisy or the system is not distilling enough signal from what it stores.
          </p>

          {isLoadingNever ? (
            <p className="text-sm text-[#888888]">Loading...</p>
          ) : !neverRecalled || neverRecalled.length === 0 ? (
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
        </div>
      </section>

      {!isLoadingHealth && topStore && (
        <section className="border border-[#2a2a2a] rounded-none bg-[#090909] p-5 sm:p-6">
          <p className="text-xs tracking-widest uppercase mb-3 text-[#888888]">
            Quick Read
          </p>
          <p className="text-sm leading-6 text-[#888888]">
            The current store is led by <span className="text-[#f0f0f0]">{topStore.label.toLowerCase()}</span> memory, with <span className="text-[#f0f0f0]">{healthStats.graphEnrichedPercent}%</span> graph coverage and <span className="text-[#f0f0f0]">{healthStats.neverRecalledPercent}%</span> of sampled memories still unused. In plain English: the system is remembering <span className="text-[#f0f0f0]">{totalMemories.toLocaleString()}</span> things, but its benchmark quality depends on whether those memories are structured, reusable, and actually recalled when needed.
          </p>
        </section>
      )}
    </div>
  );
}
