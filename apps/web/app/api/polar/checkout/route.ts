import { Polar } from "@polar-sh/sdk";
import { NextResponse, type NextRequest } from "next/server";

const PRODUCT_IDS: Record<string, string | undefined> = {
  free: process.env.POLAR_PRODUCT_ID_FREE,
  pro: process.env.POLAR_PRODUCT_ID_PRO,
  ultra: process.env.POLAR_PRODUCT_ID_ULTRA,
};

export async function GET(request: NextRequest) {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const { searchParams } = new URL(request.url);
  const plan = searchParams.get("plan") ?? "pro";
  const productId = PRODUCT_IDS[plan] ?? process.env.POLAR_PRODUCT_ID_PRO;

  if (!accessToken || !productId) {
    return NextResponse.redirect("https://polar.sh/illumin8ca/products");
  }

  const polar = new Polar({ accessToken });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://memorycrystal.ai";

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${appUrl}/dashboard?subscribed=1`,
    });
    return NextResponse.redirect(checkout.url);
  } catch {
    return NextResponse.redirect("https://polar.sh/illumin8ca/products");
  }
}
