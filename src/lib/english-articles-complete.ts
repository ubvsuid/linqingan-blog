import {
  englishArticleRoutePairs as baseEnglishArticleRoutePairs,
  publishedEnglishArticles as basePublishedEnglishArticles,
  type EnglishArticleRecord,
} from "./english-articles";
import { englishFoundationBatchTwoRegistry } from "./english-foundation-registry-2";
import { englishSpawnBatchThreeRegistry } from "./english-spawn-registry-3";
import { englishLifecycleBatchFourRegistry } from "./english-lifecycle-registry-4";
import { englishMovementBatchFiveRegistry } from "./english-movement-registry-5";

export type { EnglishArticleRecord };

export const publishedEnglishArticles: EnglishArticleRecord[] = [
  ...basePublishedEnglishArticles,
  ...englishFoundationBatchTwoRegistry,
  ...englishSpawnBatchThreeRegistry,
  ...englishLifecycleBatchFourRegistry,
  ...englishMovementBatchFiveRegistry,
];

export const englishArticleRoutePairs = {
  ...baseEnglishArticleRoutePairs,
  ...Object.fromEntries(
    [
      ...englishFoundationBatchTwoRegistry,
      ...englishSpawnBatchThreeRegistry,
      ...englishLifecycleBatchFourRegistry,
      ...englishMovementBatchFiveRegistry,
    ].map((article) => [article.chinesePath, article.href]),
  ),
} as Record<string, string>;
