import Link from "next/link";
import CrystalIcon from "./CrystalIcon";

export default function Footer() {
  return (
    <footer className="border-t border-border/25 py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-heading text-lg tracking-wide neon-text">
            <CrystalIcon size={20} glow />
            MEMORY CRYSTAL
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-secondary">
            <Link href="/docs">Docs</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/changelog">Changelog</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer">
              Discord
            </a>
          </div>
        </div>
        <div className="mt-6 text-secondary text-xs">
          <span>&copy; {new Date().getFullYear()} Memory Crystal</span>
        </div>
      </div>
    </footer>
  );
}
