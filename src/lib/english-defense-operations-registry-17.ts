import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishDefenseOperationsBatchSeventeenRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-nuker-launch",
    chinesePath: "/blog/screeps-nuker-launch-checklist",
    category: "DEFENSE · IRREVERSIBLE NUKER OPERATION",
    title: "How to Launch a Nuke Without Reusing a Stale Target Request",
    description:
      "Bind confirmation to target room and coordinates, recover an owned active Nuker by ID, check cooldown, NUKE_RANGE, Energy and Ghodium capacities, disable before launchNuke(), save the return code, and verify later evidence without requiring target-room visibility.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    readingTime: "19 min read",
    primaryKeyword: "Screeps launchNuke",
    searchIntent: "Submit one explicitly confirmed Nuker launch with current structure, resource, range, and target evidence",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps launchNuke",
      "Screeps StructureNuker checklist",
      "Screeps NUKE_RANGE",
      "Screeps Nuker Ghodium Energy",
      "Screeps launchNuke return codes",
    ],
  },
  {
    href: "/en/blog/screeps-rampart-set-public",
    chinesePath: "/blog/screeps-rampart-set-public",
    category: "DEFENSE · RAMPART ACCESS CONTROL",
    title: "How to Change Rampart Access Without Treating Public as an Ally List",
    description:
      "Lock a one-time setPublic() request to Rampart ID, room, coordinates, target boolean and target-bound confirmation, verify ownership and current state, disable before the call, save the result, and re-read isPublic later.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    readingTime: "17 min read",
    primaryKeyword: "Screeps Rampart setPublic",
    searchIntent: "Change one owned Rampart's public state with exact identity and one-time confirmation",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Rampart setPublic",
      "Screeps rampart isPublic",
      "Screeps public Rampart access",
      "Screeps Rampart confirmation request",
      "Screeps setPublic return codes",
    ],
  },
  {
    href: "/en/blog/screeps-wall-rampart-repair-limit",
    chinesePath: "/blog/screeps-wall-rampart-repair-limit",
    category: "DEFENSE · STAGED REPAIR AND EVENT IDENTITY",
    title: "Screeps Fortification Repair: Stages, Reservations, and Event Proof",
    description:
      "Set room-specific Wall and Rampart stages, reserve targets across repairers, record only accepted repair calls, and verify the exact Repairer-to-structure EVENT_REPAIR on the next tick.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-03",
    readingTime: "21 min read",
    primaryKeyword: "Screeps fortification repair limit",
    searchIntent: "Coordinate staged Wall and Rampart repair across multiple Creeps and verify the exact accepted repair action",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps fortification repair limit",
      "Screeps EVENT_REPAIR",
      "Screeps Wall Rampart stage",
      "Screeps repair target reservation",
      "Room.getEventLog repair",
    ],
  },
];
