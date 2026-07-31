import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishObservabilityBatchNineRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-game-notify",
    chinesePath: "/blog/screeps-game-notify",
    category: "OBSERVABILITY · NOTIFICATION SUBMISSION",
    title: "Screeps Game.notify(): Queue Alerts and Mark Them Submitted",
    description:
      "Separate detected, queued, submitted, and externally delivered states; cap calls at 20; preserve deferred alerts; cancel recovered risks; and advance cooldowns only at the API call site.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-07-31",
    readingTime: "13 min read",
    primaryKeyword: "Screeps Game.notify",
    searchIntent:
      "Queue stateful Screeps alerts without starting submission cooldowns for deferred, expired, or cancelled items",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.notify",
      "Screeps notification queue",
      "Game.notify 20 per tick",
      "Game.notify groupInterval minutes",
      "Screeps alert submitted vs delivered",
    ],
  },
  {
    href: "/en/blog/screeps-room-event-log",
    chinesePath: "/blog/screeps-room-event-log",
    category: "OBSERVABILITY · PREVIOUS-TICK EVENT LOGS",
    title: "How to Read Room.getEventLog() Safely in Screeps",
    description:
      "Read previous-tick room events, distinguish parsed arrays from raw JSON strings, validate event-specific data, preserve IDs when objects disappear, filter attacks on owned targets, and store bounded aggregates instead of unlimited history.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "18 min read",
    primaryKeyword: "Screeps Room.getEventLog",
    searchIntent: "Read and normalize previous-tick events without misattributing current commands",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Room.getEventLog",
      "Screeps previous tick events",
      "Screeps EVENT_ATTACK",
      "Room.getEventLog raw",
      "Screeps event history",
    ],
  },
  {
    href: "/en/blog/screeps-roomvisual-debug",
    chinesePath: "/blog/screeps-roomvisual-debug",
    category: "OBSERVABILITY · BOUNDED ROOM VISUALS",
    title: "Screeps RoomVisual Debugging: Draw Current State Within a Budget",
    description:
      "Plan current-tick debug marks from plain data, render them behind a room switch, stop on item and byte budgets, and record action results separately from drawings.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-07-31",
    readingTime: "12 min read",
    primaryKeyword: "Screeps RoomVisual debugging",
    searchIntent:
      "Add bounded RoomVisual diagnostics that observe current state without mutating task decisions or pretending drawings prove outcomes",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps RoomVisual debugging",
      "RoomVisual getSize",
      "Screeps visual byte limit",
      "Screeps draw current state",
      "Screeps RoomVisual CPU",
    ],
  },
];
