const checkpoints = [
  {
    title: "Session Kickoff",
    date: "2026-02-27 09:12",
    memoryCount: 18,
    createdBy: "system",
  },
  {
    title: "Feature Audit Snapshot",
    date: "2026-02-26 16:41",
    memoryCount: 42,
    createdBy: "operator",
  },
  {
    title: "Post-Deploy Checkpoint",
    date: "2026-02-25 11:05",
    memoryCount: 76,
    createdBy: "system",
  },
];

export default function CheckpointsPage() {
  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-3 tracking-wide">CHECKPOINTS</h1>
      <p className="text-secondary text-sm mb-6 sm:mb-8">
        Placeholder checkpoint view for now. Each checkpoint can later connect to Convex snapshots and restore
        actions.
      </p>

      <div className="space-y-3">
        {checkpoints.map((checkpoint) => (
          <article key={checkpoint.title} className="border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-primary font-medium">{checkpoint.title}</span>
              <span className="w-fit text-accent text-[10px] sm:text-xs font-mono border border-accent px-2 py-1 shrink-0">
                {checkpoint.createdBy}
              </span>
            </div>
            <div className="text-sm text-secondary flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span>{checkpoint.date}</span>
              <span>Memories: {checkpoint.memoryCount}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
