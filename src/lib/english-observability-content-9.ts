import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishNotifyArticle } from "@/lib/english-observability-notify-9";
import { englishEventLogArticle } from "@/lib/english-observability-event-log-9";
import { englishRoomVisualArticle } from "@/lib/english-observability-roomvisual-9";

export const englishObservabilityBatchNineArticles = [
  englishNotifyArticle,
  englishEventLogArticle,
  englishRoomVisualArticle,
] satisfies EnglishBeginnerArticle[];

export const englishObservabilityBatchNineBySlug = Object.fromEntries(
  englishObservabilityBatchNineArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishObservabilityBatchNineArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishObservabilityBatchNineBySlug[slug];
}
