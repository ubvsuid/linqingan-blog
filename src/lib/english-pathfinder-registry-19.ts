import type { EnglishArticleRecord } from "./english-articles";

export type EnglishOriginalArticleRecord = Omit<EnglishArticleRecord, "chinesePath"> & {
  chinesePath?: undefined;
  updatedAt?: string;
};

export const englishPathfinderBatchNineteenRegistry: EnglishOriginalArticleRecord[] = [
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
];
