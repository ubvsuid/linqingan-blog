import type { DatedEnglishArticleRecord } from "./english-article-record-types";

export const englishMineralStoragePowerBatchTwelveRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-mineral-extractor-harvest",
    chinesePath: "/blog/screeps-mineral-extractor-harvest",
    category: "RESOURCES · MINERAL HARVEST EVENT IDENTITY",
    title: "Screeps Mineral Harvesting: Exact Miner and Mineral Event Identity",
    description:
      "Validate the same-tile Extractor and Miner, record only accepted harvest calls, match the exact EVENT_HARVEST on the next tick, and separate event identity from Store overflow and depletion.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-03",
    readingTime: "20 min read",
    primaryKeyword: "Screeps mineral harvest event",
    searchIntent: "Run and verify one exact Mineral harvest action while handling Extractor cooldown, depletion, Store overflow and the one-tick event window",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps mineral harvest event",
      "Screeps EVENT_HARVEST mineral",
      "Screeps Extractor cooldown",
      "Screeps Mineral depletion",
      "Room.getEventLog harvest",
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
    title: "Screeps processPower(): Energy Ratio, GPL, and Reserves",
    description:
      "Recover an owned active Power Spawn, calculate base and PWR_OPERATE_POWER processing amounts, require Power and POWER_SPAWN_ENERGY_RATIO Energy, preserve a configurable room reserve, store GPL and resource snapshots, handle return codes, and verify later deltas.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-30",
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
