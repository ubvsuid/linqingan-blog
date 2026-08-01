import type { EnglishArticleRecord } from "./english-articles";

type DatedEnglishArticleRecord = EnglishArticleRecord & {
  updatedAt?: string;
};

export const englishMarketBatchTenRegistry: DatedEnglishArticleRecord[] = [
  {
    href: "/en/blog/screeps-market-create-order",
    chinesePath: "/blog/screeps-market-create-order",
    category: "MARKET · ORDER CREATION AND IDENTITY",
    title:
      "Screeps createOrder(): Verify the New Order by ID Difference",
    description:
      "Validate one reviewed createOrder request, preserve the pre-call order ID set, disable before submission, and identify the exact new order without mistaking an older equivalent order for success.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-01",
    readingTime: "13 min read",
    primaryKeyword: "Screeps Game.market.createOrder",
    searchIntent:
      "Create one reviewed market order and identify the exact newly created order without matching an older equivalent order",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.market.createOrder",
      "Screeps verify new market order",
      "Screeps market order ID",
      "Screeps market order fee",
      "Screeps duplicate market order",
    ],
  },
  {
    href: "/en/blog/screeps-market-deal",
    chinesePath: "/blog/screeps-market-deal",
    category: "MARKET · COORDINATED DEAL SUBMISSION",
    title:
      "Screeps market.deal(): One Coordinator, One Accepted Request",
    description:
      "Refresh one reviewed sell order, coordinate the account-wide per-tick deal limit, save the pre-call transaction IDs, submit once, and verify the exact incoming transaction by ID difference.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-01",
    readingTime: "14 min read",
    primaryKeyword: "Screeps Game.market.deal",
    searchIntent:
      "Execute one reviewed market deal through a shared per-tick coordinator and verify the exact resulting transaction",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps Game.market.deal",
      "Screeps market deal coordinator",
      "Screeps 10 deals per tick",
      "Screeps verify market transaction",
      "Screeps order amount",
    ],
  },
  {
    href: "/en/blog/screeps-terminal-send-resources",
    chinesePath: "/blog/screeps-terminal-send-resources",
    category: "LOGISTICS · TRANSFER IDENTITY AND SETTLEMENT",
    title:
      "Screeps Terminal.send(): Verify the Exact Outgoing Transaction",
    description:
      "Validate one direct Terminal transfer, preserve the pre-call outgoing transaction IDs, disable before send(), and verify the exact new transaction without guessing when identical transfers overlap.",
    publishedAt: "2026-07-26",
    publishedLabel: "July 26, 2026",
    updatedAt: "2026-08-01",
    readingTime: "13 min read",
    primaryKeyword: "Screeps StructureTerminal.send",
    searchIntent:
      "Submit one direct Terminal transfer and identify the exact resulting outgoing transaction without matching an older or concurrent transfer",
    status: "published",
    finalScore: 98,
    keywords: [
      "Screeps StructureTerminal.send",
      "Screeps outgoing transaction ID",
      "Screeps Terminal transfer verification",
      "TERMINAL_MIN_SEND Screeps",
      "Screeps send Energy transaction cost",
    ],
  },
];
