import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishControllerBatchFourteenRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-controller-activate-safe-mode",
    chinesePath: "/blog/screeps-controller-activate-safe-mode",
    category: "CONTROLLER · SAFE MODE ACTIVATION",
    title: "Screeps activateSafeMode(): Prevent Same-Tick Intent Overwrite",
    description:
      "Route every Safe Mode request through one final per-tick dispatcher, bind the exact Controller ID, disable the request before activateSafeMode(), and verify activation consumption on the next tick.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-04",
    readingTime: "17 min read",
    primaryKeyword: "Screeps activateSafeMode",
    searchIntent: "Coordinate and verify one exact Safe Mode activation without same-tick intent replacement",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps activateSafeMode",
      "Screeps Safe Mode intent overwrite",
      "Screeps Safe Mode coordinator",
      "Screeps safeModeAvailable",
      "Screeps Controller ERR_BUSY",
    ],
  },
  {
    href: "/en/blog/screeps-controller-downgrade",
    chinesePath: "/blog/screeps-controller-downgrade",
    category: "CONTROLLER · DOWNGRADE RECOVERY",
    title: "How to Detect Controller Downgrade Risk and Recover Safely",
    description:
      "Compare ticksToDowngrade with configurable enter and recovery thresholds, use CONTROLLER_DOWNGRADE for context, select an owned ready Upgrader with Energy and active WORK, move to range 3, save upgradeController() results, and exit emergency mode only after recovery.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    readingTime: "18 min read",
    primaryKeyword: "Screeps Controller downgrade",
    searchIntent: "Enter and leave an emergency Controller upgrading state without threshold flapping",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Controller downgrade",
      "Screeps ticksToDowngrade",
      "Screeps CONTROLLER_DOWNGRADE",
      "Screeps emergency upgrader",
      "Screeps upgradeController range 3",
    ],
  },
  {
    href: "/en/blog/screeps-reserve-vs-claim-controller",
    chinesePath: "/blog/screeps-reserve-vs-claim-controller",
    category: "CONTROLLER · RESERVE OR CLAIM",
    title: "How to Choose Between Reserving and Claiming a Controller",
    description:
      "Separate renewable remote-room reservations from one-time room ownership, require an active CLAIM part and range 1, block owned Controllers and hostile reservations, require explicit claim confirmation and GCL capacity, save return codes, and stop a claim mission after OK.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    readingTime: "19 min read",
    primaryKeyword: "Screeps reserveController vs claimController",
    searchIntent: "Choose a renewable reservation or explicitly confirmed permanent room claim from current Controller and GCL evidence",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps reserveController vs claimController",
      "Screeps remote room reservation",
      "Screeps claim Controller GCL",
      "Screeps CLAIM body part",
      "Screeps Controller reservation ticksToEnd",
    ],
  },
];