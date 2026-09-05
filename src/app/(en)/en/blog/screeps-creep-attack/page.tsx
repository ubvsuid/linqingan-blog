import type { Metadata } from "next";

import { EnglishOriginalArticlePage } from "@/components/english-original-article-page";
import { englishCreepAttackArticle as article } from "@/lib/english-creep-attack-original-21";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const articleUrl = `${siteConfig.url}${article.path}`;
const discovery = getEnglishDiscoveryArticle(article.path);
const modifiedTime = discovery?.updatedAt ?? article.publishedAt;

export const metadata: Metadata = {
  title: { absolute: `${article.title} | Linqingan` },
  description: article.description,
  keywords: article.keywords,
  authors: [{ name: "Linqingan", url: `${siteConfig.url}/en/about` }],
  alternates: {
    canonical: article.path,
    languages: { en: article.path, "x-default": article.path },
    types: { "application/rss+xml": "/en/feed.xml" },
  },
  openGraph: {
    type: "article",
    locale: "en_US",
    url: articleUrl,
    siteName: "Linqingan",
    title: `${article.title} | Linqingan`,
    description: article.description,
    publishedTime: article.publishedAt,
    modifiedTime,
    authors: ["Linqingan"],
    tags: discovery?.tags ?? article.tags,
  },
  twitter: {
    card: "summary",
    title: `${article.title} | Linqingan`,
    description: article.description,
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.headline,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: modifiedTime,
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
    about: discovery?.tags ?? article.tags,
    articleSection: discovery?.moduleTitle ?? "Construction & Defense",
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${siteConfig.url}/en/blog` },
      { "@type": "ListItem", position: 3, name: article.headline, item: articleUrl },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  },
];

export default function ScreepsCreepAttackPage() {
  return (
    <EnglishOriginalArticlePage
      articleHref={article.path}
      headline={article.headline}
      description={article.description}
      breadcrumbLabel={article.breadcrumbLabel}
      category={article.category}
      publishedAt={article.publishedAt}
      publishedLabel={article.publishedLabel}
      modifiedAt={modifiedTime}
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
