import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishConstructionSafetyBatchFifteenRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-room-create-construction-site",
    chinesePath: "/blog/screeps-room-create-construction-site",
    category: "CONSTRUCTION · ROAD SITE PLACEMENT",
    title: "How to Create One Road Construction Site Safely",
    description:
      "Use a one-time Memory request, validate a visible room and 0–49 coordinates, allow Road placement on natural wall terrain, reject an existing Road or Construction Site, respect MAX_CONSTRUCTION_SITES, disable before createConstructionSite(), and verify later.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    readingTime: "17 min read",
    primaryKeyword: "Screeps Room createConstructionSite",
    searchIntent: "Create one reviewed Road Construction Site without repeated calls or stale coordinates",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Room createConstructionSite",
      "Screeps Road construction site",
      "Screeps MAX_CONSTRUCTION_SITES",
      "Screeps Construction Site coordinates",
      "Screeps createConstructionSite ERR_FULL",
    ],
  },
  {
    href: "/en/blog/screeps-construction-site-progress",
    chinesePath: "/blog/screeps-construction-site-progress",
    category: "CONSTRUCTION · PROGRESS AND EVENT IDENTITY",
    title: "Screeps ConstructionSite Progress: Verify One Builder Across Ticks",
    description:
      "Report progress and remaining work, submit one tracked build intent, match the exact Builder and Site in the next tick's EVENT_BUILD record, and separate completion from removal.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-03",
    readingTime: "17 min read",
    primaryKeyword: "Screeps ConstructionSite progress",
    searchIntent:
      "Measure current Construction Site state and attribute one accepted build intent to the exact Builder and Site across ticks",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps ConstructionSite progress",
      "Screeps EVENT_BUILD",
      "Screeps Builder verification",
      "Construction Site completion vs removal",
      "Room.getEventLog build",
    ],
  },
  {
    href: "/en/blog/screeps-structure-destroy",
    chinesePath: "/blog/screeps-structure-destroy",
    category: "CONSTRUCTION · DESTRUCTIVE STRUCTURE CHANGE",
    title: "How to Destroy a Misplaced Extension Without Hitting the Wrong Structure",
    description:
      "Use a one-time request locked to Structure ID, room, X, Y, STRUCTURE_EXTENSION and an exact confirmation phrase, verify ownership through Game.structures, stop when hostile Creeps are present, disable before destroy(), save the result, and verify later disappearance.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    readingTime: "18 min read",
    primaryKeyword: "Screeps Structure destroy",
    searchIntent: "Destroy one explicitly confirmed misplaced Extension without targeting another completed Structure",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Structure destroy",
      "Screeps destroy Extension",
      "Screeps Game.structures ownership",
      "Screeps Structure.destroy ERR_BUSY",
      "Screeps destructive one-time request",
    ],
  },
];
