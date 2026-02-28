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
      <h1 className="font-mono font-bold text-2xl text-primary mb-3 tracking-wide">
        CHECKPOINTS
      </h1>
      <p className="text-secondary text-sm mb-8">
        Placeholder checkpoint view for now. Each checkpoint can later connect to Convex snapshots and restore
        actions.
      </p>

      <div className="border border-border">
        <div className="bg-elevated grid grid-cols-4 px-4 py-2 text-secondary text-xs tracking-widest uppercase font-mono">
          <span>Title</span>
          <span>Date</span>
          <span>Memory Count</span>
          <span>Created By</span>
        </div>
        {checkpoints.map((checkpoint) => (
          <div
            key={checkpoint.title}
            className="grid grid-cols-4 px-4 py-3 border-t border-border bg-surface text-sm"
          >
            <span className="text-primary font-medium">{checkpoint.title}</span>
            <span className="text-secondary">{checkpoint.date}</span>
            <span className="text-secondary">{checkpoint.memoryCount}</span>
            <span className="w-fit text-accent text-xs font-mono border border-accent px-2 py-0.5">
              {checkpoint.createdBy}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
