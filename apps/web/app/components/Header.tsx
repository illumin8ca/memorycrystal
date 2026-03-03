"use client";

import { useState } from "react";
import Link from "next/link";
import CrystalIcon from "./CrystalIcon";

const navItems = [
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/changelog", label: "Changelog" },
  { href: "/roadmap", label: "Roadmap" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d1820]">
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
          <Link href="/login" className="px-4 py-2 text-xs font-mono border border-white/20 hover:border-accent transition">
            Sign in
          </Link>
          <Link href="/signup" className="px-4 py-2 text-xs font-mono bg-accent text-white hover:brightness-110 transition whitespace-nowrap">
            GET STARTED
          </Link>
        </div>

        {/* Hamburger button — mobile only */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex items-center justify-center w-10 h-10"
        >
          {open ? (
            /* X icon */
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="3" y1="3" x2="19" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="19" y1="3" x2="3" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            /* Staggered hamburger — 3 different width lines */
            <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="1" x2="24" y2="1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="0" y1="9" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="0" y1="17" x2="20" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 top-16 z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          {/* Panel — solid background, no transparency */}
          <div className="absolute right-0 top-0 h-full w-72 flex flex-col" style={{ backgroundColor: "#0d1820", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>

            {/* Nav links */}
            <nav className="flex flex-col px-4 pt-6 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors"
                >
                  <span className="text-[#2180d6] text-xs">◈</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* CTA buttons */}
            <div className="mt-auto px-4 py-8 flex flex-col gap-3">
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="w-full py-3 text-center text-xs font-mono font-bold text-white tracking-widest"
                style={{ backgroundColor: "#2180d6" }}
              >
                GET STARTED FREE
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="w-full py-3 text-center text-xs font-mono text-white/70 hover:text-white tracking-widest"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                SIGN IN
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
