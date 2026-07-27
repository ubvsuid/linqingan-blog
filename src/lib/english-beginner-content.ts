// Published: complete English beginner sequence.
import { gunzipSync } from "node:zlib";

import { englishBeginnerArticleOverrides } from "./english-beginner-overrides";
import { englishBeginnerBodyPartsArticleOverrides } from "./english-beginner-body-parts-override";
import { englishBeginnerCreepRolesArticleOverrides } from "./english-beginner-creep-roles-override";
import { englishBeginnerSpawnCreepArticleOverrides } from "./english-beginner-spawn-creep-override";
import { englishBeginnerTickArticleOverrides } from "./english-beginner-tick-override";
import { englishBeginnerUpgradeControllerArticleOverrides } from "./english-beginner-upgrade-controller-override";
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
  verification: Array<[string, string]>;
  toc: Array<[string, string]>;
  faq: Array<[string, string]>;
  previous: EnglishArticleNavigation | null;
  next: EnglishArticleNavigation | null;
  articleHtml: string;
}

const encodedArticleData = [part1, part2, part3, part4, part5, part6].join("");

function isStringPair(value: unknown): value is [string, string] {
  return Array.isArray(value)
    && value.length === 2
    && value.every((item) => typeof item === "string" && item.length > 0);
}

function parseEnglishBeginnerArticles(encoded: string): EnglishBeginnerArticle[] {
  const parsed: unknown = JSON.parse(
    gunzipSync(Buffer.from(encoded, "base64")).toString("utf8"),
  );

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("English beginner article payload must be a non-empty array.");
  }

  const requiredStringFields = [
    "slug",
    "path",
    "chinesePath",
    "title",
    "headline",
    "description",
    "category",
    "publishedAt",
    "publishedLabel",
    "readingTime",
    "breadcrumbLabel",
    "primaryKeyword",
    "searchIntent",
    "articleHtml",
  ] as const;

  for (const [index, value] of parsed.entries()) {
    if (!value || typeof value !== "object") {
      throw new Error(`English beginner article ${index} must be an object.`);
    }

    const article = value as Record<string, unknown>;

    for (const field of requiredStringFields) {
      if (typeof article[field] !== "string" || article[field].length === 0) {
        throw new Error(`English beginner article ${index} has an invalid ${field}.`);
      }
    }

    if (!Array.isArray(article.tags) || !article.tags.every((item) => typeof item === "string")) {
      throw new Error(`English beginner article ${index} has invalid tags.`);
    }

    if (!Array.isArray(article.keywords) || !article.keywords.every((item) => typeof item === "string")) {
      throw new Error(`English beginner article ${index} has invalid keywords.`);
    }

    for (const field of ["verification", "toc", "faq"] as const) {
      if (!Array.isArray(article[field]) || !article[field].every(isStringPair)) {
        throw new Error(`English beginner article ${index} has invalid ${field} pairs.`);
      }
    }

    if (typeof article.finalScore !== "number" || article.finalScore < 96) {
      throw new Error(`English beginner article ${index} does not meet the publication score.`);
    }
  }

  return parsed as EnglishBeginnerArticle[];
}

const parsedEnglishBeginnerArticles = parseEnglishBeginnerArticles(encodedArticleData);

// Keep focused lesson rewrites readable; Lesson 9 loads after the earlier overrides.
const articleOverrides = {
  ...englishBeginnerArticleOverrides,
  ...englishBeginnerTickArticleOverrides,
  ...englishBeginnerBodyPartsArticleOverrides,
  ...englishBeginnerSpawnCreepArticleOverrides,
  ...englishBeginnerCreepRolesArticleOverrides,
  ...englishBeginnerUpgradeControllerArticleOverrides,
} as unknown as Record<string, Partial<EnglishBeginnerArticle>>;

export const englishBeginnerArticles: EnglishBeginnerArticle[] =
  parsedEnglishBeginnerArticles.map((article) => ({
    ...article,
    ...(articleOverrides[article.slug] ?? {}),
  }));

export const englishBeginnerArticleBySlug = Object.fromEntries(
  englishBeginnerArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishBeginnerArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishBeginnerArticleBySlug[slug];
}
