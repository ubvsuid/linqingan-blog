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
import { englishControllerBatchFourteenRegistry } from "./english-controller-registry-14";
import { englishConstructionSafetyBatchFifteenRegistry } from "./english-construction-safety-registry-15";
import { englishConfigCodeBatchSixteenRegistry } from "./english-config-code-registry-16";
import { englishDefenseOperationsBatchSeventeenRegistry } from "./english-defense-operations-registry-17";
import { englishLinkSourceBatchEighteenRegistry } from "./english-link-source-registry-18";

export type { EnglishArticleRecord };

const articleRecordOverrides: Record<string, Partial<EnglishArticleRecord>> = {
  "/en/blog/screeps-introduction": {
    category: "GETTING STARTED · BEGINNER LESSON 1 OF 12",
    title: "What Is Screeps? A Programming Strategy Game",
    description:
      "Learn what Screeps is, how JavaScript controls its persistent world, and how Rooms, Creeps, Sources, Spawns, and Controllers work together for new players.",
    readingTime: "8 min read",
    primaryKeyword: "what is Screeps",
    searchIntent:
      "Beginner concept explanation of what Screeps is and how its persistent JavaScript-controlled world works",
    finalScore: 98,
    keywords: [
      "what is Screeps",
      "Screeps programming game",
      "how Screeps works",
      "Screeps beginner guide",
      "Screeps World",
      "JavaScript strategy game",
    ],
  },
};

const publishedBaseArticles = basePublishedEnglishArticles.map((article) => ({
  ...article,
  ...(articleRecordOverrides[article.href] ?? {}),
}));

export const publishedEnglishArticles: EnglishArticleRecord[] = [
  ...publishedBaseArticles,
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
  ...englishControllerBatchFourteenRegistry,
  ...englishConstructionSafetyBatchFifteenRegistry,
  ...englishConfigCodeBatchSixteenRegistry,
  ...englishDefenseOperationsBatchSeventeenRegistry,
  ...englishLinkSourceBatchEighteenRegistry,
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
      ...englishControllerBatchFourteenRegistry,
      ...englishConstructionSafetyBatchFifteenRegistry,
      ...englishConfigCodeBatchSixteenRegistry,
      ...englishDefenseOperationsBatchSeventeenRegistry,
      ...englishLinkSourceBatchEighteenRegistry,
    ].map((article) => [article.chinesePath, article.href]),
  ),
} as Record<string, string>;
