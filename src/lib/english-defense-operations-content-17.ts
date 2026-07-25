import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishNukerLaunchArticle } from "@/lib/english-nuker-launch-17";
import { englishRampartPublicArticle } from "@/lib/english-rampart-public-17";
import { englishFortificationRepairArticle } from "@/lib/english-fortification-repair-17";

export const englishDefenseOperationsBatchSeventeenArticles = [
  englishNukerLaunchArticle,
  englishRampartPublicArticle,
  englishFortificationRepairArticle,
] satisfies EnglishBeginnerArticle[];

export const englishDefenseOperationsBatchSeventeenBySlug = Object.fromEntries(
  englishDefenseOperationsBatchSeventeenArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishDefenseOperationsBatchSeventeenArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishDefenseOperationsBatchSeventeenBySlug[slug];
}
