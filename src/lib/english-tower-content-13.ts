import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishTowerAttackArticle } from "@/lib/english-tower-attack-13";
import { englishTowerHealArticle } from "@/lib/english-tower-heal-13";
import { englishTowerRepairArticle } from "@/lib/english-tower-repair-13";

export const englishTowerBatchThirteenArticles = [
  englishTowerAttackArticle,
  englishTowerHealArticle,
  englishTowerRepairArticle,
] satisfies EnglishBeginnerArticle[];

export const englishTowerBatchThirteenBySlug = Object.fromEntries(
  englishTowerBatchThirteenArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishTowerBatchThirteenArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishTowerBatchThirteenBySlug[slug];
}
