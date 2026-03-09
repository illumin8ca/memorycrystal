"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useImpersonation } from "../../../ImpersonationContext";

type Role = "subscriber" | "manager" | "admin";
type ApiKeyEntry = {
  _id: string;
  label?: string | null;
  active: boolean;
  createdAt?: number | null;
  lastUsedAt?: number | null;
};
const ALL_ROLES: Role[] = ["subscriber", "manager", "admin"];

const fmt = (ts?: number | null) => (ts ? new Date(ts).toLocaleString() : "—");

export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = decodeURIComponent(params.userId);
  const data = useQuery(api.crystal.admin.getUserDetail, { userId });

  const adminSupportApi = (api as unknown as Record<string, Record<string, unknown>>)["crystal/adminSupport"];
  const ensureProfile = useMutation(adminSupportApi.adminEnsureUserProfile as never) as unknown as (args: {
    targetUserId: string;
    email?: string;
  }) => Promise<{ created: boolean }>;
  const resyncSubscription = useMutation(adminSupportApi.adminResyncUserSubscriptionLinkage as never) as unknown as (args: {
    targetUserId: string;
  }) => Promise<{ changedFields: string[] }>;
  const revokeApiKey = useMutation(adminSupportApi.adminRevokeUserApiKey as never) as unknown as (args: {
    targetUserId: string;
    keyId: string;
    reason?: string;
  }) => Promise<{ ok: boolean }>;
  const regenerateApiKey = useMutation(adminSupportApi.adminRegenerateUserApiKey as never) as unknown as (args: {
    targetUserId: string;
    oldKeyId: string;
    revokeOld?: boolean;
  }) => Promise<{ rawKey: string }>;
  const updateRoles = useMutation(adminSupportApi.adminUpdateUserRoles as never) as unknown as (args: {
    targetUserId: string;
    roles: Role[];
  }) => Promise<{ roles: Role[] }>;
  const { canImpersonate, activeSession, startImpersonation, stopImpersonation } = useImpersonation();

  const [busyAction, setBusyAction] = useState<string>("");
  const [actionResult, setActionResult] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [newKeyValue, setNewKeyValue] = useState<string>("");
  const [nextRoles, setNextRoles] = useState<Role[]>([]);

  const isBusy = (name: string) => busyAction === name;

  const currentRoles = useMemo<Role[]>(() => {
    if (!data) return ["subscriber"];
    return (data.roles as Role[]).length ? (data.roles as Role[]) : ["subscriber"];
  }, [data]);

  const draftRoles = nextRoles.length ? nextRoles : currentRoles;

  const toggleRole = (role: Role) => {
    const source = nextRoles.length ? [...nextRoles] : [...currentRoles];
    const exists = source.includes(role);
    let updated = exists ? source.filter((r) => r !== role) : [...source, role];
    if (!updated.length) updated = ["subscriber"];
    if (!updated.includes("subscriber")) updated = ["subscriber", ...updated];
    const deduped = Array.from(new Set(updated));
    setNextRoles(deduped as Role[]);
  };

  async function runAction(name: string, fn: () => Promise<void>) {
    setActionError("");
    setActionResult("");
    setBusyAction(name);
    try {
      await fn();
    } catch (err) {
      setActionError((err as Error).message ?? "Action failed");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <div>
      <Link href="/admin/users" className="text-accent text-xs font-mono hover:underline">← BACK TO USERS</Link>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mt-3 mb-6 tracking-wide">USER DETAIL</h1>

      {!data ? (
        <div className="text-secondary">Loading...</div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {actionResult ? <div className="text-emerald-300 text-xs font-mono bg-emerald-500/10 border border-emerald-400/30 p-3">{actionResult}</div> : null}
          {actionError ? <div className="text-red-300 text-xs font-mono bg-red-500/10 border border-red-400/30 p-3">{actionError}</div> : null}
          {newKeyValue ? (
            <div className="text-amber-100 text-xs font-mono bg-amber-500/10 border border-amber-400/40 p-3 break-all">
              NEW API KEY (copy now): {newKeyValue}
            </div>
          ) : null}

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
            <div className="flex flex-wrap gap-2 mb-4">
              {data.roles.map((r: string) => (
                <span key={r} className="text-xs font-mono border border-accent/60 text-accent px-2 py-1">{r}</span>
              ))}
            </div>
            <div className="border border-white/10 p-3">
              <p className="text-secondary text-[11px] uppercase tracking-widest mb-2">Role update (admin only)</p>
              <div className="flex flex-wrap gap-3 mb-3">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="inline-flex items-center gap-2 text-xs text-primary font-mono">
                    <input
                      type="checkbox"
                      checked={draftRoles.includes(role)}
                      disabled={!data.viewer.canAssignRoles || !!busyAction}
                      onChange={() => toggleRole(role)}
                    />
                    {role}
                  </label>
                ))}
              </div>
              <button
                type="button"
                disabled={!data.viewer.canAssignRoles || !!busyAction}
                className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
                onClick={() =>
                  runAction("roles", async () => {
                    await updateRoles({ targetUserId: userId, roles: draftRoles });
                    setActionResult(`Updated roles: ${draftRoles.join(", ")}`);
                    setNextRoles([]);
                  })
                }
              >
                {isBusy("roles") ? "Updating..." : "Update roles"}
              </button>
            </div>
          </section>

          <section className="bg-surface border border-white/[0.07] p-4 sm:p-6">
            <p className="text-secondary text-[11px] tracking-widest uppercase mb-2">API Key Summary</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4">
              <div><span className="text-secondary">Total:</span><div className="text-primary">{data.apiKeys.total}</div></div>
              <div><span className="text-secondary">Active:</span><div className="text-primary">{data.apiKeys.active}</div></div>
              <div><span className="text-secondary">Last Used:</span><div className="text-primary">{fmt(data.apiKeys.latestUsedAt)}</div></div>
            </div>
            <div className="space-y-2">
              {(data.apiKeys.entries as ApiKeyEntry[]).map((k) => (
                <div key={k._id} className="border border-white/10 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-xs">
                    <div className="text-primary font-mono">{k.label ?? "(no label)"}</div>
                    <div className="text-secondary">Created: {fmt(k.createdAt)} • Last used: {fmt(k.lastUsedAt)}</div>
                    <div className={k.active ? "text-emerald-300" : "text-secondary"}>{k.active ? "Active" : "Revoked"}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!k.active || !!busyAction}
                      className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
                      onClick={() =>
                        runAction(`revoke:${k._id}`, async () => {
                          await revokeApiKey({ targetUserId: userId, keyId: k._id, reason: "admin_user_detail" });
                          setActionResult("API key revoked.");
                        })
                      }
                    >
                      {isBusy(`revoke:${k._id}`) ? "Revoking..." : "Revoke"}
                    </button>
                    <button
                      type="button"
                      disabled={!!busyAction}
                      className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
                      onClick={() =>
                        runAction(`regen:${k._id}`, async () => {
                          const result = await regenerateApiKey({ targetUserId: userId, oldKeyId: k._id, revokeOld: true });
                          setNewKeyValue(result.rawKey);
                          setActionResult("Generated replacement API key and revoked previous key.");
                        })
                      }
                    >
                      {isBusy(`regen:${k._id}`) ? "Regenerating..." : "Regenerate"}
                    </button>
                  </div>
                </div>
              ))}
              {data.apiKeys.entries.length === 0 ? <p className="text-secondary text-xs">No API keys found.</p> : null}
            </div>
          </section>

          <section className="bg-surface border border-white/[0.07] p-4 sm:p-6">
            <p className="text-secondary text-[11px] tracking-widest uppercase mb-3">Support Actions</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
                disabled={!!busyAction}
                onClick={() =>
                  runAction("ensure", async () => {
                    const result = await ensureProfile({ targetUserId: userId });
                    setActionResult(result.created ? "Created missing profile." : "Profile exists and is normalized.");
                  })
                }
              >
                {isBusy("ensure") ? "Ensuring..." : "Ensure profile"}
              </button>
              <button
                type="button"
                className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
                disabled={!!busyAction}
                onClick={() =>
                  runAction("resync", async () => {
                    const result = await resyncSubscription({ targetUserId: userId });
                    setActionResult(
                      result.changedFields.length
                        ? `Resynced subscription linkage (${result.changedFields.join(", ")}).`
                        : "Resync completed with no changes.",
                    );
                  })
                }
              >
                {isBusy("resync") ? "Resyncing..." : "Resync subscription linkage"}
              </button>
              {canImpersonate ? (
                activeSession?.targetUserId === userId ? (
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-xs"
                    disabled={!!busyAction}
                    onClick={() => runAction("imp-stop", async () => {
                      await stopImpersonation();
                      setActionResult("Stopped impersonation session.");
                    })}
                  >
                    Stop impersonation
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-xs"
                    disabled={!!busyAction}
                    onClick={() => runAction("imp-start", async () => {
                      await startImpersonation(userId, "admin_user_detail");
                      setActionResult(`Now impersonating ${userId}.`);
                    })}
                  >
                    Impersonate this user
                  </button>
                )
              ) : null}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
