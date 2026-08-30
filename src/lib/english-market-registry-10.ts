import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishMarketBatchTenRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-market-create-order",
    chinesePath: "/blog/screeps-market-create-order",
    category: "MARKET · ORDER CREATION IDENTITY",
    title:
      "Screeps createOrder(): Bind One Request to the New Order ID",
    description:
      "Freeze one reviewed order revision, reserve the creation fee and account mutation slot, call createOrder once, and verify the exact new order ID in the next account snapshot.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-05",
    readingTime: "19 min read",
    primaryKeyword: "Screeps createOrder verification",
    searchIntent:
      "Create one reviewed Screeps market order and prove which exact order ID appeared without duplicate calls or stale-request attribution",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps createOrder verification",
      "Screeps market order ID",
      "Screeps market creation fee rounding",
      "Screeps createOrder request identity",
      "Screeps market order created tick",
    ],
  },
  {
    href: "/en/blog/screeps-market-deal",
    chinesePath: "/blog/screeps-market-deal",
    category: "MARKET · DEAL SETTLEMENT IDENTITY",
    title:
      "Screeps market.deal(): Reserve the Terminal and Verify Actual Amount",
    description:
      "Freeze one reviewed deal revision, reserve both an account deal slot and the exact Terminal, submit once, and verify the new transaction ID and actual partial or full amount next tick.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-05",
    readingTime: "21 min read",
    primaryKeyword: "Screeps market deal verification",
    searchIntent:
      "Execute one exact Screeps sell-order purchase without Terminal contention or false full-amount settlement claims",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps market deal verification",
      "Screeps partial market deal",
      "Screeps Terminal deal reservation",
      "Screeps incoming transaction ID",
      "Screeps deal actual amount",
    ],
  },
  {
    href: "/en/blog/screeps-terminal-send-resources",
    chinesePath: "/blog/screeps-terminal-send-resources",
    category: "LOGISTICS · TERMINAL INTENT IDENTITY",
    title:
      "Screeps Terminal.send(): Prevent Intent Overwrite and Verify Actual Amount",
    description:
      "Freeze one transfer revision, reserve the exact Terminal against send and market-deal conflicts, submit once, normalize ledger descriptions, and verify the actual full or partial outgoing transaction next tick.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-30",
    readingTime: "21 min read",
    primaryKeyword: "Screeps Terminal send verification",
    searchIntent:
      "Send one exact Screeps Terminal transfer without same-tick intent overwrite, deal contention or false missing-transaction reports",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Terminal send verification",
      "Screeps Terminal send intent overwrite",
      "Screeps partial Terminal transfer",
      "Screeps outgoing transaction description",
      "Screeps Terminal deal conflict",
    ],
  },
];
