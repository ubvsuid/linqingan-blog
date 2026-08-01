import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishLabFactoryBatchElevenRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-lab-run-reaction",
    chinesePath: "/blog/screeps-lab-run-reaction",
    category: "RESOURCES · OWNED LAB REACTION",
    title:
      "Screeps runReaction(): Verify One Owned Lab Reaction",
    description:
      "Bind one request to three exact Lab IDs, snapshot both reagent types and Stores, submit once, and verify the product and two reagent deltas under an exclusive action window.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-01",
    readingTime: "14 min read",
    primaryKeyword: "Screeps StructureLab runReaction",
    searchIntent:
      "Submit one exact three-Lab reaction and verify its product and reagent Store signature",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps StructureLab runReaction",
      "Screeps verify Lab reaction",
      "Screeps LAB_REACTION_AMOUNT",
      "Screeps REACTIONS",
      "Screeps Lab Store deltas",
    ],
  },
  {
    href: "/en/blog/screeps-lab-boost-creep",
    chinesePath: "/blog/screeps-lab-boost-creep",
    category: "RESOURCES · BOOST TARGET IDENTITY",
    title:
      "Screeps boostCreep(): Verify Exact Body Part Changes",
    description:
      "Bind a boost request to the exact Creep ID, predict the documented part indexes, submit once, then verify the index set, final boost mineral, and Lab resource deltas.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-01",
    readingTime: "14 min read",
    primaryKeyword: "Screeps StructureLab boostCreep",
    searchIntent:
      "Boost one exact Creep and verify the documented body-part indexes and Lab resource consumption",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps StructureLab boostCreep",
      "Screeps boost body part indexes",
      "Screeps Creep ID boost",
      "LAB_BOOST_MINERAL",
      "LAB_BOOST_ENERGY",
    ],
  },
  {
    href: "/en/blog/screeps-factory-produce",
    chinesePath: "/blog/screeps-factory-produce",
    category: "RESOURCES · FACTORY BATCH VERIFICATION",
    title:
      "Screeps Factory.produce(): Verify One Production Batch",
    description:
      "Separate permanent Factory level from the active Power effect, snapshot every recipe component, submit one batch, and verify exact output and component deltas under an exclusive Store window.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-01",
    readingTime: "15 min read",
    primaryKeyword: "Screeps StructureFactory produce",
    searchIntent:
      "Submit one Factory production batch and verify its exact component and output Store signature",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps StructureFactory produce",
      "Screeps verify Factory batch",
      "Screeps Factory permanent level",
      "PWR_OPERATE_FACTORY",
      "Screeps commodity component deltas",
    ],
  },
];
