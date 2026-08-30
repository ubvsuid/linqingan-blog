import type { EnglishArticleRecord } from "./english-articles";
import { englishCreepAttackBatchTwentyOneRegistry } from "./english-creep-attack-registry-21";

export type EnglishOriginalArticleRecord = Omit<EnglishArticleRecord, "chinesePath"> & {
  chinesePath?: undefined;
  updatedAt?: string;
};

// Production keeps this legacy export name for compatibility, but the array is
// the published English-original standalone registry entry point.
export const englishStandalonePublishedRegistry: EnglishOriginalArticleRecord[] = [
  {
    href: "/en/blog/screeps-pathfinder-search",
    category: "MOVEMENT · PATHFINDER SEARCH",
    title: "Screeps PathFinder.search(): Goal Range, Complete Paths, and the incomplete Flag",
    description:
      "Call PathFinder.search() with the goal range your action actually needs, interpret path, ops, cost, and incomplete correctly, and reject partial paths before handing movement to a Creep.",
    publishedAt: "2026-08-29",
    publishedLabel: "August 29, 2026",
    readingTime: "15 min read",
    primaryKeyword: "Screeps PathFinder.search",
    searchIntent:
      "Run and interpret one PathFinder.search() call with the correct goal range, then reject incomplete partial paths before downstream movement or task assignment",
    status: "published",
    finalScore: 97,
    keywords: [
      "Screeps PathFinder.search",
      "Screeps PathFinder incomplete",
      "Screeps PathFinder goal range",
      "Screeps PathFinder path cost",
      "Screeps partial path",
    ],
    updatedAt: "2026-08-29",
  },
  {
    href: "/en/blog/screeps-creep-pull",
    category: "MOVEMENT · CREEP PULL",
    title: "Screeps Creep.pull(): Coordinate Two Creeps in One Tick",
    description:
      "Coordinate Creep.pull(), the puller's movement, and target.move(puller) in the same tick, handle adjacency and fatigue correctly, and verify the pair moved later.",
    publishedAt: "2026-08-29",
    publishedLabel: "August 29, 2026",
    readingTime: "13 min read",
    primaryKeyword: "Screeps Creep.pull",
    searchIntent:
      "Coordinate one adjacent puller-target Creep pair so Creep.pull() and both movement intents produce one valid pulled step, while handling range, MOVE, fatigue, and later-tick verification",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Creep.pull",
      "Screeps pull creep",
      "Screeps target.move puller",
      "Screeps pulling fatigue",
      "Screeps creep pair movement",
    ],
    updatedAt: "2026-08-29",
  },
  ...englishCreepAttackBatchTwentyOneRegistry,
];

export const englishPathfinderBatchNineteenRegistry =
  englishStandalonePublishedRegistry;
