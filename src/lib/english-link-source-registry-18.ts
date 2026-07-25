import type { EnglishArticleRecord } from "./english-articles";

export const englishLinkSourceBatchEighteenRegistry: EnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-link-transfer-energy",
    chinesePath: "/blog/screeps-link-transfer-energy",
    category: "LOGISTICS · LINK ENERGY NETWORK",
    title: "How to Transfer Link Energy Without Depending on Structure Array Order",
    description:
      "Recover source and target Links by fixed IDs, require ownership, different objects, the same room, active structures and zero source cooldown, calculate a conservative amount from source stock and target free capacity, estimate LINK_LOSS_RATIO only for logs, and verify Store changes later.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    readingTime: "18 min read",
    primaryKeyword: "Screeps Link transferEnergy",
    searchIntent: "Transfer Energy between two explicitly identified owned Links with conservative capacity and cooldown checks",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Link transferEnergy",
      "Screeps Link cooldown",
      "Screeps LINK_LOSS_RATIO",
      "Screeps controller Link",
      "Screeps Link Energy amount",
    ],
  },
  {
    href: "/en/blog/screeps-select-source-by-path",
    chinesePath: "/blog/screeps-select-source-by-path",
    category: "HARVESTING · SOURCE TARGET SELECTION",
    title: "How to Select an Active Source by Reachable Path Without Target Churn",
    description:
      "Recover a stored Source ID first, distinguish FIND_SOURCES from FIND_SOURCES_ACTIVE, build reachable path candidates, rank path length before assignment count and stable ID, store the selected identity, handle empty Sources according to a documented dynamic policy, and preserve harvest and movement results.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    readingTime: "19 min read",
    primaryKeyword: "Screeps select Source by path",
    searchIntent: "Keep or select a reachable active Source with deterministic path and load ordering",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps select Source by path",
      "Screeps FIND_SOURCES_ACTIVE",
      "Screeps Source assignment count",
      "Screeps store Source ID",
      "Screeps findClosestByPath Source",
    ],
  },
];
