import Link from "next/link";
import CrystalIcon from "./CrystalIcon";

export default function Footer() {
  return (
    <footer className="border-t border-border/25 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-5">
          <Link href="/" className="flex items-center gap-2 font-logo text-base sm:text-lg tracking-wide neon-text">
            <CrystalIcon size={20} glow />
            MEMORY CRYSTAL
          </Link>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-start sm:items-center gap-x-5 gap-y-2 text-xs font-mono text-secondary w-full md:w-auto">
            <Link href="/docs">Docs</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/whats-new">What&apos;s New</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer">
              Discord
            </a>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-secondary text-xs">
          <span>&copy; {new Date().getFullYear()} Memory Crystal</span>
          <span className="hidden sm:inline">·</span>
          <Link href="/privacy" className="hover:text-accent">Privacy</Link>
          <Link href="/terms" className="hover:text-accent">Terms</Link>
          <Link href="/cookies" className="hover:text-accent">Cookies</Link>
          <Link href="/acceptable-use" className="hover:text-accent">Acceptable Use</Link>
        </div>
      </div>
    </footer>
  );
}
