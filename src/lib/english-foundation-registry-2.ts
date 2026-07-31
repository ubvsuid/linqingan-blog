import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishFoundationBatchTwoRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-working-state",
    chinesePath: "/blog/screeps-creep-working-state",
    category: "FOUNDATION · WORKING STATE",
    title: "How to Switch a Screeps Creep Between Getting Energy and Working",
    description:
      "Build a stable two-phase working state from Store boundaries, keep the previous state at partial Energy, handle initialization and invalid capacity, and separate harvesting from Controller upgrading.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "15 min read",
    primaryKeyword: "Screeps working state",
    searchIntent: "State-switching tutorial and task-flapping troubleshooting",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps working state",
      "creep.memory.working",
      "Screeps switch harvesting and working",
      "Screeps Creep state machine",
      "Store getUsedCapacity getFreeCapacity",
    ],
  },
  {
    href: "/en/blog/screeps-get-object-by-id",
    chinesePath: "/blog/screeps-game-get-object-by-id",
    category: "FOUNDATION · TARGET RESTORATION",
    title: "How to Restore a Screeps Target from Memory with Game.getObjectById()",
    description:
      "Store an object ID and room name, recover the current object every tick, distinguish missing vision from a destroyed target, validate the restored type, and define an explicit invalidation policy.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "16 min read",
    primaryKeyword: "Screeps Game.getObjectById",
    searchIntent: "Target-restoration tutorial and null-result troubleshooting",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.getObjectById",
      "Screeps save target ID Memory",
      "Game.getObjectById null",
      "Screeps restore Source target",
      "Screeps room vision target",
    ],
  },
  {
    href: "/en/blog/screeps-clean-dead-creep-memory",
    chinesePath: "/blog/screeps-clean-dead-creep-memory",
    category: "MEMORY · DEAD-CREEP CLEANUP",
    title: "Screeps Dead Creep Memory: Clean Names and Owned Indexes",
    description:
      "Collect names absent from Game.creeps, remove their Creep-owned Memory, clean only documented name indexes, bound logs, and keep death cause and shared queues separate.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-07-31",
    readingTime: "11 min read",
    primaryKeyword: "Screeps clean dead Creep Memory",
    searchIntent:
      "Remove confirmed stale Creep-name state without deleting unrelated Memory or inventing a death cause",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps clean dead Creep Memory",
      "Memory.creeps cleanup",
      "Game.creeps dead Creep",
      "Screeps stale Creep assignment",
      "Screeps Creep name reuse",
    ],
  },
];
