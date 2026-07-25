import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishCostMatrixArticle } from "@/lib/english-vision-costmatrix-7";
import { englishObserverArticle } from "@/lib/english-vision-observer-7";
import { englishRoomVisibilityArticle } from "@/lib/english-vision-room-visibility-7";

export const englishVisionBatchSevenArticles = [
  englishRoomVisibilityArticle,
  englishObserverArticle,
  englishCostMatrixArticle,
] satisfies EnglishBeginnerArticle[];

export const englishVisionBatchSevenBySlug = Object.fromEntries(
  englishVisionBatchSevenArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishVisionBatchSevenArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishVisionBatchSevenBySlug[slug];
}
