"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import CrystalIcon from "../../components/CrystalIcon";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingMode, setLoadingMode] = useState<"idle" | "password" | "github" | "google">("idle");

  const isLoading = loadingMode !== "idle";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoadingMode("password");
    try {
      await signIn("password", {
        email: email.trim(),
        password,
        flow: "signIn",
        redirectTo: "/dashboard",
      });
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message ?? "Sign in failed");
      setLoadingMode("idle");
    }
  };

  const handleGitHubSignIn = async () => {
    setError("");
    setLoadingMode("github");
    try {
      const result = await signIn("github", { redirectTo: "/dashboard" });
      if (result.signingIn) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError((err as Error).message ?? "GitHub sign in failed");
      setLoadingMode("idle");
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoadingMode("google");
    try {
      const result = await signIn("google", { redirectTo: "/dashboard" });
      if (result.signingIn) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError((err as Error).message ?? "Google sign in failed");
      setLoadingMode("idle");
    }
  };

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm border border-border bg-surface p-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <CrystalIcon size={26} glow />
          <span className="font-logo text-lg tracking-wide neon-text">MEMORY CRYSTAL</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-secondary text-xs tracking-widest uppercase mb-2">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-elevated border border-border text-primary p-3 text-sm outline-none focus:border-accent placeholder:text-secondary"
              style={{ borderRadius: 0 }}
            />
          </div>
          <div>
            <label className="block text-secondary text-xs tracking-widest uppercase mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-elevated border border-border text-primary p-3 text-sm outline-none focus:border-accent placeholder:text-secondary"
              style={{ borderRadius: 0 }}
            />
          </div>
          {error ? <p className="text-red-400 text-sm">{error}</p> : null}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent-dim text-white p-3 font-semibold text-sm transition-colors disabled:opacity-60"
            style={{ borderRadius: 0 }}
          >
            {loadingMode === "password" ? "Loading..." : "SIGN IN"}
          </button>
        </form>
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-secondary text-xs">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-elevated border border-border text-primary p-3 text-sm hover:border-accent transition-colors disabled:opacity-60"
            style={{ borderRadius: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            {loadingMode === "github" ? "Loading..." : "Continue with GitHub"}
          </button>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-elevated border border-border text-primary p-3 text-sm hover:border-accent transition-colors disabled:opacity-60"
            style={{ borderRadius: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {loadingMode === "google" ? "Loading..." : "Continue with Google"}
          </button>
        </div>
        <p className="text-center mt-6 text-sm">
          <a href="/signup" className="text-accent hover:underline">
            No account? Get started &rarr;
          </a>
        </p>
      </div>
      </div>
      <Footer />
    </div>
  );
}
