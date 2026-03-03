"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export default function MessagesPage() {
  const messages = useQuery(api.crystal.dashboard.listMessages, { limit: 50 });

  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-2 tracking-wide">SHORT-TERM MEMORY</h1>
      <p className="text-secondary text-sm mb-6 sm:mb-8">Recent conversation messages captured from your AI sessions.</p>
      <div className="space-y-2">
        {messages
          ? messages.map((m) => (
              <div key={m._id} className="bg-surface border border-white/[0.07] p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-start min-w-0">
                <div className="flex items-center gap-2 sm:contents">
                  <span className="neon-text text-xs font-mono shrink-0 sm:w-20 sm:pt-0.5">
                    {formatTime(m.timestamp)}
                  </span>
                  <span
                    className={`text-[10px] sm:text-xs font-mono border px-2 py-1 shrink-0 ${
                      m.role === "user" ? "text-accent border-accent" : "text-secondary border-white/[0.07]"
                    }`}
                  >
                    {m.role === "user" ? "USER" : m.role === "assistant" ? "AI" : m.role.toUpperCase()}
                  </span>
                </div>
                <p className="text-primary text-sm break-words">{m.content}</p>
              </div>
            ))
          : (
            <div className="text-secondary text-sm px-2">Loading...</div>
          )}
      </div>
    </div>
  );
}
