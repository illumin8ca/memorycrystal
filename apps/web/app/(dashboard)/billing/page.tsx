"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useImpersonation } from "../ImpersonationContext";

const SUPPORT_EMAIL = "support@memorycrystal.ai";
const POLAR_PORTAL_URL = "https://polar.sh/illumin8ca/portal";

const upgradeHrefByTier: Record<string, string | null> = {
  free: "/api/polar/checkout?plan=pro",
  starter: "/api/polar/checkout?plan=pro",
  pro: null,
  ultra: null,
  unlimited: null,
};

export default function BillingPage() {
  const user = useQuery(api.crystal.userProfiles.getCurrentUser, {});
  const { asUserId } = useImpersonation();
  const userId = user?.userId ?? null;
  const usage = useQuery(api.crystal.dashboard.getUsage, userId ? { asUserId } : "skip");
  const userTier = useQuery(api.crystal.userProfiles.getCurrentUserTier, userId ? { asUserId } : "skip");

  const tier = usage?.tier ?? userTier ?? "free";
  const upgradeHref = upgradeHrefByTier[tier] ?? null;
  const refundMailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Refund request")}&body=${encodeURIComponent(
    "Hi Memory Crystal support,\n\nI would like to request a refund for my subscription.\n\nAccount email: "
  )}`;

  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-6 sm:mb-8 tracking-wide">BILLING</h1>

      <section className="mb-6">
        <h2 className="font-mono font-bold text-lg text-primary mb-4">Current Plan</h2>
        <div className="border border-white/[0.07] bg-surface p-4">
          <p className="text-secondary text-xs tracking-widest uppercase mb-2">Plan Status</p>
          <p className="text-primary text-base font-medium">{String(tier).toUpperCase()}</p>
          <p className="text-secondary text-xs mt-1">
            {usage
              ? `${usage.memoriesUsed} / ${usage.memoriesLimit === null ? "∞" : usage.memoriesLimit} memories used • Message TTL: ${usage.messageTtlDays} days`
              : "Loading current usage..."}
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-mono font-bold text-lg text-primary mb-4">Upgrade</h2>
        <div className="border border-white/[0.07] bg-surface p-4">
          <p className="text-primary text-sm mb-2">Pro includes larger limits, full memory health dashboard, and advanced recall workflows.</p>
          <p className="text-secondary text-xs mb-4">Free trial for Pro is shown at checkout when available.</p>
          {upgradeHref ? (
            <a href={upgradeHref} className="btn-primary inline-flex px-4 py-2 text-xs">
              Upgrade to Pro
            </a>
          ) : (
            <p className="text-accent text-sm font-mono">You are already on a Pro-level plan.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-mono font-bold text-lg text-primary mb-4">Manage Subscription</h2>
        <div className="border border-white/[0.07] bg-surface p-4 space-y-3">
          <p className="text-secondary text-sm">Need to cancel or change billing? Open the Polar customer portal.</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
            <a
              href={POLAR_PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline text-left min-h-11"
            >
              Manage or cancel in Polar →
            </a>
            <a href={refundMailto} className="text-accent underline text-left min-h-11">
              Request a refund via support →
            </a>
          </div>
          <p className="text-secondary text-xs">
            If you need help with billing changes, email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent underline">{SUPPORT_EMAIL}</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
