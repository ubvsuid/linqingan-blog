import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishObservabilityBatchNineRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-game-notify",
    chinesePath: "/blog/screeps-game-notify",
    category: "OBSERVABILITY · NOTIFICATION REVISION IDENTITY",
    title: "Screeps Game.notify(): Bind Alert Payload Identity Before Submission",
    description:
      "Bind each notification to an exact request revision and payload digest, reserve one incident per tick, record local submission only at the Game.notify call site, and keep external delivery unverified.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-08-05",
    readingTime: "20 min read",
    primaryKeyword: "Screeps Game.notify payload identity",
    searchIntent:
      "Queue and submit one exact Screeps notification revision without stale payload approval, duplicate incident submission, or false delivery claims",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.notify payload identity",
      "Screeps notification revision",
      "Game.notify 20 per tick",
      "Game.notify groupInterval minutes",
      "Screeps notification submitted vs delivered",
    ],
  },
  {
    href: "/en/blog/screeps-room-event-log",
    chinesePath: "/blog/screeps-room-event-log",
    category: "OBSERVABILITY · PREVIOUS-TICK WINDOW IDENTITY",
    title: "Screeps Room.getEventLog(): Bind Exact Previous-Tick Windows",
    description:
      "Bind every parsed event window to one room, one previous tick and one schema version; accept ownership snapshots only from that exact event tick; commit once; and report missed windows as non-replayable.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-08-05",
    readingTime: "22 min read",
    primaryKeyword: "Screeps Room.getEventLog previous tick",
    searchIntent:
      "Ingest one exact Room event-log window without stale ownership evidence, duplicate commits, raw-mode confusion, or fictional backfill",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Room.getEventLog previous tick",
      "Screeps event window identity",
      "Screeps ownership snapshot capturedAt",
      "Screeps event log no backfill",
      "Screeps parsed event schema",
    ],
  },
  {
    href: "/en/blog/screeps-roomvisual-debug",
    chinesePath: "/blog/screeps-roomvisual-debug",
    category: "OBSERVABILITY · ROOM-BOUND VISUAL IDENTITY",
    title: "Screeps RoomVisual: Coordinate One Room-Bound Debug Layer",
    description:
      "Bind every debug layer to one room and capture tick, reject cross-room snapshots, detect earlier visual writers, reserve unique layer IDs, and keep drawing output separate from game-state evidence.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-08-05",
    readingTime: "21 min read",
    primaryKeyword: "Screeps RoomVisual room identity",
    searchIntent:
      "Render bounded Screeps RoomVisual diagnostics without cross-room coordinates, competing clear or import calls, duplicate layers, or false outcome claims",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps RoomVisual room identity",
      "Screeps RoomVisual dispatcher",
      "RoomVisual getSize 512000",
      "Screeps cross-room visual snapshot",
      "Screeps RoomVisual clear import coordination",
    ],
  },
];