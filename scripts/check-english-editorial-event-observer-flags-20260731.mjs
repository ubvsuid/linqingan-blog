import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

const root = process.cwd();
const overridePath =
  "src/lib/english-editorial-event-observer-flags-overrides-20260731.ts";
const overrideSource = readFileSync(join(root, overridePath), "utf8");
const publication = readFileSync(
  join(root, "src/lib/english-editorial-published-20260731.ts"),
  "utf8",
);
const observabilityRegistry = readFileSync(
  join(root, "src/lib/english-observability-registry-9.ts"),
  "utf8",
);
const visionRegistry = readFileSync(
  join(root, "src/lib/english-vision-registry-7.ts"),
  "utf8",
);
const configRegistry = readFileSync(
  join(root, "src/lib/english-config-code-registry-16.ts"),
  "utf8",
);
const packageJson = readFileSync(join(root, "package.json"), "utf8");
const auditDoc = readFileSync(
  join(
    root,
    "docs/english-editorial-event-observer-flags-batch-20260731.md",
  ),
  "utf8",
);

const encodedMatch = overrideSource.match(
  /const encodedEditorialOverrides = "([A-Za-z0-9+/=]+)";/,
);
if (!encodedMatch) {
  console.error("ERROR: Encoded event, Observer, and Flag payload is missing");
  process.exit(1);
}

const articles = JSON.parse(
  gunzipSync(Buffer.from(encodedMatch[1], "base64")).toString("utf8"),
);

const expected = {
  "screeps-room-event-log": {
    path: "/en/blog/screeps-room-event-log",
    chinesePath: "/blog/screeps-room-event-log",
    publishedAt: "2026-07-25",
    title: "Screeps Room.getEventLog(): Process Each Previous Tick Once",
    headline: "Read a Room Event Log Once Without Duplicating Incidents",
    registry: observabilityRegistry,
    signals: [
      "already-processed",
      "Memory.roomEventWindows",
      "FIND_MY_POWER_CREEPS",
      "event-log-not-array",
    ],
  },
  "screeps-observer-observe-room": {
    path: "/en/blog/screeps-observer-observe-room",
    chinesePath: "/blog/screeps-observer-observe-room",
    publishedAt: "2026-07-25",
    title: "Screeps Observer: Coordinate One Final observeRoom() Call",
    headline:
      "Stop Multiple Observer Calls From Overwriting the Request You Track",
    registry: visionRegistry,
    signals: [
      "createObservationPlan",
      "selectObservationRequest",
      "submitObservationPlan",
      "queued-in-plan",
    ],
  },
  "screeps-flags-configuration": {
    path: "/en/blog/screeps-flags-configuration",
    chinesePath: "/blog/screeps-flags-config",
    publishedAt: "2026-07-26",
    title:
      "Screeps Flags: Bind Configuration to Room and Target Identity",
    headline: "Fail Closed When a Flag and Its Saved Target Disagree",
    registry: configRegistry,
    signals: [
      "target-room-mismatch",
      "fallback-forbidden",
      "configured-target-required",
      "recordConfigurationChange",
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
  failures.push("Payload must contain exactly the three selected existing slugs");
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

  const recordStart = identity.registry.indexOf(
    `href: "${identity.path}"`,
  );
  const record =
    recordStart >= 0
      ? identity.registry.slice(recordStart, recordStart + 1900)
      : "";
  for (const signal of [
    identity.title,
    'updatedAt: "2026-07-31"',
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
      `editorial-event-observer-flags-${slug}-${index}-${process.pid}.js`,
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
if (javascriptCount !== 21) {
  failures.push(
    `Expected 21 JavaScript blocks, received ${javascriptCount}`,
  );
}
if (
  !publication.includes(
    "englishEditorialEventObserverFlagsOverrides20260731",
  )
) {
  failures.push("Publication aggregate is missing the new override batch");
}
if (
  !packageJson.includes(
    "englisheditorialeventobserverflags20260731check",
  )
) {
  failures.push("package.json is missing the dedicated editorial gate");
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
  "/en/blog/screeps-room-event-log",
  "/en/blog/screeps-observer-observe-room",
  "/en/blog/screeps-flags-configuration",
  "**98**",
  "Screeps Console execution",
  "same-tick Observer overwrite",
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
    `\nEvent, Observer, and Flag editorial gate failed: `
      + `${failures.length} issues.`,
  );
  process.exit(1);
}

console.log(
  "Event, Observer, and Flag editorial gate passed: "
    + "3 existing routes, 34 anchors, 21 JavaScript blocks, "
    + "synchronized metadata, idempotent event windows, "
    + "single-call Observer coordination, room-bound Flag identity, "
    + "98-point scorecards, no FAQ, and explicit Pending evidence.",
);
