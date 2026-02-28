"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type ApiKeyRow = {
  _id: Id<"vexclawApiKeys">;
  keyHash?: string;
  label?: string;
  createdAt?: number;
  lastUsedAt?: number;
  active: boolean;
};

export default function SettingsPage() {
  const user = useQuery(api.vexclaw.userProfiles.getCurrentUser, {});
  const userId = user?.userId ?? null;
  const apiKeys = useQuery(api.vexclaw.apiKeys.listApiKeys, userId ? { userId } : "skip");
  const createApiKey = useMutation(api.vexclaw.apiKeys.createApiKey);
  const revokeApiKey = useMutation(api.vexclaw.apiKeys.revokeApiKey);

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

  const handleRevoke = async (keyId: Id<"vexclawApiKeys">) => {
    if (!userId) return;
    await revokeApiKey({ userId, keyId });
  };

  return (
    <div>
      <h1 className="font-mono font-bold text-2xl text-[#f0f0f0] mb-8 tracking-wide">SETTINGS</h1>

      <section className="mb-12">
        <h2 className="font-mono font-bold text-lg text-[#f0f0f0] mb-2">API KEYS</h2>
        <p className="text-[#888] text-sm mb-6">Use these keys to connect OpenClaw and other integrations to your VexClaw memory.</p>
        {error ? <p className="text-red-400 text-sm mb-4">{error}</p> : null}
        <button
          onClick={handleCreate}
          disabled={!userId || isCreating}
          className="bg-[#0066ff] hover:bg-[#0044cc] text-white px-4 py-2 text-sm font-semibold mb-6 transition-colors disabled:opacity-60"
          style={{ borderRadius: 0 }}
        >
          {isCreating ? "Loading..." : "+ CREATE NEW KEY"}
        </button>
        <div className="border border-[#2a2a2a]">
          <div className="bg-[#1e1e1e] grid grid-cols-5 px-4 py-2 text-[#888] text-xs tracking-widest uppercase font-mono">
            <span>Label</span><span>Created</span><span>Last Used</span><span>Status</span><span></span>
          </div>
          {apiKeys
            ? apiKeys.map((k: ApiKeyRow) => (
                <div
                  key={k._id}
                  className="grid grid-cols-5 px-4 py-3 border-t border-[#2a2a2a] bg-[#141414] text-sm"
                >
                  <span className="text-[#f0f0f0] font-medium">{k.label ?? "Untitled Key"}</span>
                  <span className="text-[#888]">
                    {k.createdAt ? new Date(k.createdAt).toLocaleDateString("en-US") : "-"}
                  </span>
                  <span className="text-[#888]">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("en-US") : "Never"}</span>
                  <span className="text-[#0066ff] text-xs font-mono border border-[#0066ff] px-2 py-0.5 w-fit">
                    {k.active ? "ACTIVE" : "REVOKED"}
                  </span>
                  <button
                    onClick={() => handleRevoke(k._id)}
                    className="text-[#888] hover:text-red-400 text-xs text-right transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              ))
            : <div className="grid grid-cols-5 px-4 py-3 border-t border-[#2a2a2a] text-[#888] text-sm">Loading...</div>}
        </div>
      </section>

      <div className="h-px bg-[#2a2a2a] mb-10" />

      <section>
        <h2 className="font-mono font-bold text-lg text-[#f0f0f0] mb-4">SUBSCRIPTION</h2>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-[#0066ff] text-sm font-mono border border-[#0066ff] px-3 py-1">ACTIVE</span>
          <span className="text-[#f0f0f0]">Pay as you go — $20/month</span>
        </div>
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            onClick={() => {
              window.location.href = "#";
            }}
            className="text-[#0066ff] underline"
          >
            Manage with Polar →
          </button>
          <button
            type="button"
            className="text-[#888] hover:text-[#f0f0f0] transition-colors"
          >
            Cancel
          </button>
        </div>
      </section>

      {createdKey ? (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl border border-[#2a2a2a] bg-[#141414] p-6">
            <p className="text-[#f0f0f0] font-mono font-bold mb-2">NEW API KEY</p>
            <p className="text-[#888] text-sm mb-4">Copy this key now. It won&apos;t be shown again.</p>
            <p className="text-[#f0f0f0] bg-[#1e1e1e] border border-[#2a2a2a] p-3 text-sm break-all mb-6">
              {createdKey}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="bg-[#0066ff] text-white px-4 py-2 text-sm hover:bg-[#0044cc] transition-colors"
              >
                Copy to clipboard
              </button>
              <button
                type="button"
                onClick={() => setCreatedKey(null)}
                className="bg-[#1e1e1e] text-[#f0f0f0] px-4 py-2 text-sm border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors"
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
