import { NextRequest, NextResponse } from "next/server";

function convexSiteBaseUrl() {
  const explicit = process.env.CONVEX_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const cloud = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!cloud) throw new Error("Missing CONVEX_URL/NEXT_PUBLIC_CONVEX_URL");
  return cloud.replace(".convex.cloud", ".convex.site").replace(/\/$/, "");
}

async function forward(req: NextRequest) {
  const base = convexSiteBaseUrl();
  const prefix = "/api/mcp/";
  const pathname = req.nextUrl.pathname;
  const subpath = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";
  const target = `${base}/api/mcp/${subpath}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const res = await fetch(target, init);
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: res.headers,
  });
}

export async function GET(req: NextRequest) {
  return forward(req);
}

export async function POST(req: NextRequest) {
  return forward(req);
}
