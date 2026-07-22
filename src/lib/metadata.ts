import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  image?: string;
}

const pageSocialImages: Record<string, string> = {
  "/beginner": "/beginner/opengraph-image",
  "/knowledge": "/knowledge/opengraph-image",
  "/tools/creep-body-calculator": "/tools/creep-body-calculator/opengraph-image",
};

export function createPageMetadata({
  title,
  description,
  path,
  noindex = false,
  image,
}: PageMetadataOptions): Metadata {
  const url = `${siteConfig.url}${path === "/" ? "" : path}`;
  const selectedImage = image ?? pageSocialImages[path];
  const imageUrl = selectedImage
    ? selectedImage.startsWith("http")
      ? selectedImage
      : `${siteConfig.url}${selectedImage.startsWith("/") ? selectedImage : `/${selectedImage}`}`
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
