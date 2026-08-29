import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { gunzipSync } from "node:zlib";

const root = process.cwd();
const read = (file) =>
  fs.readFileSync(path.join(root, file), "utf8");

const overridePath =
  "src/lib/english-editorial-tower-events-overrides-20260801.ts";
const overrideSource = read(overridePath);
const payloadPaths = [
  "src/lib/english-editorial-tower-attack-event-20260801.ts",
  "src/lib/english-editorial-tower-heal-event-20260801.ts",
  "src/lib/english-editorial-tower-repair-event-20260801.ts",
];
const aggregator = read(
  "src/lib/english-editorial-published-20260731.ts",
);
const registry = read(
  "src/lib/english-tower-registry-13.ts",
);
const route = read(
  "src/app/(en)/en/blog/[slug]/page.tsx",
);
const packageSource = read("package.json");
const smoke = read(
  "scripts/smoke-english-tower-13.mjs",
);
const audit = read(
  "docs/english-editorial-tower-events-batch-20260801.md",
);
const failures = [];

const articles = [];
for (const payloadPath of payloadPaths) {
  const source = read(payloadPath);
  const chunks = [
    ...source.matchAll(
      /^\s*"([A-Za-z0-9+/=]+)",?\s*$/gm,
    ),
  ].map((match) => match[1]);

  try {
    articles.push(
      JSON.parse(
        gunzipSync(
          Buffer.from(
            chunks.join(""),
            "base64",
          ),
        ).toString("utf8"),
      ),
    );
  } catch (error) {
    failures.push(
      `${payloadPath} cannot be decoded: ${error.message}`,
    );
  }
}

const expected = [
  {
    slug: "screeps-tower-auto-attack-hostiles",
    path: "/en/blog/screeps-tower-auto-attack-hostiles",
    chinesePath: "/blog/screeps-tower-auto-attack-hostiles",
    title:
      "Screeps Tower.attack(): Verify One Multi-Tower Volley",
    headline:
      "Assign Tower Fire by ID and Verify Every Attack Event",
    intent:
      "Submit one reviewed multi-Tower volley and verify every accepted Tower-target event on the next tick",
    signals: [
      "EVENT_ATTACK",
      "EVENT_ATTACK_TYPE_RANGED",
      "verified-tower-volley",
      "event-window-missed",
      "room.getEventLog()",
      "estimatedRawDamage",
    ],
  },
  {
    slug: "screeps-tower-heal-creeps",
    path: "/en/blog/screeps-tower-heal-creeps",
    chinesePath: "/blog/screeps-tower-heal-creeps",
    title:
      "Screeps Tower.heal(): Verify Exact Heal Events",
    headline:
      "Heal Owned Creeps and Power Creeps Without Guessing the Result",
    intent:
      "Allocate Tower healing to owned Creeps or Power Creeps and verify every accepted ranged-heal event",
    registryTitle:
      "Screeps Tower Healing: Injury Ratio, Missing Hits, and Range",
    registryIntent:
      "Heal the most urgent owned injured Creep with deterministic Tower priorities",
    registryUpdatedAt: "2026-08-28",
    signals: [
      "FIND_MY_POWER_CREEPS",
      "EVENT_HEAL",
      "EVENT_HEAL_TYPE_RANGED",
      "verified-tower-healing",
      "allocateTowerHealing",
      "room.getEventLog()",
    ],
  },
  {
    slug: "screeps-tower-repair-threshold",
    path: "/en/blog/screeps-tower-repair-threshold",
    chinesePath: "/blog/screeps-tower-repair-threshold",
    title:
      "Screeps Tower.repair(): Verify Exact Repair Events",
    headline:
      "Repair One Structure Without Confusing Decay or Other Workers",
    intent:
      "Repair one ordinary structure under a reserve and verify each accepted Tower repair event and Energy cost",
    signals: [
      "EVENT_REPAIR",
      "energySpent",
      "verified-tower-repair",
      "allocateTowerRepair",
      "TOWER_POWER_REPAIR",
      "room.getEventLog()",
    ],
  },
];

if (!Array.isArray(articles) || articles.length !== 3) {
  failures.push(
    `Tower override must contain exactly 3 articles; received ${articles.length}`,
  );
}

const bySlug = new Map(
  articles.map((article) => [article.slug, article]),
);
const allHtml = articles
  .map((article) => article.articleHtml)
  .join("\n");
const allArticleText = JSON.stringify(articles);

for (const item of expected) {
  const article = bySlug.get(item.slug);
  if (!article) {
    failures.push(`Missing override article: ${item.slug}`);
    continue;
  }

  for (const [field, value] of [
    ["path", item.path],
    ["chinesePath", item.chinesePath],
    ["title", item.title],
    ["headline", item.headline],
    ["searchIntent", item.intent],
    ["publishedAt", "2026-07-26"],
    ["finalScore", 98],
  ]) {
    if (article[field] !== value) {
      failures.push(
        `${item.slug}: ${field} does not match the approved value`,
      );
    }
  }

  if (!Array.isArray(article.faq) || article.faq.length !== 0) {
    failures.push(`${item.slug}: FAQ data must be empty`);
  }

  for (const signal of item.signals) {
    if (!article.articleHtml.includes(signal)) {
      failures.push(`${item.slug}: missing signal ${signal}`);
    }
  }

  for (const evidence of [
    ["Screeps Console test", "Pending"],
    ["Live multi-tick verification", "Pending"],
  ]) {
    if (
      !article.verification.some(
        ([label, value]) =>
          label === evidence[0]
          && value === evidence[1],
      )
    ) {
      failures.push(
        `${item.slug}: missing Pending evidence ${evidence[0]}`,
      );
    }
  }

  if (
    article.articleHtml.includes('<h2 id="faq">')
    || article.articleHtml.includes("Frequently asked questions")
  ) {
    failures.push(`${item.slug}: repeated FAQ section remains`);
  }
}

for (const text of [
  "TOWER_POWER_ATTACK",
  "TOWER_POWER_HEAL",
  "TOWER_POWER_REPAIR",
  "TOWER_OPTIMAL_RANGE",
  "TOWER_FALLOFF_RANGE",
  "TOWER_FALLOFF",
  "PWR_OPERATE_TOWER",
  "PWR_DISRUPT_TOWER",
  "POWER_INFO",
  "EVENT_ATTACK_TYPE_RANGED",
  "EVENT_HEAL_TYPE_RANGED",
  "EVENT_REPAIR",
  "energySpent",
  "submittedAt + 1",
  "event-window-missed",
  "partial-event-match",
  "Screeps Console test",
  "Live multi-tick verification",
]) {
  if (!allArticleText.includes(text)) {
    failures.push(`Deep Tower content missing: ${text}`);
  }
}

for (const url of [
  "https://docs.screeps.com/api/#StructureTower.attack",
  "https://docs.screeps.com/api/#StructureTower.heal",
  "https://docs.screeps.com/api/#StructureTower.repair",
  "https://docs.screeps.com/api/#Room.getEventLog",
  "https://docs.screeps.com/defense.html",
  "https://docs.screeps.com/power.html",
]) {
  if (!allHtml.includes(url)) {
    failures.push(`Official source missing: ${url}`);
  }
}

const tocEntries = articles.flatMap(
  (article) => article.toc,
);
if (tocEntries.length !== 35) {
  failures.push(
    `Expected 35 TOC entries; received ${tocEntries.length}`,
  );
}
for (const article of articles) {
  for (const [id] of article.toc) {
    if (
      !article.articleHtml.includes(`<h2 id="${id}">`)
      && !article.articleHtml.includes(`<h3 id="${id}">`)
    ) {
      failures.push(`${article.slug}: missing TOC anchor ${id}`);
    }
  }
}

const blocks = articles.flatMap((article) => [
  ...article.articleHtml.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  ),
].map((match) =>
  match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&"),
));

if (blocks.length !== 18) {
  failures.push(
    `Expected 18 JavaScript blocks; received ${blocks.length}`,
  );
}

const temp = fs.mkdtempSync(
  path.join(os.tmpdir(), "tower-events-"),
);
try {
  blocks.forEach((code, index) => {
    const file = path.join(temp, `${index}.js`);
    fs.writeFileSync(file, code);
    const result = spawnSync(
      process.execPath,
      ["--check", file],
      { encoding: "utf8" },
    );
    if (result.status !== 0) {
      failures.push(
        `JavaScript block ${index + 1} failed syntax: ${result.stderr.trim()}`,
      );
    }
  });
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

function rangeAmount(basePower, range) {
  const optimal = 5;
  const falloffRange = 20;
  const falloff = 0.75;
  const clamped = Math.max(
    optimal,
    Math.min(falloffRange, range),
  );
  const fraction =
    (clamped - optimal)
    / (falloffRange - optimal);

  return Math.floor(
    basePower * (1 - falloff * fraction),
  );
}

for (const [basePower, range, value] of [
  [600, 5, 600],
  [600, 6, 570],
  [600, 20, 150],
  [400, 5, 400],
  [400, 6, 380],
  [400, 20, 100],
  [800, 5, 800],
  [800, 6, 760],
  [800, 20, 200],
]) {
  if (rangeAmount(basePower, range) !== value) {
    failures.push(
      `Tower range formula failed: ${basePower}/${range}`,
    );
  }
}

for (const text of [
  "englishEditorialTowerAttackEventArticle20260801",
  "englishEditorialTowerHealEventArticle20260801",
  "englishEditorialTowerRepairEventArticle20260801",
]) {
  if (!overrideSource.includes(text)) {
    failures.push(`Tower override aggregator missing: ${text}`);
  }
}

for (const text of [
  'import { englishEditorialTowerEventsOverrides20260801 }',
  "...englishEditorialTowerEventsOverrides20260801",
]) {
  if (!aggregator.includes(text)) {
    failures.push(`Editorial aggregator missing: ${text}`);
  }
}

for (const item of expected) {
  const registryTitle = item.registryTitle ?? item.title;
  const registryIntent = item.registryIntent ?? item.intent;
  const registryUpdatedAt = item.registryUpdatedAt ?? "2026-08-01";

  for (const text of [
    `href: "${item.path}"`,
    `chinesePath: "${item.chinesePath}"`,
    registryTitle,
    registryIntent,
    'publishedAt: "2026-07-26"',
    `updatedAt: "${registryUpdatedAt}"`,
    "finalScore: 98",
  ]) {
    if (!registry.includes(text)) {
      failures.push(`Registry missing for ${item.slug}: ${text}`);
    }
  }
}

if (
  !route.includes("getEnglishEditorialPublished20260731")
  || !route.includes("englishTowerBatchThirteenArticles")
) {
  failures.push("Existing dynamic route integration changed unexpectedly");
}

for (const text of [
  "englisheditorialtowerevents20260801check",
  "check-english-editorial-tower-events-20260801.mjs",
]) {
  if (!packageSource.includes(text)) {
    failures.push(`Package integration missing: ${text}`);
  }
}

for (const text of [
  "verified-tower-volley",
  "verified-tower-repair",
  "FIND_MY_CREEPS",
  "heal-partial",
  "Memory.towerHealing",
  "EVENT_ATTACK_TYPE_RANGED",
  "energySpent",
  'modifiedAt: "2026-08-01"',
  'modifiedAt: "2026-08-28"',
  '"@type":"BlogPosting"',
  '"@type":"FAQPage"',
]) {
  if (!smoke.includes(text)) {
    failures.push(`Production smoke missing signal: ${text}`);
  }
}

for (const phrase of [
  "as an ai",
  "in today's fast-paced",
  "unlock the power",
  "game-changer",
  "delve into",
  "seamlessly",
]) {
  if (allHtml.toLowerCase().includes(phrase)) {
    failures.push(`Prohibited generic phrase remains: ${phrase}`);
  }
}

for (const text of [
  "These are project-internal editorial scores",
  "| Tower attack events | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |",
  "| Tower heal events | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |",
  "| Tower repair events | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |",
  "Screeps Console execution remains Pending",
]) {
  if (!audit.includes(text)) {
    failures.push(`Audit record missing: ${text}`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) =>
    console.error(`ERROR: ${failure}`),
  );
  process.exit(1);
}

console.log(
  "Deep Tower event editorial gate passed: historical 2026-08-01 payloads remain intact, current registry supersession is explicit, and production smoke covers the current Tower heal workflow separately.",
);
