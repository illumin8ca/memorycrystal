"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const stores = ["ALL", "SENSORY", "EPISODIC", "SEMANTIC", "PROCEDURAL", "PROSPECTIVE"];

const formatDate = (value?: number) => {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function MemoriesPage() {
  const [activeStore, setActive] = useState("ALL");
  const [search, setSearch] = useState("");

  const memories = useQuery(api.crystal.dashboard.listMemories, {
    store: activeStore === "ALL" ? undefined : activeStore.toLowerCase(),
    limit: 50,
  });

  const filtered = memories
    ? memories.filter(
        (m) =>
          !search.trim() ||
          m.title?.toLowerCase().includes(search.toLowerCase()) ||
          m.content?.toLowerCase().includes(search.toLowerCase()) ||
          m.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const isSearching = search.trim().length > 0;

  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-2 tracking-wide break-words">
        MEMORY VAULT ({memories ? (isSearching ? filtered.length : memories.length) : "Loading..."})
      </h1>
      <p className="text-secondary text-sm mb-3 sm:mb-4">Search and review memories pulled from Convex.</p>
      {memories && (
        <p className="text-secondary text-xs mb-4 font-mono">
          {isSearching ? `${filtered.length} memories` : `${memories.length} memories`}
        </p>
      )}
      <input
        placeholder="Search memories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-elevated border border-white/[0.07] text-primary p-3 min-h-11 text-sm mb-5 outline-none focus:border-accent focus:shadow-[0_0_0_1px_#2180D6,0_0_12px_rgba(33,128,214,0.2)] placeholder:text-secondary"
        style={{ borderRadius: 0 }}
      />
      <div className="flex gap-2 flex-wrap mb-6">
        {stores.map((store) => (
          <button
            key={store}
            onClick={() => setActive(store)}
            className={`px-3 py-2 min-h-11 text-xs font-mono border transition-colors ${activeStore === store ? "bg-accent text-white border-accent" : "bg-elevated text-secondary border-white/[0.07] hover:text-primary"}`}
            style={{ borderRadius: 0 }}
          >
            {store}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {!memories ? (
          <div className="text-secondary text-sm px-2">Loading...</div>
        ) : filtered.length === 0 && isSearching ? (
          <p className="text-secondary text-sm text-center py-12 font-mono">No memories match &quot;{search}&quot;</p>
        ) : filtered.length === 0 ? (
          <p className="text-secondary text-sm text-center py-12 font-mono">No memories yet.</p>
        ) : (
          filtered.map((m) => (
            <div key={m._id} className="bg-surface border border-white/[0.07] p-4 sm:p-5 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <span className="text-primary font-medium break-words">{m.title || "Untitled memory"}</span>
                <span className="text-secondary text-xs shrink-0">{formatDate(m.createdAt)}</span>
              </div>
              <p className="text-secondary text-sm mb-3 break-words">
                {(m.content || "").slice(0, 120)}
                {(m.content || "").length > 120 ? "..." : ""}
              </p>
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="text-accent text-xs border border-accent px-2 py-0.5 font-mono">{m.store}</span>
                <span className="text-secondary text-xs border border-white/[0.14] px-2 py-0.5 font-mono">
                  {(m.category || "uncategorized").toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {m.tags?.length ? (
                  m.tags.map((t: string) => (
                    <span key={t} className="border border-white/[0.07] text-secondary text-xs px-2 py-1 font-mono break-all">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-secondary/80 text-xs font-mono">No tags</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
