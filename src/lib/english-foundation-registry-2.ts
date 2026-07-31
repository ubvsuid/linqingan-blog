import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishFoundationBatchTwoRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-working-state",
    chinesePath: "/blog/screeps-creep-working-state",
    category: "FOUNDATION · ENERGY PHASE HYSTERESIS",
    title: "Screeps Working State: Switch Only at Empty and Full",
    description:
      "Enter acquire at zero Energy, enter work when full, preserve the previous phase at partial values, initialize explicitly, and keep state selection separate from actions and outcomes.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-07-31",
    readingTime: "11 min read",
    primaryKeyword: "Screeps working state",
    searchIntent:
      "Stop a Creep from flipping tasks by applying an explicit empty/full Energy-phase hysteresis rule before action selection",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps working state",
      "Screeps Energy phase",
      "creep.memory working switch",
      "Screeps empty full hysteresis",
      "Store getUsedCapacity getFreeCapacity",
    ],
  },
  {
    href: "/en/blog/screeps-get-object-by-id",
    chinesePath: "/blog/screeps-game-get-object-by-id",
    category: "FOUNDATION · SAVED TARGET RESOLUTION",
    title: "Screeps Game.getObjectById(): Resolve Saved Targets Safely",
    description:
      "Save an ID with room and kind metadata, return explicit invalid, no-vision, missing, wrong-type, and ready states, and keep restoration separate from reselection and actions.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-07-31",
    readingTime: "12 min read",
    primaryKeyword: "Screeps Game.getObjectById",
    searchIntent:
      "Resolve one saved target and distinguish invalid data, missing vision, missing object, and wrong type before task logic decides what to do",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.getObjectById",
      "Game.getObjectById null",
      "Screeps saved target ID",
      "Screeps target room visibility",
      "Screeps restore Memory target",
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
