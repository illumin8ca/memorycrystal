import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const createOrGet = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) return existing;
    const now = Date.now();
    const id = await ctx.db.insert("crystalUserProfiles", {
      userId,
      subscriptionStatus: "inactive",
      createdAt: now,
      updatedAt: now,
    });
    return ctx.db.get(id);
  },
});

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) =>
    ctx.db.query("crystalUserProfiles").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
});

export const getByPolarCustomer = query({
  args: { polarCustomerId: v.string() },
  handler: async (ctx, { polarCustomerId }) =>
    ctx.db.query("crystalUserProfiles").withIndex("by_polar_customer", (q) => q.eq("polarCustomerId", polarCustomerId)).first(),
});

export const getByPolarSubscription = query({
  args: { polarSubscriptionId: v.string() },
  handler: async (ctx, { polarSubscriptionId }) =>
    ctx.db.query("crystalUserProfiles").withIndex("by_polar_subscription", (q) => q.eq("polarSubscriptionId", polarSubscriptionId)).first(),
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
  },
  handler: async (ctx, { userProfileId, ...fields }) => {
    await ctx.db.patch(userProfileId, { ...fields, updatedAt: Date.now() });
  },
});

export const isSubscribed = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return profile?.subscriptionStatus === "active" || profile?.subscriptionStatus === "trialing";
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return {
      userId: identity.subject,
      email: identity.email ?? null,
      name: identity.name ?? null,
    };
  },
});
