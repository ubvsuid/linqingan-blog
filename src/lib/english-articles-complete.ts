import {
  englishArticleRoutePairs as baseEnglishArticleRoutePairs,
  publishedEnglishArticles as basePublishedEnglishArticles,
  type EnglishArticleRecord,
} from "./english-articles";
import { englishFoundationBatchTwoRegistry } from "./english-foundation-registry-2";
import { englishSpawnBatchThreeRegistry } from "./english-spawn-registry-3";
import { englishLifecycleBatchFourRegistry } from "./english-lifecycle-registry-4";
import { englishMovementBatchFiveRegistry } from "./english-movement-registry-5";
import { englishMovementBatchSixRegistry } from "./english-movement-registry-6";
import { englishVisionBatchSevenRegistry } from "./english-vision-registry-7";
import { englishRuntimeBatchEightRegistry } from "./english-runtime-registry-8";
import { englishObservabilityBatchNineRegistry } from "./english-observability-registry-9";
import { englishMarketBatchTenRegistry } from "./english-market-registry-10";
import { englishLabFactoryBatchElevenRegistry } from "./english-lab-factory-registry-11";
import { englishMineralStoragePowerBatchTwelveRegistry } from "./english-mineral-storage-power-registry-12";
import { englishTowerBatchThirteenRegistry } from "./english-tower-registry-13";

export type { EnglishArticleRecord };

export const publishedEnglishArticles: EnglishArticleRecord[] = [
  ...basePublishedEnglishArticles,
  ...englishFoundationBatchTwoRegistry,
  ...englishSpawnBatchThreeRegistry,
  ...englishLifecycleBatchFourRegistry,
  ...englishMovementBatchFiveRegistry,
  ...englishMovementBatchSixRegistry,
  ...englishVisionBatchSevenRegistry,
  ...englishRuntimeBatchEightRegistry,
  ...englishObservabilityBatchNineRegistry,
  ...englishMarketBatchTenRegistry,
  ...englishLabFactoryBatchElevenRegistry,
  ...englishMineralStoragePowerBatchTwelveRegistry,
  ...englishTowerBatchThirteenRegistry,
];

export const englishArticleRoutePairs = {
  ...baseEnglishArticleRoutePairs,
  ...Object.fromEntries(
    [
      ...englishFoundationBatchTwoRegistry,
      ...englishSpawnBatchThreeRegistry,
      ...englishLifecycleBatchFourRegistry,
      ...englishMovementBatchFiveRegistry,
      ...englishMovementBatchSixRegistry,
      ...englishVisionBatchSevenRegistry,
      ...englishRuntimeBatchEightRegistry,
      ...englishObservabilityBatchNineRegistry,
      ...englishMarketBatchTenRegistry,
      ...englishLabFactoryBatchElevenRegistry,
      ...englishMineralStoragePowerBatchTwelveRegistry,
      ...englishTowerBatchThirteenRegistry,
    ].map((article) => [article.chinesePath, article.href]),
  ),
} as Record<string, string>;
