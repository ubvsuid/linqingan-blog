import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishMarketCreateOrderArticle } from "@/lib/english-market-create-order-10";
import { englishMarketDealArticle } from "@/lib/english-market-deal-10";
import { englishTerminalSendArticle } from "@/lib/english-terminal-send-10";

export const englishMarketBatchTenArticles = [
  englishMarketCreateOrderArticle,
  englishMarketDealArticle,
  englishTerminalSendArticle,
] satisfies EnglishBeginnerArticle[];

export const englishMarketBatchTenBySlug = Object.fromEntries(
  englishMarketBatchTenArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishMarketBatchTenArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishMarketBatchTenBySlug[slug];
}
