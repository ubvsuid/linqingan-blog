import type { EnglishArticleRecord } from "./english-articles";

export const englishLifecycleBatchFourRegistry: EnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-renew-creep",
    chinesePath: "/blog/screeps-spawn-renew-creep",
    category: "CREEP LIFECYCLE · RENEWAL",
    title: "How to Use renewCreep() Safely in Screeps",
    description:
      "Calculate the TTL and Energy gained per renewal, reject CLAIM Creeps, require explicit Boost removal approval, coordinate Spawn time, move adjacent, stop at a target TTL, and handle every documented result.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "17 min read",
    primaryKeyword: "Screeps renewCreep",
    searchIntent: "Safe Creep renewal decision, formula and return-code troubleshooting",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps renewCreep",
      "StructureSpawn renewCreep",
      "Screeps Creep TTL renewal",
      "renewCreep Energy formula",
      "renewCreep removes boosts",
    ],
  },
  {
    href: "/en/blog/screeps-recycle-creep",
    chinesePath: "/blog/screeps-spawn-recycle-creep",
    category: "CREEP LIFECYCLE · RECYCLING",
    title: "How to Recycle a Creep Safely in Screeps",
    description:
      "Use an explicit one-time confirmation request, validate the named Spawn and Creep, move adjacent, submit recycleCreep() once, avoid an automatic suicide fallback, and verify disappearance and resource drops on the next tick.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "16 min read",
    primaryKeyword: "Screeps recycleCreep",
    searchIntent: "Irreversible Creep retirement workflow and return-code troubleshooting",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps recycleCreep",
      "StructureSpawn recycleCreep",
      "Screeps recycle old Creep",
      "recycleCreep resource refund",
      "recycleCreep vs suicide",
    ],
  },
];