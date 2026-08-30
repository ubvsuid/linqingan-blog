import type { EnglishArticleRecord } from "./english-articles";

type EnglishCreepAttackArticleRecord = Omit<EnglishArticleRecord, "chinesePath"> & {
  chinesePath?: undefined;
  updatedAt?: string;
};

export const englishCreepAttackBatchTwentyOneRegistry: EnglishCreepAttackArticleRecord[] = [
  {
    href: "/en/blog/screeps-creep-attack",
    category: "COMBAT · CREEP ATTACK",
    title: "Screeps Creep.attack(): Melee Range, ATTACK Parts, and Return Codes",
    description:
      "Use Creep.attack() with the correct range-1 boundary, active ATTACK parts, documented return codes, Rampart behavior, and later-tick verification.",
    publishedAt: "2026-08-30",
    publishedLabel: "August 30, 2026",
    readingTime: "10 min read",
    primaryKeyword: "Screeps Creep.attack",
    searchIntent:
      "Use one owned melee Creep to select a valid hostile target, move to range 1, submit attack(), interpret documented return codes, and distinguish accepted intent from later observed damage",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Creep.attack",
      "Screeps melee attack",
      "Screeps ATTACK body part",
      "Screeps ERR_NOT_IN_RANGE attack",
      "Screeps creep combat return codes",
    ],
    updatedAt: "2026-08-30",
  },
];
