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
    "category": "GETTING STARTED · BEGINNER LESSON 1 OF 12",
    "title": "What Is Screeps? A Programming Strategy Game",
    "description": "Learn what Screeps is, how JavaScript controls its persistent world, and how Rooms, Creeps, Sources, Spawns, and Controllers work together for new players.",
    "readingTime": "8 min read",
    "primaryKeyword": "what is Screeps",
    "searchIntent": "Beginner concept explanation of what Screeps is and how its persistent JavaScript-controlled world works",
    "finalScore": 98,
    "updatedAt": "2026-07-26",
    "keywords": [
      "what is Screeps",
      "Screeps programming game",
      "how Screeps works",
      "Screeps beginner guide",
      "Screeps World",
      "JavaScript strategy game"
    ]
  },
  "/en/blog/screeps-first-room": {
    "category": "GETTING STARTED · BEGINNER LESSON 2 OF 12",
    "title": "Screeps First Room: Find the Editor and Console",
    "description": "Find your first Screeps Room, code editor, and Console, then use read-only commands to identify visible Rooms, Spawns, Creeps, Sources, and the Controller.",
    "readingTime": "8 min read",
    "primaryKeyword": "Screeps first room",
    "searchIntent": "Beginner interface orientation and read-only inspection of the first visible Screeps room and owned game objects",
    "finalScore": 98,
    "updatedAt": "2026-07-27",
    "keywords": [
      "Screeps first room",
      "Screeps code editor",
      "Screeps Console",
      "Game.rooms",
      "Game.spawns",
      "Game.creeps",
      "Screeps beginner interface"
    ]
  },
  "/en/blog/screeps-tick-game-loop": {
    "category": "GETTING STARTED · BEGINNER LESSON 3 OF 12",
    "title": "Screeps Ticks and Game Loop: Why Your Code Runs Repeatedly",
    "description": "Understand a Screeps tick, Game.time, and module.exports.loop, then run safe observations that show why actions and state changes appear across later ticks.",
    "readingTime": "8 min read",
    "primaryKeyword": "Screeps tick",
    "searchIntent": "Beginner explanation of Screeps tick timing, repeated main-loop execution, and safe observation across later ticks",
    "finalScore": 98,
    "updatedAt": "2026-07-27",
    "keywords": [
      "Screeps tick",
      "Screeps game loop",
      "Game.time",
      "module.exports.loop",
      "Screeps action next tick",
      "Screeps beginner"
    ]
  },
  "/en/blog/screeps-creep-harvest-energy": {
    "category": "GETTING STARTED · BEGINNER LESSON 4 OF 12",
    "title": "Screeps Harvest Energy: Your First Creep Script",
    "description": "Make one named Screeps Creep find a Source, move into range, and harvest Energy with a small script you can verify across later ticks.",
    "readingTime": "9 min read",
    "primaryKeyword": "Screeps harvest Energy",
    "searchIntent": "Beginner action tutorial for moving one named Creep into range and harvesting Energy from a visible Source",
    "finalScore": 98,
    "updatedAt": "2026-07-27",
    "keywords": [
      "Screeps harvest Energy",
      "Creep.harvest()",
      "FIND_SOURCES",
      "ERR_NOT_IN_RANGE",
      "Creep.moveTo()",
      "Screeps beginner code"
    ]
  },
  "/en/blog/screeps-transfer-energy-to-spawn": {
    "category": "GETTING STARTED · BEGINNER LESSON 5 OF 12",
    "title": "Screeps Energy Delivery: Creep to Spawn",
    "description": "Make one Creep transfer Energy to a named Spawn, preserve delivery mode across ticks, and complete its first Source-to-Spawn round trip.",
    "readingTime": "10 min read",
    "primaryKeyword": "Screeps transfer Energy to Spawn",
    "searchIntent": "Beginner action tutorial for transferring carried Energy to a named Spawn and preserving the harvest-deliver state across ticks",
    "finalScore": 98,
    "updatedAt": "2026-07-27",
    "keywords": [
      "Screeps transfer Energy to Spawn",
      "Creep.transfer()",
      "creep.memory.delivering",
      "Game.spawns",
      "RESOURCE_ENERGY",
      "Screeps Energy loop"
    ]
  },
  "/en/blog/screeps-creep-body-parts": {
    "category": "GETTING STARTED · BEGINNER LESSON 6 OF 12",
    "title": "Screeps Creep Body Parts: WORK, CARRY, and MOVE",
    "description": "Inspect one Creep's active WORK, CARRY, and MOVE parts, then use its action result, Store, fatigue, and damage to diagnose missing abilities.",
    "readingTime": "8 min read",
    "primaryKeyword": "Screeps Creep body parts",
    "searchIntent": "Beginner diagnostic lesson for matching harvest, Store, and movement failures to active WORK, CARRY, and MOVE parts",
    "finalScore": 98,
    "updatedAt": "2026-07-27",
    "keywords": [
      "Screeps Creep body parts",
      "Screeps WORK CARRY MOVE",
      "Creep.getActiveBodyparts()",
      "ERR_NO_BODYPART",
      "creep.body",
      "creep.fatigue"
    ]
  },
  "/en/blog/screeps-spawn-creep": {
    "category": "GETTING STARTED · BEGINNER LESSON 7 OF 12",
    "title": "Screeps spawnCreep(): Create Your First Creep",
    "description": "Use dryRun to validate a WORK-CARRY-MOVE body, submit one safe spawnCreep() request, read its return code, and verify the new Creep across later ticks.",
    "readingTime": "8 min read",
    "primaryKeyword": "Screeps spawnCreep",
    "searchIntent": "Beginner action tutorial for validating and submitting one fixed-name spawnCreep request, then verifying the result across later ticks",
    "finalScore": 98,
    "updatedAt": "2026-07-27",
    "keywords": [
      "Screeps spawnCreep",
      "create Creep Screeps",
      "StructureSpawn.spawnCreep()",
      "spawnCreep dryRun",
      "ERR_NOT_ENOUGH_ENERGY",
      "Screeps first Creep"
    ]
  },
  "/en/blog/screeps-creep-roles": {
    "category": "GETTING STARTED · BEGINNER LESSON 8 OF 12",
    "title": "Screeps Creep Roles: Harvester, Upgrader, and Builder",
    "description": "Learn why Harvester, Upgrader, and Builder are player-defined responsibilities, how roles differ from body parts, and why a Creep name does not create behavior.",
    "readingTime": "8 min read",
    "primaryKeyword": "Screeps Creep roles",
    "searchIntent": "Beginner concept lesson explaining player-defined Creep responsibilities, fixed-name teaching roles, and the difference between body ability, role, and current action",
    "finalScore": 98,
    "updatedAt": "2026-07-27",
    "keywords": [
      "Screeps Creep roles",
      "Screeps Harvester Upgrader Builder",
      "Screeps role vs body parts",
      "player-defined Creep roles",
      "Game.creeps names",
      "Screeps beginner roles"
    ]
  },
  "/en/blog/screeps-upgrade-controller": {
    "category": "GETTING STARTED · BEGINNER LESSON 9 OF 12",
    "title": "Screeps upgradeController(): Build Your First Upgrader Loop",
    "description": "Build one Upgrader1 loop that harvests from an active Source, moves within Controller range 3, spends Energy with upgradeController(), and switches state across ticks.",
    "readingTime": "10 min read",
    "primaryKeyword": "Screeps upgradeController",
    "searchIntent": "Beginner action tutorial for running one fixed-name Upgrader between an active Source and an owned Room Controller across repeated ticks",
    "finalScore": 98,
    "updatedAt": "2026-07-27",
    "keywords": [
      "Screeps upgradeController",
      "Creep.upgradeController()",
      "Screeps Upgrader code",
      "creep.memory.upgrading",
      "FIND_SOURCES_ACTIVE",
      "Room Controller range 3"
    ]
  },
  "/en/blog/screeps-err-not-in-range": {
    "category": "MOVEMENT · ACTION RANGE DEBUGGING",
    "title": "Screeps ERR_NOT_IN_RANGE: Use the Correct Action Range",
    "description": "Find the action that returned ERR_NOT_IN_RANGE, use its documented range, submit movement separately, and retry the action on a later tick.",
    "readingTime": "11 min read",
    "primaryKeyword": "Screeps ERR_NOT_IN_RANGE",
    "searchIntent": "Diagnose an action-distance failure and implement the correct move-then-retry boundary",
    "finalScore": 98,
    updatedAt: "2026-07-31",
    "keywords": [
      "Screeps ERR_NOT_IN_RANGE",
      "Screeps action range",
      "moveTo then retry",
      "upgradeController range 3",
      "Creep action return codes"
    ]
  },
  "/en/blog/screeps-moveto-not-moving": {
    "category": "MOVEMENT · MULTI-TICK PROGRESS DEBUGGING",
    "title": "Screeps moveTo() Returns OK but the Creep Stays Put",
    "description": "Verify movement over later ticks, then isolate fatigue, repeated movement intents, traffic, cached paths, room edges, and impossible stop ranges.",
    "readingTime": "13 min read",
    "primaryKeyword": "Screeps moveTo OK not moving",
    "searchIntent": "Diagnose accepted movement orders that show no position progress across later ticks",
    "finalScore": 98,
    updatedAt: "2026-07-31",
    "keywords": [
      "Screeps moveTo OK not moving",
      "Screeps Creep stuck",
      "Screeps movement diagnostic",
      "Creep fatigue",
      "Screeps duplicate movement intent"
    ]
  },
  "/en/blog/screeps-err-no-path": {
    "category": "MOVEMENT · PATH SEARCH DEBUGGING",
    "title": "Screeps ERR_NO_PATH: Diagnose Range, Matrices, and Routes",
    "description": "Separate ERR_NO_PATH from missing cached paths and incomplete PathFinder searches, then inspect goal range, CostMatrix rules, callbacks, limits, and room routes.",
    "readingTime": "15 min read",
    "primaryKeyword": "Screeps ERR_NO_PATH",
    "searchIntent": "Diagnose a failed path search without confusing it with traffic or accepted movement",
    "finalScore": 98,
    updatedAt: "2026-07-31",
    "keywords": [
      "Screeps ERR_NO_PATH",
      "Screeps PathFinder incomplete",
      "Screeps CostMatrix walkability",
      "roomCallback false Screeps",
      "Game.map.findRoute ERR_NO_PATH"
    ]
  },
  "/en/blog/screeps-memory-basics": {
    "category": "FOUNDATION · PERSISTENT STATE",
    "title": "Screeps Memory: Persistent State, Heap Cache, and Creep Data",
    "description": "Distinguish local variables, disposable heap cache, and persistent Memory; initialize Creep state safely; store JSON-compatible values; and recover current game objects from IDs.",
    "readingTime": "12 min read",
    "primaryKeyword": "Screeps Memory",
    "searchIntent": "Understand where cross-tick state belongs and implement durable Creep state without confusing Memory with disposable heap cache",
    "finalScore": 98,
    updatedAt: "2026-07-31",
    "keywords": [
      "Screeps Memory",
      "Screeps global heap cache",
      "creep.memory",
      "Memory.creeps",
      "Screeps state across ticks",
      "Game.getObjectById"
    ]
  },
  "/en/blog/screeps-spawncreep-return-codes": {
    "category": "SPAWNING · RETURN-CODE DIAGNOSIS",
    "title": "Screeps spawnCreep() Errors: Diagnose Every Return Code",
    "description": "Capture the actual Spawn request, interpret each documented return code, separate dryRun from the final submission, and verify scheduled spawning across later ticks.",
    "readingTime": "12 min read",
    "primaryKeyword": "Screeps spawnCreep return codes",
    "searchIntent": "Diagnose one failed spawnCreep request from its documented return code and verify the accepted operation across later ticks",
    "finalScore": 98,
    updatedAt: "2026-07-31",
    "keywords": [
      "Screeps spawnCreep return codes",
      "spawnCreep dryRun",
      "ERR_NOT_ENOUGH_ENERGY spawnCreep",
      "ERR_NAME_EXISTS Screeps",
      "ERR_BUSY spawnCreep",
      "ERR_INVALID_ARGS spawnCreep"
    ]
  },
  "/en/blog/screeps-cpu-getused-bucket": {
    "category": "RUNTIME · CPU PROFILING",
    "title": "Screeps CPU Profiling: Measure Code with Game.cpu.getUsed()",
    "description": "Measure one code section with Game.cpu.getUsed() deltas, compare equivalent server ticks, separate bucket context from profiling, and protect essential work before optional tasks.",
    "readingTime": "12 min read",
    "primaryKeyword": "Screeps Game.cpu.getUsed",
    "searchIntent": "Measure a specific Screeps code path accurately and protect the current tick without treating bucket thresholds as performance evidence",
    "finalScore": 98,
    updatedAt: "2026-07-31",
    "keywords": [
      "Screeps Game.cpu.getUsed",
      "Screeps CPU profiling",
      "Screeps CPU bucket",
      "Screeps tickLimit",
      "Screeps CPU measurement",
      "Screeps Simulation getUsed zero"
    ]
  }
};

const allPublishedEnglishArticles: EnglishArticleRecord[] = [
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
  ...englishControllerBatchFourteenRegistry,
  ...englishConstructionSafetyBatchFifteenRegistry,
  ...englishConfigCodeBatchSixteenRegistry,
  ...englishDefenseOperationsBatchSeventeenRegistry,
  ...englishLinkSourceBatchEighteenRegistry,
];

export const publishedEnglishArticles: EnglishArticleRecord[] =
  allPublishedEnglishArticles.map((article) => ({
    ...article,
    ...(articleRecordOverrides[article.href] ?? {}),
  }));

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
