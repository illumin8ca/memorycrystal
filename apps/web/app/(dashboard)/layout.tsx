"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { ActivitySquare, BookOpen, Brain, Flag, KeyRound, LayoutDashboard, MessageSquare, PlayCircle, BarChart2, CreditCard, Shield, type LucideIcon } from "lucide-react";
import CrystalIcon from "../components/CrystalIcon";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ImpersonationProvider, useImpersonation } from "./ImpersonationContext";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const baseNav: NavItem[] = [
  { label: "Get Started", href: "/get-started", icon: PlayCircle },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Eval", href: "/eval", icon: ActivitySquare },
  { label: "Docs", href: "/dashboard/docs", icon: BookOpen },
  { label: "API Keys", href: "/api-keys", icon: KeyRound },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Memories", href: "/memories", icon: Brain },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Checkpoints", href: "/checkpoints", icon: Flag },
  { label: "Usage", href: "/usage", icon: BarChart2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ImpersonationProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ImpersonationProvider>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [impersonationError, setImpersonationError] = useState("");
  const pathname = usePathname();
  const currentUser = useQuery(api.crystal.userProfiles.getCurrentUser, {});
  const currentProfile = useQuery(api.crystal.userProfiles.getByUser, {});
  const ensureProfile = useMutation(api.crystal.userProfiles.createOrGet);
  const router = useRouter();
  const { signOut } = useAuthActions();
  const currentEmail = currentUser?.email ?? "";
  const currentName = currentUser?.name ?? "";
  const { canImpersonate, activeSession, startImpersonation, stopImpersonation } = useImpersonation();
  const handleSignOut = async () => {
    await signOut();
    // Use full navigation instead of client-side router.push —
    // iOS PWA doesn't reliably handle Next.js router after auth state clears.
    window.location.href = "/";
  };

  useEffect(() => {
    if (!currentUser?.userId) return;
    void ensureProfile({}).catch(() => {
      // Non-fatal: tier checks safely default to free.
    });
  }, [currentUser?.userId, ensureProfile]);

  // During sign-out, auth state clears before navigation completes.
  // Return a minimal loading shell to prevent Convex query errors.
  // Redirect to home after 2s as a safety net (iOS PWA can get stuck).
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const timeout = setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="animate-pulse">
          <CrystalIcon size={32} glow />
        </div>
      </div>
    );
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);
  const roles = currentProfile?.roles ?? ["subscriber"];
  const canAccessAdmin = roles.includes("manager") || roles.includes("admin");
  const nav = canAccessAdmin
    ? [...baseNav, { label: "Admin", href: "/admin/users", icon: Shield }]
    : baseNav;

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
      <AnimatePresence mode="wait">
        {mobileOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-50"
          >
            {/* Backdrop */}
            <div
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
                {nav.map((item, i) => {
                  const Icon = item.icon;
                  return (
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
                        <Icon className="h-[1.05rem] w-[1.05rem]" />
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* User + sign out */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.22 }}
                className="px-5 py-6"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                {currentName && <p className="text-sm text-white/70 truncate">{currentName}</p>}
                {currentEmail && <p className="text-xs text-white/40 truncate mb-3">{currentEmail}</p>}
                <button
                  type="button"
                  onClick={async () => { setMobileOpen(false); await handleSignOut(); }}
                  className="btn-secondary w-full py-3 text-center text-xs tracking-widest"
                >
                  SIGN OUT
                </button>
              </motion.div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {(activeSession || canImpersonate) && (
        <div className="px-4 sm:px-6 lg:ml-56 lg:px-8 py-3 border-y border-amber-400/40 bg-amber-500/10">
          {activeSession ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-amber-100">
              <p className="text-xs font-mono tracking-wide">SUPPORT MODE: impersonating <span className="font-bold">{activeSession.targetUserId}</span></p>
              <button className="btn-secondary px-3 py-1 text-xs" onClick={() => void stopImpersonation()}>Stop impersonation</button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Target userId"
                className="bg-elevated border border-white/20 text-primary px-3 py-2 text-xs font-mono"
              />
              <button
                className="btn-secondary px-3 py-2 text-xs"
                onClick={async () => {
                  try {
                    setImpersonationError("");
                    await startImpersonation(targetUserId.trim());
                    setTargetUserId("");
                  } catch (err) {
                    setImpersonationError((err as Error).message ?? "Failed to start impersonation");
                  }
                }}
              >
                Start support impersonation
              </button>
              {impersonationError ? <span className="text-red-300 text-xs">{impersonationError}</span> : null}
            </div>
          )}
        </div>
      )}

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
            {nav.map((item) => {
              const Icon = item.icon;
              return (
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
                  <Icon className="h-[1.05rem] w-[1.05rem]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            {currentName && <p className="text-sm text-white/70 truncate">{currentName}</p>}
            {currentEmail && <p className="text-xs text-white/40 truncate">{currentEmail}</p>}
            <button type="button" onClick={handleSignOut} className="text-xs mt-2 hover:underline" style={{ color: "#2180d6" }}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:ml-56 lg:p-8 pb-8 overflow-x-hidden">{children}</main>
      </div>


    </div>
  );
}