import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { publishedEnglishArticles } from "@/lib/english-articles-complete";
import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishEditorialFourthArticleOverrides20260814 } from "@/lib/english-editorial-fourth-20260814";
import {
  applyEnglishEditorialSeventh20260817,
  getEnglishEditorialSeventhUpdatedAt20260817,
} from "@/lib/english-editorial-seventh-20260817";
import { normalizeEnglishEditorialSeventhHtml20260817 } from "@/lib/english-editorial-seventh-html-20260817";
import {
  applyEnglishHarvestEnergyOptimization20260829,
  getEnglishHarvestEnergyOptimizationUpdatedAt20260829,
} from "@/lib/english-harvest-energy-optimization-20260829";
import { siteConfig } from "@/lib/site";

const slug = "screeps-creep-harvest-energy";
const path = "/en/blog/screeps-creep-harvest-energy";

function requireArticle(): EnglishBeginnerArticle {
  const record = publishedEnglishArticles.find(
    (candidate) => candidate.href === path,
  );
  const override = englishEditorialFourthArticleOverrides20260814[slug];

  if (
    !record
    || !record.chinesePath
    || !override?.title
    || !override.headline
    || !override.description
    || !override.category
    || !override.readingTime
    || !override.breadcrumbLabel
    || !override.tags
    || !override.keywords
    || !override.primaryKeyword
    || !override.searchIntent
    || typeof override.finalScore !== "number"
    || !override.verification
    || !override.toc
    || !override.faq
    || !override.articleHtml
  ) {
    throw new Error(`Incomplete fourth editorial article: ${slug}`);
  }

  return {
    slug,
    path: record.href,
    chinesePath: record.chinesePath,
    title: override.title,
    headline: override.headline,
    description: override.description,
    category: override.category,
    publishedAt: record.publishedAt,
    publishedLabel: record.publishedLabel,
    readingTime: override.readingTime,
    breadcrumbLabel: override.breadcrumbLabel,
    tags: override.tags,
    keywords: override.keywords,
    primaryKeyword: override.primaryKeyword,
    searchIntent: override.searchIntent,
    finalScore: override.finalScore,
    verification: override.verification,
    toc: override.toc,
    faq: override.faq,
    previous: {
      href: "/en/blog/screeps-tick-game-loop",
      label: "Previous lesson",
      title: "Understand Screeps Ticks",
    },
    next: {
      href: "/en/blog/screeps-transfer-energy-to-spawn",
      label: "Next lesson",
      title: "Deliver Energy to a Spawn",
    },
    articleHtml: override.articleHtml,
  };
}

const baseArticle = requireArticle();
const seventhArticle = applyEnglishEditorialSeventh20260817(baseArticle) ?? baseArticle;
const normalizedArticle =
  normalizeEnglishEditorialSeventhHtml20260817(seventhArticle) ?? seventhArticle;
const article =
  applyEnglishHarvestEnergyOptimization20260829(normalizedArticle)
  ?? normalizedArticle;
const modifiedAt =
  getEnglishHarvestEnergyOptimizationUpdatedAt20260829(slug)
  ?? getEnglishEditorialSeventhUpdatedAt20260817(slug)
  ?? "2026-08-14";
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
