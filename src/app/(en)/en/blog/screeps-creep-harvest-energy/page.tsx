import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { siteConfig } from "@/lib/site";

const slug = "screeps-creep-harvest-energy";

function requireArticle() {
  const value = getEnglishBeginnerArticle(slug);

  if (!value) {
    throw new Error(`Missing English beginner article: ${slug}`);
  }

  return value;
}

const article = requireArticle();
const modifiedAt = "2026-08-14";
const articleUrl = `${siteConfig.url}${article.path}`;
const socialImage = `${siteConfig.url}/opengraph-image`;

export const metadata: Metadata = {
  title: { absolute: `${article.title} | Linqingan` },
  description: article.description,
  keywords: article.keywords,
  authors: [{ name: "Linqingan", url: `${siteConfig.url}/en/about` }],
  alternates: {
    canonical: article.path,
    languages: {
      en: article.path,
      "zh-CN": article.chinesePath,
      "x-default": article.path,
    },
    types: { "application/rss+xml": "/en/feed.xml" },
  },
  openGraph: {
    type: "article",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: articleUrl,
    siteName: "Linqingan",
    title: `${article.title} | Linqingan`,
    description: article.description,
    publishedTime: article.publishedAt,
    modifiedTime: modifiedAt,
    authors: ["Linqingan"],
    tags: article.tags,
    images: [{ url: socialImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${article.title} | Linqingan`,
    description: article.description,
    images: [socialImage],
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.headline,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: modifiedAt,
    inLanguage: "en-US",
    mainEntityOfPage: articleUrl,
    url: articleUrl,
    author: {
      "@type": "Person",
      name: "Linqingan",
      url: `${siteConfig.url}/en/about`,
      sameAs: [siteConfig.links.github],
    },
    publisher: {
      "@type": "Person",
      name: "Linqingan",
      url: `${siteConfig.url}/en/about`,
    },
    isBasedOn: `${siteConfig.url}${article.chinesePath}`,
    about: article.tags,
    articleSection: "Beginner",
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteConfig.url}/en`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${siteConfig.url}/en/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.headline,
        item: articleUrl,
      },
    ],
  },
];

export default function HarvestEnergyArticlePage() {
  return (
    <EnglishArticlePage
      articleHref={article.path}
      chinesePath={article.chinesePath}
      headline={article.headline}
      description={article.description}
      breadcrumbLabel={article.breadcrumbLabel}
      category={article.category}
      publishedAt={article.publishedAt}
      publishedLabel={article.publishedLabel}
      modifiedAt={modifiedAt}
      readingTime={article.readingTime}
      tags={article.tags}
      verification={article.verification.map(([term, value]) => ({ term, value }))}
      toc={article.toc}
      articleHtml={article.articleHtml}
      jsonLd={jsonLd}
      previous={article.previous ?? undefined}
      next={article.next ?? undefined}
    />
  );
}
