import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

const root = process.cwd();
const overrideSource = readFileSync(
  join(root, "src/lib/english-editorial-first-loop-state-notify-overrides-20260731.ts"),
  "utf8",
);
const publication = readFileSync(
  join(root, "src/lib/english-editorial-published-20260731.ts"),
  "utf8",
);
const completeRegistry = readFileSync(
  join(root, "src/lib/english-articles-complete.ts"),
  "utf8",
);
const foundationRegistry = readFileSync(
  join(root, "src/lib/english-foundation-registry-2.ts"),
  "utf8",
);
const observabilityRegistry = readFileSync(
  join(root, "src/lib/english-observability-registry-9.ts"),
  "utf8",
);
const packageJson = readFileSync(join(root, "package.json"), "utf8");
const auditDoc = readFileSync(
  join(root, "docs/english-editorial-first-loop-state-notify-batch-20260731.md"),
  "utf8",
);

const encodedMatch = overrideSource.match(
  /const encodedEditorialOverrides = "([A-Za-z0-9+/=]+)";/,
);
if (!encodedMatch) {
  console.error("ERROR: Encoded first-loop editorial payload is missing");
  process.exit(1);
}

const articles = JSON.parse(
  gunzipSync(Buffer.from(encodedMatch[1], "base64")).toString("utf8"),
);
const expected = {
  "screeps-first-room-code": {
    path: "/en/blog/screeps-first-room-code",
    chinesePath: "/blog/screeps-first-room-code",
    publishedAt: "2026-07-24",
    title: "Screeps First Room Code: A Small Loop You Can Verify",
    headline: "Combine Your First Screeps Room Loop Without Hiding Failure States",
    registry: completeRegistry,
    signals: [
      "trySpawnFirstMissing",
      "spawn-dry-run-rejected",
      "active-source-not-found",
      "The body costs 200 Energy",
    ],
  },
  "screeps-working-state": {
    path: "/en/blog/screeps-working-state",
    chinesePath: "/blog/screeps-creep-working-state",
    publishedAt: "2026-07-25",
    title: "Screeps Working State: Switch Only at Empty and Full",
    headline: "Use Store Boundaries as Hysteresis, Not a Tick Toggle",
    registry: foundationRegistry,
    signals: [
      "partial-keep-previous",
      "partial-initialized",
      "invalid-store-values",
      "decision.changed",
    ],
  },
  "screeps-game-notify": {
    path: "/en/blog/screeps-game-notify",
    chinesePath: "/blog/screeps-game-notify",
    publishedAt: "2026-07-25",
    title: "Screeps Game.notify(): Queue Alerts and Mark Them Submitted",
    headline: "Do Not Mark an Alert Sent Until Game.notify() Is Called",
    registry: observabilityRegistry,
    signals: [
      "awaiting-first-submission",
      "valid.slice(0, 20)",
      "lastSubmittedTick: Game.time",
      "delete Memory.notificationQueue[item.key]",
    ],
  },
};

const scorecards = {
  "screeps-first-room-code": {
    technical: 23, intent: 18, original: 14, english: 12,
    structure: 10, evidence: 8, seo: 8, accessibility: 5,
  },
  "screeps-working-state": {
    technical: 23, intent: 18, original: 14, english: 12,
    structure: 10, evidence: 8, seo: 8, accessibility: 5,
  },
  "screeps-game-notify": {
    technical: 23, intent: 18, original: 14, english: 12,
    structure: 10, evidence: 8, seo: 8, accessibility: 5,
  },
};
const minimums = {
  technical: 22, intent: 17, original: 13, english: 11,
  structure: 9, evidence: 7, seo: 7, accessibility: 5,
};
const failures = [];

if (Object.keys(articles).sort().join("|") !== Object.keys(expected).sort().join("|")) {
  failures.push("Editorial payload must contain exactly the three selected existing slugs");
}

let tocCount = 0;
let javascriptCount = 0;
const tempFiles = [];
const decodeHtml = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&#39;", "'")
  .replaceAll("&quot;", '"');

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

  if (article.finalScore !== 98 || article.faq.length !== 0) {
    failures.push(`${slug}: score must be 98 and FAQ must be empty`);
  }
  if (!article.verification.some(([label, value]) => label === "Screeps Console test" && value === "Pending")) {
    failures.push(`${slug}: Console evidence boundary missing`);
  }
  if (!article.verification.some(([label, value]) => label === "Live multi-tick verification" && value === "Pending")) {
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

  const recordStart = identity.registry.indexOf(`href: "${identity.path}"`);
  const overrideStart = identity.registry.indexOf(`"${identity.path}": {`);
  const start = recordStart >= 0 ? recordStart : overrideStart;
  const record = start >= 0 ? identity.registry.slice(start, start + 1800) : "";
  for (const signal of [identity.title, 'updatedAt: "2026-07-31"']) {
    if (!record.includes(signal)) {
      failures.push(`${slug}: registry metadata missing ${signal}`);
    }
  }

  const blocks = [...article.articleHtml.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  )];
  javascriptCount += blocks.length;
  for (const [index, block] of blocks.entries()) {
    const path = join(tmpdir(), `editorial-${slug}-${index}-${process.pid}.js`);
    tempFiles.push(path);
    writeFileSync(path, decodeHtml(block[1]), "utf8");
    try {
      execFileSync(process.execPath, ["--check", path], { stdio: "pipe" });
    } catch {
      failures.push(`${slug}: JavaScript block ${index + 1} failed node --check`);
    }
  }

  const score = scorecards[slug];
  for (const [name, minimum] of Object.entries(minimums)) {
    if (score[name] < minimum) failures.push(`${slug}: ${name} score below threshold`);
  }
  const total = Object.values(score).reduce((sum, value) => sum + value, 0);
  if (total !== 98) failures.push(`${slug}: score total is ${total}`);
}

for (const path of tempFiles) {
  try { unlinkSync(path); } catch {}
}

if (tocCount !== 37) failures.push(`Expected 37 TOC anchors, received ${tocCount}`);
if (javascriptCount !== 8) failures.push(`Expected 8 JavaScript blocks, received ${javascriptCount}`);
if (!publication.includes("englishEditorialFirstLoopStateNotifyOverrides20260731")) {
  failures.push("Publication aggregate is missing the new override batch");
}
for (const signal of [
  "normalizeFirstLoopStateNotifyArticle",
  "<code>energyPhase</code> string",
  "movement-deferred-fatigue",
  "The Creep was tired, so no new movement was accepted.",
]) {
  if (!publication.includes(signal)) {
    failures.push(`Publication correction is missing ${signal}`);
  }
}
if (!packageJson.includes("englisheditorialfirstloopstatenotify20260731check")) {
  failures.push("package.json is missing the dedicated editorial gate");
}
for (const phrase of ["delve", "game-changer", "unlock the power", "in today's fast-paced"]) {
  if (overrideSource.toLowerCase().includes(phrase)) failures.push(`Prohibited AI-style phrase: ${phrase}`);
}
for (const marker of [
  "/en/blog/screeps-first-room-code",
  "/en/blog/screeps-working-state",
  "/en/blog/screeps-game-notify",
  "**98**",
  "Screeps Console execution",
]) {
  if (!auditDoc.includes(marker)) failures.push(`Audit document is missing ${marker}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nFirst-loop, state, and notify editorial gate failed: ${failures.length} issues.`);
  process.exit(1);
}

console.log("First-loop, state, and notify editorial gate passed: 3 existing routes, 37 anchors, 8 JavaScript blocks, synchronized metadata, corrected fatigue and inline-code boundaries, 98-point scorecards, no FAQ, and explicit Pending evidence.");
