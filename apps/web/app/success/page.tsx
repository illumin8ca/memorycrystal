"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import CrystalIcon from "../components/CrystalIcon";
import Header from "../components/Header";

export default function SuccessPage() {
  const router = useRouter();
  const subscribed = useQuery(api.crystal.userProfiles.isSubscribed);
  const [dots, setDots] = useState(".");

  // Animate the waiting dots
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 600);
    return () => clearInterval(t);
  }, []);

  // Redirect once subscription is confirmed, or after 10s fallback
  useEffect(() => {
    if (subscribed === true) {
      router.push("/dashboard");
      return;
    }
    // Fallback: redirect after 10s even if webhook hasn't fired yet
    const t = setTimeout(() => router.push("/dashboard"), 10_000);
    return () => clearTimeout(t);
  }, [subscribed, router]);

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-6 max-w-md">
          <CrystalIcon size={56} glow />
          <h1 className="text-2xl font-mono font-bold text-white">Welcome to Memory Crystal</h1>
          {subscribed === true ? (
            <p className="text-white/60 text-sm">Subscription confirmed. Opening your vault…</p>
          ) : (
            <p className="text-white/60 text-sm">Confirming your subscription{dots}</p>
          )}
          <a href="/dashboard" className="btn-primary px-8 py-3 text-sm font-mono tracking-widest">
            OPEN VAULT →
          </a>
        </div>
      </main>
    </>
  );
}
