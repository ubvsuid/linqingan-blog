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

type EnglishArticleRecordOverride = Partial<EnglishArticleRecord> & {
  updatedAt?: string;
};

const articleRecordOverrides: Record<string, EnglishArticleRecordOverride> = {
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
    updatedAt: "2026-07-26",
    keywords: [
      "what is Screeps",
      "Screeps programming game",
      "how Screeps works",
      "Screeps beginner guide",
      "Screeps World",
      "JavaScript strategy game",
    ],
  },
  "/en/blog/screeps-first-room": {
    category: "GETTING STARTED · BEGINNER LESSON 2 OF 12",
    title: "Screeps First Room: Find the Editor and Console",
    description:
      "Find your first Screeps Room, code editor, and Console, then use read-only commands to identify visible Rooms, Spawns, Creeps, Sources, and the Controller.",
    readingTime: "8 min read",
    primaryKeyword: "Screeps first room",
    searchIntent:
      "Beginner interface orientation and read-only inspection of the first visible Screeps room and owned game objects",
    finalScore: 98,
    updatedAt: "2026-07-27",
    keywords: [
      "Screeps first room",
      "Screeps code editor",
      "Screeps Console",
      "Game.rooms",
      "Game.spawns",
      "Game.creeps",
      "Screeps beginner interface",
    ],
  },
  "/en/blog/screeps-tick-game-loop": {
    category: "GETTING STARTED · BEGINNER LESSON 3 OF 12",
    title: "Screeps Ticks and Game Loop: Why Your Code Runs Repeatedly",
    description:
      "Understand a Screeps tick, Game.time, and module.exports.loop, then run safe observations that show why actions and state changes appear across later ticks.",
    readingTime: "8 min read",
    primaryKeyword: "Screeps tick",
    searchIntent:
      "Beginner explanation of Screeps tick timing, repeated main-loop execution, and safe observation across later ticks",
    finalScore: 98,
    updatedAt: "2026-07-27",
    keywords: [
      "Screeps tick",
      "Screeps game loop",
      "Game.time",
      "module.exports.loop",
      "Screeps action next tick",
      "Screeps beginner",
    ],
  },
  "/en/blog/screeps-creep-harvest-energy": {
    category: "GETTING STARTED · BEGINNER LESSON 4 OF 12",
    title: "Screeps Harvest Energy: Your First Creep Script",
    description:
      "Make one named Screeps Creep find a Source, move into range, and harvest Energy with a small script you can verify across later ticks.",
    readingTime: "9 min read",
    primaryKeyword: "Screeps harvest Energy",
    searchIntent:
      "Beginner action tutorial for moving one named Creep into range and harvesting Energy from a visible Source",
    finalScore: 98,
    updatedAt: "2026-07-27",
    keywords: [
      "Screeps harvest Energy",
      "Creep.harvest()",
      "FIND_SOURCES",
      "ERR_NOT_IN_RANGE",
      "Creep.moveTo()",
      "Screeps beginner code",
    ],
  },
  "/en/blog/screeps-transfer-energy-to-spawn": {
    category: "GETTING STARTED · BEGINNER LESSON 5 OF 12",
    title: "Screeps Energy Delivery: Creep to Spawn",
    description:
      "Make one Creep transfer Energy to a named Spawn, preserve delivery mode across ticks, and complete its first Source-to-Spawn round trip.",
    readingTime: "10 min read",
    primaryKeyword: "Screeps transfer Energy to Spawn",
    searchIntent:
      "Beginner action tutorial for transferring carried Energy to a named Spawn and preserving the harvest-deliver state across ticks",
    finalScore: 98,
    updatedAt: "2026-07-27",
    keywords: [
      "Screeps transfer Energy to Spawn",
      "Creep.transfer()",
      "creep.memory.delivering",
      "Game.spawns",
      "RESOURCE_ENERGY",
      "Screeps Energy loop",
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
