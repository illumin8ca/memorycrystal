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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/25 bg-[#131E26]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 font-logo text-sm sm:text-lg tracking-wide neon-text">
          <CrystalIcon size={22} glow />
          <span className="truncate">MEMORY CRYSTAL</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-secondary">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-accent transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="min-h-11 px-4 py-2 inline-flex items-center text-xs font-mono border border-border/35 hover:border-accent hover:shadow-[0_0_10px_rgba(33,128,214,0.3)] transition"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="min-h-11 px-4 py-2 inline-flex items-center text-xs font-mono bg-accent text-white shadow-[0_0_20px_rgba(33,128,214,0.45)] hover:brightness-110 transition"
          >
            GET STARTED
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          className="md:hidden h-11 w-11 inline-flex items-center justify-center border border-border/40 bg-surface/60 text-primary hover:border-accent transition"
        >
          <span className="text-lg leading-none">{mobileOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out border-t border-border/25 ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-3 flex flex-col gap-2 bg-surface/70 backdrop-blur-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="min-h-11 px-3 py-2 flex items-center text-sm text-secondary hover:text-accent border border-border/30 hover:border-accent/50 transition"
            >
              {item.label}
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="min-h-11 px-3 py-2 inline-flex items-center justify-center text-xs font-mono border border-border/35 hover:border-accent transition"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="min-h-11 px-3 py-2 inline-flex items-center justify-center text-xs font-mono bg-accent text-white shadow-[0_0_20px_rgba(33,128,214,0.45)]"
            >
              GET STARTED
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
