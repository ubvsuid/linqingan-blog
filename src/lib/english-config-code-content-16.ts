import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishFlagsConfigurationArticle } from "@/lib/english-flags-configuration-16";
import { englishRequireModulesArticle } from "@/lib/english-require-modules-16";

export const englishConfigCodeBatchSixteenArticles = [
  englishFlagsConfigurationArticle,
  englishRequireModulesArticle,
] satisfies EnglishBeginnerArticle[];

export const englishConfigCodeBatchSixteenBySlug = Object.fromEntries(
  englishConfigCodeBatchSixteenArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishConfigCodeBatchSixteenArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishConfigCodeBatchSixteenBySlug[slug];
}
