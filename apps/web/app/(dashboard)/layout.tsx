"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthActions } from "@convex-dev/auth/react";
import CrystalIcon from "../components/CrystalIcon";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: "⊞" },
  { label: "Memories", href: "/memories", icon: "◈" },
  { label: "Messages", href: "/messages", icon: "✉" },
  { label: "Checkpoints", href: "/checkpoints", icon: "◎" },
  { label: "Settings", href: "/settings", icon: "⚙" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const currentUser = useQuery(api.crystal.userProfiles.getCurrentUser, {});
  const subscribed = useQuery(api.crystal.userProfiles.isSubscribed);
  const { signOut } = useAuthActions();
  const currentEmail = currentUser?.email ?? "";

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0d1820" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 h-14 px-4 flex items-center justify-between" style={{ backgroundColor: "#0d1820", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/dashboard" className="flex items-center gap-2 font-logo tracking-wide neon-text whitespace-nowrap">
          <CrystalIcon size={22} glow />
          <span className="text-sm font-bold">MEMORY CRYSTAL</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="h-10 w-10 flex items-center justify-center"
        >
          <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
            <line x1="0" y1="1" x2="24" y2="1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="0" y1="9" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="0" y1="17" x2="20" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
              className="absolute right-0 top-0 h-full w-72 flex flex-col"
              style={{ backgroundColor: "#0d1820", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Drawer header with X */}
              <div className="h-14 px-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-xs font-mono text-white/40 tracking-widest uppercase">Navigation</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="h-10 w-10 flex items-center justify-center"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <line x1="2" y1="2" x2="16" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="16" y1="2" x2="2" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Nav links — staggered */}
              <nav className="flex-1 flex flex-col px-4 py-4 gap-1">
                {nav.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.05, duration: 0.22 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm rounded transition-colors"
                      style={{
                        color: isActive(item.href) ? "#2180d6" : "rgba(255,255,255,0.65)",
                        backgroundColor: isActive(item.href) ? "rgba(33,128,214,0.1)" : "transparent",
                        borderLeft: isActive(item.href) ? "2px solid #2180d6" : "2px solid transparent",
                      }}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* User + sign out */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.22 }}
                className="px-5 py-6"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                {currentEmail && <p className="text-xs text-white/40 truncate mb-3">{currentEmail}</p>}
                <button
                  type="button"
                  onClick={async () => { setMobileOpen(false); await signOut(); }}
                  className="btn-secondary w-full py-3 text-center text-xs tracking-widest"
                  
                >
                  SIGN OUT
                </button>
              </motion.div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-56 flex-col z-40" style={{ backgroundColor: "#0d1820", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <Link href="/dashboard" className="flex items-center gap-2 font-logo tracking-wide neon-text whitespace-nowrap">
              <CrystalIcon size={20} glow />
              <span className="text-sm">MEMORY CRYSTAL</span>
            </Link>
          </div>
          <nav className="flex-1 py-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-6 py-3 text-sm transition-colors"
                style={{
                  color: isActive(item.href) ? "#2180d6" : "rgba(255,255,255,0.55)",
                  backgroundColor: isActive(item.href) ? "rgba(33,128,214,0.08)" : "transparent",
                  borderLeft: isActive(item.href) ? "2px solid #2180d6" : "2px solid transparent",
                }}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            {currentEmail && <p className="text-xs text-white/40 truncate">{currentEmail}</p>}
            <button type="button" onClick={() => signOut()} className="text-xs mt-2 hover:underline" style={{ color: "#2180d6" }}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:ml-56 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden">{children}</main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40" style={{ backgroundColor: "#0d1820", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <ul className="grid grid-cols-5">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="min-h-14 px-1 py-2 flex flex-col items-center justify-center text-[10px] font-mono gap-1 transition-colors"
                style={{ color: isActive(item.href) ? "#2180d6" : "rgba(255,255,255,0.45)" }}
              >
                <span className="text-sm leading-none">{item.icon}</span>
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {subscribed !== undefined && subscribed === false && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(13,24,32,0.97)", backdropFilter: "blur(12px)" }}
        >
          <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
            <CrystalIcon size={48} glow />
            <div>
              <h2 className="text-xl font-mono font-bold text-white mb-2">Subscription Required</h2>
              <p className="text-sm text-white/60">
                Memory Crystal requires an active subscription to access your vault.
              </p>
            </div>
            <a
              href="/api/polar/checkout"
              className="btn-primary px-8 py-3 text-sm font-mono font-bold tracking-widest"
            >
              SUBSCRIBE NOW
            </a>
            <p className="text-xs text-white/30">
              Already subscribed?{" "}
              <a href="/dashboard" className="text-accent hover:underline">
                Refresh
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
