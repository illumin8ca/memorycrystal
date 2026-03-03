import { Polar } from "@polar-sh/sdk";
import { NextResponse } from "next/server";

export async function GET() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const productId = process.env.POLAR_PRODUCT_ID;

  if (!accessToken || !productId) {
    // Fallback to manual checkout page if not configured
    return NextResponse.redirect("https://polar.sh/illumin8ca/products");
  }

  const polar = new Polar({ accessToken });

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://memorycrystal.ai"}/dashboard?subscribed=1`,
    });
    return NextResponse.redirect(checkout.url);
  } catch {
    return NextResponse.redirect("https://polar.sh/illumin8ca/products");
  }
}
