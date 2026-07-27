import type { Metadata, Viewport } from "next";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";

import "../globals.css";
import "../improvements.css";

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author.name, url: `${siteConfig.url}/about` }],
  creator: siteConfig.author.name,
  applicationName: siteConfig.title,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
    ],
    shortcut: ["/favicon.ico"],
  },
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/feed.xml" },
  },
  verification: googleVerification ? { google: googleVerification } : undefined,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.title,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

const themeBootScript = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme =
      saved === "dark" || (!saved && systemDark) ? "dark" : "light";
  } catch (_) {}
})();
`;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteConfig.url}/#person`,
      name: "Linqingan",
      alternateName: [siteConfig.author.name, siteConfig.author.handle],
      url: `${siteConfig.url}/about`,
      image: `${siteConfig.url}/profile-avatar.webp`,
      email: `mailto:${siteConfig.author.email}`,
      sameAs: [siteConfig.links.github],
      knowsAbout: ["Screeps", "JavaScript", "system design", "debugging", "technical documentation"],
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: "Linqingan",
      alternateName: [siteConfig.title, "Linqingan Screeps Guides & Tools"],
      description: "Screeps learning, debugging, engineering notes, and practical tools in Chinese and English.",
      inLanguage: ["zh-CN", "en"],
      author: { "@id": `${siteConfig.url}/#person` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteConfig.url}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function ChineseRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-site-language="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">跳到正文</a>
        <SiteHeader />
        <div id="main-content" className="site-content">{children}</div>
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
