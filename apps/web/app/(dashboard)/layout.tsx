"use client";

import Link from "next/link";
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
  const currentUser = useQuery(api.crystal.userProfiles.getCurrentUser, {});
  const { signOut } = useAuthActions();
  const currentEmail = currentUser?.email ?? "Loading...";

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex min-h-screen bg-void">
      <aside className="fixed top-0 left-0 h-screen w-56 bg-surface border-r border-border flex flex-col z-40">
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
              className="flex items-center gap-3 px-6 py-3 text-secondary hover:bg-elevated hover:text-primary text-sm transition-colors"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-border">
          <p className="text-secondary text-xs truncate">{currentEmail}</p>
          <button type="button" onClick={handleSignOut} className="text-accent text-xs mt-1 hover:underline">
            Sign out
          </button>
        </div>
      </aside>
      <main className="ml-56 flex-1 p-8">{children}</main>
    </div>
  );
}
