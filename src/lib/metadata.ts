
import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  image?: string;
}

export function createPageMetadata({
  title,
  description,
  path,
  noindex = false,
  image,
}: PageMetadataOptions): Metadata {
  const url = `${siteConfig.url}${path === "/" ? "" : path}`;
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${siteConfig.url}${image.startsWith("/") ? image : `/${image}`}`
    : `${siteConfig.url}/opengraph-image`;

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
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

