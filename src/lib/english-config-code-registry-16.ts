import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishConfigCodeBatchSixteenRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-flags-configuration",
    chinesePath: "/blog/screeps-flags-config",
    category: "CONFIGURATION · FLAG AND TARGET BINDING",
    title: "Screeps Flags: Bind Configuration to Room and Target Identity",
    description:
      "Resolve an exact Flag, validate its schema, bind saved object IDs to the Flag room and expected type, make fallback an explicit policy, and report configuration drift without mutating the Flag.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-07-31",
    readingTime: "12 min read",
    primaryKeyword: "Screeps Game.flags configuration",
    searchIntent:
      "Validate a named Flag and bind its saved target to the expected object type and Flag room without silent fallback",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.flags configuration",
      "Screeps Flag target ID",
      "Screeps Flag room mismatch",
      "Screeps Flag memory schema",
      "Screeps fail closed configuration",
    ],
  },
  {
    href: "/en/blog/screeps-require-modules",
    chinesePath: "/blog/screeps-modules-require",
    category: "CODE ORGANIZATION · TICK-SAFE MODULE CONTRACTS",
    title: "Screeps Modules: One Main Loop, Small Contracts, Fresh Tick Data",
    description:
      "Keep one main loop, export small functions, pass current game objects into modules, validate role contracts once per runtime, isolate per-Creep failures, and keep durable state out of module scope.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-07-31",
    readingTime: "13 min read",
    primaryKeyword: "Screeps require modules",
    searchIntent:
      "Structure Screeps modules around one loop and explicit contracts while keeping current-tick objects fresh and persistent state in Memory",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps require modules",
      "Screeps module.exports loop",
      "Screeps role module contract",
      "Screeps CommonJS",
      "Screeps fresh tick objects",
    ],
  },
];
