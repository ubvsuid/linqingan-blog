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
    category: "CREEP LIFECYCLE · RECYCLING IDENTITY",
    title: "Screeps recycleCreep(): Verify the Exact Creep Retirement",
    description:
      "Bind one retirement request to exact Spawn and Creep IDs, reserve both objects for the tick, record pending evidence only after OK, verify the exact Creep disappears, and label drop evidence as confounded.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-08-04",
    readingTime: "22 min read",
    primaryKeyword: "Screeps recycleCreep verification",
    searchIntent: "Submit and verify one exact Creep recycling operation without automatic retry, name-only identity, Spawn-busy assumptions, or invented refund proof",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps recycleCreep verification",
      "Screeps recycle exact Creep ID",
      "Screeps recycling resource drops",
      "Screeps recycleCreep no ERR_BUSY",
      "Screeps recycleCreep vs suicide",
    ],
  },
];
