"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import CrystalIcon from "./CrystalIcon";

const navItems = [
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/releases", label: "Releases" },
  { href: "/roadmap", label: "Roadmap" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0d1820]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 font-logo tracking-wide neon-text whitespace-nowrap">
          <CrystalIcon size={30} glow />
          <span className="text-base sm:text-lg">MEMORY CRYSTAL</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-secondary">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-accent transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="btn-secondary px-4 py-2 text-xs font-mono">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary px-4 py-2 text-xs font-mono whitespace-nowrap">
            GET STARTED
          </Link>
        </div>

        {/* Hamburger — mobile only */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex items-center justify-center w-10 h-10"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.svg
                key="close"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.18 }}
                width="22" height="22" viewBox="0 0 22 22" fill="none"
              >
                <line x1="3" y1="3" x2="19" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="19" y1="3" x2="3" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </motion.svg>
            ) : (
              <motion.svg
                key="open"
                initial={{ rotate: 45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -45, opacity: 0 }}
                transition={{ duration: 0.18 }}
                width="24" height="18" viewBox="0 0 24 18" fill="none"
              >
                <line x1="0" y1="1" x2="24" y2="1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="0" y1="9" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="0" y1="17" x2="20" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </motion.svg>
            )}
          </AnimatePresence>
        </button>
      </div>

    </header>

    {mounted &&
      createPortal(
        <AnimatePresence>
          {open && (
            <div className="md:hidden fixed inset-0 top-16 z-[9999]">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/75"
                onClick={() => setOpen(false)}
              />
              {/* Drawer panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
                className="absolute right-0 top-0 h-full w-72 flex flex-col bg-[#0d1820]"
                style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", boxShadow: "-8px 0 32px rgba(0,0,0,0.8)" }}
              >
                  {/* Nav links — staggered in */}
                  <nav className="flex flex-col px-4 pt-6 gap-1">
                    {navItems.map((item, i) => (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.06 + i * 0.055, duration: 0.25 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors"
                        >
                          <span className="text-[#2180d6] text-xs">◈</span>
                          {item.label}
                        </Link>
                      </motion.div>
                    ))}
                  </nav>

                  {/* CTA buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, duration: 0.28 }}
                    className="mt-auto px-4 py-8 flex flex-col gap-3"
                  >
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="btn-primary w-full py-3 text-center text-xs font-mono font-bold tracking-widest"
                    >
                      GET STARTED FREE
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="btn-secondary w-full py-3 text-center text-xs font-mono tracking-widest"
                    >
                      SIGN IN
                    </Link>
                  </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
