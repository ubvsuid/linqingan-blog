import type { DatedEnglishArticleRecord } from "./english-article-record-types";

export const englishSpawnEgressBatchNineteenRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-spawn-exit-blocked",
    chinesePath: "/blog/screeps-spawn-exit-blocked",
    category: "SPAWNING · EXIT BLOCKAGE DIAGNOSIS",
    title: "Screeps Spawn Exit Blocked: directions and Egress Recovery",
    description:
      "Distinguish normal spawn time from blocked egress, inspect all eight adjacent tiles, use spawnCreep directions and Spawning.setDirections safely, move owned blockers, and verify release on a later tick without cancelling the Creep.",
    publishedAt: "2026-08-06",
    publishedLabel: "August 6, 2026",
    readingTime: "20 min read",
    primaryKeyword: "Screeps Spawn exit blocked",
    searchIntent:
      "Diagnose a Spawn whose Creep has completed its timer but cannot leave an allowed adjacent tile",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Spawn exit blocked",
      "Screeps Creep stuck spawning",
      "Screeps spawnCreep directions",
      "StructureSpawn Spawning setDirections",
      "Screeps Spawn egress",
    ],
  },
];
