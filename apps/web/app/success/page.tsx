"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CrystalIcon from "../components/CrystalIcon";
import Header from "../components/Header";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push("/dashboard"), 4000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-6 max-w-md">
          <CrystalIcon size={56} glow />
          <h1 className="text-2xl font-mono font-bold text-white">Welcome to Memory Crystal</h1>
          <p className="text-white/60 text-sm">
            Your subscription is active. Redirecting to your vault in a moment...
          </p>
          <a href="/dashboard" className="btn-primary px-8 py-3 text-sm font-mono tracking-widest">
            OPEN VAULT →
          </a>
        </div>
      </main>
    </>
  );
}
