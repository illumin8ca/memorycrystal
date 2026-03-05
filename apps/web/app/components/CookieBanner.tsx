"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("mc-cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("mc-cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("mc-cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] border-t border-border bg-[#131E26] p-4 md:p-5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <p className="text-sm text-secondary">
          Memory Crystal uses essential cookies for authentication and preferences. We do not use tracking cookies or share data with third parties.{" "}
          <Link href="/cookies" className="text-accent hover:underline">
            Cookie Policy
          </Link>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={decline}
            className="px-4 py-2 text-xs font-mono border border-border text-secondary hover:text-primary hover:border-accent transition"
          >
            DECLINE
          </button>
          <button
            type="button"
            onClick={accept}
            className="px-4 py-2 text-xs font-mono bg-accent text-white hover:brightness-110 transition"
          >
            ACCEPT
          </button>
        </div>
      </div>
    </div>
  );
}
