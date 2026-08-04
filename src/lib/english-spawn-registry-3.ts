import type { DatedEnglishArticleRecord } from "./english-article-record-types";

export const englishSpawnBatchThreeRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-spawncreep-return-codes",
    chinesePath: "/blog/screeps-spawncreep-return-codes",
    category: "SPAWNING · RETURN-CODE DEBUGGING",
    title: "How to Debug spawnCreep() Return Codes in Screeps",
    description:
      "Validate the Spawn, Creep name, body, Energy, Memory, and optional structures; run dryRun first; preserve the real spawnCreep() result; and map each error code to a concrete fix.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "16 min read",
    primaryKeyword: "Screeps spawnCreep return codes",
    searchIntent: "Focused spawn request diagnosis after a failed spawnCreep call",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps spawnCreep return codes",
      "spawnCreep dryRun",
      "ERR_NOT_ENOUGH_ENERGY spawnCreep",
      "ERR_NAME_EXISTS Screeps",
      "Screeps Spawn debugging",
    ],
  },
  {
    href: "/en/blog/screeps-dynamic-creep-body",
    chinesePath: "/blog/screeps-dynamic-creep-body-energy",
    category: "SPAWNING · BODY BUDGET POLICY",
    title: "Screeps Dynamic Creep Body: Minimum, Target, and Emergency Plans",
    description:
      "Separate minimum, target, and emergency body policies; scale one role template within current Energy and the 50-part limit; then validate spawning separately.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-07-31",
    readingTime: "13 min read",
    primaryKeyword: "Screeps dynamic Creep body",
    searchIntent:
      "Build one legal role body from an explicit minimum, current Energy budget, role cap, and emergency policy",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps dynamic Creep body",
      "Screeps minimum Creep body",
      "Screeps emergency body",
      "room.energyAvailable body",
      "Screeps 50 body part limit",
      "CREEP_SPAWN_TIME",
    ],
  },
  {
    href: "/en/blog/screeps-emergency-harvester-recovery",
    chinesePath: "/blog/screeps-spawn-emergency-recovery",
    category: "SPAWNING · COLLAPSE RECOVERY STATE",
    title: "Screeps Emergency Harvester Recovery: Track the Exact Spawn Request",
    description:
      "Detect whether a capable harvester exists or is already spawning, submit one minimum recovery request, save the exact Spawn and Creep name, and verify that request across later ticks.",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    updatedAt: "2026-08-03",
    readingTime: "17 min read",
    primaryKeyword: "Screeps emergency harvester recovery",
    searchIntent:
      "Restore one owned room after the capable harvesting workforce disappears without submitting duplicate Spawn requests",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps emergency harvester recovery",
      "Screeps no harvester",
      "Screeps recovery Creep spawning",
      "spawnCreep duplicate prevention",
      "Screeps room collapse recovery",
    ],
  },
];
