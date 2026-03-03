"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center p-6">
      <p className="text-4xl">⚠</p>
      <div>
        <h2 className="font-mono font-bold text-primary text-lg mb-2">Something went wrong</h2>
        <p className="text-secondary text-sm max-w-sm">
          {error.message || "An unexpected error occurred loading this page."}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="btn-primary px-6 py-2 text-xs font-mono"
      >
        TRY AGAIN
      </button>
    </div>
  );
}
