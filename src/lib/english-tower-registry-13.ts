import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishTowerBatchThirteenRegistry:
  DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-tower-auto-attack-hostiles",
    chinesePath: "/blog/screeps-tower-auto-attack-hostiles",
    category: "DEFENSE · TOWER ATTACK EVENTS",
    title:
      "Screeps Tower.attack(): Verify One Multi-Tower Volley",
    description:
      "Bind one target and each Tower ID, estimate range- and Power-adjusted output for allocation, submit one attack intent per Tower, then verify exact prior-tick ranged-attack events instead of inferring a volley from net hits.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-01",
    readingTime: "15 min read",
    primaryKeyword: "Screeps StructureTower attack",
    searchIntent:
      "Submit one reviewed multi-Tower volley and verify every accepted Tower-target event on the next tick",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps StructureTower attack",
      "Screeps Tower event log",
      "Screeps multi Tower volley",
      "EVENT_ATTACK_TYPE_RANGED",
      "Screeps Tower range falloff",
    ],
  },
  {
    href: "/en/blog/screeps-tower-heal-creeps",
    chinesePath: "/blog/screeps-tower-heal-creeps",
    category: "DEFENSE · TOWER HEAL EVENTS",
    title:
      "Screeps Tower.heal(): Verify Exact Heal Events",
    description:
      "Include injured owned Creeps and Power Creeps, rank urgency deterministically, estimate range-adjusted healing to limit over-heal, submit one intent per Tower, and verify exact prior-tick ranged-heal events.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-01",
    readingTime: "15 min read",
    primaryKeyword: "Screeps StructureTower heal",
    searchIntent:
      "Allocate Tower healing to owned Creeps or Power Creeps and verify every accepted ranged-heal event",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps StructureTower heal",
      "Screeps Tower heal event",
      "FIND_MY_POWER_CREEPS",
      "EVENT_HEAL_TYPE_RANGED",
      "Screeps Tower over heal",
    ],
  },
  {
    href: "/en/blog/screeps-tower-repair-threshold",
    chinesePath: "/blog/screeps-tower-repair-threshold",
    category: "DEFENSE · TOWER REPAIR EVENTS",
    title:
      "Screeps Tower.repair(): Verify Exact Repair Events",
    description:
      "Preserve a defense Energy reserve, select an ordinary damaged structure, estimate range-adjusted repair to limit over-repair, submit one intent per Tower, then verify exact prior-tick repair events and Energy spent.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-01",
    readingTime: "16 min read",
    primaryKeyword: "Screeps StructureTower repair",
    searchIntent:
      "Repair one ordinary structure under a reserve and verify each accepted Tower repair event and Energy cost",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps StructureTower repair",
      "Screeps Tower repair event",
      "EVENT_REPAIR energySpent",
      "Screeps Tower repair falloff",
      "Screeps Tower Energy reserve",
    ],
  },
];
