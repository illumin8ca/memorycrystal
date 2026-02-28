import { mutation, query } from "../_generated/server";
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
  args: { userId: v.string(), label: v.optional(v.string()) },
  handler: async (ctx, { userId, label }) => {
    const rawKey = generateKey();
    const keyHash = await sha256Hex(rawKey);
    await ctx.db.insert("vexclawApiKeys", {
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
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const keys = await ctx.db
      .query("vexclawApiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return keys.map(({ keyHash: _kh, ...rest }) => rest);
  },
});

export const revokeApiKey = mutation({
  args: { userId: v.string(), keyId: v.id("vexclawApiKeys") },
  handler: async (ctx, { userId, keyId }) => {
    const key = await ctx.db.get(keyId);
    if (!key || key.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(keyId, { active: false });
  },
});

export const validateApiKey = query({
  args: { keyHash: v.string() },
  handler: async (ctx, { keyHash }) => {
    const key = await ctx.db
      .query("vexclawApiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", keyHash))
      .first();
    if (!key || !key.active) return null;
    return key.userId;
  },
});
