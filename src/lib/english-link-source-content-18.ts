import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishLinkTransferArticle } from "@/lib/english-link-transfer-18";
import { englishSourceSelectionArticle } from "@/lib/english-source-selection-18";

export const englishLinkSourceBatchEighteenArticles = [
  englishLinkTransferArticle,
  englishSourceSelectionArticle,
] satisfies EnglishBeginnerArticle[];

export const englishLinkSourceBatchEighteenBySlug = Object.fromEntries(
  englishLinkSourceBatchEighteenArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishLinkSourceBatchEighteenArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishLinkSourceBatchEighteenBySlug[slug];
}
