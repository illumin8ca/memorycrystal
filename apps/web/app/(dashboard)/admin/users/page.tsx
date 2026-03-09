"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";

const fmt = (ts?: number | null) => (ts ? new Date(ts).toLocaleString() : "—");

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const trimmedSearch = useMemo(() => search.trim(), [search]);

  const data = useQuery(api.crystal.admin.listUsers, {
    search: trimmedSearch.length ? trimmedSearch : undefined,
    limit: 250,
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <p className="text-secondary text-xs tracking-widest uppercase mb-2">Admin</p>
        <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary tracking-wide">USER DIRECTORY</h1>
      </div>

      <div className="bg-surface border border-white/[0.07] p-4 sm:p-5 mb-4 sm:mb-6">
        <label className="text-secondary text-[11px] tracking-widest uppercase block mb-2">Search by user ID / billing IDs</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="user_... or cus_..."
          className="w-full bg-[#0d1820] border border-white/10 px-3 py-2 text-sm text-primary outline-none focus:border-accent"
        />
        <p className="text-secondary text-xs mt-2">Email search is deferred until identity email is exposed in admin query layer.</p>
      </div>

      <div className="bg-surface border border-white/[0.07] overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] text-secondary text-[11px] tracking-widest uppercase">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Tier / Sub</th>
              <th className="text-left px-4 py-3">Roles</th>
              <th className="text-left px-4 py-3">Profile Health</th>
              <th className="text-left px-4 py-3">API Keys</th>
              <th className="text-left px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {!data ? (
              <tr>
                <td className="px-4 py-5 text-secondary" colSpan={6}>Loading users...</td>
              </tr>
            ) : data.users.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-secondary" colSpan={6}>No users matched this filter.</td>
              </tr>
            ) : (
              data.users.map((u) => (
                <tr key={u.userId} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 align-top">
                    <Link href={`/admin/users/${encodeURIComponent(u.userId)}`} className="text-accent hover:underline font-mono">
                      {u.userId}
                    </Link>
                    <div className="text-secondary text-xs mt-1">{u.polarCustomerId ?? "No customer ID"}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-primary font-mono">{(u.plan ?? "free").toUpperCase()}</div>
                    <div className="text-secondary text-xs">{u.subscriptionStatus}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span key={r} className="text-[10px] font-mono border border-accent/60 text-accent px-2 py-0.5">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-secondary">
                    <div>Billing: {u.profileHealth.hasBillingLinkage ? "ok" : "missing"}</div>
                    <div>Plan: {u.profileHealth.hasSubscriptionPlan ? "ok" : "missing"}</div>
                    <div>Roles: {u.profileHealth.hasRoles ? "ok" : "missing"}</div>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-secondary">
                    {u.apiKeys.active}/{u.apiKeys.total} active
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-secondary">{fmt(u.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
