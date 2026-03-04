import { NextRequest, NextResponse } from "next/server";

function convexSiteBaseUrl() {
  const explicit = process.env.CONVEX_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const cloud = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!cloud) throw new Error("Missing CONVEX_URL/NEXT_PUBLIC_CONVEX_URL");
  return cloud.replace(".convex.cloud", ".convex.site").replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  const target = `${convexSiteBaseUrl()}/api/mcp-auth`;
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  const res = await fetch(target, {
    method: "POST",
    headers,
    body: await req.text(),
    redirect: "manual",
  });

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: res.headers,
  });
}
