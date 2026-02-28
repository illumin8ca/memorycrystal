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
  const apiKeys = useQuery(api.crystal.apiKeys.listApiKeys, userId ? { userId } : "skip");
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
      const key = await createApiKey({ userId });
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
    await revokeApiKey({ userId, keyId });
  };

  return (
    <div>
      <h1 className="font-mono font-bold text-2xl text-primary mb-8 tracking-wide">SETTINGS</h1>

      <section className="mb-12">
        <h2 className="font-mono font-bold text-lg text-primary mb-2">API KEYS</h2>
        <p className="text-secondary text-sm mb-6">Use these keys to connect OpenClaw and other integrations to your Memory Crystal memory.</p>
        {error ? <p className="text-red-400 text-sm mb-4">{error}</p> : null}
        <button
          onClick={handleCreate}
          disabled={!userId || isCreating}
          className="bg-accent hover:bg-accent-dim text-white px-4 py-2 text-sm font-semibold mb-6 transition-colors disabled:opacity-60"
          style={{ borderRadius: 0 }}
        >
          {isCreating ? "Loading..." : "+ CREATE NEW KEY"}
        </button>
        <div className="border border-border">
          <div className="bg-elevated grid grid-cols-5 px-4 py-2 text-secondary text-xs tracking-widest uppercase font-mono">
            <span>Label</span><span>Created</span><span>Last Used</span><span>Status</span><span></span>
          </div>
          {apiKeys
            ? apiKeys.map((k: ApiKeyRow) => (
                <div
                  key={k._id}
                  className="grid grid-cols-5 px-4 py-3 border-t border-border bg-surface text-sm"
                >
                  <span className="text-primary font-medium">{k.label ?? "Untitled Key"}</span>
                  <span className="text-secondary">
                    {k.createdAt ? new Date(k.createdAt).toLocaleDateString("en-US") : "-"}
                  </span>
                  <span className="text-secondary">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("en-US") : "Never"}</span>
                  <span className="text-accent text-xs font-mono border border-accent px-2 py-0.5 w-fit">
                    {k.active ? "ACTIVE" : "REVOKED"}
                  </span>
                  <button
                    onClick={() => handleRevoke(k._id)}
                    className="text-secondary hover:text-red-400 text-xs text-right transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              ))
            : <div className="grid grid-cols-5 px-4 py-3 border-t border-border text-secondary text-sm">Loading...</div>}
        </div>
      </section>

      <div className="h-px bg-border mb-10" />

      <section>
        <h2 className="font-mono font-bold text-lg text-primary mb-4">SUBSCRIPTION</h2>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-accent text-sm font-mono border border-accent px-3 py-1">ACTIVE</span>
          <span className="text-primary">Pay as you go — $20/month</span>
        </div>
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            onClick={() => {
              window.location.href = "#";
            }}
            className="text-accent underline"
          >
            Manage with Polar →
          </button>
          <button
            type="button"
            className="text-secondary hover:text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </section>

      {createdKey ? (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl border border-border bg-surface p-6">
            <p className="text-primary font-mono font-bold mb-2">NEW API KEY</p>
            <p className="text-secondary text-sm mb-4">Copy this key now. It won&apos;t be shown again.</p>
            <p className="text-primary bg-elevated border border-border p-3 text-sm break-all mb-6">
              {createdKey}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="bg-accent text-white px-4 py-2 text-sm hover:bg-accent-dim transition-colors"
              >
                Copy to clipboard
              </button>
              <button
                type="button"
                onClick={() => setCreatedKey(null)}
                className="bg-elevated text-primary px-4 py-2 text-sm border border-border hover:bg-elevated transition-colors"
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
