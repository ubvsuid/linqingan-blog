import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishControllerSafeModeArticle } from "@/lib/english-controller-safe-mode-14";
import { englishControllerDowngradeArticle } from "@/lib/english-controller-downgrade-14";
import { englishReserveClaimControllerArticle } from "@/lib/english-reserve-claim-controller-14";

export const englishControllerBatchFourteenArticles = [
  englishControllerSafeModeArticle,
  englishControllerDowngradeArticle,
  englishReserveClaimControllerArticle,
] satisfies EnglishBeginnerArticle[];

export const englishControllerBatchFourteenBySlug = Object.fromEntries(
  englishControllerBatchFourteenArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishControllerBatchFourteenArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishControllerBatchFourteenBySlug[slug];
}
