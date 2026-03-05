"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type ApiKeyRow = {
  _id: Id<"crystalApiKeys">;
  keyHash?: string;
  label?: string;
  createdAt?: number;
  lastUsedAt?: number;
  active: boolean;
};

export default function SettingsPage() {
  const user = useQuery(api.crystal.userProfiles.getCurrentUser, {});
  const userId = user?.userId ?? null;
  const subscribed = useQuery(api.crystal.userProfiles.isSubscribed);
  const usage = useQuery(api.crystal.dashboard.getUsage, userId ? {} : "skip");
  const apiKeys = useQuery(api.crystal.apiKeys.listApiKeys, userId ? {} : "skip");
  const createApiKey = useMutation(api.crystal.apiKeys.createApiKey);
  const revokeApiKey = useMutation(api.crystal.apiKeys.revokeApiKey);
  const regenerateApiKeyMutation = useMutation(api.crystal.apiKeys.regenerateApiKey);

  const [isCreating, setIsCreating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");

  const handleCreate = async () => {
    if (!userId) return;
    setError("");
    setIsCreating(true);
    try {
      const cleanedLabel = newKeyLabel.trim();
      const key = await createApiKey({
        ...(cleanedLabel ? { label: cleanedLabel } : {}),
      });
      setCreatedKey(key);
      setShowCreateModal(false);
      setNewKeyLabel("");
    } catch (err) {
      setError((err as Error).message ?? "Failed to create key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevoke = async (keyId: Id<"crystalApiKeys">) => {
    if (!userId) return;
    setError("");
    try {
      await revokeApiKey({ keyId });
    } catch (err) {
      setError((err as Error).message ?? "Failed to revoke key");
    }
  };

  const handleRegenerate = async (keyId: Id<"crystalApiKeys">, label?: string) => {
    if (!userId) return;
    setIsRegenerating(keyId);
    try {
      const newKey = await regenerateApiKeyMutation({ oldKeyId: keyId, label });
      setCreatedKey(newKey);
    } catch (e) {
      alert("Failed to regenerate: " + String(e));
    } finally {
      setIsRegenerating(null);
    }
  };

  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-6 sm:mb-8 tracking-wide">SETTINGS</h1>

      <section className="mb-10 sm:mb-12">
        <h2 className="font-mono font-bold text-lg text-primary mb-2">API KEYS</h2>
        <p className="text-secondary text-sm mb-6">Use these keys to connect OpenClaw and other integrations to your Memory Crystal memory.</p>
        {error ? <p className="text-red-400 text-sm mb-4">{error}</p> : null}
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!userId || isCreating}
          className="btn-primary px-4 py-2 min-h-11 text-sm mb-6 disabled:opacity-60"
          style={{ borderRadius: 0 }}
        >
          {isCreating ? "Loading..." : "+ CREATE NEW KEY"}
        </button>

        <div className="space-y-3">
          {apiKeys
            ? apiKeys.map((k: ApiKeyRow) => (
                <div key={k._id} className="border border-white/[0.07] bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-primary font-medium">{k.label ?? "Untitled Key"}</span>
                    <span className="text-accent text-[10px] sm:text-xs font-mono border border-accent px-2 py-1 w-fit">
                      {k.active ? "ACTIVE" : "REVOKED"}
                    </span>
                  </div>
                  <div className="text-secondary text-xs mt-2 space-y-1">
                    <p>Created: {k.createdAt ? new Date(k.createdAt).toLocaleDateString("en-US") : "-"}</p>
                    <p>Last Used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("en-US") : "Never"}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleRegenerate(k._id, k.label)}
                      disabled={isRegenerating === k._id}
                      className="btn-secondary text-xs px-3 py-2 min-h-9 disabled:opacity-60"
                    >
                      {isRegenerating === k._id ? "Regenerating..." : "Regenerate"}
                    </button>
                    {k.active ? (
                      <button
                        onClick={() => handleRevoke(k._id)}
                        className="text-secondary hover:text-red-400 text-xs transition-colors min-h-9"
                      >
                        Revoke
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            : <div className="border border-white/[0.07] p-4 text-secondary text-sm">Loading...</div>}
        </div>
      </section>

      <div className="h-px bg-white/[0.06] mb-8 sm:mb-10" />

      <section>
        <h2 className="font-mono font-bold text-lg text-primary mb-4">SUBSCRIPTION</h2>

        <div className="border border-white/[0.07] bg-surface p-4 mb-4">
          <p className="text-secondary text-xs tracking-widest uppercase mb-2">Usage</p>
          <p className="text-primary text-sm">
            {usage
              ? `${usage.memoriesUsed} / ${usage.memoriesLimit === null ? "∞" : usage.memoriesLimit} memories used`
              : "Loading usage..."}
          </p>
          <p className="text-secondary text-xs mt-1">
            {usage ? `Tier: ${usage.tier.toUpperCase()} • Message TTL: ${usage.messageTtlDays} days` : ""}
          </p>
          {usage && usage.tier !== "ultra" && usage.tier !== "unlimited" ? (
            <a
              href="/api/polar/checkout?plan=pro"
              className="btn-primary inline-flex px-4 py-2 text-xs mt-3"
            >
              Upgrade
            </a>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
          {subscribed === undefined ? (
            <span className="text-white/30 text-sm font-mono border border-white/10 px-3 py-2">LOADING…</span>
          ) : subscribed ? (
            <span className="text-accent text-sm font-mono border border-accent px-3 py-2">ACTIVE</span>
          ) : (
            <span className="text-red-400 text-sm font-mono border border-red-400/50 px-3 py-2">INACTIVE</span>
          )}
          <span className="text-primary">{subscribed ? "Your vault is active" : "No active subscription"}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
          <a
            href="https://polar.sh/illumin8ca/portal"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline text-left min-h-11"
          >
            Manage with Polar →
          </a>
          <button
            type="button"
            className="text-secondary hover:text-primary transition-colors text-left min-h-11"
          >
            Cancel
          </button>
        </div>
      </section>

      <AnimatePresence>
      {showCreateModal ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-md p-5 sm:p-6"
            style={{ backgroundColor: "#0f1e29", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
          >
            <p className="text-primary font-mono font-bold mb-2">CREATE API KEY</p>
            <p className="text-secondary text-sm mb-4">Add a label so you can recognize this key later.</p>
            <label className="block text-xs font-mono text-secondary mb-2">Key Label</label>
            <input
              type="text"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder="e.g. OpenClaw Beta Tester"
              className="w-full bg-elevated border border-white/[0.07] text-primary px-3 py-3 text-sm mb-5 outline-none focus:border-accent focus:shadow-[0_0_0_1px_#2180D6,0_0_12px_rgba(33,128,214,0.2)]"
              maxLength={64}
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="btn-primary px-4 py-2 min-h-11 text-sm disabled:opacity-60"
              >
                {isCreating ? "Creating..." : "Create Key"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isCreating) return;
                  setShowCreateModal(false);
                  setNewKeyLabel("");
                }}
                className="btn-secondary px-4 py-2 min-h-11 text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>

      <AnimatePresence>
      {createdKey ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-xl p-5 sm:p-6"
            style={{ backgroundColor: "#0f1e29", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
          >
            <p className="text-primary font-mono font-bold mb-2">NEW API KEY</p>
            <p className="text-secondary text-sm mb-4">Copy this key now. It won&apos;t be shown again.</p>
            <p className="text-primary bg-elevated border border-white/[0.07] p-3 text-sm break-all mb-6">
              {createdKey}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2 min-h-11 text-sm transition-all ${copied ? "btn-secondary" : "btn-primary"}`}
              >
                {copied ? "✓ Copied!" : "Copy to clipboard"}
              </button>
              <button
                type="button"
                onClick={() => setCreatedKey(null)}
                className="btn-secondary px-4 py-2 min-h-11 text-sm"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </div>
  );
}
