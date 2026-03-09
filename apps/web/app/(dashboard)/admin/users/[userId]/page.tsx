"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";

const fmt = (ts?: number | null) => (ts ? new Date(ts).toLocaleString() : "—");

export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = decodeURIComponent(params.userId);
  const data = useQuery(api.crystal.admin.getUserDetail, { userId });

  return (
    <div>
      <Link href="/admin/users" className="text-accent text-xs font-mono hover:underline">← BACK TO USERS</Link>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mt-3 mb-6 tracking-wide">USER DETAIL</h1>

      {!data ? (
        <div className="text-secondary">Loading...</div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <section className="bg-surface border border-white/[0.07] p-4 sm:p-6">
            <p className="text-secondary text-[11px] tracking-widest uppercase mb-2">Account Summary</p>
            <p className="font-mono text-primary mb-3 break-all">{data.userId}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div><span className="text-secondary">Created:</span><div className="text-primary">{fmt(data.accountSummary.createdAt)}</div></div>
              <div><span className="text-secondary">Updated:</span><div className="text-primary">{fmt(data.accountSummary.updatedAt)}</div></div>
              <div><span className="text-secondary">Memories:</span><div className="text-primary">{data.accountSummary.memoryCount}</div></div>
              <div><span className="text-secondary">Sessions:</span><div className="text-primary">{data.accountSummary.sessionsCount}</div></div>
            </div>
          </section>

          <section className="bg-surface border border-white/[0.07] p-4 sm:p-6">
            <p className="text-secondary text-[11px] tracking-widest uppercase mb-2">Subscription Linkage</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-secondary">Status:</span><div className="text-primary">{data.subscription.status}</div></div>
              <div><span className="text-secondary">Plan:</span><div className="text-primary">{data.subscription.plan ?? "—"}</div></div>
              <div><span className="text-secondary">Polar Customer:</span><div className="text-primary break-all">{data.subscription.polarCustomerId ?? "—"}</div></div>
              <div><span className="text-secondary">Polar Subscription:</span><div className="text-primary break-all">{data.subscription.polarSubscriptionId ?? "—"}</div></div>
            </div>
          </section>

          <section className="bg-surface border border-white/[0.07] p-4 sm:p-6">
            <p className="text-secondary text-[11px] tracking-widest uppercase mb-2">Roles</p>
            <div className="flex flex-wrap gap-2">
              {data.roles.map((r) => (
                <span key={r} className="text-xs font-mono border border-accent/60 text-accent px-2 py-1">{r}</span>
              ))}
            </div>
          </section>

          <section className="bg-surface border border-white/[0.07] p-4 sm:p-6">
            <p className="text-secondary text-[11px] tracking-widest uppercase mb-2">API Key Summary</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div><span className="text-secondary">Total:</span><div className="text-primary">{data.apiKeys.total}</div></div>
              <div><span className="text-secondary">Active:</span><div className="text-primary">{data.apiKeys.active}</div></div>
              <div><span className="text-secondary">Last Used:</span><div className="text-primary">{fmt(data.apiKeys.latestUsedAt)}</div></div>
            </div>
          </section>

          <section className="bg-surface border border-white/[0.07] p-4 sm:p-6">
            <p className="text-secondary text-[11px] tracking-widest uppercase mb-3">Support Actions (placeholder)</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary px-3 py-2 text-xs" disabled>Reset rate limits (TODO)</button>
              <button type="button" className="btn-secondary px-3 py-2 text-xs" disabled>Impersonate session (TODO)</button>
              <button type="button" className="btn-secondary px-3 py-2 text-xs" disabled>Resync billing profile (TODO)</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
