import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishRuntimeBatchEightRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-cpu-getused-bucket",
    chinesePath: "/blog/screeps-cpu-getused-bucket",
    category: "RUNTIME · CPU MEASUREMENT AND BUDGETING",
    title: "How to Measure and Control CPU Usage in Screeps",
    description:
      "Measure CPU with Game.cpu.getUsed() deltas, understand limit, tickLimit, and bucket, avoid Simulation-only conclusions, collect bounded samples, and gate optional work without hiding essential room logic.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "17 min read",
    primaryKeyword: "Screeps Game.cpu.getUsed",
    searchIntent: "Measure real Screeps CPU and design safe bucket-aware work budgets",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.cpu.getUsed",
      "Screeps CPU bucket",
      "Screeps tickLimit",
      "Screeps CPU profiling",
      "Screeps Simulation getUsed zero",
    ],
  },
  {
    href: "/en/blog/screeps-global-cache",
    chinesePath: "/blog/screeps-global-cache",
    category: "RUNTIME · REBUILDABLE GLOBAL CACHE",
    title: "Screeps Global Cache: Rebuildable Data Across Runtime Ticks",
    description:
      "Cache derived IDs and plain data in global, rebuild after resets, invalidate with explicit versions, and keep callers correct when the cache is missing or stale.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-07-31",
    readingTime: "12 min read",
    primaryKeyword: "Screeps global cache",
    searchIntent:
      "Implement one rebuildable global cache without treating disposable runtime data as persistent state",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps global cache",
      "Screeps global reset",
      "Screeps cache invalidation",
      "cache object IDs Screeps",
      "Screeps global vs Memory",
    ],
  },
  {
    href: "/en/blog/screeps-rawmemory-segments",
    chinesePath: "/blog/screeps-rawmemory-segments",
    category: "STORAGE · SEGMENT ACTIVATION LIFECYCLE",
    title: "Screeps RawMemory Segments: Request, Read, and Write Across Ticks",
    description:
      "Request active Segment IDs once, read them on a later tick, distinguish unavailable from empty, validate versioned JSON, and write only after a successful read.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-07-31",
    readingTime: "13 min read",
    primaryKeyword: "Screeps RawMemory Segments",
    searchIntent:
      "Implement one coordinated request-read-write Segment lifecycle without same-tick activation assumptions",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps RawMemory Segments",
      "setActiveSegments next tick",
      "RawMemory.segments undefined",
      "Screeps Segment manager",
      "Screeps Segment 100 KB",
    ],
  },
];
