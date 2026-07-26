import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import {
  getEnglishBeginnerArticle,
  type EnglishBeginnerArticle,
} from "@/lib/english-beginner-content";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

function requireBodyPartsArticle(): EnglishBeginnerArticle {
  const value = getEnglishBeginnerArticle("screeps-creep-body-parts");
  if (!value) throw new Error("Missing English beginner article: screeps-creep-body-parts");
  return value;
}

const article = requireBodyPartsArticle();
const discovery = getEnglishDiscoveryArticle(article.path);
const articleUrl = `${siteConfig.url}${article.path}`;
const modifiedTime = discovery?.updatedAt ?? article.publishedAt;

export const metadata: Metadata = {
  title: { absolute: `${article.title} | Linqingan` },
  description: article.description,
  keywords: article.keywords,
  alternates: {
    canonical: article.path,
    languages: {
      en: article.path,
      "zh-CN": article.chinesePath,
      "x-default": article.path,
    },
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
    modifiedTime,
    tags: discovery?.tags ?? article.tags,
    images: [{ url: `${siteConfig.url}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${article.title} | Linqingan`,
    description: article.description,
    images: [`${siteConfig.url}/opengraph-image`],
  },
};

export default function EnglishCreepBodyPartsPage() {
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
      author: { "@type": "Person", name: "Linqingan", url: `${siteConfig.url}/en/about` },
      publisher: { "@type": "Organization", name: "Linqingan", url: siteConfig.url },
      isBasedOn: `${siteConfig.url}${article.chinesePath}`,
      about: discovery?.tags,
      articleSection: discovery?.moduleTitle,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
        { "@type": "ListItem", position: 2, name: "Articles", item: `${siteConfig.url}/en/blog` },
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
