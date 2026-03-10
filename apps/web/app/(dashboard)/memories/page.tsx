"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useImpersonation } from "../ImpersonationContext";

const stores = ["ALL", "SENSORY", "EPISODIC", "SEMANTIC", "PROCEDURAL", "PROSPECTIVE"];
const PAGE_SIZE = 25;

type MemoryRow = {
  _id: string;
  title: string;
  content: string;
  store: string;
  createdAt?: number;
  tags: string[];
};

type MemoryQueryRow = MemoryRow & {
  totalCount?: number;
  statsNote?: string;
};

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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<MemoryRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { asUserId } = useImpersonation();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Reset pagination state when filters/search/impersonation changes.
  useEffect(() => {
    setPage(0);
    setRows([]);
    setTotalCount(0);
    setHasMore(true);
  }, [activeStore, search, asUserId]);

  const rawPage = useQuery(api.crystal.dashboard.listMemories, {
    asUserId,
    store: activeStore === "ALL" ? undefined : activeStore.toLowerCase(),
    limit: PAGE_SIZE,
    page,
    search: search || undefined,
  });

  useEffect(() => {
    if (rawPage === undefined) return;

    const pageRows = rawPage.map((memory) => {
      const row = memory as MemoryQueryRow;
      return {
        _id: row._id,
        title: row.title,
        content: row.content,
        store: row.store,
        createdAt: row.createdAt,
        tags: row.tags,
      } as MemoryRow;
    });

    const pageTotal = rawPage[0]?.totalCount;
    if (typeof pageTotal === "number") {
      setTotalCount(pageTotal);
    }

    setRows((prev) => {
      if (page === 0) {
        return pageRows;
      }

      if (pageRows.length === 0) {
        return prev;
      }

      const existing = new Set(prev.map((row) => row._id));
      return [...prev, ...pageRows.filter((row) => !existing.has(row._id))];
    });

    setHasMore(pageRows.length === PAGE_SIZE);
  }, [rawPage, page]);

  const isLoading = rawPage === undefined;
  const isLoadingFirstPage = page === 0 && isLoading;
  const isLoadingMore = page > 0 && isLoading;
  const isSearching = search.length > 0;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || isLoading || rows.length === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      {
        rootMargin: "400px 0px",
        threshold: 0,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, isLoading, rows.length]);

  const canShowCount = page > 0 || rawPage !== undefined;

  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-2 tracking-wide break-words">
        MEMORY VAULT
        {canShowCount ? <span className="text-white/30 font-normal text-base ml-2">({totalCount})</span> : null}
      </h1>
      <p className="text-secondary text-sm mb-4">Search and review your crystallized memories.</p>

      <input
        placeholder="Search this page…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="w-full bg-elevated border border-white/[0.07] text-primary p-3 min-h-11 text-sm mb-4 outline-none focus:border-accent focus:shadow-[0_0_0_1px_#2180D6,0_0_12px_rgba(33,128,214,0.2)] placeholder:text-secondary"
        style={{ borderRadius: 0 }}
      />

      <div className="flex gap-2 flex-wrap mb-6">
        {stores.map((store) => (
          <button
            key={store}
            onClick={() => {
              setActiveStore(store);
            }}
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
        {isLoadingFirstPage ? (
          <div className="text-secondary text-sm px-2">Loading...</div>
        ) : rows.length === 0 && isSearching ? (
          <p className="text-secondary text-sm text-center py-12 font-mono">No memories match &quot;{search}&quot;</p>
        ) : rows.length === 0 ? (
          <p className="text-secondary text-sm text-center py-12 font-mono">No memories yet.</p>
        ) : (
          rows.map((m) => (
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
                {m.tags.slice(0, 5).map((t) => (
                  <span key={t} className="text-[10px] font-mono text-accent/60 border border-accent/20 px-1.5 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {isLoadingMore ? (
        <div className="text-secondary text-sm px-2 py-3 text-center">Loading more memories…</div>
      ) : null}

      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
    </div>
  );
}
