import Link from "next/link";
import CrystalIcon from "./CrystalIcon";

const navItems = [
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/changelog", label: "Changelog" },
  { href: "/roadmap", label: "Roadmap" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/25 bg-[#131E26]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-logo text-lg tracking-wide neon-text">
          <CrystalIcon size={22} glow />
          MEMORY CRYSTAL
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-secondary">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-accent transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-mono border border-border/35 hover:border-accent hover:shadow-[0_0_10px_rgba(33,128,214,0.3)] transition"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-xs font-mono bg-accent text-white shadow-[0_0_20px_rgba(33,128,214,0.45)] hover:brightness-110 transition"
          >
            GET STARTED
          </Link>
        </div>
      </div>
    </header>
  );
}
