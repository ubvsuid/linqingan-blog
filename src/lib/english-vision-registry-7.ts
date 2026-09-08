import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishVisionBatchSevenRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-room-visibility",
    chinesePath: "/blog/screeps-room-visibility",
    category: "VISION · GAME.ROOMS AND LIVE OBJECTS",
    title: "Why Is Game.rooms[roomName] Undefined in Screeps?",
    description:
      "Understand when a Room exists in Game.rooms, separate current-tick visibility from historical Memory, guard Controller and structure reads, and build a safe visibility-first inspection helper.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "13 min read",
    primaryKeyword: "Screeps Game.rooms undefined",
    searchIntent: "Explain why a Room object is missing and inspect visible rooms safely",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.rooms undefined",
      "Screeps room visibility",
      "Game.rooms roomName",
      "Screeps Memory rooms vs Game rooms",
      "Screeps visible room object",
    ],
  },
  {
    href: "/en/blog/screeps-observer-observe-room",
    chinesePath: "/blog/screeps-observer-observe-room",
    category: "VISION · SINGLE-CALL OBSERVER COORDINATION",
    title: "Screeps Observer: Coordinate One Final observeRoom() Call",
    description:
      "Collect requests, choose one target per Observer, make one final observeRoom() call, store only that accepted target, read it next tick, and keep visibility attribution honest.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-07-31",
    readingTime: "13 min read",
    primaryKeyword: "Screeps StructureObserver observeRoom",
    searchIntent:
      "Coordinate multiple vision producers into one final Observer call and track only the request that can actually execute",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps StructureObserver observeRoom",
      "Screeps Observer multiple calls",
      "observeRoom last call",
      "Screeps Observer next tick",
      "Screeps Observer coordinator",
    ],
  },
  {
    href: "/en/blog/screeps-pathfinder-costmatrix",
    chinesePath: "/blog/screeps-pathfinder-costmatrix",
    category: "PATHFINDING · COSTMATRIX DIAGNOSTICS",
    title: "Screeps CostMatrix 255: Why It Means Unwalkable",
    description:
      "In Screeps PathFinder, a CostMatrix cost of 255 is unwalkable. See what 0, 1–254, and 255 mean, plus practical road, obstacle, and roomCallback rules.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-07-31",
    readingTime: "13 min read",
    primaryKeyword: "Screeps CostMatrix 255",
    searchIntent:
      "Explain why CostMatrix 255 is unwalkable, then apply 0, finite custom costs, hard obstacles, roomCallback behavior, and incomplete-path checks correctly",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps CostMatrix 255",
      "Screeps CostMatrix unwalkable",
      "Screeps PathFinder CostMatrix 255",
      "PathFinder roomCallback",
      "Screeps CostMatrix obstacle",
    ],
  },
];
