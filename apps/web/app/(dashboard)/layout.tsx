"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import CrystalIcon from "../components/CrystalIcon";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: "▦" },
  { label: "Memories", href: "/memories", icon: "◈" },
  { label: "Messages", href: "/messages", icon: "◻" },
  { label: "Checkpoints", href: "/checkpoints", icon: "◎" },
  { label: "Settings", href: "/settings", icon: "⚙" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const currentUser = useQuery(api.crystal.userProfiles.getCurrentUser, {});
  const { signOut } = useAuthActions();
  const currentEmail = currentUser?.email ?? "Loading...";

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-void">
      <div className="lg:hidden sticky top-0 z-40 h-14 border-b border-border bg-surface/95 backdrop-blur-sm px-4 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono font-bold tracking-widest neon-text text-sm">
          <CrystalIcon size={16} glow />
          CRYSTAL
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="h-11 w-11 inline-flex items-center justify-center border border-border/40 text-primary"
        >
          ☰
        </button>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <aside className="relative h-full w-[82%] max-w-xs bg-surface border-r border-border flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono font-bold tracking-widest neon-text text-sm">
                <CrystalIcon size={16} glow />
                CRYSTAL
              </span>
              <button type="button" onClick={() => setMobileOpen(false)} className="h-10 w-10 text-lg">✕</button>
            </div>
            <nav className="flex-1 py-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                    isActive(item.href)
                      ? "bg-elevated text-primary border-l-2 border-accent"
                      : "text-secondary hover:bg-elevated hover:text-primary"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="px-5 py-4 border-t border-border">
              <p className="text-secondary text-xs truncate">{currentEmail}</p>
              <button type="button" onClick={handleSignOut} className="text-accent text-xs mt-2 hover:underline min-h-11">
                Sign out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen">
        <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-56 bg-surface border-r border-border flex-col z-40">
          <div className="px-6 py-5 border-b border-border">
            <span className="flex items-center gap-2 font-mono font-bold tracking-widest neon-text text-base">
              <CrystalIcon size={18} glow />
              CRYSTAL
            </span>
          </div>
          <nav className="flex-1 py-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-elevated text-primary border-l-2 border-accent"
                    : "text-secondary hover:bg-elevated hover:text-primary"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-6 py-4 border-t border-border">
            <p className="text-secondary text-xs truncate">{currentEmail}</p>
            <button type="button" onClick={handleSignOut} className="text-accent text-xs mt-1 hover:underline min-h-11">
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:ml-56 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden">{children}</main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm">
        <ul className="grid grid-cols-5">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`min-h-14 px-1 py-1 flex flex-col items-center justify-center text-[10px] font-mono ${
                  isActive(item.href) ? "text-accent" : "text-secondary"
                }`}
              >
                <span className="text-sm leading-none mb-1">{item.icon}</span>
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
