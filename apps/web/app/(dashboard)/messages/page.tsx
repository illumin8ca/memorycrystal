"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useImpersonation } from "../ImpersonationContext";
import { useInView } from "../../hooks/useInView";

const PAGE_SIZE = 25;
const roles = ["ALL", "USER", "AI"];

const formatTime = (value: number) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

type MessageRow = {
  _id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  sessionKey?: string;
};

export default function MessagesPage() {
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { asUserId } = useImpersonation();

  const { ref, isInView } = useInView<HTMLDivElement>({
    rootMargin: "250px 0px",
    threshold: 0.1,
    once: false,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const convexRole =
    roleFilter === "USER" ? "user" : roleFilter === "AI" ? "assistant" : undefined;

  // Reset pagination state when filters/search/impersonation changes.
  useEffect(() => {
    setPage(0);
    setRows([]);
    setTotalCount(0);
    setHasMore(true);
  }, [roleFilter, search, asUserId]);

  const rawPage = useQuery(api.crystal.dashboard.listMessages, {
    asUserId,
    limit: PAGE_SIZE,
    page,
    role: convexRole,
    search: search || undefined,
  });

  useEffect(() => {
    if (rawPage === undefined) return;

    const cleanRows = rawPage.map((row) => ({
      _id: row._id,
      role: row.role,
      content: row.content,
      timestamp: row.timestamp,
      sessionKey: row.sessionKey,
    }));

    const pageTotal = rawPage[0]?.totalCount;
    if (typeof pageTotal === "number") {
      setTotalCount(pageTotal);
    }

    setRows((prev) => {
      if (page === 0) {
        return cleanRows;
      }

      if (cleanRows.length === 0) {
        return prev;
      }

      const existing = new Set(prev.map((row) => row._id));
      return [...prev, ...cleanRows.filter((row) => !existing.has(row._id))];
    });

    setHasMore(cleanRows.length === PAGE_SIZE);
  }, [rawPage, page]);

  const isLoading = rawPage === undefined;
  const isLoadingFirstPage = page === 0 && isLoading;
  const isLoadingMore = page > 0 && isLoading;
  const isSearching = search.length > 0;

  useEffect(() => {
    if (!isInView || !hasMore || isLoading || rows.length === 0) return;

    setPage((p) => p + 1);
  }, [isInView, hasMore, isLoading, rows.length]);

  const canShowCount = page > 0 || rawPage !== undefined;

  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-2 tracking-wide">
        SHORT-TERM MEMORY
        {canShowCount && <span className="text-white/30 font-normal text-base ml-2">({totalCount})</span>}
      </h1>
      <p className="text-secondary text-sm mb-4">Conversation messages captured from your AI sessions.</p>

      <input
        placeholder="Search this page…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="w-full bg-elevated border border-white/[0.07] text-primary p-3 min-h-11 text-sm mb-4 outline-none focus:border-accent focus:shadow-[0_0_0_1px_#2180D6,0_0_12px_rgba(33,128,214,0.2)] placeholder:text-secondary"
        style={{ borderRadius: 0 }}
      />

      <div className="flex gap-2 flex-wrap mb-6">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-2 min-h-11 text-xs font-mono border transition-colors ${
              roleFilter === r
                ? "bg-accent text-white border-accent"
                : "bg-elevated text-secondary border-white/[0.07] hover:text-primary"
            }`}
            style={{ borderRadius: 0 }}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-6">
        {isLoadingFirstPage ? (
          <div className="text-secondary text-sm px-2">Loading...</div>
        ) : rows.length === 0 && isSearching ? (
          <p className="text-secondary text-sm text-center py-12 font-mono">No messages match &quot;{search}&quot;</p>
        ) : rows.length === 0 ? (
          <p className="text-secondary text-sm text-center py-12 font-mono">No messages yet.</p>
        ) : (
          rows.map((m) => (
            <div key={m._id} className="bg-surface border border-white/[0.07] p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span
                  className={`text-[10px] sm:text-xs font-mono border px-2 py-1 shrink-0 ${
                    m.role === "user"
                      ? "text-accent border-accent"
                      : "text-secondary border-white/[0.14]"
                  }`}
                >
                  {m.role === "user" ? "USER" : m.role === "assistant" ? "AI" : m.role.toUpperCase()}
                </span>
                <span className="text-white/30 text-[11px] font-mono">{formatTime(m.timestamp)}</span>
                {m.sessionKey && (
                  <span className="text-white/20 text-[10px] font-mono truncate max-w-[120px]">{m.sessionKey}</span>
                )}
              </div>
              <p className="text-primary text-sm break-words leading-relaxed">{m.content}</p>
            </div>
          ))
        )}
      </div>

      {isLoadingMore ? <div className="text-secondary text-sm px-2 py-3 text-center">Loading more messages…</div> : null}

      {rows.length > 0 ? <div ref={ref} className="h-8 w-full" aria-hidden="true" /> : null}
    </div>
  );
}
