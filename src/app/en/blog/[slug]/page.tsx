import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EnglishArticlePage } from "@/components/english-article-page";
import {
  englishBeginnerArticles,
  getEnglishBeginnerArticle,
} from "@/lib/english-beginner-content";
import {
  englishFoundationArticles,
  getEnglishFoundationArticle,
} from "@/lib/english-foundation-content";
import {
  englishFoundationBatchTwoArticles,
  getEnglishFoundationBatchTwoArticle,
} from "@/lib/english-foundation-content-2";
import {
  englishSpawnBatchThreeArticles,
  getEnglishSpawnBatchThreeArticle,
} from "@/lib/english-spawn-content-3-published";
import {
  englishLifecycleBatchFourArticles,
  getEnglishLifecycleBatchFourArticle,
} from "@/lib/english-lifecycle-content-4-published";
import {
  englishMovementBatchFiveArticles,
  getEnglishMovementBatchFiveArticle,
} from "@/lib/english-movement-content-5";
import {
  englishMovementBatchSixArticles,
  getEnglishMovementBatchSixArticle,
} from "@/lib/english-movement-content-6-published";
import {
  englishVisionBatchSevenArticles,
  getEnglishVisionBatchSevenArticle,
} from "@/lib/english-vision-content-7";
import {
  englishRuntimeBatchEightArticles,
  getEnglishRuntimeBatchEightArticle,
} from "@/lib/english-runtime-content-8";
import {
  englishObservabilityBatchNineArticles,
  getEnglishObservabilityBatchNineArticle,
} from "@/lib/english-observability-content-9";
import {
  englishMarketBatchTenArticles,
  getEnglishMarketBatchTenArticle,
} from "@/lib/english-market-content-10";
import {
  englishLabFactoryBatchElevenArticles,
  getEnglishLabFactoryBatchElevenArticle,
} from "@/lib/english-lab-factory-content-11";
import {
  englishMineralStoragePowerBatchTwelveArticles,
  getEnglishMineralStoragePowerBatchTwelveArticle,
} from "@/lib/english-mineral-storage-power-content-12";
import {
  englishTowerBatchThirteenArticles,
  getEnglishTowerBatchThirteenArticle,
} from "@/lib/english-tower-content-13";
import {
  englishControllerBatchFourteenArticles,
  getEnglishControllerBatchFourteenArticle,
} from "@/lib/english-controller-content-14";
import {
  englishConstructionSafetyBatchFifteenArticles,
  getEnglishConstructionSafetyBatchFifteenArticle,
} from "@/lib/english-construction-safety-content-15";
import {
  englishConfigCodeBatchSixteenArticles,
  getEnglishConfigCodeBatchSixteenArticle,
} from "@/lib/english-config-code-content-16";
import {
  englishDefenseOperationsBatchSeventeenArticles,
  getEnglishDefenseOperationsBatchSeventeenArticle,
} from "@/lib/english-defense-operations-content-17";
import {
  englishLinkSourceBatchEighteenArticles,
  getEnglishLinkSourceBatchEighteenArticle,
} from "@/lib/english-link-source-content-18";
import { siteConfig } from "@/lib/site";

interface EnglishArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

const staticBeginnerSlugs = new Set(["screeps-creep-body-parts"]);
const dynamicEnglishArticles = [
  ...englishBeginnerArticles,
  ...englishFoundationArticles,
  ...englishFoundationBatchTwoArticles,
  ...englishSpawnBatchThreeArticles,
  ...englishLifecycleBatchFourArticles,
  ...englishMovementBatchFiveArticles,
  ...englishMovementBatchSixArticles,
  ...englishVisionBatchSevenArticles,
  ...englishRuntimeBatchEightArticles,
  ...englishObservabilityBatchNineArticles,
  ...englishMarketBatchTenArticles,
  ...englishLabFactoryBatchElevenArticles,
  ...englishMineralStoragePowerBatchTwelveArticles,
  ...englishTowerBatchThirteenArticles,
  ...englishControllerBatchFourteenArticles,
  ...englishConstructionSafetyBatchFifteenArticles,
  ...englishConfigCodeBatchSixteenArticles,
  ...englishDefenseOperationsBatchSeventeenArticles,
  ...englishLinkSourceBatchEighteenArticles,
];

function getDynamicEnglishArticle(slug: string) {
  return getEnglishBeginnerArticle(slug)
    ?? getEnglishFoundationArticle(slug)
    ?? getEnglishFoundationBatchTwoArticle(slug)
    ?? getEnglishSpawnBatchThreeArticle(slug)
    ?? getEnglishLifecycleBatchFourArticle(slug)
    ?? getEnglishMovementBatchFiveArticle(slug)
    ?? getEnglishMovementBatchSixArticle(slug)
    ?? getEnglishVisionBatchSevenArticle(slug)
    ?? getEnglishRuntimeBatchEightArticle(slug)
    ?? getEnglishObservabilityBatchNineArticle(slug)
    ?? getEnglishMarketBatchTenArticle(slug)
    ?? getEnglishLabFactoryBatchElevenArticle(slug)
    ?? getEnglishMineralStoragePowerBatchTwelveArticle(slug)
    ?? getEnglishTowerBatchThirteenArticle(slug)
    ?? getEnglishControllerBatchFourteenArticle(slug)
    ?? getEnglishConstructionSafetyBatchFifteenArticle(slug)
    ?? getEnglishConfigCodeBatchSixteenArticle(slug)
    ?? getEnglishDefenseOperationsBatchSeventeenArticle(slug)
    ?? getEnglishLinkSourceBatchEighteenArticle(slug);
}

export const dynamicParams = false;

export function generateStaticParams() {
  return dynamicEnglishArticles
    .filter((article) => !staticBeginnerSlugs.has(article.slug))
    .map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: EnglishArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getDynamicEnglishArticle(slug);

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
      modifiedTime: article.publishedAt,
      tags: article.tags,
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

export default async function EnglishArticleRoute({
  params,
}: EnglishArticlePageProps) {
  const { slug } = await params;
  const article = getDynamicEnglishArticle(slug);

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
