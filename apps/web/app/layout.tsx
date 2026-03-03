import type { Metadata } from "next";
import { Oxanium, Audiowide, Inter } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "./ConvexClientProvider";
import CookieBanner from "./components/CookieBanner";
import "./globals.css";

const oxanium = Oxanium({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

const audiowide = Audiowide({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-logo",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heading",
});

export const viewport = {
  themeColor: "#0d1820",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Memory Crystal — Persistent Memory for Claude Code, Codex & AI Agents",
  description: "Memory Crystal is the MCP server that gives Claude Code, Codex, and OpenClaw persistent memory across sessions and compactions. Never lose context again. Free plan available.",
  keywords: [
    "Claude Code persistent memory",
    "MCP server for AI memory",
    "AI agent persistent memory",
    "Claude Code context compaction solution",
    "Codex persistent memory MCP",
    "OpenClaw memory plugin",
    "AI memory across sessions",
    "persistent context for AI coding assistants",
    "MCP memory server",
    "Claude Code memory loss fix",
  ],
  openGraph: {
    title: "Memory Crystal — Persistent Memory for Claude Code & AI Agents",
    description: "The MCP server that gives Claude Code, Codex, and OpenClaw persistent memory. Never lose context when compacting. Free plan available.",
    type: "website",
    url: "https://memorycrystal.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memory Crystal — Persistent Memory for Claude Code & AI Agents",
    description: "The MCP server that gives Claude Code, Codex, and OpenClaw persistent memory. Never lose context when compacting.",
  },
  alternates: {
    canonical: "https://memorycrystal.ai",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${oxanium.variable} ${audiowide.variable} ${inter.variable} bg-void text-primary antialiased`}>
        <ConvexAuthNextjsServerProvider>
          <ConvexClientProvider>
            {children}
            <CookieBanner />
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
