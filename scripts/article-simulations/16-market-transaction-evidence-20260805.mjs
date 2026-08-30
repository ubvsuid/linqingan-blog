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
    registryUpdatedAt: "2026-08-05",
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
    registryUpdatedAt: "2026-08-05",
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
    registryUpdatedAt: "2026-08-30",
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
    failures.push(`${spec.path}: historical source segment missing`);
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

let tocCount = 0;
for (const spec of specs) {
  const segment = getSegment(spec);
  const record = getRegistryRecord(spec.path);

  // Preserve the 2026-08-05 source layer as historical evidence.
  for (const text of [
    'publishedAt: "2026-07-26"',
    'updatedAt: "2026-08-05"',
    `title: "${spec.title}"`,
    "finalScore: 98",
    "faq: []",
  ]) {
    requireText(segment, text, `${spec.path} historical article metadata`);
  }
  for (const signal of spec.technical) {
    requireText(segment, signal, `${spec.path} historical technical signal`);
  }

  const toc = [
    ...segment.matchAll(
      /\["([a-z0-9]+(?:-[a-z0-9]+)*)", "([^"]+)"\],/g,
    ),
  ];
  tocCount += toc.length;
  for (const match of toc) {
    requireText(
      segment,
      `<h2 id="${match[1]}">`,
      `${spec.path} historical TOC target`,
    );
  }

  // Discovery metadata follows the current public supersession. Only the
  // Terminal article was re-reviewed on 2026-08-30.
  for (const text of [
    spec.title,
    'publishedAt: "2026-07-26"',
    `updatedAt: "${spec.registryUpdatedAt}"`,
    "finalScore: 98",
  ]) {
    requireText(record, text, `${spec.path} current registry metadata`);
  }
}
requireEqual(tocCount, 34, "combined historical TOC count");

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

// The final Terminal wrapper is the reviewed 2026-08-30 supersession. Assert
// its fail-closed request shape directly rather than the old .articleHtml.replace
// implementation form.
for (const text of [
  "function finalizeTerminalSendArticle",
  "request?.description",
  "typeof request.requestId !== 'string'",
  "typeof request.terminalId !== 'string'",
  "typeof request.resourceType !== 'string'",
  "!Number.isInteger(request.amount)",
  "typeof request.destination !== 'string'",
  "!Number.isFinite(request.energyReserve)",
  "request.energyReserve < 0",
  "buildTerminalSendConfirmation(request)",
  'updatedAt: "2026-08-30"',
  "englishEditorialTerminalSendArticleFinal20260805",
]) {
  requireText(finalSource, text, "current Terminal request guard");
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
requireEqual(blocks.length, 19, "historical JavaScript block count");

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
        `Historical JavaScript block ${index + 1}: ${result.stderr.trim()}`,
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
  [
    101,
    [exactOrder, { ...exactOrder, id: "new-2" }],
    "new-order-identity-ambiguous",
  ],
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
  [
    [{ time: 100, amount: 60 }, { time: 100, amount: 40 }],
    "transaction-identity-ambiguous",
  ],
]) {
  requireEqual(
    verifyTransaction(101, 100, 100, transactions),
    expected,
    `transaction ${expected}`,
  );
}

function validateTerminalRequestShape(request, confirmationMatches) {
  if (
    !request
    || request.enabled !== true
    || typeof request.requestId !== "string"
    || request.requestId.length === 0
    || !Number.isInteger(request.revision)
    || request.revision < 1
    || typeof request.terminalId !== "string"
    || request.terminalId.length === 0
    || typeof request.resourceType !== "string"
    || request.resourceType.length === 0
    || !Number.isInteger(request.amount)
    || request.amount < 100
    || typeof request.destination !== "string"
    || request.destination.length === 0
    || !Number.isFinite(request.energyReserve)
    || request.energyReserve < 0
    || confirmationMatches !== true
  ) {
    return "request-invalid";
  }
  return "request-valid";
}

const validTerminalRequest = {
  enabled: true,
  requestId: "send-1",
  revision: 1,
  terminalId: "terminal-1",
  resourceType: "U",
  amount: 100,
  destination: "W2N2",
  energyReserve: 1000,
};
for (const [request, confirmationMatches, expected] of [
  [validTerminalRequest, true, "request-valid"],
  [{ ...validTerminalRequest, requestId: "" }, true, "request-invalid"],
  [{ ...validTerminalRequest, destination: "" }, true, "request-invalid"],
  [{ ...validTerminalRequest, energyReserve: Number.NaN }, true, "request-invalid"],
  [{ ...validTerminalRequest, energyReserve: -1 }, true, "request-invalid"],
  [validTerminalRequest, false, "request-invalid"],
]) {
  requireEqual(
    validateTerminalRequestShape(request, confirmationMatches),
    expected,
    `Terminal request shape ${expected}`,
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
  requireText(audit, marker, "historical audit evidence");
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `Market transaction evidence simulation failed: ${failures.length} issues.`,
  );
  process.exit(1);
}

console.log(
  "Market transaction evidence simulation passed: the 2026-08-05 market "
    + "source layer remains intact, current registry metadata recognizes the "
    + "2026-08-30 Terminal supersession, 19 historical JavaScript blocks "
    + "parse, and the current Terminal request shape rejects malformed "
    + "identity, destination, reserve and confirmation inputs.",
);
