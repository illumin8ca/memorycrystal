"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function DashboardPage() {
  const stats = useQuery(api.crystal.dashboard.getStats, {});

  const cards = [
    {
      label: "TOTAL MEMORIES",
      value: stats ? String(stats.totalMemories) : "Loading...",
      sub: stats ? `across ${stats.activeStores} stores` : "Loading...",
    },
    {
      label: "MESSAGES CAPTURED",
      value: stats ? String(stats.totalMessages) : "Loading...",
      sub: stats ? "last 14 days" : "Loading...",
    },
    {
      label: "MEMORY STORES",
      value: stats ? String(stats.activeStores) : "Loading...",
      sub: stats ? "active" : "Loading...",
    },
    {
      label: "LAST CAPTURE",
      value: stats?.recentActivity?.[0]?.title ?? "Loading...",
      sub: stats?.recentActivity?.[0]
        ? `${stats.recentActivity[0].store.toUpperCase()} • ${formatTime(stats.recentActivity[0].createdAt)}`
        : "Loading...",
    },
  ];

  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-5 sm:mb-8 tracking-wide">DASHBOARD</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {cards.map((s) => (
          <div key={s.label} className="bg-surface border border-white/[0.07] p-4 sm:p-6 min-w-0">
            <p className="text-secondary text-[11px] tracking-widest uppercase mb-2">{s.label}</p>
            <p className="text-2xl sm:text-3xl font-bold neon-text break-words">{s.value}</p>
            <p className="text-secondary text-xs mt-1 break-words">{s.sub}</p>
          </div>
        ))}
      </div>
      <p className="text-secondary text-xs tracking-widest uppercase mb-3 sm:mb-4">RECENT ACTIVITY</p>
      <div className="space-y-2">
        {stats?.recentActivity && stats.recentActivity.length > 0
          ? stats.recentActivity.map((m) => (
              <div
                key={`${m.title}-${m.createdAt}`}
                className="bg-surface border border-white/[0.07] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-primary text-sm font-medium truncate">{m.title}</span>
                  <span className="text-accent text-[10px] sm:text-xs border border-accent px-2 py-0.5 font-mono shrink-0">
                    {m.store}
                  </span>
                </div>
                <span className="text-secondary text-xs shrink-0">{formatTime(m.createdAt)}</span>
              </div>
            ))
          : !stats
            ? (
              <div className="text-secondary text-sm px-2">Loading...</div>
            )
            : null}
      </div>
    </div>
  );
}
