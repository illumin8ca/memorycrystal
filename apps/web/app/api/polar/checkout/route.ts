import { Polar } from "@polar-sh/sdk";
import { NextResponse, type NextRequest } from "next/server";

const PRODUCT_IDS: Record<string, string | undefined> = {
  free: process.env.POLAR_PRODUCT_ID_FREE ?? "bbd98a9d-271d-431b-bf23-246bc34e79f0",
  starter: process.env.POLAR_PRODUCT_ID_STARTER ?? "06c4022e-4a2d-4d44-9281-01922aef23b6",
  pro: process.env.POLAR_PRODUCT_ID_PRO ?? "f78ee82b-719e-4de8-850a-3e9eea3db4b0",
  ultra: process.env.POLAR_PRODUCT_ID_ULTRA ?? "9d59dd76-5026-4079-95f7-bf594f71121b",
};

export async function GET(request: NextRequest) {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const { searchParams } = new URL(request.url);
  const plan = searchParams.get("plan") ?? "pro";
  const productId = PRODUCT_IDS[plan];

  if (!accessToken || !productId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL ?? "https://memorycrystal.ai"}/pricing?checkoutError=config&plan=${encodeURIComponent(plan)}`);
  }

  const polar = new Polar({ accessToken });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://memorycrystal.ai";

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${appUrl}/dashboard?subscribed=1`,
    });
    return NextResponse.redirect(checkout.url);
  } catch (error) {
    console.error("Polar checkout creation failed", { plan, productId, error });
    return NextResponse.redirect(`${appUrl}/pricing?checkoutError=polar&plan=${encodeURIComponent(plan)}`);
  }
}
