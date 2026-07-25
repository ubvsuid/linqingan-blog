import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishSpawnBatchThreeArticles as sourceArticles } from "@/lib/english-spawn-content-3";

const invalidInfinityCheck = `    || !Number.isFinite(maximumUnits)\n    || maximumUnits < 0`;
const validInfinityCheck = `    || (\n      maximumUnits !== Infinity\n      && !Number.isFinite(maximumUnits)\n    )\n    || maximumUnits < 0`;

export const englishSpawnBatchThreeArticles = sourceArticles.map((article) => ({
  ...article,
  articleHtml: article.articleHtml.replace(
    invalidInfinityCheck,
    validInfinityCheck,
  ),
})) satisfies EnglishBeginnerArticle[];

export const englishSpawnBatchThreeBySlug = Object.fromEntries(
  englishSpawnBatchThreeArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishSpawnBatchThreeArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishSpawnBatchThreeBySlug[slug];
}
