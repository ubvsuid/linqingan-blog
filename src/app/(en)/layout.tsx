import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";

import "../globals.css";
import "../improvements.css";
import "../site-shell.css";
import "./english-article.css";
import "./english-about.css";
import "./english-search.css";
import "./english-knowledge.css";

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "Linqingan Screeps Guides & Tools",
  description: "Practical English Screeps guides, debugging workflows, references, and browser-based tools.",
  authors: [{ name: "Linqingan", url: `${siteConfig.url}/en/about` }],
  creator: "Linqingan",
  applicationName: "Linqingan Screeps Guides & Tools",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
    ],
    shortcut: ["/favicon.ico"],
  },
  verification: googleVerification ? { google: googleVerification } : undefined,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${siteConfig.url}/en`,
    siteName: "Linqingan",
    title: "Linqingan Screeps Guides & Tools",
    description: "Practical English Screeps guides, debugging workflows, references, and browser-based tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Linqingan Screeps Guides & Tools",
    description: "Practical English Screeps guides, debugging workflows, references, and browser-based tools.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function EnglishRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-site-language="en" suppressHydrationWarning>
      <body>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <div id="main-content" className="site-content">{children}</div>
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
