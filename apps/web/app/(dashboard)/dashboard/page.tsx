"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function DashboardPage() {
  const stats = useQuery(api.crystal.dashboard.getStats, {});
  const recentMemories = useQuery(api.crystal.dashboard.listMemories, { limit: 5 });
  const recentMessages = useQuery(api.crystal.dashboard.listMessages, { limit: 3 });

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="text-secondary text-xs tracking-widest uppercase">Recent Memories</p>
            <Link href="/memories" className="text-accent text-xs font-mono hover:underline">
              VIEW ALL
            </Link>
          </div>
          <div className="space-y-2">
            {!recentMemories ? (
              <div className="text-secondary text-sm px-2">Loading...</div>
            ) : recentMemories.length === 0 ? (
              <div className="text-secondary text-sm px-2">No memories yet.</div>
            ) : (
              recentMemories.map((m) => (
                <Link
                  key={m._id}
                  href="/memories"
                  className="block bg-surface border border-white/[0.07] p-3 sm:p-4 hover:border-accent/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-primary text-sm font-medium line-clamp-1">{m.title || "Untitled"}</p>
                    <span className="text-accent text-[10px] sm:text-xs border border-accent px-2 py-0.5 font-mono shrink-0">
                      {m.store}
                    </span>
                  </div>
                  <p className="text-secondary text-xs line-clamp-2">{m.content}</p>
                </Link>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="text-secondary text-xs tracking-widest uppercase">Recent Messages</p>
            <Link href="/messages" className="text-accent text-xs font-mono hover:underline">
              VIEW ALL
            </Link>
          </div>
          <div className="space-y-2">
            {!recentMessages ? (
              <div className="text-secondary text-sm px-2">Loading...</div>
            ) : recentMessages.length === 0 ? (
              <div className="text-secondary text-sm px-2">No messages yet.</div>
            ) : (
              recentMessages.map((m) => (
                <Link
                  key={m._id}
                  href="/messages"
                  className="block bg-surface border border-white/[0.07] p-3 sm:p-4 hover:border-accent/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span
                      className={`text-[10px] sm:text-xs font-mono border px-2 py-0.5 shrink-0 ${
                        m.role === "user" ? "text-accent border-accent" : "text-secondary border-white/[0.14]"
                      }`}
                    >
                      {m.role === "user" ? "USER" : m.role === "assistant" ? "AI" : m.role.toUpperCase()}
                    </span>
                    <span className="text-secondary text-xs">{formatTime(m.timestamp)}</span>
                  </div>
                  <p className="text-primary text-sm line-clamp-2">{m.content}</p>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
