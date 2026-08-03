import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishMineralStoragePowerBatchTwelveRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-mineral-extractor-harvest",
    chinesePath: "/blog/screeps-mineral-extractor-harvest",
    category: "RESOURCES · MINERAL HARVESTING",
    title: "How to Harvest Minerals with an Extractor Safely",
    description:
      "Find the room Mineral, require a same-tile owned active Extractor, check mineralAmount, Extractor cooldown, active WORK parts, Creep capacity and range, handle harvest() return codes, and verify Store and regeneration state on later ticks.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    readingTime: "17 min read",
    primaryKeyword: "Screeps mineral harvesting",
    searchIntent: "Harvest a room Mineral only when the Extractor, Creep, capacity, range, and regeneration state are valid",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps mineral harvesting",
      "Screeps StructureExtractor cooldown",
      "Screeps mineralAmount ticksToRegeneration",
      "Screeps creep harvest mineral",
      "Screeps Extractor ERR_NOT_FOUND",
    ],
  },
  {
    href: "/en/blog/screeps-storage-energy-usage",
    chinesePath: "/blog/screeps-storage-energy-usage",
    category: "LOGISTICS · STORAGE BUDGET AND EVENT IDENTITY",
    title: "Screeps Storage Energy: Reserve Budgets and Verify Transfers",
    description:
      "Coordinate one shared Storage withdrawal budget and target capacity map, record only accepted withdraw or transfer calls, and verify the exact source-target event on the next tick.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-03",
    readingTime: "18 min read",
    primaryKeyword: "Screeps Storage Energy reserve",
    searchIntent:
      "Coordinate Storage Energy withdrawals and deliveries without crossing a shared reserve or misattributing another logistics action",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Storage Energy reserve",
      "Screeps withdraw event verification",
      "Screeps hauler capacity reservation",
      "Room.getEventLog EVENT_TRANSFER",
      "Screeps Storage logistics",
    ],
  },
  {
    href: "/en/blog/screeps-power-spawn-process-power",
    chinesePath: "/blog/screeps-power-spawn-process-power",
    category: "RESOURCES · POWER PROCESSING",
    title: "How to Process Power Without Breaking Your Energy Budget",
    description:
      "Recover an owned active Power Spawn, calculate base and PWR_OPERATE_POWER processing amounts, require Power and POWER_SPAWN_ENERGY_RATIO Energy, preserve a configurable room reserve, store GPL and resource snapshots, handle return codes, and verify later deltas.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    readingTime: "18 min read",
    primaryKeyword: "Screeps StructurePowerSpawn processPower",
    searchIntent: "Process Power continuously with explicit resource and room Energy safeguards",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps StructurePowerSpawn processPower",
      "Screeps POWER_SPAWN_ENERGY_RATIO",
      "Screeps PWR_OPERATE_POWER",
      "Screeps Game.gpl progress",
      "Screeps Power Spawn energy reserve",
    ],
  },
];
