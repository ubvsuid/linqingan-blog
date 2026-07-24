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
    alternates: {
      canonical: path,
      languages: {
        en: path,
        "zh-CN": chinesePath,
        "x-default": "/en",
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
