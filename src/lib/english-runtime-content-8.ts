import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishCpuArticle } from "@/lib/english-runtime-cpu-8";
import { englishGlobalCacheArticle } from "@/lib/english-runtime-global-cache-8";
import { englishSegmentsArticle } from "@/lib/english-runtime-segments-8";

export const englishRuntimeBatchEightArticles = [
  englishCpuArticle,
  englishGlobalCacheArticle,
  englishSegmentsArticle,
] satisfies EnglishBeginnerArticle[];

export const englishRuntimeBatchEightBySlug = Object.fromEntries(
  englishRuntimeBatchEightArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishRuntimeBatchEightArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishRuntimeBatchEightBySlug[slug];
}
