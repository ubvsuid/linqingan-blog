import { gunzipSync } from "node:zlib";

import part1 from "@/lib/english-beginner-data/part-1";
import part2 from "@/lib/english-beginner-data/part-2";
import part3 from "@/lib/english-beginner-data/part-3";
import part4 from "@/lib/english-beginner-data/part-4";
import part5 from "@/lib/english-beginner-data/part-5";
import part6 from "@/lib/english-beginner-data/part-6";

export interface EnglishArticleNavigation {
  href: string;
  label: string;
  title: string;
}

export interface EnglishArticleVerification {
  term: string;
  value: string;
}

export interface EnglishBeginnerArticle {
  slug: string;
  path: string;
  chinesePath: string;
  title: string;
  headline: string;
  description: string;
  category: string;
  publishedAt: string;
  publishedLabel: string;
  readingTime: string;
  breadcrumbLabel: string;
  tags: string[];
  keywords: string[];
  primaryKeyword: string;
  searchIntent: string;
  finalScore: number;
  verification: EnglishArticleVerification[];
  toc: [string, string][];
  faq: [string, string][];
  previous: EnglishArticleNavigation | null;
  next: EnglishArticleNavigation | null;
  articleHtml: string;
}

const encodedArticleData = [part1, part2, part3, part4, part5, part6].join("");

export const englishBeginnerArticles = JSON.parse(
  gunzipSync(Buffer.from(encodedArticleData, "base64")).toString("utf8"),
) as EnglishBeginnerArticle[];

export const englishBeginnerArticleBySlug = Object.fromEntries(
  englishBeginnerArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishBeginnerArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishBeginnerArticleBySlug[slug];
}
