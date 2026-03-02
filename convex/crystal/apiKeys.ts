import { internalQuery, mutation, query } from "../_generated/server";
import { v } from "convex/values";

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateKey(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const createApiKey = mutation({
  args: { label: v.optional(v.string()) },
  handler: async (ctx, { label }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;
    const rawKey = generateKey();
    const keyHash = await sha256Hex(rawKey);
    await ctx.db.insert("crystalApiKeys", {
      userId,
      keyHash,
      label,
      createdAt: Date.now(),
      active: true,
    });
    return rawKey; // only time raw key is returned
  },
});

export const listApiKeys = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const keys = await ctx.db
      .query("crystalApiKeys")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    return keys.map(({ keyHash: _kh, ...rest }) => rest);
  },
});

export const revokeApiKey = mutation({
  args: { keyId: v.id("crystalApiKeys") },
  handler: async (ctx, { keyId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const key = await ctx.db.get(keyId);
    if (!key || key.userId !== identity.subject) throw new Error("Not found");
    await ctx.db.patch(keyId, { active: false });
  },
});

export const validateApiKey = internalQuery({
  args: { keyHash: v.string() },
  handler: async (ctx, { keyHash }) => {
    const key = await ctx.db
      .query("crystalApiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", keyHash))
      .first();
    if (!key || !key.active) return null;
    return key.userId;
  },
});
