import type { Metadata } from "next";

import { languageRoutePairs } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

interface EnglishMetadataOptions {
  title: string;
  description: string;
  path: string;
  chinesePath: keyof typeof languageRoutePairs;
  noindex?: boolean;
  image?: string;
}

export function createEnglishPageMetadata({
  title,
  description,
  path,
  chinesePath,
  noindex = false,
  image = "/opengraph-image",
}: EnglishMetadataOptions): Metadata {
  const absoluteTitle = title.includes("Linqingan") ? title : `${title} | Linqingan`;
  const url = `${siteConfig.url}${path}`;
  const imageUrl = image.startsWith("http") ? image : `${siteConfig.url}${image}`;

  return {
    title: { absolute: absoluteTitle },
    description,
    applicationName: "Linqingan Screeps Guides & Tools",
    authors: [{ name: "Linqingan", url: `${siteConfig.url}/en/about` }],
    creator: "Linqingan",
    publisher: "Linqingan",
    alternates: {
      canonical: path,
      languages: {
        en: path,
        "zh-CN": chinesePath,
        "x-default": "/en",
      },
      types: {
        "application/rss+xml": "/en/feed.xml",
      },
    },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      locale: "en_US",
      alternateLocale: ["zh_CN"],
      url,
      siteName: "Linqingan",
      title: absoluteTitle,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: absoluteTitle,
      description,
      images: [imageUrl],
    },
  };
}
