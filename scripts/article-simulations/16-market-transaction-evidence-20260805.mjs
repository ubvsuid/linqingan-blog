import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const source = read(
  "src/lib/english-editorial-market-transaction-evidence-20260805.ts",
);
const finalSource = read(
  "src/lib/english-editorial-market-transaction-evidence-final-20260805.ts",
);
const publication = read(
  "src/lib/english-editorial-published-20260731.ts",
);
const registry = read("src/lib/english-market-registry-10.ts");
const audit = read(
  "docs/english-editorial-market-transaction-evidence-20260805.md",
);

const failures = [];
const requireText = (input, text, label) => {
  if (!input.includes(text)) failures.push(`Missing ${label}: ${text}`);
};
const requireEqual = (actual, expected, label) => {
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, received ${actual}`);
  }
};

const specs = [
  {
    exportName: "englishEditorialMarketCreateOrderArticle20260805",
    nextExport: "englishEditorialMarketDealArticle20260805",
    path: "/en/blog/screeps-market-create-order",
    title: "Screeps createOrder(): Bind One Request to the New Order ID",
    technical: [
      "buildCreateOrderConfirmation",
      "calculateCreateOrderFeeCeiling",
      "creation-slot-reserved",
      "order.created === pending.submittedAt",
      "new-order-identity-ambiguous",
      "verification-window-missed",
    ],
  },
  {
    exportName: "englishEditorialMarketDealArticle20260805",
    nextExport: "englishEditorialTerminalSendArticle20260805",
    path: "/en/blog/screeps-market-deal",
    title:
      "Screeps market.deal(): Reserve the Terminal and Verify Actual Amount",
    technical: [
      "createTerminalMarketDispatcher",
      "terminal-already-reserved",
      "order-already-reserved",
      "transaction.time === pending.submittedAt",
      "partial-deal-settlement-observed",
      "transaction-identity-ambiguous",
    ],
  },
  {
    exportName: "englishEditorialTerminalSendArticle20260805",
    nextExport:
      "englishEditorialMarketTransactionEvidenceOverrides20260805",
    path: "/en/blog/screeps-terminal-send-resources",
    title:
      "Screeps Terminal.send(): Prevent Intent Overwrite and Verify Actual Amount",
    technical: [
      "normalizeSendDescription",
      "createTerminalOperationDispatcher",
      "terminal-already-reserved",
      "readLedgerDescription(transaction)",
      "partial-transfer-observed",
      "!transaction.order",
    ],
  },
];

function getSegment(spec) {
  const start = source.indexOf(`export const ${spec.exportName}`);
  const end = source.indexOf(`export const ${spec.nextExport}`, start + 1);
  if (start < 0 || end < 0) {
    failures.push(`${spec.path}: source segment missing`);
    return "";
  }
  return source.slice(start, end);
}

function getRegistryRecord(articlePath) {
  const href = `href: "${articlePath}"`;
  const start = registry.indexOf(href);
  const end = registry.indexOf("\n  {", start + href.length);
  if (start < 0) return "";
  return registry.slice(start, end < 0 ? registry.length : end);
}

function scoreSegment(segment, spec) {
  const toc = [
    ...segment.matchAll(
      /\["([a-z0-9]+(?:-[a-z0-9]+)*)", "([^"]+)"\],/g,
    ),
  ];
  const dimensions = {
    technical: spec.technical.every((item) => segment.includes(item))
      ? 23
      : 0,
    intent: ["evidence-contract", "failure-states", "integration"]
      .every((item) => segment.includes(item))
      ? 18
      : 0,
    original: [
      "80977824199a596d174d392fd0cf8c458c21fcbd",
      "Technical correction",
    ].every((item) => segment.includes(item))
      ? 14
      : 0,
    english: [
      "delve",
      "game-changer",
      "unlock the power",
      "in today's fast-paced",
    ].every((item) => !segment.toLowerCase().includes(item))
      ? 12
      : 0,
    structure:
      toc.length >= 11
      && toc.every((match) =>
        segment.includes(`<h2 id="${match[1]}">`),
      )
        ? 10
        : 0,
    evidence: [
      "Official engine",
      "Screeps Console test",
      "Pending",
      "Last verified",
    ].every((item) => segment.includes(item))
      ? 8
      : 0,
    seo: [
      `title: "${spec.title}"`,
      "description:",
      "primaryKeyword:",
      "searchIntent:",
      "keywords:",
    ].every((item) => segment.includes(item))
      ? 8
      : 0,
    accessibility: [
      "<h2 id=",
      '<div class="table-scroll"><table>',
      "<thead>",
      "<tbody>",
    ].every((item) => segment.includes(item))
      ? 5
      : 0,
  };
  return {
    total: Object.values(dimensions).reduce(
      (sum, value) => sum + value,
      0,
    ),
    dimensions,
    tocCount: toc.length,
  };
}

let tocCount = 0;
for (const spec of specs) {
  const segment = getSegment(spec);
  const record = getRegistryRecord(spec.path);

  for (const text of [
    'publishedAt: "2026-07-26"',
    'updatedAt: "2026-08-05"',
    `title: "${spec.title}"`,
    "finalScore: 98",
    "faq: []",
  ]) {
    requireText(segment, text, `${spec.path} article metadata`);
  }
  for (const text of [
    spec.title,
    'publishedAt: "2026-07-26"',
    'updatedAt: "2026-08-05"',
    "finalScore: 98",
  ]) {
    requireText(record, text, `${spec.path} registry metadata`);
  }
  for (const signal of spec.technical) {
    requireText(segment, signal, `${spec.path} technical signal`);
  }

  const score = scoreSegment(segment, spec);
  tocCount += score.tocCount;
  if (score.total < 96) {
    failures.push(
      `${spec.path}: score ${score.total}/100; `
        + JSON.stringify(score.dimensions),
    );
  }
  requireEqual(score.total, 98, `${spec.path} internal score`);
}
requireEqual(tocCount, 34, "combined TOC count");

for (const text of [
  "englishEditorialMarketTransactionEvidenceFinalOverrides20260805",
  "...englishEditorialMarketIdentityOverrides20260801",
  "...englishEditorialMarketTransactionEvidenceFinalOverrides20260805",
]) {
  requireText(publication, text, "publication wiring");
}
if (
  publication.indexOf(
    "...englishEditorialMarketTransactionEvidenceFinalOverrides20260805",
  )
  <= publication.indexOf(
    "...englishEditorialMarketIdentityOverrides20260801",
  )
) {
  failures.push("Current market override must follow the legacy override");
}
for (const text of [
  "request?.description",
  "englishEditorialTerminalSendArticle20260805.articleHtml.replace",
]) {
  requireText(finalSource, text, "final Terminal request guard");
}

const decodeHtmlOnce = (value) => value
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&#39;", "'")
  .replaceAll("&quot;", '"')
  .replaceAll("&amp;", "&");

const blocks = [
  ...source.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  ),
].map((match) => decodeHtmlOnce(match[1]));
requireEqual(blocks.length, 19, "JavaScript block count");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "market-transaction-evidence-"),
);
try {
  blocks.forEach((code, index) => {
    const file = path.join(tempDir, `block-${index + 1}.js`);
    fs.writeFileSync(file, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(
        `JavaScript block ${index + 1}: ${result.stderr.trim()}`,
      );
    }
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function makeCreationCoordinator() {
  let used = false;
  return {
    reserve({ credits, fee, reserve }) {
      if (used) return "creation-slot-reserved";
      if (credits - fee < reserve) return "credit-reserve";
      used = true;
      return "reserved";
    },
  };
}
const creation = makeCreationCoordinator();
requireEqual(
  creation.reserve({ credits: 100, fee: 5, reserve: 90 }),
  "reserved",
  "first creation reservation",
);
requireEqual(
  creation.reserve({ credits: 100, fee: 1, reserve: 0 }),
  "creation-slot-reserved",
  "duplicate creation reservation",
);
requireEqual(
  makeCreationCoordinator().reserve({
    credits: 94.999,
    fee: 5,
    reserve: 90,
  }),
  "credit-reserve",
  "rounded fee reserve",
);
requireEqual(
  Math.ceil(0.3333 * 3 * 0.05 * 1000) / 1000,
  0.05,
  "milli-Credit fee ceiling",
);

function verifyCreated(gameTime, pending, orders) {
  if (gameTime < pending.submittedAt + 1) return "waiting-for-next-tick";
  if (gameTime > pending.submittedAt + 1) return "verification-window-missed";
  const oldIds = new Set(pending.oldIds);
  const matches = orders.filter((order) =>
    !oldIds.has(order.id)
    && order.created === pending.submittedAt
    && order.type === pending.type
    && order.resourceType === pending.resourceType
    && order.roomName === pending.roomName
    && order.totalAmount === pending.totalAmount,
  );
  if (matches.length === 0) return "accepted-order-not-observed";
  if (matches.length > 1) return "new-order-identity-ambiguous";
  return "created-order-observed";
}
const pendingOrder = {
  submittedAt: 100,
  oldIds: ["old"],
  type: "sell",
  resourceType: "U",
  roomName: "W1N1",
  totalAmount: 1000,
};
const exactOrder = {
  id: "new",
  created: 100,
  type: "sell",
  resourceType: "U",
  roomName: "W1N1",
  totalAmount: 1000,
};
for (const [time, orders, expected] of [
  [100, [], "waiting-for-next-tick"],
  [102, [exactOrder], "verification-window-missed"],
  [101, [], "accepted-order-not-observed"],
  [101, [exactOrder, { ...exactOrder, id: "new-2" }], "new-order-identity-ambiguous"],
  [101, [exactOrder], "created-order-observed"],
]) {
  requireEqual(
    verifyCreated(time, pendingOrder, orders),
    expected,
    `create order ${expected}`,
  );
}

function makeTerminalDispatcher() {
  const terminals = new Set();
  return {
    reserve(terminalId) {
      if (terminals.has(terminalId)) {
        return "terminal-already-reserved";
      }
      terminals.add(terminalId);
      return "terminal-reserved";
    },
  };
}
const terminalDispatcher = makeTerminalDispatcher();
requireEqual(
  terminalDispatcher.reserve("terminal-1"),
  "terminal-reserved",
  "deal Terminal reservation",
);
requireEqual(
  terminalDispatcher.reserve("terminal-1"),
  "terminal-already-reserved",
  "send versus deal collision",
);

function verifyTransaction(time, submittedAt, requested, transactions) {
  if (time < submittedAt + 1) return "waiting-for-next-tick";
  if (time > submittedAt + 1) return "verification-window-missed";
  const matches = transactions.filter((item) =>
    item.time === submittedAt
    && item.amount > 0
    && item.amount <= requested,
  );
  if (matches.length === 0) return "accepted-no-transaction-observed";
  if (matches.length > 1) return "transaction-identity-ambiguous";
  return matches[0].amount === requested
    ? "full-settlement-observed"
    : "partial-settlement-observed";
}
for (const [transactions, expected] of [
  [[], "accepted-no-transaction-observed"],
  [[{ time: 100, amount: 100 }], "full-settlement-observed"],
  [[{ time: 100, amount: 60 }], "partial-settlement-observed"],
  [[{ time: 100, amount: 60 }, { time: 100, amount: 40 }], "transaction-identity-ambiguous"],
]) {
  requireEqual(
    verifyTransaction(101, 100, 100, transactions),
    expected,
    `transaction ${expected}`,
  );
}

const normalizeDescription = (value) => {
  if (value == null || value === "") return "";
  return String(value).replace(/</g, "&lt;");
};
requireEqual(normalizeDescription(""), "", "empty ledger description");
requireEqual(
  normalizeDescription("A<B"),
  "A&lt;B",
  "escaped ledger description",
);
requireEqual(
  decodeHtmlOnce("text.replace(/&lt;/g, '&amp;lt;')"),
  "text.replace(/</g, '&lt;')",
  "one-pass entity decoding",
);

for (const marker of [
  "bb29adda579567ca757c72324114ddde9ec519c8",
  "80977824199a596d174d392fd0cf8c458c21fcbd",
  "/en/blog/screeps-market-create-order",
  "/en/blog/screeps-market-deal",
  "/en/blog/screeps-terminal-send-resources",
  "**98/100**",
  "Screeps Console execution",
  "Evidence still Pending",
]) {
  requireText(audit, marker, "audit evidence");
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `Market transaction evidence simulation failed: ${failures.length} issues.`,
  );
  process.exit(1);
}

console.log(
  "Market transaction evidence simulation passed: 3 existing routes, "
    + "34 anchors, 19 JavaScript blocks, content-derived 98-point scores, "
    + "rounded fees, exact next-tick IDs, shared Terminal reservations, "
    + "partial settlements, safe empty requests and normalized descriptions.",
);
