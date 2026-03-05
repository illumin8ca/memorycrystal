import { internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { stableUserId } from "./auth";

export type UserTier = "free" | "starter" | "pro" | "ultra" | "unlimited";

const UNLIMITED_EMAILS = ["andy@illumin8.ca", "admin@illumin8.ca", "andydoucet@gmail.com"];
const PRO_PRODUCT_ID = "f78ee82b-719e-4de8-850a-3e9eea3db4b0";
const ULTRA_PRODUCT_ID = "9d59dd76-5026-4079-95f7-bf594f71121b";

function pickLatestProfile<T extends { updatedAt?: number }>(profiles: T[]): T | undefined {
  return profiles.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
}

function deriveTier(profile: { subscriptionStatus?: string; plan?: string } | null | undefined): UserTier {
  if (profile?.subscriptionStatus === "unlimited") return "unlimited";
  if (profile?.subscriptionStatus !== "active" && profile?.subscriptionStatus !== "trialing") return "free";

  const plan = (profile?.plan ?? "").toLowerCase();
  if (plan === ULTRA_PRODUCT_ID || plan === "ultra") return "ultra";
  if (plan === PRO_PRODUCT_ID || plan === "pro") return "pro";
  if (plan === "starter") return "starter";

  return "pro";
}

export const createOrGet = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);

    const existingProfiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const existing = pickLatestProfile(existingProfiles);
    if (existing) return existing;

    const now = Date.now();
    // Auto-grant unlimited plan to allowlisted emails
    const isUnlimited = UNLIMITED_EMAILS.includes((identity.email ?? "").toLowerCase());

    const id = await ctx.db.insert("crystalUserProfiles", {
      userId,
      subscriptionStatus: isUnlimited ? "unlimited" : "inactive",
      plan: isUnlimited ? "unlimited" : undefined,
      createdAt: now,
      updatedAt: now,
    });
    return ctx.db.get(id);
  },
});

export const grantUnlimitedByUserId = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!profile) {
      // Create profile if it doesn't exist
      const now = Date.now();
      await ctx.db.insert("crystalUserProfiles", {
        userId,
        subscriptionStatus: "unlimited",
        plan: "unlimited",
        createdAt: now,
        updatedAt: now,
      });
      return { created: true };
    }
    await ctx.db.patch(profile._id, {
      subscriptionStatus: "unlimited",
      plan: "unlimited",
      updatedAt: Date.now(),
    });
    return { updated: true };
  },
});

export const grantUnlimitedBySelf = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    if (!UNLIMITED_EMAILS.includes((identity.email ?? "").toLowerCase())) {
      throw new Error("Not authorized for unlimited plan");
    }
    const userId = stableUserId(identity.subject);
    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const profile = pickLatestProfile(profiles);
    if (!profile) throw new Error("No profile found — visit /dashboard first");
    await ctx.db.patch(profile._id, {
      subscriptionStatus: "unlimited",
      plan: "unlimited",
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);
    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return pickLatestProfile(profiles) ?? null;
  },
});

export const isSubscribed = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const userId = stableUserId(identity.subject);
    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const profile = pickLatestProfile(profiles);
    return (
      profile?.subscriptionStatus === "active" ||
      profile?.subscriptionStatus === "trialing" ||
      profile?.subscriptionStatus === "unlimited"
    );
  },
});

export const getUserTier = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }): Promise<UserTier> => {
    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return deriveTier(pickLatestProfile(profiles));
  },
});

export const getCurrentUserTier = query({
  args: {},
  handler: async (ctx): Promise<UserTier> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);

    const profiles = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return deriveTier(pickLatestProfile(profiles));
  },
});

// Internal helpers for webhook/server jobs
export const getByUserInternal = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) =>
    ctx.db.query("crystalUserProfiles").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
});

export const getByPolarCustomerInternal = internalQuery({
  args: { polarCustomerId: v.string() },
  handler: async (ctx, { polarCustomerId }) =>
    ctx.db.query("crystalUserProfiles").withIndex("by_polar_customer", (q) => q.eq("polarCustomerId", polarCustomerId)).first(),
});

export const getByPolarSubscriptionInternal = internalQuery({
  args: { polarSubscriptionId: v.string() },
  handler: async (ctx, { polarSubscriptionId }) =>
    ctx.db.query("crystalUserProfiles").withIndex("by_polar_subscription", (q) => q.eq("polarSubscriptionId", polarSubscriptionId)).first(),
});

export const updateSubscriptionInternal = internalMutation({
  args: {
    userProfileId: v.id("crystalUserProfiles"),
    polarSubscriptionId: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
    subscriptionStatus: v.union(
      v.literal("active"), v.literal("inactive"), v.literal("cancelled"), v.literal("trialing")
    ),
    plan: v.optional(v.string()),
  },
  handler: async (ctx, { userProfileId, ...fields }) => {
    await ctx.db.patch(userProfileId, { ...fields, updatedAt: Date.now() });
  },
});

// Used by background jobs to iterate all users
export const listAllUserIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("crystalUserProfiles").collect();
    return profiles.map((p) => p.userId).filter((id): id is string => !!id);
  },
});

export const getByPolarCustomer = query({
  args: { polarCustomerId: v.string(), webhookToken: v.string() },
  handler: async (ctx, { polarCustomerId, webhookToken }) => {
    if (!process.env.POLAR_WEBHOOK_SECRET || webhookToken !== process.env.POLAR_WEBHOOK_SECRET) {
      throw new Error("Unauthorized");
    }
    return ctx.db.query("crystalUserProfiles").withIndex("by_polar_customer", (q) => q.eq("polarCustomerId", polarCustomerId)).first();
  },
});

export const updateSubscription = mutation({
  args: {
    userProfileId: v.id("crystalUserProfiles"),
    polarSubscriptionId: v.optional(v.string()),
    polarCustomerId: v.optional(v.string()),
    subscriptionStatus: v.union(
      v.literal("active"), v.literal("inactive"), v.literal("cancelled"), v.literal("trialing")
    ),
    plan: v.optional(v.string()),
    webhookToken: v.string(),
  },
  handler: async (ctx, { userProfileId, webhookToken, ...fields }) => {
    if (!process.env.POLAR_WEBHOOK_SECRET || webhookToken !== process.env.POLAR_WEBHOOK_SECRET) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(userProfileId, { ...fields, updatedAt: Date.now() });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return {
      userId: stableUserId(identity.subject),
      email: identity.email ?? null,
      name: identity.name ?? null,
    };
  },
});
