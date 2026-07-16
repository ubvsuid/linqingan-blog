import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

export function createPageMetadata({
  title,
  description,
  path,
  noindex = false,
}: PageMetadataOptions): Metadata {
  const url = `${siteConfig.url}${path === "/" ? "" : path}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    robots: noindex
      ? {
          index: false,
          follow: true,
        }
      : undefined,
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.title,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
