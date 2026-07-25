import {
  englishArticleRoutePairs as baseEnglishArticleRoutePairs,
  publishedEnglishArticles as basePublishedEnglishArticles,
  type EnglishArticleRecord,
} from "./english-articles";
import { englishFoundationBatchTwoRegistry } from "./english-foundation-registry-2";
import { englishSpawnBatchThreeRegistry } from "./english-spawn-registry-3";

export type { EnglishArticleRecord };

export const publishedEnglishArticles: EnglishArticleRecord[] = [
  ...basePublishedEnglishArticles,
  ...englishFoundationBatchTwoRegistry,
  ...englishSpawnBatchThreeRegistry,
];

export const englishArticleRoutePairs = {
  ...baseEnglishArticleRoutePairs,
  ...Object.fromEntries(
    [
      ...englishFoundationBatchTwoRegistry,
      ...englishSpawnBatchThreeRegistry,
    ].map((article) => [article.chinesePath, article.href]),
  ),
} as Record<string, string>;
