import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishLabReactionArticle } from "@/lib/english-lab-reaction-11";
import { englishLabBoostArticle } from "@/lib/english-lab-boost-11";
import { englishFactoryProduceArticle } from "@/lib/english-factory-produce-11";

export const englishLabFactoryBatchElevenArticles = [
  englishLabReactionArticle,
  englishLabBoostArticle,
  englishFactoryProduceArticle,
] satisfies EnglishBeginnerArticle[];

export const englishLabFactoryBatchElevenBySlug = Object.fromEntries(
  englishLabFactoryBatchElevenArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishLabFactoryBatchElevenArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishLabFactoryBatchElevenBySlug[slug];
}
