"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import CrystalIcon from "../../components/CrystalIcon";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { api } from "../../../../../convex/_generated/api";

type Step = "credentials" | "verify";

function friendlySignupError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already exists") || m.includes("duplicate") || /already registered|email.*taken/i.test(m))
    return "An account with that email already exists. Sign in instead?";
  if (m.includes("weak") || m.includes("short") || m.includes("password"))
    return "Password must be at least 8 characters.";
  if (m.includes("invalid email") || m.includes("email"))
    return "Please enter a valid email address.";
  return "Sign up failed. Please try again.";
}

function friendlyVerifyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid") || m.includes("incorrect") || m.includes("wrong"))
    return "Incorrect code. Check your email and try again.";
  if (m.includes("expired"))
    return "That code has expired. Request a new one.";
  return "Verification failed. Please try again.";
}

function formatProviderName(provider: string): string {
  if (provider === "google") return "Google";
  if (provider === "github") return "GitHub";
  return provider;
}

function getOAuthFallbackError(providerLabel: string, message: string): string {
  const msg = message.toLowerCase();
  if (/already exists|already.*account|already registered|account exists|already linked|could not sign in/i.test(msg)) {
    return `Could not complete ${providerLabel} sign in. If you already have a password account, try signing in with your email and password first.`;
  }
  return `Could not complete ${providerLabel} sign in. If this continues, please try signing in with your email and password first.`;
}

export default function SignupPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [loadingMode, setLoadingMode] = useState<"idle" | "password" | "verify" | "resend" | "github" | "google">("idle");
  const [suggestedProvider, setSuggestedProvider] = useState<string | null>(null);

  const authMethods = useQuery(
    api.crystal.authLookup.getAuthMethodsForEmail,
    email.trim() ? { email: email.trim() } : "skip"
  );

  const isLoading = loadingMode !== "idle";

  const handleCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuggestedProvider(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoadingMode("password");
    try {
      await signIn("password", {
        email: email.trim(),
        password,
        flow: "signUp",
      });
      // After signUp with email verification, Convex sends the email and resolves.
      // Always transition to the verify step.
      setStep("verify");
    } catch (err) {
      const msg = (err as Error).message ?? "";
      console.error("[signup] signIn error:", msg);

      const oauthProviders = authMethods ? authMethods.providers.filter((p) => p !== "password") : [];
      const hasOAuthProvider = oauthProviders.length > 0;

      if (
        /already exists|already registered|already taken|already has an account|already.*account|duplicate/i.test(
          msg
        ) && hasOAuthProvider
      ) {
        const providerNames = oauthProviders.map((provider) => formatProviderName(provider));
        const providerList = providerNames.join(" and ");
        const message = `An account with that email already exists via ${providerList}. Please sign in with ${providerList}, or use 'Forgot password?' on the login page to set a password.`;
        setSuggestedProvider(providerNames[0] ?? null);
        setError(message);
      } else {
        setSuggestedProvider(null);
        setError(friendlySignupError(msg));
      }
    } finally {
      setLoadingMode("idle");
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoadingMode("verify");
    try {
      await signIn("password", {
        email: email.trim(),
        code: code.trim(),
        flow: "email-verification",
      });
      router.push("/dashboard");
    } catch (err) {
      setError(friendlyVerifyError((err as Error).message ?? ""));
    } finally {
      setLoadingMode("idle");
    }
  };

  const handleResend = async () => {
    setError("");
    setResendMsg("");
    setLoadingMode("resend");
    try {
      await signIn("password", {
        email: email.trim(),
        password,
        flow: "signUp",
      });
      setResendMsg("A new code has been sent to your email.");
    } catch {
      // silently ignore resend errors
    } finally {
      setLoadingMode("idle");
    }
  };

  const handleGitHubSignUp = async () => {
    setError("");
    setLoadingMode("github");
    try {
      const result = await signIn("github", { redirectTo: "/dashboard" });
      if (result.signingIn) {
        router.push("/dashboard");
      }
    } catch (err) {
      const msg = (err as Error).message ?? "";
      console.error("[signup] github signIn error:", msg);
      setError(getOAuthFallbackError("GitHub", msg));
      setLoadingMode("idle");
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setLoadingMode("google");
    try {
      const result = await signIn("google", { redirectTo: "/dashboard" });
      if (result.signingIn) {
        router.push("/dashboard");
      }
    } catch (err) {
      const msg = (err as Error).message ?? "";
      console.error("[signup] google signIn error:", msg);
      setError(getOAuthFallbackError("Google", msg));
      setLoadingMode("idle");
    }
  };

  // Step 2: Email verification code entry
  if (step === "verify") {
    return (
      <div className="min-h-screen bg-void flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="auth-glass-card w-full max-w-sm p-6 sm:p-10">
            <div className="flex items-center justify-center gap-2 mb-8">
              <CrystalIcon size={26} glow />
              <span className="font-logo text-lg tracking-wide neon-text">MEMORY CRYSTAL</span>
            </div>
            <h2 className="text-primary text-base font-semibold mb-2 text-center">Check your email</h2>
            <p className="text-secondary text-sm text-center mb-6">
              We sent a 6-digit code to <span className="text-primary">{email}</span>
            </p>
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-secondary text-xs tracking-widest uppercase mb-2">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-glass w-full text-primary p-3 text-sm outline-none placeholder:text-secondary text-center tracking-widest"
                  style={{ borderRadius: 0 }}
                />
              </div>
              {error ? <p className="text-red-400 text-sm">{error}</p> : null}
              {resendMsg ? <p className="text-green-400 text-sm">{resendMsg}</p> : null}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full p-3 min-h-11 text-sm disabled:opacity-60"
                style={{ borderRadius: 0 }}
              >
                {loadingMode === "verify" ? "Verifying..." : "VERIFY EMAIL"}
              </button>
            </form>
            <p className="text-center mt-6 text-sm text-secondary">
              Didn&apos;t receive it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-accent hover:underline disabled:opacity-60"
              >
                {loadingMode === "resend" ? "Sending..." : "Resend code"}
              </button>
            </p>
            <p className="text-center mt-3 text-xs text-secondary">
              <button
                type="button"
                onClick={() => { setStep("credentials"); setCode(""); setError(""); setResendMsg(""); }}
                className="text-secondary hover:underline"
              >
                &larr; Back
              </button>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Step 1: Credentials entry
  return (
    <div className="min-h-screen bg-void flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="auth-glass-card w-full max-w-sm p-6 sm:p-10">
          <div className="flex items-center justify-center gap-2 mb-8">
            <CrystalIcon size={26} glow />
            <span className="font-logo text-lg tracking-wide neon-text">MEMORY CRYSTAL</span>
          </div>
          <form onSubmit={handleCredentials} className="space-y-5">
            <div>
              <label className="block text-secondary text-xs tracking-widest uppercase mb-2">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSuggestedProvider(null);
                }}
                required
                disabled={isLoading}
                className="input-glass w-full text-primary p-3 text-sm outline-none placeholder:text-secondary"
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
                className="input-glass w-full text-primary p-3 text-sm outline-none placeholder:text-secondary"
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
                disabled={isLoading}
                className="input-glass w-full text-primary p-3 text-sm outline-none placeholder:text-secondary"
                style={{ borderRadius: 0 }}
              />
            </div>
            {error ? <p className="text-red-400 text-sm">{error}</p> : null}
            {suggestedProvider ? (
              <p className="text-sm text-secondary">
                Existing account is linked with {suggestedProvider}.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full p-3 min-h-11 text-sm disabled:opacity-60"
              style={{ borderRadius: 0 }}
            >
              {loadingMode === "password" ? "Loading..." : "CREATE ACCOUNT"}
            </button>
          </form>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-secondary text-xs">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGitHubSignUp}
              disabled={isLoading}
              className="btn-secondary w-full flex items-center justify-center gap-3 p-3 min-h-11 text-sm disabled:opacity-60"
              style={{ borderRadius: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              {loadingMode === "github" ? "Loading..." : "Continue with GitHub"}
            </button>
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="btn-secondary w-full flex items-center justify-center gap-3 p-3 min-h-11 text-sm disabled:opacity-60"
              style={{ borderRadius: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {loadingMode === "google" ? "Loading..." : "Continue with Google"}
            </button>
          </div>
          <p className="text-center mt-6 text-sm">
            <a href="/login" className="text-accent hover:underline">
              Already have an account? Sign in &rarr;
            </a>
          </p>
          <p className="text-center mt-3 text-xs text-secondary">After signup you&apos;ll be redirected to complete your subscription.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
