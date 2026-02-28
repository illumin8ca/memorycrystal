import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Replace with real Polar checkout URL once checkout session creation is wired.
  const checkoutUrl = "https://polar.sh/checkout/TODO";
  return NextResponse.redirect(checkoutUrl);
}
