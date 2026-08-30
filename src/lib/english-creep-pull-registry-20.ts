import type { EnglishArticleRecord } from "./english-articles";

type EnglishCreepPullArticleRecord = Omit<EnglishArticleRecord, "chinesePath"> & {
  chinesePath?: undefined;
  updatedAt?: string;
};

export const englishCreepPullBatchTwentyRegistry: EnglishCreepPullArticleRecord[] = [
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
];
