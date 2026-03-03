"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const formatDate = (ts: number) =>
  new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export default function CheckpointsPage() {
  const checkpoints = useQuery(api.crystal.checkpoints.listCheckpoints, { limit: 50 });
  const createCheckpoint = useMutation(api.crystal.checkpoints.createCheckpoint);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async () => {
    if (!label.trim()) return;
    setIsCreating(true);
    try {
      await createCheckpoint({ label: label.trim(), description: description.trim() || undefined });
      setLabel("");
      setDescription("");
      setShowForm(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 sm:mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-2 tracking-wide">CHECKPOINTS</h1>
          <p className="text-secondary text-sm">Snapshots of your memory state at a point in time.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary px-4 py-2 text-xs font-mono whitespace-nowrap"
        >
          + NEW CHECKPOINT
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-surface border border-white/[0.07] p-4 sm:p-5 mb-6">
          <p className="text-xs font-mono text-secondary mb-3 tracking-widest">CREATE CHECKPOINT</p>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Pre-launch snapshot)"
            className="w-full bg-elevated border border-white/[0.07] text-primary px-3 py-2 text-sm mb-3 outline-none focus:border-accent"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-elevated border border-white/[0.07] text-primary px-3 py-2 text-sm mb-4 outline-none focus:border-accent resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating || !label.trim()}
              className="btn-primary px-4 py-2 text-xs font-mono disabled:opacity-50"
            >
              {isCreating ? "Saving..." : "Save Checkpoint"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary px-4 py-2 text-xs font-mono"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {checkpoints === undefined ? (
        <div className="text-secondary text-sm text-center py-16 font-mono">Loading...</div>
      ) : checkpoints.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-secondary text-sm font-mono mb-2">◎ No checkpoints yet</p>
          <p className="text-white/30 text-xs">Create your first checkpoint to save a snapshot of your memory state.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checkpoints.map((cp) => (
            <div key={cp._id} className="bg-surface border border-white/[0.07] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-mono font-bold text-primary text-sm mb-1">{cp.label}</p>
                  {cp.description && <p className="text-secondary text-xs mb-2 leading-relaxed">{cp.description}</p>}
                  <div className="flex gap-3 flex-wrap">
                    <span className="text-xs text-white/30 font-mono">{formatDate(cp.createdAt)}</span>
                    {cp.tags?.length > 0 &&
                      cp.tags.map((t: string) => (
                        <span key={t} className="text-[10px] font-mono text-accent border border-accent/30 px-1.5 py-0.5">
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/30 border border-white/[0.07] px-2 py-1">
                    {cp.memorySnapshot?.length ?? 0} memories
                  </span>
                </div>
              </div>
              {cp.semanticSummary && cp.semanticSummary !== cp.label && (
                <p className="text-xs text-white/40 mt-3 pt-3 border-t border-white/[0.05] italic leading-relaxed">
                  {cp.semanticSummary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
