"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function DashboardPage() {
  const stats = useQuery(api.vexclaw.dashboard.getStats, {});

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
      <h1 className="font-mono font-bold text-2xl text-[#f0f0f0] mb-8 tracking-wide">DASHBOARD</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((s) => (
          <div key={s.label} className="bg-[#141414] border border-[#2a2a2a] p-6">
            <p className="text-[#888] text-xs tracking-widest uppercase mb-2">{s.label}</p>
            <p className="text-3xl font-bold text-[#f0f0f0]">{s.value}</p>
            <p className="text-[#888] text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
      <p className="text-[#888] text-xs tracking-widest uppercase mb-4">RECENT ACTIVITY</p>
      <div className="space-y-2">
        {stats?.recentActivity && stats.recentActivity.length > 0
          ? stats.recentActivity.map((m) => (
              <div
                key={`${m.title}-${m.createdAt}`}
                className="bg-[#141414] border border-[#2a2a2a] p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#f0f0f0] text-sm font-medium">{m.title}</span>
                  <span className="text-[#0066ff] text-xs border border-[#0066ff] px-2 py-0.5 font-mono">
                    {m.store}
                  </span>
                </div>
                <span className="text-[#888] text-xs shrink-0 ml-4">{formatTime(m.createdAt)}</span>
              </div>
            ))
          : !stats
            ? (
              <div className="text-[#888] text-sm px-2">Loading...</div>
            )
            : null}
      </div>
    </div>
  );
}
