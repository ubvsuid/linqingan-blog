export interface EnglishArticleRecord {
  href: string;
  chinesePath: string;
  category: string;
  title: string;
  description: string;
  publishedAt: string;
  publishedLabel: string;
  readingTime: string;
  primaryKeyword: string;
  searchIntent: string;
  status: "published";
  finalScore: number;
  keywords: string[];
}

export const publishedEnglishArticles: EnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-creep-body-parts",
    chinesePath: "/blog/screeps-creep-body-parts",
    category: "BEGINNER · CREEP BODY",
    title: "Why Your Screeps Creep Cannot Harvest, Carry, or Move",
    description:
      "Connect WORK, CARRY, and MOVE to real Creep actions, inspect active body parts, calculate a basic body, and diagnose missing abilities.",
    publishedAt: "2026-07-24",
    publishedLabel: "July 24, 2026",
    readingTime: "10 min read",
    primaryKeyword: "Screeps Creep body parts",
    searchIntent: "Beginner explanation and ability diagnosis",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Creep body parts",
      "Screeps WORK CARRY MOVE",
      "getActiveBodyparts",
      "BODYPART_COST",
      "CARRY_CAPACITY",
    ],
  },
  {
    href: "/en/blog/screeps-transfer-energy-to-spawn",
    chinesePath: "/blog/screeps-creep-deliver-energy",
    category: "BEGINNER · ENERGY DELIVERY",
    title: "How to Make a Screeps Creep Deliver Energy to a Spawn",
    description:
      "Switch from harvesting to delivery, move to a named Spawn, handle transfer() results, and keep unloading after a partial transfer.",
    publishedAt: "2026-07-24",
    publishedLabel: "July 24, 2026",
    readingTime: "13 min read",
    primaryKeyword: "Screeps transfer energy to Spawn",
    searchIntent: "Beginner tutorial and task completion",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps transfer energy to Spawn",
      "Creep.transfer",
      "Game.spawns",
      "ERR_FULL",
      "RESOURCE_ENERGY",
    ],
  },
  {
    href: "/en/blog/screeps-creep-harvest-energy",
    chinesePath: "/blog/screeps-first-creep-harvest",
    category: "BEGINNER · ENERGY HARVESTING",
    title: "How to Make Your First Screeps Creep Harvest Energy",
    description:
      "Find a named Creep and Source, call harvest(), move only when range is insufficient, and inspect the action results across ticks.",
    publishedAt: "2026-07-24",
    publishedLabel: "July 24, 2026",
    readingTime: "11 min read",
    primaryKeyword: "Screeps Creep harvest Energy",
    searchIntent: "Beginner tutorial and first action debugging",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Creep harvest Energy",
      "Creep.harvest",
      "FIND_SOURCES",
      "ERR_NOT_IN_RANGE",
      "Creep.moveTo",
    ],
  },
  {
    href: "/en/blog/screeps-remove-construction-site",
    chinesePath: "/blog/screeps-construction-site-remove",
    category: "API SAFETY · CONSTRUCTION",
    title: "How to Remove a Construction Site Safely in Screeps",
    description:
      "Inspect a misplaced Construction Site, validate its identity, submit remove() once, handle return codes, and verify the result on the next tick.",
    publishedAt: "2026-07-24",
    publishedLabel: "July 24, 2026",
    readingTime: "12 min read",
    primaryKeyword: "Screeps remove construction site",
    searchIntent: "Safe API operation and troubleshooting",
    status: "published",
    finalScore: 100,
    keywords: [
      "Screeps remove construction site",
      "ConstructionSite.remove",
      "LOOK_CONSTRUCTION_SITES",
      "Game.getObjectById",
      "ERR_NOT_OWNER",
    ],
  },
];

export const englishArticleRoutePairs = Object.fromEntries(
  publishedEnglishArticles.map((article) => [article.chinesePath, article.href]),
) as Record<string, string>;
