"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import CrystalIcon from "../components/CrystalIcon";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { api } from "../../../../convex/_generated/api";

export default function DeviceAuthorizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const authorizeSession = useMutation(api.crystal.deviceAuth.authorizeSession);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userCode = useMemo(() => searchParams.get("user_code")?.trim().toUpperCase() ?? "", [searchParams]);
  const session = useQuery(
    api.crystal.deviceAuth.getSessionByUserCode,
    userCode ? { userCode } : "skip",
  );

  useEffect(() => {
    if (!userCode || isLoading || isAuthenticated) return;
    const redirectTo = `/device?user_code=${encodeURIComponent(userCode)}`;
    router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }, [isAuthenticated, isLoading, router, userCode]);

  const handleAuthorize = async () => {
    if (!userCode) return;
    setError("");
    setSubmitting(true);
    try {
      await authorizeSession({ userCode });
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message || "Failed to authorize device.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="auth-glass-card w-full max-w-xl p-6 sm:p-10">
          <div className="flex items-center justify-center gap-2 mb-8">
            <CrystalIcon size={28} glow />
            <span className="font-logo text-lg tracking-wide neon-text">MEMORY CRYSTAL</span>
          </div>

          <p className="text-accent text-xs tracking-[0.24em] uppercase text-center mb-3">Device Authorization</p>
          <h1 className="text-primary text-2xl sm:text-3xl font-semibold text-center">Connect this OpenClaw install</h1>
          <p className="text-secondary text-sm text-center mt-3">
            Approve the installer running in your terminal and we&apos;ll mint a one-time API key for it.
          </p>

          <div className="mt-8 border border-white/10 bg-white/[0.03] p-5 text-center">
            <p className="text-secondary text-xs uppercase tracking-[0.22em] mb-2">Verification code</p>
            <div className="font-mono text-3xl sm:text-4xl tracking-[0.24em] text-primary">
              {userCode || "---- --"}
            </div>
          </div>

          {!userCode ? (
            <p className="mt-6 text-red-400 text-sm text-center">Missing user_code. Re-run the installer and open the new link.</p>
          ) : null}

          {session === null && userCode ? (
            <p className="mt-6 text-red-400 text-sm text-center">This device session could not be found.</p>
          ) : null}

          {session?.status === "expired" ? (
            <p className="mt-6 text-red-400 text-sm text-center">This device session expired. Re-run the installer to generate a fresh code.</p>
          ) : null}

          {session?.status === "complete" || success ? (
            <div className="mt-6 border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <p className="text-emerald-300 font-medium">Authorized.</p>
              <p className="text-secondary text-sm mt-2">You can head back to your terminal — the installer should finish automatically in a few seconds.</p>
            </div>
          ) : null}

          {error ? <p className="mt-6 text-red-400 text-sm text-center">{error}</p> : null}

          {userCode && session && session.status === "pending" && !success ? (
            <button
              type="button"
              onClick={handleAuthorize}
              disabled={submitting || isLoading || !isAuthenticated}
              className="btn-primary w-full mt-6 p-3 min-h-11 text-sm disabled:opacity-60"
              style={{ borderRadius: 0 }}
            >
              {submitting ? "Authorizing..." : "AUTHORIZE THIS DEVICE"}
            </button>
          ) : null}

          {!isLoading && !isAuthenticated && userCode ? (
            <p className="mt-4 text-secondary text-sm text-center">Redirecting to login…</p>
          ) : null}

          <div className="mt-8 text-center text-sm text-secondary">
            Need a manual install instead? <Link className="text-accent hover:text-white" href="/dashboard/settings">Create an API key in Settings</Link>.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
