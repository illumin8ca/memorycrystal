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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f9ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1820" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Memory Crystal — Persistent Memory for Claude Code, Codex & AI Agents",
    template: "%s | Memory Crystal",
  },
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
    "persistent memory MCP server",
    "AI coding assistant memory",
    "agent memory layer",
    "cross-session memory AI",
  ],
  openGraph: {
    title: "Memory Crystal — Persistent Memory for Claude Code & AI Agents",
    description: "The MCP server that gives Claude Code, Codex, and OpenClaw persistent memory. Never lose context when compacting. Free plan available.",
    type: "website",
    url: "https://memorycrystal.ai",
    siteName: "Memory Crystal",
    images: [
      {
        url: "https://memorycrystal.ai/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Memory Crystal — Persistent Memory for AI Agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Memory Crystal — Persistent Memory for Claude Code & AI Agents",
    description: "The MCP server that gives Claude Code, Codex, and OpenClaw persistent memory. Never lose context when compacting.",
    site: "@memorycrystal",
  },
  alternates: {
    canonical: "https://memorycrystal.ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon-dark", media: "(prefers-color-scheme: dark)", type: "image/png" },
      { url: "/icon-light", media: "(prefers-color-scheme: light)", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-dark", media: "(prefers-color-scheme: dark)", sizes: "180x180", type: "image/png" },
      { url: "/apple-light", media: "(prefers-color-scheme: light)", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon-dark",
  },
  manifest: "/manifest.json",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Memory Crystal",
  url: "https://memorycrystal.ai",
  logo: "https://memorycrystal.ai/icons/icon-512.png",
  description:
    "Memory Crystal is the MCP server that gives Claude Code, Codex, and OpenClaw persistent memory across sessions and compactions.",
  sameAs: ["https://github.com/openclaw/memorycrystal"],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Memory Crystal",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux, Windows",
  url: "https://memorycrystal.ai",
  description:
    "Persistent memory MCP server for Claude Code, Codex, OpenClaw, and any MCP-compatible AI coding assistant. Never lose context between sessions.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan available",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics 4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-T56SQ5LHF8" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-T56SQ5LHF8');
            `,
          }}
        />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className={`${oxanium.variable} ${audiowide.variable} ${inter.variable} bg-void text-primary antialiased`}>
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
