"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import CrystalIcon from "../../components/CrystalIcon";

export default function SignupPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signIn("password", {
        email: email.trim(),
        password,
        flow: "signUp",
        redirectTo: "/dashboard",
      });
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message ?? "Sign up failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-border bg-surface p-10">
        <p className="flex items-center gap-2 font-mono font-bold tracking-widest neon-text text-lg mb-8"><CrystalIcon size={22} glow />CRYSTAL</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-secondary text-xs tracking-widest uppercase mb-2">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
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
              disabled={loading}
              className="w-full bg-elevated border border-border text-primary p-3 text-sm outline-none focus:border-accent placeholder:text-secondary"
              style={{ borderRadius: 0 }}
            />
          </div>
          <div>
            <label className="block text-secondary text-xs tracking-widest uppercase mb-2">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={loading}
              className="w-full bg-elevated border border-border text-primary p-3 text-sm outline-none focus:border-accent placeholder:text-secondary"
              style={{ borderRadius: 0 }}
            />
          </div>
          {error ? <p className="text-red-400 text-sm">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dim text-white p-3 font-semibold text-sm transition-colors disabled:opacity-60"
            style={{ borderRadius: 0 }}
          >
            {loading ? "Loading..." : "CREATE ACCOUNT"}
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          <a href="/login" className="text-accent hover:underline">
            Already have an account? Sign in →
          </a>
        </p>
        <p className="text-center mt-3 text-xs text-secondary">After signup you&apos;ll be redirected to complete your subscription.</p>
      </div>
    </div>
  );
}
