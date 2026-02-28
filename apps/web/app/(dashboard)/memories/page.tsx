"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const stores = ["ALL", "SENSORY", "EPISODIC", "SEMANTIC", "PROCEDURAL", "PROSPECTIVE"];

export default function MemoriesPage() {
  const [activeStore, setActive] = useState("ALL");

  const memories = useQuery(api.vexclaw.dashboard.listMemories, {
    store: activeStore === "ALL" ? undefined : activeStore.toLowerCase(),
    limit: 50,
  });

  return (
    <div>
      <h1 className="font-mono font-bold text-2xl text-[#f0f0f0] mb-2 tracking-wide">
        MEMORY VAULT ({memories ? memories.length : "Loading..."})
      </h1>
      <p className="text-[#888] text-sm mb-8">Search and review memories pulled from Convex.</p>
      <input
        placeholder="Search memories..."
        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-[#f0f0f0] p-3 text-sm mb-5 outline-none focus:border-[#0066ff] placeholder:text-[#888]"
        style={{ borderRadius: 0 }}
      />
      <div className="flex gap-2 flex-wrap mb-6">
        {stores.map((store) => (
          <button
            key={store}
            onClick={() => setActive(store)}
            className={`px-3 py-1 text-xs font-mono border transition-colors ${activeStore === store ? "bg-[#0066ff] text-white border-[#0066ff]" : "bg-[#1e1e1e] text-[#888] border-[#2a2a2a] hover:text-[#f0f0f0]"}`}
            style={{ borderRadius: 0 }}
          >
            {store}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {memories
          ? memories.map((m) => (
              <div key={m._id} className="bg-[#141414] border border-[#2a2a2a] p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[#f0f0f0] font-medium">{m.title}</span>
                    <span className="text-[#0066ff] text-xs border border-[#0066ff] px-2 py-0.5 font-mono">
                      {m.store}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    <div className="w-24 h-1 bg-[#1e1e1e]">
                      <div className="h-1 bg-[#0066ff]" style={{ width: `${(m.strength ?? 0) * 100}%` }} />
                    </div>
                    <span className="text-[#888] text-xs ml-2">{Math.round((m.strength ?? 0) * 100)}%</span>
                  </div>
                </div>
                <p className="text-[#888] text-sm mb-3 line-clamp-2">{m.content}</p>
                <div className="flex gap-2 flex-wrap">
                  {m.tags?.map((t: string) => (
                    <span key={t} className="border border-[#2a2a2a] text-[#888] text-xs px-2 py-0.5 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))
          : !memories
            ? <div className="text-[#888] text-sm px-2">Loading...</div>
            : null}
      </div>
    </div>
  );
}
