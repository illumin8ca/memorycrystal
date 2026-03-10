"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { formatLimit, formatTtlDays, TIER_LIMITS } from "@shared/tierLimits";
import { useImpersonation } from "../ImpersonationContext";

// ─── Tier comparison data ─────────────────────────────────────────────────────

type TierInfo = {
  name: string;
  label: string;
  price: string;
  memories: string;
  stm: string;
  ttl: string;
  channels: string;
};

type TierName = "free" | "starter" | "pro" | "ultra";

const PLAN_PRICES: Record<TierName, string> = {
  free: "$0/mo",
  starter: "$10/mo",
  pro: "$20/mo",
  ultra: "$100/mo",
};

const TIERS: TierInfo[] = (["free", "starter", "pro", "ultra"] as const).map((name: TierName) => {
  const limits = TIER_LIMITS[name];
  const memories = formatLimit(limits.memories);
  const stm = limits.stmMessages === null ? "Unlimited" : `${formatLimit(limits.stmMessages)} msgs`;
  const ttl = formatTtlDays(limits.stmTtlDays);
  const channels = limits.channels === null ? "Unlimited" : limits.channels.toString();
  return {
    name,
    label: name === "free" ? "Free" : name.charAt(0).toUpperCase() + name.slice(1),
    price: PLAN_PRICES[name],
    memories,
    stm,
    ttl,
    channels,
  };
});

const NEXT_TIER: Record<string, string> = {
  free: "starter",
  starter: "pro",
  pro: "ultra",
};

const UPGRADE_HREF: Record<string, string> = {
  free: "/api/polar/checkout?plan=starter",
  starter: "/api/polar/checkout?plan=pro",
  pro: "/api/polar/checkout?plan=ultra",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function UsageBar({
  label,
  used,
  limit,
  percent,
  unlimited,
}: {
  label: string;
  used: number;
  limit: number | null;
  percent: number;
  unlimited: boolean;
}) {
  const color =
    unlimited || percent < 70
      ? "#2180d6"
      : percent < 90
      ? "#f59e0b"
      : "#ef4444";

  const displayUsed = used.toLocaleString();
  const displayLimit = limit !== null ? limit.toLocaleString() : "∞";

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-secondary text-xs tracking-widest uppercase">{label}</span>
        <span className="text-primary text-xs font-mono">
          {displayUsed} / {displayLimit}
          {!unlimited && (
            <span className="text-secondary ml-2">({percent}%)</span>
          )}
        </span>
      </div>
      <div
        className="h-2 w-full rounded-none overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: unlimited ? "100%" : `${percent}%`,
            backgroundColor: color,
            opacity: unlimited ? 0.25 : 1,
          }}
        />
      </div>
      {!unlimited && percent >= 90 && (
        <p className="text-red-400 text-[11px] mt-1">
          ⚠ You&apos;re almost at your limit
        </p>
      )}
    </div>
  );
}

function StoreBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 mb-2">
      <span
        className="text-xs font-mono text-secondary w-24 shrink-0 text-right"
        style={{ textTransform: "capitalize" }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-none overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            backgroundColor: "#2180d6",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span className="text-primary text-xs font-mono w-10 text-right shrink-0">
        {count.toLocaleString()}
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UsagePage() {
  const { asUserId } = useImpersonation();
  const stats = useQuery(api.crystal.stats.getUserUsageStats, { asUserId });

  if (stats === undefined) {
    return (
      <div>
        <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-6 tracking-wide">
          USAGE
        </h1>
        <div className="text-secondary text-sm">Loading usage data…</div>
      </div>
    );
  }

  const {
    tier,
    limits,
    usage,
    subscriptionStatus,
    upgradeAvailable,
  } = stats;

  const memUnlimited = limits.memories === null;
  const stmUnlimited = limits.stmMessages === null;

  const totalByStore =
    usage.byStore.sensory +
    usage.byStore.episodic +
    usage.byStore.semantic +
    usage.byStore.procedural +
    usage.byStore.prospective;

  const nextTierName = NEXT_TIER[tier];
  const nextTierInfo = nextTierName
    ? TIERS.find((t) => t.name === nextTierName)
    : null;

  const statusColor =
    subscriptionStatus === "active" || subscriptionStatus === "unlimited"
      ? "#2180d6"
      : subscriptionStatus === "trialing"
      ? "#f59e0b"
      : "rgba(255,255,255,0.3)";

  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-6 sm:mb-8 tracking-wide">
        USAGE
      </h1>

      {/* ── Plan badge ── */}
      <div
        className="border border-white/[0.07] p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ backgroundColor: "#1E2F3D" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-mono border px-3 py-1 uppercase"
            style={{ color: statusColor, borderColor: statusColor }}
          >
            {tier}
          </span>
          <span className="text-secondary text-xs font-mono uppercase tracking-wider">
            {subscriptionStatus}
          </span>
        </div>
        {upgradeAvailable && (
          <a
            href={UPGRADE_HREF[tier] ?? "#"}
            className="btn-primary inline-flex items-center px-4 py-2 text-xs sm:ml-auto"
          >
            Upgrade to {nextTierName?.toUpperCase() ?? "next plan"} →
          </a>
        )}
      </div>

      {/* ── Usage bars ── */}
      <section className="border border-white/[0.07] p-4 sm:p-6 mb-6" style={{ backgroundColor: "#1E2F3D" }}>
        <p className="text-secondary text-xs tracking-widest uppercase mb-4">Memory &amp; Message Usage</p>

        <UsageBar
          label="Memories"
          used={usage.totalMemories}
          limit={limits.memories}
          percent={usage.memoriesUsedPercent}
          unlimited={memUnlimited}
        />

        <UsageBar
          label="STM Messages"
          used={usage.totalStmMessages}
          limit={limits.stmMessages}
          percent={usage.stmUsedPercent}
          unlimited={stmUnlimited}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-secondary text-[10px] tracking-widest uppercase">Active</p>
            <p className="text-primary text-lg font-bold font-mono">{usage.totalMemories.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-secondary text-[10px] tracking-widest uppercase">Archived</p>
            <p className="text-primary text-lg font-bold font-mono">{usage.archivedMemories.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-secondary text-[10px] tracking-widest uppercase">Sessions</p>
            <p className="text-primary text-lg font-bold font-mono">{usage.totalSessions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-secondary text-[10px] tracking-widest uppercase">Checkpoints</p>
            <p className="text-primary text-lg font-bold font-mono">{usage.checkpoints.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* ── Memory age ── */}
      {(usage.oldestMemoryDays !== null || usage.newestMemoryDays !== null) && (
        <section className="border border-white/[0.07] p-4 sm:p-6 mb-6" style={{ backgroundColor: "#1E2F3D" }}>
          <p className="text-secondary text-xs tracking-widest uppercase mb-3">Memory Age</p>
          <div className="flex flex-col sm:flex-row gap-4">
            {usage.newestMemoryDays !== null && (
              <div>
                <p className="text-secondary text-[10px] uppercase tracking-widest">Newest</p>
                <p className="text-primary text-sm font-mono">
                  {usage.newestMemoryDays === 0 ? "Today" : `${usage.newestMemoryDays}d ago`}
                </p>
              </div>
            )}
            {usage.oldestMemoryDays !== null && (
              <div>
                <p className="text-secondary text-[10px] uppercase tracking-widest">Oldest</p>
                <p className="text-primary text-sm font-mono">{usage.oldestMemoryDays}d ago</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Breakdown by store ── */}
      <section className="border border-white/[0.07] p-4 sm:p-6 mb-6" style={{ backgroundColor: "#1E2F3D" }}>
        <p className="text-secondary text-xs tracking-widest uppercase mb-4">Memories by Store</p>
        {totalByStore === 0 ? (
          <p className="text-secondary text-sm">No active memories yet.</p>
        ) : (
          <>
            <StoreBar label="Episodic" count={usage.byStore.episodic} total={totalByStore} />
            <StoreBar label="Semantic" count={usage.byStore.semantic} total={totalByStore} />
            <StoreBar label="Procedural" count={usage.byStore.procedural} total={totalByStore} />
            <StoreBar label="Prospective" count={usage.byStore.prospective} total={totalByStore} />
            <StoreBar label="Sensory" count={usage.byStore.sensory} total={totalByStore} />
          </>
        )}

        {/* Category breakdown */}
        {Object.keys(usage.byCategory).length > 0 && (
          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-secondary text-[10px] tracking-widest uppercase mb-3">By Category</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(usage.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => (
                  <span
                    key={cat}
                    className="text-[11px] font-mono border px-2 py-0.5"
                    style={{ color: "#7A9AB5", borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    {cat}: {count}
                  </span>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Upgrade CTA ── */}
      {upgradeAvailable && nextTierInfo && (
        <section className="border border-accent/40 p-4 sm:p-6 mb-6" style={{ backgroundColor: "rgba(33,128,214,0.06)" }}>
          <p className="text-primary text-sm font-bold font-mono mb-1 tracking-wide">
            UPGRADE TO {nextTierInfo.label.toUpperCase()}
          </p>
          <p className="text-secondary text-xs mb-3">
            Get more memories, longer message history, and additional channels.
          </p>
          <ul className="text-secondary text-xs space-y-1 mb-4">
            <li>→ {nextTierInfo.memories} memories</li>
            <li>→ {nextTierInfo.stm} (STM)</li>
            <li>→ {nextTierInfo.ttl} message retention</li>
            <li>→ {nextTierInfo.channels} channel{nextTierInfo.channels !== "1" ? "s" : ""}</li>
          </ul>
          <a
            href={UPGRADE_HREF[tier] ?? "#"}
            className="btn-primary inline-flex items-center px-5 py-2 text-xs"
          >
            Upgrade for {nextTierInfo.price} →
          </a>
        </section>
      )}

      {/* ── Tier comparison table ── */}
      <section className="border border-white/[0.07] p-4 sm:p-6" style={{ backgroundColor: "#1E2F3D" }}>
        <p className="text-secondary text-xs tracking-widest uppercase mb-4">Plan Comparison</p>

        {/* Mobile: stacked cards */}
        <div className="flex flex-col gap-3 sm:hidden">
          {TIERS.map((t) => {
            const isCurrent = t.name === tier;
            return (
              <div
                key={t.name}
                className="border p-3"
                style={{
                  borderColor: isCurrent ? "#2180d6" : "rgba(255,255,255,0.07)",
                  backgroundColor: isCurrent ? "rgba(33,128,214,0.07)" : "transparent",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-sm font-mono font-bold"
                    style={{ color: isCurrent ? "#2180d6" : "#E8F0F8" }}
                  >
                    {t.label}
                    {isCurrent && (
                      <span className="ml-2 text-[10px] border border-accent px-1.5 py-0.5">CURRENT</span>
                    )}
                  </span>
                  <span className="text-primary text-sm font-bold">{t.price}</span>
                </div>
                <div className="text-secondary text-xs space-y-0.5">
                  <p>Memories: <span className="text-primary">{t.memories}</span></p>
                  <p>STM: <span className="text-primary">{t.stm}</span></p>
                  <p>Retention: <span className="text-primary">{t.ttl}</span></p>
                  <p>Channels: <span className="text-primary">{t.channels}</span></p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <th className="text-left text-secondary text-[10px] tracking-widest uppercase pb-2 pr-4 font-normal">
                  Plan
                </th>
                <th className="text-right text-secondary text-[10px] tracking-widest uppercase pb-2 px-4 font-normal">
                  Price
                </th>
                <th className="text-right text-secondary text-[10px] tracking-widest uppercase pb-2 px-4 font-normal">
                  Memories
                </th>
                <th className="text-right text-secondary text-[10px] tracking-widest uppercase pb-2 px-4 font-normal">
                  STM
                </th>
                <th className="text-right text-secondary text-[10px] tracking-widest uppercase pb-2 px-4 font-normal">
                  Retention
                </th>
                <th className="text-right text-secondary text-[10px] tracking-widest uppercase pb-2 pl-4 font-normal">
                  Channels
                </th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => {
                const isCurrent = t.name === tier;
                return (
                  <tr
                    key={t.name}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      backgroundColor: isCurrent ? "rgba(33,128,214,0.07)" : "transparent",
                    }}
                  >
                    <td className="py-2.5 pr-4">
                      <span
                        className="font-mono font-bold"
                        style={{ color: isCurrent ? "#2180d6" : "#E8F0F8" }}
                      >
                        {t.label}
                      </span>
                      {isCurrent && (
                        <span
                          className="ml-2 text-[10px] border border-accent px-1.5 py-0.5 font-mono"
                          style={{ color: "#2180d6" }}
                        >
                          CURRENT
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right text-primary font-mono">{t.price}</td>
                    <td className="py-2.5 px-4 text-right text-primary font-mono">{t.memories}</td>
                    <td className="py-2.5 px-4 text-right text-primary font-mono">{t.stm}</td>
                    <td className="py-2.5 px-4 text-right text-primary font-mono">{t.ttl}</td>
                    <td className="py-2.5 pl-4 text-right text-primary font-mono">{t.channels}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
