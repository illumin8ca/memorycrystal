"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useImpersonation } from "../ImpersonationContext";

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

export default function MessagesPage() {
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const handleRoleChange = (r: string) => {
    setRoleFilter(r);
    setPage(0);
  };

  const convexRole =
    roleFilter === "USER" ? "user" : roleFilter === "AI" ? "assistant" : undefined;

  const { asUserId } = useImpersonation();
  const messages = useQuery(api.crystal.dashboard.listMessages, {
    asUserId,
    limit: PAGE_SIZE,
    page,
    role: convexRole,
  });

  const totalCount = messages?.[0]?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  type MessageRow = NonNullable<typeof messages>[number];

  const filtered: MessageRow[] = messages
    ? messages.filter(
        (m: MessageRow) =>
          !search.trim() ||
          m.content?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const isSearching = search.trim().length > 0;

  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-2 tracking-wide">
        SHORT-TERM MEMORY
        {messages !== undefined && (
          <span className="text-white/30 font-normal text-base ml-2">
            ({isSearching ? filtered.length : totalCount})
          </span>
        )}
      </h1>
      <p className="text-secondary text-sm mb-4">
        Conversation messages captured from your AI sessions.
      </p>

      <input
        placeholder="Search this page…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-elevated border border-white/[0.07] text-primary p-3 min-h-11 text-sm mb-4 outline-none focus:border-accent focus:shadow-[0_0_0_1px_#2180D6,0_0_12px_rgba(33,128,214,0.2)] placeholder:text-secondary"
        style={{ borderRadius: 0 }}
      />

      <div className="flex gap-2 flex-wrap mb-6">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => handleRoleChange(r)}
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
        {!messages ? (
          <div className="text-secondary text-sm px-2">Loading...</div>
        ) : filtered.length === 0 && isSearching ? (
          <p className="text-secondary text-sm text-center py-12 font-mono">
            No messages match &quot;{search}&quot;
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-secondary text-sm text-center py-12 font-mono">No messages yet.</p>
        ) : (
          filtered.map((m) => (
            <div
              key={m._id}
              className="bg-surface border border-white/[0.07] p-3 sm:p-4 min-w-0"
            >
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span
                  className={`text-[10px] sm:text-xs font-mono border px-2 py-1 shrink-0 ${
                    m.role === "user"
                      ? "text-accent border-accent"
                      : "text-secondary border-white/[0.14]"
                  }`}
                >
                  {m.role === "user" ? "USER" : m.role === "assistant" ? "AI" : m.role?.toUpperCase()}
                </span>
                <span className="text-white/30 text-[11px] font-mono">{formatTime(m.timestamp)}</span>
                {m.sessionKey && (
                  <span className="text-white/20 text-[10px] font-mono truncate max-w-[120px]">
                    {m.sessionKey}
                  </span>
                )}
              </div>
              <p className="text-primary text-sm break-words leading-relaxed">{m.content}</p>
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
