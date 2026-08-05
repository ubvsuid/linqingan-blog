import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { gunzipSync } from "node:zlib";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const legacySource = read(
  "src/lib/english-editorial-market-identity-overrides-20260801.ts",
);
const currentSource = read(
  "src/lib/english-editorial-market-transaction-evidence-20260805.ts",
);
const finalSource = read(
  "src/lib/english-editorial-market-transaction-evidence-final-20260805.ts",
);
const publication = read(
  "src/lib/english-editorial-published-20260731.ts",
);
const registry = read("src/lib/english-market-registry-10.ts");
const legacyAudit = read(
  "docs/english-editorial-market-identity-batch-20260801.md",
);
const currentAudit = read(
  "docs/english-editorial-market-transaction-evidence-20260805.md",
);

const failures = [];
const requireText = (input, text, label) => {
  if (!input.includes(text)) failures.push(`Missing ${label}: ${text}`);
};

const encoded = legacySource.match(
  /const encodedEditorialOverrides = "([A-Za-z0-9+/=]+)";/,
)?.[1];
if (!encoded) {
  console.error("ERROR: Legacy market payload is missing");
  process.exit(1);
}

const articles = JSON.parse(
  gunzipSync(Buffer.from(encoded, "base64")).toString("utf8"),
);
const expected = {
  "screeps-market-create-order": {
    path: "/en/blog/screeps-market-create-order",
    chinesePath: "/blog/screeps-market-create-order",
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
    signals: [
      "destination-is-source-room",
      "transactionIdsBefore",
      "ambiguous-transactions",
      "verified-transaction",
    ],
  },
};

if (
  Object.keys(articles).sort().join("|")
  !== Object.keys(expected).sort().join("|")
) {
  failures.push("Legacy payload must contain exactly the three market routes");
}

const decodeHtmlOnce = (value) => value
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&#39;", "'")
  .replaceAll("&quot;", '"')
  .replaceAll("&amp;", "&");

const codeBlocks = [];
for (const [slug, identity] of Object.entries(expected)) {
  const article = articles[slug];
  if (!article) {
    failures.push(`${slug}: legacy article missing`);
    continue;
  }
  for (const [field, value] of [
    ["path", identity.path],
    ["chinesePath", identity.chinesePath],
    ["publishedAt", "2026-07-26"],
  ]) {
    if (article[field] !== value) {
      failures.push(`${slug}: legacy ${field} changed`);
    }
  }
  if (article.finalScore !== 98) {
    failures.push(`${slug}: legacy score changed`);
  }
  for (const signal of identity.signals) {
    if (!article.articleHtml.includes(signal)) {
      failures.push(`${slug}: legacy source signal missing ${signal}`);
    }
  }
  for (const match of article.articleHtml.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  )) {
    codeBlocks.push({ slug, code: decodeHtmlOnce(match[1]) });
  }
}

if (codeBlocks.length !== 17) {
  failures.push(
    `Legacy JavaScript block count ${codeBlocks.length}; expected 17`,
  );
}
const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "legacy-market-identity-"),
);
try {
  codeBlocks.forEach(({ slug, code }, index) => {
    const file = path.join(tempDir, `${slug}-${index + 1}.js`);
    fs.writeFileSync(file, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(
        `${slug}: legacy JavaScript block failed: ${result.stderr.trim()}`,
      );
    }
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

for (const text of [
  "englishEditorialMarketIdentityOverrides20260801",
  "englishEditorialMarketTransactionEvidenceFinalOverrides20260805",
  "...englishEditorialMarketIdentityOverrides20260801",
  "...englishEditorialMarketTransactionEvidenceFinalOverrides20260805",
]) {
  requireText(publication, text, "market publication chain");
}
if (
  publication.indexOf(
    "...englishEditorialMarketTransactionEvidenceFinalOverrides20260805",
  )
  <= publication.indexOf(
    "...englishEditorialMarketIdentityOverrides20260801",
  )
) {
  failures.push("Current market override must supersede the legacy override");
}

for (const [route, title] of [
  [
    "/en/blog/screeps-market-create-order",
    "Screeps createOrder(): Bind One Request to the New Order ID",
  ],
  [
    "/en/blog/screeps-market-deal",
    "Screeps market.deal(): Reserve the Terminal and Verify Actual Amount",
  ],
  [
    "/en/blog/screeps-terminal-send-resources",
    "Screeps Terminal.send(): Prevent Intent Overwrite and Verify Actual Amount",
  ],
]) {
  const start = registry.indexOf(`href: "${route}"`);
  const next = registry.indexOf("\n  {", start + route.length);
  const record = start < 0
    ? ""
    : registry.slice(start, next < 0 ? registry.length : next);
  for (const text of [title, 'updatedAt: "2026-08-05"', "finalScore: 98"]) {
    requireText(record, text, `${route} current registry`);
  }
}

for (const text of [
  "englishEditorialMarketCreateOrderArticle20260805",
  "englishEditorialMarketDealArticle20260805",
  "englishEditorialTerminalSendArticle20260805",
  "partial-deal-settlement-observed",
  "partial-transfer-observed",
]) {
  requireText(currentSource, text, "current market source");
}
requireText(finalSource, "request?.description", "safe Terminal request guard");

for (const marker of [
  "/en/blog/screeps-market-create-order",
  "/en/blog/screeps-market-deal",
  "/en/blog/screeps-terminal-send-resources",
  "**98**",
]) {
  requireText(legacyAudit, marker, "legacy audit scope");
}
for (const marker of [
  "bb29adda579567ca757c72324114ddde9ec519c8",
  "80977824199a596d174d392fd0cf8c458c21fcbd",
  "**98/100**",
  "Evidence still Pending",
]) {
  requireText(currentAudit, marker, "current audit scope");
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `Market identity compatibility gate failed: ${failures.length} issues.`,
  );
  process.exit(1);
}

console.log(
  "Market identity compatibility gate passed: legacy payload scope and "
    + "17 code blocks remain valid, while the readable 2026-08-05 market "
    + "transaction evidence batch supersedes current publication metadata.",
);
