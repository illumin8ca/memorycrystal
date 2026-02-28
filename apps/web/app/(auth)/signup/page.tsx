"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

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
              disabled={loading}
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
              disabled={loading}
              className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-[#f0f0f0] p-3 text-sm outline-none focus:border-[#0066ff] placeholder:text-[#888]"
              style={{ borderRadius: 0 }}
            />
          </div>
          <div>
            <label className="block text-[#888] text-xs tracking-widest uppercase mb-2">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={loading}
              className="w-full bg-[#1e1e1e] border border-[#2a2a2a] text-[#f0f0f0] p-3 text-sm outline-none focus:border-[#0066ff] placeholder:text-[#888]"
              style={{ borderRadius: 0 }}
            />
          </div>
          {error ? <p className="text-red-400 text-sm">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0066ff] hover:bg-[#0044cc] text-white p-3 font-semibold text-sm transition-colors disabled:opacity-60"
            style={{ borderRadius: 0 }}
          >
            {loading ? "Loading..." : "CREATE ACCOUNT"}
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          <a href="/login" className="text-[#0066ff] hover:underline">
            Already have an account? Sign in →
          </a>
        </p>
        <p className="text-center mt-3 text-xs text-[#888]">After signup you&apos;ll be redirected to complete your subscription.</p>
      </div>
    </div>
  );
}
