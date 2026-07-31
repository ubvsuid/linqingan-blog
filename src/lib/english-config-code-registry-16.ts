import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishConfigCodeBatchSixteenRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-flags-configuration",
    chinesePath: "/blog/screeps-flags-config",
    category: "CONFIGURATION · FLAGS AND OBJECT REFERENCES",
    title: "How to Use Flags as Reviewed Configuration Instead of Hidden Automation",
    description:
      "Resolve exact Flag names from Game.flags, validate flag.memory fields, recover configured targets by ID before a deterministic local fallback, and report missing or stale configuration without mutating Flags.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    readingTime: "16 min read",
    primaryKeyword: "Screeps Game.flags configuration",
    searchIntent: "Use named Flags as explicit reviewed configuration without silently mutating the game world",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.flags configuration",
      "Screeps Flag memory",
      "Screeps Flag target ID",
      "Screeps Game.getObjectById flag",
      "Screeps missing Flag diagnostics",
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
