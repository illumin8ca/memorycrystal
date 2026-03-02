"use client";

import { useState } from "react";
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
  const apiKeys = useQuery(api.crystal.apiKeys.listApiKeys, userId ? {} : "skip");
  const createApiKey = useMutation(api.crystal.apiKeys.createApiKey);
  const revokeApiKey = useMutation(api.crystal.apiKeys.revokeApiKey);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!userId) return;
    setError("");
    setIsCreating(true);
    try {
      const key = await createApiKey({});
      setCreatedKey(key);
    } catch (err) {
      setError((err as Error).message ?? "Failed to create key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setError("Key copied to clipboard");
  };

  const handleRevoke = async (keyId: Id<"crystalApiKeys">) => {
    if (!userId) return;
    await revokeApiKey({ keyId });
  };

  return (
    <div>
      <h1 className="font-mono font-bold text-xl sm:text-2xl text-primary mb-6 sm:mb-8 tracking-wide">SETTINGS</h1>

      <section className="mb-10 sm:mb-12">
        <h2 className="font-mono font-bold text-lg text-primary mb-2">API KEYS</h2>
        <p className="text-secondary text-sm mb-6">Use these keys to connect OpenClaw and other integrations to your Memory Crystal memory.</p>
        {error ? <p className="text-red-400 text-sm mb-4">{error}</p> : null}
        <button
          onClick={handleCreate}
          disabled={!userId || isCreating}
          className="bg-accent hover:bg-accent-dim text-white px-4 py-2 min-h-11 text-sm font-semibold mb-6 transition-colors disabled:opacity-60"
          style={{ borderRadius: 0 }}
        >
          {isCreating ? "Loading..." : "+ CREATE NEW KEY"}
        </button>

        <div className="space-y-3">
          {apiKeys
            ? apiKeys.map((k: ApiKeyRow) => (
                <div key={k._id} className="border border-border bg-surface p-4">
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
                  <button
                    onClick={() => handleRevoke(k._id)}
                    className="text-secondary hover:text-red-400 text-xs mt-3 transition-colors min-h-11"
                  >
                    Revoke
                  </button>
                </div>
              ))
            : <div className="border border-border p-4 text-secondary text-sm">Loading...</div>}
        </div>
      </section>

      <div className="h-px bg-border mb-8 sm:mb-10" />

      <section>
        <h2 className="font-mono font-bold text-lg text-primary mb-4">SUBSCRIPTION</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
          <span className="text-accent text-sm font-mono border border-accent px-3 py-2">ACTIVE</span>
          <span className="text-primary">Pay as you go — $20/month</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
          <button
            type="button"
            onClick={() => {
              window.location.href = "#";
            }}
            className="text-accent underline text-left min-h-11"
          >
            Manage with Polar →
          </button>
          <button
            type="button"
            className="text-secondary hover:text-primary transition-colors text-left min-h-11"
          >
            Cancel
          </button>
        </div>
      </section>

      {createdKey ? (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl border border-border bg-surface p-5 sm:p-6">
            <p className="text-primary font-mono font-bold mb-2">NEW API KEY</p>
            <p className="text-secondary text-sm mb-4">Copy this key now. It won&apos;t be shown again.</p>
            <p className="text-primary bg-elevated border border-border p-3 text-sm break-all mb-6">
              {createdKey}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="bg-accent text-white px-4 py-2 min-h-11 text-sm hover:bg-accent-dim transition-colors"
              >
                Copy to clipboard
              </button>
              <button
                type="button"
                onClick={() => setCreatedKey(null)}
                className="bg-elevated text-primary px-4 py-2 min-h-11 text-sm border border-border hover:bg-elevated transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
