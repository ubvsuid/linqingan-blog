import type { DatedEnglishArticleRecord } from "./english-article-record-types";

export const englishLifecycleBatchFourRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-renew-creep",
    chinesePath: "/blog/screeps-spawn-renew-creep",
    category: "CREEP LIFECYCLE · RENEWAL IDENTITY",
    title: "Screeps renewCreep(): Coordinate Spawn Time and Verify TTL Gain",
    description:
      "Reserve one Spawn and Creep per tick, record only accepted renewCreep calls, verify the exact TTL and Boost signature on the next tick, and label Energy-transfer confounds.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-08-03",
    readingTime: "22 min read",
    primaryKeyword: "Screeps renewCreep verification",
    searchIntent: "Coordinate one exact Creep renewal and distinguish accepted intent, observed TTL gain, Spawn Energy changes, Boost removal, and contention",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps renewCreep verification",
      "Screeps renewCreep TTL formula",
      "Screeps Spawn renewal coordinator",
      "Screeps renewCreep removes boosts",
      "Screeps Spawn Energy confound",
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
