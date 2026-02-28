"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingMode, setLoadingMode] = useState<"idle" | "password" | "github">("idle");

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
      await signIn("github", { redirectTo: "/dashboard" });
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message ?? "GitHub sign in failed");
      setLoadingMode("idle");
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-[#2a2a2a] bg-[#141414] p-10">
        <p className="font-mono font-bold tracking-widest text-[#0066ff] text-lg mb-8">VEXCLAW</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[#888] text-xs tracking-widest uppercase mb-2">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-[#f0f0f0] p-3 text-sm outline-none focus:border-[#0066ff] placeholder:text-[#888]"
              style={{ borderRadius: 0 }}
            />
          </div>
          <div>
            <label className="block text-[#888] text-xs tracking-widest uppercase mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-[#f0f0f0] p-3 text-sm outline-none focus:border-[#0066ff] placeholder:text-[#888]"
              style={{ borderRadius: 0 }}
            />
          </div>
          {error ? <p className="text-red-400 text-sm">{error}</p> : null}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0066ff] hover:bg-[#0044cc] text-white p-3 font-semibold text-sm transition-colors disabled:opacity-60"
            style={{ borderRadius: 0 }}
          >
            {loadingMode === "password" ? "Loading..." : "SIGN IN"}
          </button>
        </form>
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#2a2a2a]" />
          <span className="text-[#888] text-xs">or</span>
          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>
        <button
          type="button"
          onClick={handleGitHubSignIn}
          disabled={isLoading}
          className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-[#f0f0f0] p-3 text-sm hover:bg-[#2a2a2a] transition-colors disabled:opacity-60"
          style={{ borderRadius: 0 }}
        >
          {loadingMode === "github" ? "Loading..." : "Continue with GitHub"}
        </button>
        <p className="text-center mt-6 text-sm">
          <a href="/signup" className="text-[#0066ff] hover:underline">
            No account? Get started →
          </a>
        </p>
      </div>
    </div>
  );
}
