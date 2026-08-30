import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishObservabilityBatchNineRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-game-notify",
    chinesePath: "/blog/screeps-game-notify",
    category: "OBSERVABILITY · RATE-LIMITED NOTIFICATIONS",
    title: "Screeps Game.notify(): Send Rate-Limited Alerts Safely",
    description:
      "Call Game.notify(), use groupInterval and simple Memory incident state to avoid repeated alerts, preserve the checked engine result, and keep scheduling separate from external email delivery.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-08-30",
    readingTime: "11 min read",
    primaryKeyword: "Screeps Game.notify",
    searchIntent:
      "Send a Screeps notification for a recurring game condition without calling every tick or claiming that local scheduling proves external email delivery",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.notify",
      "Screeps email notification",
      "Game.notify groupInterval",
      "Screeps notification rate limit",
      "Screeps 20 notifications per tick",
    ],
  },
  {
    href: "/en/blog/screeps-room-event-log",
    chinesePath: "/blog/screeps-room-event-log",
    category: "OBSERVABILITY · ROOM EVENT LOG",
    title: "Screeps Room.getEventLog(): Read Previous-Tick Events",
    description:
      "Read the previous tick's Room events, distinguish parsed and raw mode, filter event-specific data safely, match actor and target IDs when attribution matters, and keep optional history bounded.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-08-30",
    readingTime: "11 min read",
    primaryKeyword: "Screeps Room.getEventLog",
    searchIntent:
      "Read and filter the previous tick's Room events without confusing them with current-tick action results",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Room.getEventLog",
      "Screeps previous tick events",
      "Screeps EVENT_REPAIR",
      "Room.getEventLog raw",
      "Screeps event log debugging",
    ],
  },
  {
    href: "/en/blog/screeps-roomvisual-debug",
    chinesePath: "/blog/screeps-roomvisual-debug",
    category: "OBSERVABILITY · ROOM VISUAL DEBUGGING",
    title: "Screeps RoomVisual: Draw Debug Labels and Paths",
    description:
      "Draw current-tick circles, labels, and lines with RoomVisual, keep coordinates in the correct Room, understand one-tick lifetime and the 512,000-byte limit, and avoid treating visuals as action evidence.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-08-30",
    readingTime: "10 min read",
    primaryKeyword: "Screeps RoomVisual",
    searchIntent:
      "Draw temporary RoomVisual debug markers for current Creeps and targets without confusing browser visuals with game-state results",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps RoomVisual",
      "Screeps visual debugging",
      "RoomVisual text circle line",
      "RoomVisual getSize",
      "Screeps debug Creep target",
    ],
  },
  {
    href: "/en/blog/screeps-room-error-isolation",
    chinesePath: "/blog/screeps-room-error-isolation",
    category: "OPERATIONS · ROOM ERROR ISOLATION",
    title: "Screeps Room Error Isolation: Keep Other Rooms Running",
    description:
      "Catch JavaScript exceptions at room or subsystem boundaries, retain bounded rate-limited evidence, pause repeatedly failing optional work, and retry after cooldown without confusing API return codes or CPU termination with exceptions.",
    publishedAt: "2026-08-06",
    publishedLabel: "August 6, 2026",
    readingTime: "18 min read",
    primaryKeyword: "Screeps room error isolation",
    searchIntent:
      "Keep unaffected rooms running after one room or optional subsystem throws a JavaScript exception",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps room error isolation",
      "Screeps try catch room loop",
      "Screeps one room error stops other rooms",
      "Screeps runtime circuit breaker",
      "Screeps structured error logging",
    ],
  },
];
