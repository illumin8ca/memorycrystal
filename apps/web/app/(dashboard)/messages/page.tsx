"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export default function MessagesPage() {
  const messages = useQuery(api.vexclaw.dashboard.listMessages, { limit: 50 });

  return (
    <div>
      <h1 className="font-mono font-bold text-2xl text-[#f0f0f0] mb-2 tracking-wide">SHORT-TERM MEMORY</h1>
      <p className="text-[#888] text-sm mb-8">Recent conversation messages captured from your AI sessions.</p>
      <div className="space-y-2">
        {messages
          ? messages.map((m) => (
              <div key={m._id} className="bg-[#141414] border border-[#2a2a2a] p-4 flex gap-4 items-start">
                <span className="text-[#888] text-xs font-mono w-20 shrink-0 pt-0.5">
                  {formatTime(m.timestamp)}
                </span>
                <span
                  className={`text-xs font-mono border px-2 py-0.5 shrink-0 ${
                    m.role === "user" ? "text-[#0066ff] border-[#0066ff]" : "text-[#888] border-[#2a2a2a]"
                  }`}
                >
                  {m.role === "user" ? "USER" : m.role === "assistant" ? "AI" : m.role.toUpperCase()}
                </span>
                <p className="text-[#f0f0f0] text-sm">{m.content}</p>
              </div>
            ))
          : (
            <div className="text-[#888] text-sm px-2">Loading...</div>
          )}
      </div>
    </div>
  );
}
