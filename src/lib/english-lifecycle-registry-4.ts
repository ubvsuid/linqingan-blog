import type { DatedEnglishArticleRecord } from "./english-article-record-types";

export const englishLifecycleBatchFourRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-renew-creep",
    chinesePath: "/blog/screeps-spawn-renew-creep",
    category: "CREEP LIFECYCLE · RENEWAL IDENTITY",
    title: "Screeps renewCreep(): Requirements, Cost, and Return Codes",
    description:
      "Learn StructureSpawn.renewCreep() requirements, TTL and Energy formulas, Boost and CLAIM limits, return codes, and how to verify renewal on the next tick.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-09-10",
    readingTime: "22 min read",
    primaryKeyword: "Screeps renewCreep",
    searchIntent: "API guide for using StructureSpawn.renewCreep(), understanding eligibility, TTL and Energy formulas, return codes, and later-tick verification",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps renewCreep verification",
      "Screeps renewCreep TTL formula",
      "Screeps Spawn renewal coordinator",
      "Screeps renewCreep removes boosts",
      "Screeps Spawn Energy confound",
      "Screeps renewCreep",
      "StructureSpawn renewCreep",
      "Screeps renewCreep return codes",
    ],
  },
  {
    href: "/en/blog/screeps-recycle-creep",
    chinesePath: "/blog/screeps-spawn-recycle-creep",
    category: "CREEP LIFECYCLE · RECYCLING IDENTITY",
    title: "Screeps recycleCreep(): Verify the Exact Creep Retirement",
    description:
      "Bind one retirement request to exact Spawn and Creep IDs, reserve both objects, record pending evidence only after OK, then match the exact destruction event and Creep-tile Tombstone.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-08-04",
    readingTime: "23 min read",
    primaryKeyword: "Screeps recycleCreep verification",
    searchIntent: "Submit and verify one exact Creep recycling operation without automatic retry, name-only identity, Spawn-busy assumptions, or incorrect resource-drop evidence",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps recycleCreep verification",
      "Screeps recycle EVENT_OBJECT_DESTROYED",
      "Screeps recycling Tombstone store",
      "Screeps recycleCreep no ERR_BUSY",
      "Screeps recycleCreep exact Creep ID",
    ],
  },
];
