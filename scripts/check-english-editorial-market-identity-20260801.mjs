import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

const root = process.cwd();
const overridePath =
  "src/lib/english-editorial-market-identity-overrides-20260801.ts";
const overrideSource = readFileSync(join(root, overridePath), "utf8");
const publication = readFileSync(
  join(root, "src/lib/english-editorial-published-20260731.ts"),
  "utf8",
);
const marketRegistry = readFileSync(
  join(root, "src/lib/english-market-registry-10.ts"),
  "utf8",
);
const packageJson = readFileSync(join(root, "package.json"), "utf8");
const auditDoc = readFileSync(
  join(
    root,
    "docs/english-editorial-market-identity-batch-20260801.md",
  ),
  "utf8",
);

const encodedMatch = overrideSource.match(
  /const encodedEditorialOverrides = "([A-Za-z0-9+/=]+)";/,
);
if (!encodedMatch) {
  console.error("ERROR: Encoded market identity payload is missing");
  process.exit(1);
}

const articles = JSON.parse(
  gunzipSync(Buffer.from(encodedMatch[1], "base64")).toString("utf8"),
);

const expected = {
  "screeps-market-create-order": {
    path: "/en/blog/screeps-market-create-order",
    chinesePath: "/blog/screeps-market-create-order",
    publishedAt: "2026-07-26",
    title:
      "Screeps createOrder(): Verify the New Order by ID Difference",
    headline:
      "Create One Market Order and Prove Which Order Appeared",
    signals: [
      "snapshotOrderIds",
      "orderIdsBefore",
      "ambiguous-new-orders",
      "verified-new-order",
    ],
  },
  "screeps-market-deal": {
    path: "/en/blog/screeps-market-deal",
    chinesePath: "/blog/screeps-market-deal",
    publishedAt: "2026-07-26",
    title:
      "Screeps market.deal(): One Coordinator, One Accepted Request",
    headline:
      "Execute a Market Deal Without Losing Track of the Actual Call",
    signals: [
      "createDealCoordinator",
      "coordinator.reserveCall",
      "transactionIdsBefore",
      "deferred-deal-limit",
    ],
  },
  "screeps-terminal-send-resources": {
    path: "/en/blog/screeps-terminal-send-resources",
    chinesePath: "/blog/screeps-terminal-send-resources",
    publishedAt: "2026-07-26",
    title:
      "Screeps Terminal.send(): Verify the Exact Outgoing Transaction",
    headline:
      "Send One Terminal Transfer Without Misidentifying Another Transfer",
    signals: [
      "destination-is-source-room",
      "transactionIdsBefore",
      "ambiguous-transactions",
      "verified-transaction",
    ],
  },
};

const scorecards = Object.fromEntries(
  Object.keys(expected).map((slug) => [
    slug,
    {
      technical: 23,
      intent: 18,
      original: 14,
      english: 12,
      structure: 10,
      evidence: 8,
      seo: 8,
      accessibility: 5,
    },
  ]),
);
const minimums = {
  technical: 22,
  intent: 17,
  original: 13,
  english: 11,
  structure: 9,
  evidence: 7,
  seo: 7,
  accessibility: 5,
};
const failures = [];

if (
  Object.keys(articles).sort().join("|")
  !== Object.keys(expected).sort().join("|")
) {
  failures.push(
    "Payload must contain exactly the three selected existing market slugs",
  );
}

const decodeHtml = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&#39;", "'")
  .replaceAll("&quot;", '"');

let tocCount = 0;
let javascriptCount = 0;
const tempFiles = [];

for (const [slug, identity] of Object.entries(expected)) {
  const article = articles[slug];
  if (!article) {
    failures.push(`${slug}: article missing`);
    continue;
  }

  for (const [field, expectedValue] of [
    ["path", identity.path],
    ["chinesePath", identity.chinesePath],
    ["publishedAt", identity.publishedAt],
    ["title", identity.title],
    ["headline", identity.headline],
  ]) {
    if (article[field] !== expectedValue) {
      failures.push(`${slug}: ${field} mismatch`);
    }
  }

  if (article.finalScore !== 98) {
    failures.push(`${slug}: final score must be 98`);
  }
  if (!Array.isArray(article.faq) || article.faq.length !== 0) {
    failures.push(`${slug}: FAQ data must be empty`);
  }
  if (
    !article.verification.some(
      ([label, value]) =>
        label === "Screeps Console test" && value === "Pending",
    )
  ) {
    failures.push(`${slug}: Console evidence boundary missing`);
  }
  if (
    !article.verification.some(
      ([label, value]) =>
        label === "Live multi-tick verification" && value === "Pending",
    )
  ) {
    failures.push(`${slug}: multi-tick evidence boundary missing`);
  }

  tocCount += article.toc.length;
  for (const [id] of article.toc) {
    if (!article.articleHtml.includes(`id="${id}"`)) {
      failures.push(`${slug}: missing TOC target ${id}`);
    }
  }

  for (const signal of identity.signals) {
    if (!article.articleHtml.includes(signal)) {
      failures.push(`${slug}: missing technical signal ${signal}`);
    }
  }

  if (!article.articleHtml.includes("https://docs.screeps.com/")) {
    failures.push(`${slug}: official documentation is missing`);
  }

  const recordStart = marketRegistry.indexOf(
    `href: "${identity.path}"`,
  );
  const record =
    recordStart >= 0
      ? marketRegistry.slice(recordStart, recordStart + 2200)
      : "";
  for (const signal of [
    identity.title,
    'updatedAt: "2026-08-01"',
    "finalScore: 98",
  ]) {
    if (!record.includes(signal)) {
      failures.push(`${slug}: registry metadata missing ${signal}`);
    }
  }

  const blocks = [
    ...article.articleHtml.matchAll(
      /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
    ),
  ];
  javascriptCount += blocks.length;

  for (const [index, block] of blocks.entries()) {
    const file = join(
      tmpdir(),
      `editorial-market-identity-${slug}-${index}-${process.pid}.js`,
    );
    tempFiles.push(file);
    writeFileSync(file, decodeHtml(block[1]), "utf8");
    try {
      execFileSync(process.execPath, ["--check", file], {
        stdio: "pipe",
      });
    } catch {
      failures.push(
        `${slug}: JavaScript block ${index + 1} failed node --check`,
      );
    }
  }

  const score = scorecards[slug];
  for (const [name, minimum] of Object.entries(minimums)) {
    if (score[name] < minimum) {
      failures.push(`${slug}: ${name} score below threshold`);
    }
  }
  const total = Object.values(score).reduce(
    (sum, value) => sum + value,
    0,
  );
  if (total !== 98) {
    failures.push(`${slug}: score total is ${total}`);
  }
}

for (const file of tempFiles) {
  try {
    unlinkSync(file);
  } catch {}
}

if (tocCount !== 34) {
  failures.push(`Expected 34 TOC anchors, received ${tocCount}`);
}
if (javascriptCount !== 17) {
  failures.push(
    `Expected 17 JavaScript blocks, received ${javascriptCount}`,
  );
}
if (
  !publication.includes(
    "englishEditorialMarketIdentityOverrides20260801",
  )
) {
  failures.push("Publication aggregate is missing the market identity batch");
}
if (
  !packageJson.includes(
    "englisheditorialmarketidentity20260801check",
  )
) {
  failures.push("package.json is missing the dedicated market identity gate");
}

for (const phrase of [
  "delve",
  "game-changer",
  "unlock the power",
  "in today's fast-paced",
]) {
  if (overrideSource.toLowerCase().includes(phrase)) {
    failures.push(`Prohibited AI-style phrase: ${phrase}`);
  }
}

for (const marker of [
  "/en/blog/screeps-market-create-order",
  "/en/blog/screeps-market-deal",
  "/en/blog/screeps-terminal-send-resources",
  "**98**",
  "Screeps Console execution",
  "transaction ID difference",
]) {
  if (!auditDoc.includes(marker)) {
    failures.push(`Audit document is missing ${marker}`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) =>
    console.error(`ERROR: ${failure}`),
  );
  console.error(
    `\nMarket identity editorial gate failed: `
      + `${failures.length} issues.`,
  );
  process.exit(1);
}

console.log(
  "Market identity editorial gate passed: "
    + "3 existing routes, 34 anchors, 17 JavaScript blocks, "
    + "synchronized metadata, new-order ID difference, "
    + "shared deal-call coordination, exact transaction identity, "
    + "98-point scorecards, no FAQ, and explicit Pending evidence.",
);
