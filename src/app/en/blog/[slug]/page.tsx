import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EnglishArticlePage } from "@/components/english-article-page";
import {
  englishBeginnerArticles,
  getEnglishBeginnerArticle,
} from "@/lib/english-beginner-content";
import { siteConfig } from "@/lib/site";

interface EnglishBeginnerArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

const staticBeginnerSlugs = new Set(["screeps-creep-body-parts"]);

export const dynamicParams = false;

export function generateStaticParams() {
  return englishBeginnerArticles
    .filter((article) => !staticBeginnerSlugs.has(article.slug))
    .map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: EnglishBeginnerArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getEnglishBeginnerArticle(slug);

  if (!article || staticBeginnerSlugs.has(slug)) {
    return {
      title: "Article not found",
      robots: { index: false, follow: false },
    };
  }

  const articleUrl = `${siteConfig.url}${article.path}`;

  return {
    title: { absolute: `${article.title} | Linqingan` },
    description: article.description,
    keywords: [...article.keywords],
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
      modifiedTime: article.publishedAt,
      tags: [...article.tags],
      images: [{
        url: `${siteConfig.url}/opengraph-image`,
        width: 1200,
        height: 630,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | Linqingan`,
      description: article.description,
      images: [`${siteConfig.url}/opengraph-image`],
    },
  };
}

export default async function EnglishBeginnerArticlePage({
  params,
}: EnglishBeginnerArticlePageProps) {
  const { slug } = await params;
  const article = getEnglishBeginnerArticle(slug);

  if (!article || staticBeginnerSlugs.has(slug)) {
    notFound();
  }

  const articleUrl = `${siteConfig.url}${article.path}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.headline,
      description: article.description,
      datePublished: article.publishedAt,
      dateModified: article.publishedAt,
      inLanguage: "en-US",
      mainEntityOfPage: articleUrl,
      author: { "@type": "Person", name: "Linqingan" },
      publisher: {
        "@type": "Organization",
        name: "Linqingan",
        url: siteConfig.url,
      },
      isBasedOn: `${siteConfig.url}${article.chinesePath}`,
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
          name: "Articles",
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
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    },
  ];

  return (
    <EnglishArticlePage
      headline={article.headline}
      description={article.description}
      breadcrumbLabel={article.breadcrumbLabel}
      category={article.category}
      publishedAt={article.publishedAt}
      publishedLabel={article.publishedLabel}
      readingTime={article.readingTime}
      tags={[...article.tags]}
      verification={article.verification.map((item) => ({ ...item }))}
      toc={article.toc.map(([label, id]) => [label, id])}
      articleHtml={article.articleHtml}
      jsonLd={jsonLd}
      previous={article.previous ?? undefined}
      next={article.next ?? undefined}
    />
  );
}
