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
      <h1 className="font-mono font-bold text-2xl text-primary mb-8 tracking-wide">DASHBOARD</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((s) => (
          <div key={s.label} className="bg-surface border border-border p-6">
            <p className="text-secondary text-xs tracking-widest uppercase mb-2">{s.label}</p>
            <p className="text-3xl font-bold neon-text">{s.value}</p>
            <p className="text-secondary text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
      <p className="text-secondary text-xs tracking-widest uppercase mb-4">RECENT ACTIVITY</p>
      <div className="space-y-2">
        {stats?.recentActivity && stats.recentActivity.length > 0
          ? stats.recentActivity.map((m) => (
              <div
                key={`${m.title}-${m.createdAt}`}
                className="bg-surface border border-border p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-primary text-sm font-medium">{m.title}</span>
                  <span className="text-accent text-xs border border-accent px-2 py-0.5 font-mono">
                    {m.store}
                  </span>
                </div>
                <span className="text-secondary text-xs shrink-0 ml-4">{formatTime(m.createdAt)}</span>
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
