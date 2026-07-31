import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishMovementBatchSixRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-move-fatigue-body-ratio",
    chinesePath: "/blog/screeps-move-fatigue-body-ratio",
    category: "MOVEMENT · FATIGUE AND BODY DESIGN",
    title: "How to Calculate Screeps Creep Movement Speed",
    description:
      "Calculate unboosted Creep movement from MOVE recovery, loaded body weight, road, plain, and swamp costs; account for empty CARRY parts; and separate a static body estimate from live multi-tick movement proof.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "16 min read",
    primaryKeyword: "Screeps MOVE parts ratio",
    searchIntent: "Calculate Creep movement speed and choose an unboosted MOVE ratio",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps MOVE parts ratio",
      "Screeps fatigue calculation",
      "Creep movement speed",
      "Screeps road plain swamp cost",
      "empty CARRY fatigue",
    ],
  },
  {
    href: "/en/blog/screeps-roomposition-distance",
    chinesePath: "/blog/screeps-roomposition-distance",
    category: "MOVEMENT · ROOMPOSITION DISTANCE",
    title: "Which Screeps RoomPosition Distance Method Should You Use?",
    description:
      "Choose between getRangeTo(), inRangeTo(), isNearTo(), isEqualTo(), findClosestByRange(), findClosestByPath(), and findInRange() without confusing linear range with route reachability.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "15 min read",
    primaryKeyword: "Screeps RoomPosition distance",
    searchIntent: "Select the correct range, equality, adjacency, filtering, or path method",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps RoomPosition distance",
      "getRangeTo vs findClosestByPath",
      "Screeps isNearTo same tile",
      "findClosestByRange Screeps",
      "Screeps action range",
    ],
  },
  {
    href: "/en/blog/screeps-map-find-route",
    chinesePath: "/blog/screeps-map-find-route",
    category: "MOVEMENT · CROSS-ROOM ROUTE EXECUTION",
    title: "Screeps Game.map.findRoute(): Plan and Execute One Room Step",
    description:
      "Separate room planning from exit-tile pathfinding, validate the first route step, use finite risk costs versus hard bans, and verify the border transition on later ticks.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-07-31",
    readingTime: "14 min read",
    primaryKeyword: "Screeps Game.map.findRoute",
    searchIntent:
      "Turn one room-level route result into a validated, reachable next-room movement step",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.map.findRoute",
      "Screeps cross-room route",
      "Screeps routeCallback Infinity",
      "Screeps exit tile",
      "Game.map.describeExits",
      "Screeps room transition",
    ],
  },
];
