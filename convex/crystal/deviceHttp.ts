import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const deviceStart = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { deviceCode, userCode } = await ctx.runMutation(internal.crystal.deviceAuth.startSession, {});
  const webBase = process.env.CRYSTAL_PUBLIC_WEB_URL || "https://memorycrystal.ai";
  const verificationUrl = `${webBase}/device?user_code=${encodeURIComponent(userCode)}`;

  return new Response(
    JSON.stringify({
      device_code: deviceCode,
      user_code: userCode,
      verification_url: verificationUrl,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
});

export const deviceStatus = httpAction(async (ctx, request) => {
  const { searchParams } = new URL(request.url);
  const deviceCode = searchParams.get("device_code")?.trim().toUpperCase();

  if (!deviceCode) {
    return new Response(JSON.stringify({ error: "device_code is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const status = await ctx.runQuery(internal.crystal.deviceAuth.getSessionStatus, { deviceCode });
  if (status.status === "expired") {
    await ctx.runMutation(internal.crystal.deviceAuth.markExpired, { deviceCode });
    return new Response(JSON.stringify({ status: "expired" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      status: status.status,
      ...(status.status === "complete" && status.apiKey ? { apiKey: status.apiKey } : {}),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
});
