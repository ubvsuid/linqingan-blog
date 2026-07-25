import {
  englishBeginnerArticles,
  type EnglishBeginnerArticle,
} from "@/lib/english-beginner-content";
import { englishFoundationArticles } from "@/lib/english-foundation-content";

export interface EnglishArticleRecord {
  href: string;
  chinesePath: string;
  category: string;
  title: string;
  description: string;
  publishedAt: string;
  publishedLabel: string;
  readingTime: string;
  primaryKeyword: string;
  searchIntent: string;
  status: "published";
  finalScore: number;
  keywords: string[];
}

function toPublishedRecord(
  article: EnglishBeginnerArticle,
): EnglishArticleRecord {
  return {
    href: article.path,
    chinesePath: article.chinesePath,
    category: article.category,
    title: article.headline,
    description: article.description,
    publishedAt: article.publishedAt,
    publishedLabel: article.publishedLabel,
    readingTime: article.readingTime,
    primaryKeyword: article.primaryKeyword,
    searchIntent: article.searchIntent,
    status: "published",
    finalScore: article.finalScore,
    keywords: article.keywords,
  };
}

const standaloneEnglishArticles: EnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-remove-construction-site",
    chinesePath: "/blog/screeps-construction-site-remove",
    category: "API SAFETY · CONSTRUCTION",
    title: "How to Remove a Construction Site Safely in Screeps",
    description:
      "Inspect a misplaced Construction Site, validate its identity, submit remove() once, handle return codes, and verify the result on the next tick.",
    publishedAt: "2026-07-24",
    publishedLabel: "July 24, 2026",
    readingTime: "12 min read",
    primaryKeyword: "Screeps remove construction site",
    searchIntent: "Safe API operation and troubleshooting",
    finalScore: 100,
    keywords: [
      "Screeps remove construction site",
      "ConstructionSite.remove",
      "LOOK_CONSTRUCTION_SITES",
      "Game.getObjectById",
      "ERR_NOT_OWNER",
    ],
    status: "published",
  },
];

export const publishedEnglishArticles: EnglishArticleRecord[] = [
  ...englishBeginnerArticles.map(toPublishedRecord),
  ...standaloneEnglishArticles,
  ...englishFoundationArticles.map(toPublishedRecord),
];

export const englishArticleRoutePairs = Object.fromEntries(
  publishedEnglishArticles.map((article) => [article.chinesePath, article.href]),
) as Record<string, string>;
