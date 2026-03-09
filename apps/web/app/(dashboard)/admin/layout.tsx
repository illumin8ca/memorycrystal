import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ConvexHttpClient } from "convex/browser";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "../../../../../convex/_generated/api";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const token = await convexAuthNextjsToken();

  if (!convexUrl || !token) {
    redirect("/dashboard");
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    client.setAuth(token);
    await client.query(api.crystal.admin.getViewerAccess, {});
  } catch {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
