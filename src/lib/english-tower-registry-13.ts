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
    category: "DEFENSE · TOWER HEAL PRIORITY",
    title:
      "Screeps Tower Healing: Injury Ratio, Missing Hits, and Range",
    description:
      "Find injured owned Creeps, rank lower hit ratios before missing hits and nearest-Tower range, require active owned Towers with TOWER_ENERGY_COST, save heal() results, avoid caching stale targets, and leave over-heal optimization to a later dispatcher.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-28",
    readingTime: "17 min read",
    primaryKeyword: "Screeps Tower heal Creeps",
    searchIntent:
      "Heal the most urgent owned injured Creep with deterministic Tower priorities",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Tower heal Creeps",
      "Screeps StructureTower heal",
      "Screeps injured Creep priority",
      "Screeps Tower heal range falloff",
      "Screeps TOWER_ENERGY_COST",
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
