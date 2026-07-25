import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishCreateConstructionSiteArticle } from "@/lib/english-create-construction-site-15";
import { englishConstructionProgressArticle } from "@/lib/english-construction-progress-15";
import { englishStructureDestroyArticle } from "@/lib/english-structure-destroy-15";

export const englishConstructionSafetyBatchFifteenArticles = [
  englishCreateConstructionSiteArticle,
  englishConstructionProgressArticle,
  englishStructureDestroyArticle,
] satisfies EnglishBeginnerArticle[];

export const englishConstructionSafetyBatchFifteenBySlug = Object.fromEntries(
  englishConstructionSafetyBatchFifteenArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishConstructionSafetyBatchFifteenArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishConstructionSafetyBatchFifteenBySlug[slug];
}
