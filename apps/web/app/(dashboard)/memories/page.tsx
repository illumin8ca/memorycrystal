"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useImpersonation } from "../ImpersonationContext";

const stores = ["ALL", "SENSORY", "EPISODIC", "SEMANTIC", "PROCEDURAL", "PROSPECTIVE"];
const PAGE_SIZE = 25;

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
  const [activeStore, setActiveStore] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Reset to page 0 when store changes
  const handleStoreChange = (s: string) => {
    setActiveStore(s);
    setPage(0);
  };

  const { asUserId } = useImpersonation();
  const memories = useQuery(api.crystal.dashboard.listMemories, {
    asUserId,
    store: activeStore === "ALL" ? undefined : activeStore.toLowerCase(),
    limit: PAGE_SIZE,
    page,
  });

  const totalCount = memories?.[0]?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  type MemoryRow = NonNullable<typeof memories>[number];

  // Client-side search filter across the current page
  const filtered: MemoryRow[] = memories
    ? memories.filter(
        (m: MemoryRow) =>
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
        MEMORY VAULT
        {memories !== undefined && (
          <span className="text-white/30 font-normal text-base ml-2">
            ({isSearching ? filtered.length : totalCount})
          </span>
        )}
      </h1>
      <p className="text-secondary text-sm mb-4">Search and review your crystallized memories.</p>

      <input
        placeholder="Search this page…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-elevated border border-white/[0.07] text-primary p-3 min-h-11 text-sm mb-4 outline-none focus:border-accent focus:shadow-[0_0_0_1px_#2180D6,0_0_12px_rgba(33,128,214,0.2)] placeholder:text-secondary"
        style={{ borderRadius: 0 }}
      />

      <div className="flex gap-2 flex-wrap mb-6">
        {stores.map((store) => (
          <button
            key={store}
            onClick={() => handleStoreChange(store)}
            className={`px-3 py-2 min-h-11 text-xs font-mono border transition-colors ${
              activeStore === store
                ? "bg-accent text-white border-accent"
                : "bg-elevated text-secondary border-white/[0.07] hover:text-primary"
            }`}
            style={{ borderRadius: 0 }}
          >
            {store}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {!memories ? (
          <div className="text-secondary text-sm px-2">Loading...</div>
        ) : filtered.length === 0 && isSearching ? (
          <p className="text-secondary text-sm text-center py-12 font-mono">No memories match &quot;{search}&quot;</p>
        ) : filtered.length === 0 ? (
          <p className="text-secondary text-sm text-center py-12 font-mono">No memories yet.</p>
        ) : (
          filtered.map((m) => (
            <div key={m._id} className="bg-surface border border-white/[0.07] p-4 sm:p-5 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-primary text-sm font-medium break-words leading-snug">{m.title || "Untitled"}</p>
                <span className="text-accent text-[10px] sm:text-xs border border-accent px-2 py-0.5 font-mono shrink-0">
                  {m.store?.toUpperCase()}
                </span>
              </div>
              <p className="text-secondary text-xs leading-relaxed mb-3 break-words line-clamp-3">{m.content}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-white/30 text-[11px] font-mono">{formatDate(m.createdAt)}</span>
                {m.tags?.slice(0, 5).map((t: string) => (
                  <span key={t} className="text-[10px] font-mono text-accent/60 border border-accent/20 px-1.5 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isSearching && totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-secondary px-4 py-2 text-xs font-mono disabled:opacity-30"
          >
            ← PREV
          </button>
          <span className="text-secondary text-xs font-mono">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="btn-secondary px-4 py-2 text-xs font-mono disabled:opacity-30"
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
}
