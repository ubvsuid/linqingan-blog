import type { Metadata, Viewport } from "next";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";

import "./globals.css";
import "./improvements.css";

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
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  verification: googleVerification
    ? {
        google: googleVerification,
      }
    : undefined,
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

const documentBootScript = `
(function () {
  try {
    var path = window.location.pathname;
    var english = path === "/en" || path.indexOf("/en/") === 0;
    document.documentElement.lang = english ? "en" : "zh-CN";
    document.documentElement.dataset.siteLanguage = english ? "en" : "zh-CN";

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
      name: siteConfig.author.name,
      alternateName: [siteConfig.author.handle, "Linqingan"],
      url: `${siteConfig.url}/about`,
      image: `${siteConfig.url}/profile-avatar.webp`,
      email: `mailto:${siteConfig.author.email}`,
      sameAs: [siteConfig.links.github],
      knowsAbout: ["Screeps", "JavaScript", "系统设计", "内容建设"],
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.title,
      alternateName: "Linqingan",
      description: siteConfig.description,
      inLanguage: ["zh-CN", "en"],
      author: {
        "@id": `${siteConfig.url}/#person`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteConfig.url}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={siteConfig.language} data-site-language={siteConfig.language} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: documentBootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          <span lang="zh-CN">跳到正文</span>
          <span aria-hidden="true"> / </span>
          <span lang="en">Skip to content</span>
        </a>
        <SiteHeader />
        <div id="main-content" className="site-content">
          {children}
        </div>
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
