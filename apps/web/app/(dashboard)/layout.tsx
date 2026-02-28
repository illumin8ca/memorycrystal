"use client";

import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
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
  const currentUser = useQuery(api.vexclaw.userProfiles.getCurrentUser, {});
  const { signOut } = useAuthActions();
  const currentEmail = currentUser?.email ?? "Loading...";

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex min-h-screen bg-[#090909]">
      <aside className="fixed top-0 left-0 h-screen w-56 bg-[#141414] border-r border-[#2a2a2a] flex flex-col z-40">
        <div className="px-6 py-5 border-b border-[#2a2a2a]">
          <span className="font-mono font-bold tracking-widest text-[#0066ff] text-base">VEXCLAW</span>
        </div>
        <nav className="flex-1 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-6 py-3 text-[#888] hover:bg-[#1e1e1e] hover:text-[#f0f0f0] text-sm transition-colors"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-[#2a2a2a]">
          <p className="text-[#888] text-xs truncate">{currentEmail}</p>
          <button type="button" onClick={handleSignOut} className="text-[#0066ff] text-xs mt-1 hover:underline">
            Sign out
          </button>
        </div>
      </aside>
      <main className="ml-56 flex-1 p-8">{children}</main>
    </div>
  );
}
