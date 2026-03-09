import { httpAction } from "../_generated/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { api } from "../_generated/api";

const HANDLED_SUBSCRIPTION_EVENTS = new Set([
  "subscription.created",
  "subscription.updated",
  "subscription.active",
  "subscription.canceled",
]);

type SubscriptionLike = {
  id?: string;
  status?: string;
  customerId?: string;
  customer_id?: string;
  customer?: { id?: string; customerId?: string };
  userId?: string;
  user_id?: string;
  user?: { id?: string };
  metadata?: Record<string, string>;
  productId?: string;
  product_id?: string;
  product?: { id?: string };
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const toSubscriptionStatus = (
  value?: string
): "active" | "inactive" | "cancelled" | "trialing" => {
  if (value === "active") return "active";
  if (value === "trialing") return "trialing";
  if (value === "cancelled" || value === "canceled") return "cancelled";
  return "inactive";
};

export const polarWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return json({ error: "Missing POLAR_WEBHOOK_SECRET" }, 500);
  }

  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event: any;
  try {
    event = validateEvent(body, headers, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return json({ error: "Invalid webhook signature" }, 400);
    }
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.toLowerCase().includes("signature") ||
      message.toLowerCase().includes("header") ||
      message.toLowerCase().includes("webhook")
    ) {
      return json({ error: "Invalid webhook signature" }, 400);
    }
    console.error("[polarWebhook] unexpected validateEvent error", err);
    return json({ error: "Webhook verification failed" }, 400);
  }

  if (!HANDLED_SUBSCRIPTION_EVENTS.has(event.type)) {
    return json({ received: true, ignored: event.type }, 200);
  }

  const subscription = (event.data ?? {}) as SubscriptionLike;
  const polarSubscriptionId = subscription.id;
  const polarCustomerId =
    subscription.customerId ??
    subscription.customer_id ??
    subscription.customer?.id ??
    subscription.customer?.customerId;
  const subscriptionStatus = toSubscriptionStatus(subscription.status);
  const productId =
    subscription.productId ?? subscription.product_id ?? subscription.product?.id ?? undefined;

  const profileBySubscription = polarSubscriptionId
    ? await ctx.runQuery(api.crystal.userProfiles.getByPolarSubscription, {
        polarSubscriptionId: String(polarSubscriptionId),
        webhookToken: secret,
      })
    : null;

  const profileByCustomer = polarCustomerId
    ? await ctx.runQuery(api.crystal.userProfiles.getByPolarCustomer, {
        polarCustomerId: String(polarCustomerId),
        webhookToken: secret,
      })
    : null;

  const profile = profileBySubscription ?? profileByCustomer;
  const eventUserId =
    subscription.userId ??
    subscription.user_id ??
    subscription.user?.id ??
    subscription.metadata?.userId;

  if (!profile?._id && !eventUserId) {
    return json({ skipped: "no matching profile" });
  }

  const incomingSubscriptionId = polarSubscriptionId ? String(polarSubscriptionId) : undefined;
  const existingSubscriptionId = profile?.polarSubscriptionId;

  const isPotentiallyStaleCancellation =
    (subscriptionStatus === "cancelled" || subscriptionStatus === "inactive") &&
    !!incomingSubscriptionId &&
    !!existingSubscriptionId &&
    incomingSubscriptionId !== existingSubscriptionId;

  if (isPotentiallyStaleCancellation) {
    return json({
      skipped: "stale cancellation/inactive event for previous subscription",
    });
  }

  if (profile?._id) {
    await ctx.runMutation(api.crystal.userProfiles.updateSubscription, {
      userProfileId: profile._id,
      polarSubscriptionId: incomingSubscriptionId,
      polarCustomerId: polarCustomerId ? String(polarCustomerId) : undefined,
      subscriptionStatus,
      plan: productId ? String(productId) : undefined,
      webhookToken: secret,
    });
  } else {
    await ctx.runMutation(api.crystal.userProfiles.upsertSubscriptionByUser, {
      userId: String(eventUserId),
      polarSubscriptionId: incomingSubscriptionId,
      polarCustomerId: polarCustomerId ? String(polarCustomerId) : undefined,
      subscriptionStatus,
      plan: productId ? String(productId) : undefined,
      webhookToken: secret,
    });
  }

  return json({ received: true });
});
