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

export const metadata: Metadata = {
  title: "Memory Crystal — Persistent Memory for AI",
  description: "Persistent memory for your AI assistant",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
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
