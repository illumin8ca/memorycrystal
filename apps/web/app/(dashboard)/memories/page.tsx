"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const stores = ["ALL", "SENSORY", "EPISODIC", "SEMANTIC", "PROCEDURAL", "PROSPECTIVE"];

export default function MemoriesPage() {
  const [activeStore, setActive] = useState("ALL");

  const memories = useQuery(api.crystal.dashboard.listMemories, {
    store: activeStore === "ALL" ? undefined : activeStore.toLowerCase(),
    limit: 50,
  });

  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-2 tracking-wide break-words">
        MEMORY VAULT ({memories ? memories.length : "Loading..."})
      </h1>
      <p className="text-secondary text-sm mb-6 sm:mb-8">Search and review memories pulled from Convex.</p>
      <input
        placeholder="Search memories..."
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
        {memories
          ? memories.map((m) => (
              <div key={m._id} className="bg-surface border border-white/[0.07] p-4 sm:p-5 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-primary font-medium truncate">{m.title}</span>
                    <span className="text-accent text-xs border border-accent px-2 py-0.5 font-mono shrink-0">
                      {m.store}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="w-24 h-1 bg-elevated">
                      <div className="h-1 bg-accent" style={{ width: `${(m.strength ?? 0) * 100}%` }} />
                    </div>
                    <span className="neon-text text-xs ml-2">{Math.round((m.strength ?? 0) * 100)}%</span>
                  </div>
                </div>
                <p className="text-secondary text-sm mb-3 break-words">{m.content}</p>
                <div className="flex gap-2 flex-wrap">
                  {m.tags?.map((t: string) => (
                    <span key={t} className="border border-white/[0.07] text-secondary text-xs px-2 py-1 font-mono break-all">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))
          : !memories
            ? <div className="text-secondary text-sm px-2">Loading...</div>
            : null}
      </div>
    </div>
  );
}
