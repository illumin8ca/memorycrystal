import { NextResponse, type NextRequest } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

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

const toSubscriptionStatus = (
  value?: string
): "active" | "inactive" | "cancelled" | "trialing" => {
  if (value === "active") return "active";
  if (value === "trialing") return "trialing";
  if (value === "cancelled" || value === "canceled") return "cancelled";
  return "inactive";
};

export async function POST(request: NextRequest) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing POLAR_WEBHOOK_SECRET" }, { status: 500 });
  }

  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event;
  try {
    event = validateEvent(body, headers, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }
    throw err;
  }

  if (
    event.type !== "subscription.created" &&
    event.type !== "subscription.updated" &&
    event.type !== "subscription.active" &&
    event.type !== "subscription.canceled"
  ) {
    return NextResponse.json({ received: true });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return NextResponse.json({ error: "Missing CONVEX_URL" }, { status: 500 });
  const rawClient = new ConvexHttpClient(convexUrl);

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

  const profileBySubscription =
    polarSubscriptionId
      ? await rawClient.query(api.crystal.userProfiles.getByPolarSubscription, {
          polarSubscriptionId: String(polarSubscriptionId),
          webhookToken: secret,
        })
      : null;

  const profileByCustomer =
    polarCustomerId
      ? await rawClient.query(api.crystal.userProfiles.getByPolarCustomer, {
          polarCustomerId: String(polarCustomerId),
          webhookToken: secret,
        })
      : null;

  const profile = profileBySubscription ?? profileByCustomer;

  if (!profile?._id) {
    return NextResponse.json({ skipped: "no matching profile" });
  }

  const incomingSubscriptionId = polarSubscriptionId ? String(polarSubscriptionId) : undefined;
  const existingSubscriptionId = profile.polarSubscriptionId;

  const isPotentiallyStaleCancellation =
    (subscriptionStatus === "cancelled" || subscriptionStatus === "inactive") &&
    !!incomingSubscriptionId &&
    !!existingSubscriptionId &&
    incomingSubscriptionId !== existingSubscriptionId;

  if (isPotentiallyStaleCancellation) {
    return NextResponse.json({
      skipped: "stale cancellation/inactive event for previous subscription",
    });
  }

  await rawClient.mutation(api.crystal.userProfiles.updateSubscription, {
    userProfileId: profile._id,
    polarSubscriptionId: incomingSubscriptionId,
    polarCustomerId: polarCustomerId ? String(polarCustomerId) : undefined,
    subscriptionStatus,
    plan: productId ? String(productId) : undefined,
    webhookToken: secret,
  });

  return NextResponse.json({ received: true });
}
