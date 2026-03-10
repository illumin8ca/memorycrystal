import { httpAction } from "../_generated/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { Webhook } from "standardwebhooks";
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

  // Step 1: Verify the webhook signature (independent of SDK schema parsing)
  let rawEvent: any;
  try {
    const base64Secret = Buffer.from(secret, "utf-8").toString("base64");
    const webhook = new Webhook(base64Secret);
    rawEvent = webhook.verify(body, headers);
  } catch (err) {
    console.error("[polarWebhook] signature verification failed", err);
    return json({ error: "Invalid webhook signature" }, 400);
  }

  const eventType = rawEvent?.type as string | undefined;

  // Step 2: If this isn't an event we handle, ack immediately (200 OK)
  if (!eventType || !HANDLED_SUBSCRIPTION_EVENTS.has(eventType)) {
    return json({ received: true, ignored: eventType ?? "unknown" }, 200);
  }

  // Step 3: For events we handle, try SDK schema validation for typed access
  let event: any;
  try {
    event = validateEvent(body, headers, secret);
  } catch (err) {
    // Signature already verified above — if SDK parsing fails, use raw event
    console.warn("[polarWebhook] SDK parseEvent failed, using raw payload", err);
    event = rawEvent;
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
