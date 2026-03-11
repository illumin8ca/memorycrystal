"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useSearchParams } from "next/navigation";

type Intent = "general" | "enterprise" | "billing" | "refund";

const intentOptions: { value: Intent; label: string; description: string }[] = [
  { value: "general", label: "General contact", description: "Questions, feedback, or anything else." },
  { value: "enterprise", label: "Enterprise / higher usage", description: "Custom limits, team rollout, or volume pricing." },
  { value: "billing", label: "Billing support", description: "Invoices, failed charges, account access, or plan issues." },
  { value: "refund", label: "Refund request", description: "Request a refund with account and payment context." },
];

export default function ContactPage() {
  const searchParams = useSearchParams();
  const currentUser = useQuery(api.crystal.userProfiles.getCurrentUser, {});
  const profile = useQuery(api.crystal.userProfiles.getByUser, currentUser?.userId ? {} : "skip");

  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const initialIntent = (searchParams.get("intent") || "general") as Intent;
  const [intent, setIntent] = useState<Intent>(intentOptions.some((o) => o.value === initialIntent) ? initialIntent : "general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const plan = useMemo(() => profile?.plan ?? profile?.subscriptionStatus ?? "", [profile]);

  useEffect(() => {
    if (!currentUser) return;
    setName((prev) => prev || currentUser.name || "");
    setEmail((prev) => prev || currentUser.email || "");
  }, [currentUser]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          intent,
          subject,
          message,
          userId: currentUser?.userId ?? undefined,
          plan: plan || undefined,
          polarCustomerId: profile?.polarCustomerId,
          polarSubscriptionId: profile?.polarSubscriptionId,
          source: currentUser?.userId ? "dashboard" : "public-site",
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Could not submit your message.");
      }

      setResult({ ok: true, text: "Message sent. We’ll get back to you at your email." });
      setSubject("");
      setMessage("");
    } catch (err) {
      setResult({ ok: false, text: (err as Error).message || "Could not submit your message." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <h1 className="text-3xl font-heading text-primary mb-2">Contact Memory Crystal</h1>
      <p className="text-secondary mb-8">Pick the reason, share details, and we’ll route it to the right queue.</p>

      <form onSubmit={onSubmit} className="space-y-5 border border-white/[0.07] bg-surface p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-secondary text-xs tracking-widest uppercase">Name</span>
            <input
              className="mt-2 w-full border border-white/[0.12] bg-elevated px-3 py-2 text-primary outline-none focus:border-accent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </label>

          <label className="block">
            <span className="text-secondary text-xs tracking-widest uppercase">Email</span>
            <input
              type="email"
              className="mt-2 w-full border border-white/[0.12] bg-elevated px-3 py-2 text-primary outline-none focus:border-accent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={190}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-secondary text-xs tracking-widest uppercase">What do you need?</span>
          <select
            className="mt-2 w-full border border-white/[0.12] bg-elevated px-3 py-2 text-primary outline-none focus:border-accent"
            value={intent}
            onChange={(e) => setIntent(e.target.value as Intent)}
          >
            {intentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-secondary text-xs">
            {intentOptions.find((i) => i.value === intent)?.description}
          </p>
        </label>

        <label className="block">
          <span className="text-secondary text-xs tracking-widest uppercase">Subject (optional)</span>
          <input
            className="mt-2 w-full border border-white/[0.12] bg-elevated px-3 py-2 text-primary outline-none focus:border-accent"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={180}
          />
        </label>

        <label className="block">
          <span className="text-secondary text-xs tracking-widest uppercase">Message</span>
          <textarea
            className="mt-2 min-h-40 w-full border border-white/[0.12] bg-elevated px-3 py-2 text-primary outline-none focus:border-accent"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            maxLength={5000}
          />
        </label>

        {result ? (
          <p className={result.ok ? "text-green-400 text-sm" : "text-red-400 text-sm"}>{result.text}</p>
        ) : null}

        <button type="submit" className="btn-primary px-5 py-2 text-sm" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send message"}
        </button>
      </form>
    </main>
  );
}
