import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

const root = process.cwd();
const overrideSource = readFileSync(
  join(root, "src/lib/english-editorial-targets-visual-modules-overrides-20260731.ts"),
  "utf8",
);
const publication = readFileSync(
  join(root, "src/lib/english-editorial-published-20260731.ts"),
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
const roomVisualFinal = readFileSync(
  join(root, "src/lib/english-editorial-roomvisual-evidence-final-20260805.ts"),
  "utf8",
);
const observabilityFinalIndex = readFileSync(
  join(root, "src/lib/english-editorial-observability-evidence-20260805.ts"),
  "utf8",
);
const configRegistry = readFileSync(
  join(root, "src/lib/english-config-code-registry-16.ts"),
  "utf8",
);
const packageJson = readFileSync(join(root, "package.json"), "utf8");
const auditDoc = readFileSync(
  join(root, "docs/english-editorial-targets-visual-modules-batch-20260731.md"),
  "utf8",
);

const encodedMatch = overrideSource.match(
  /const encodedEditorialOverrides = "([A-Za-z0-9+/=]+)";/,
);
if (!encodedMatch) {
  console.error("ERROR: Encoded editorial payload is missing");
  process.exit(1);
}

const overrides = JSON.parse(
  gunzipSync(Buffer.from(encodedMatch[1], "base64")).toString("utf8"),
);

const expected = {
  "screeps-get-object-by-id": {
    path: "/en/blog/screeps-get-object-by-id",
    chinesePath: "/blog/screeps-game-get-object-by-id",
    title: "Screeps Game.getObjectById(): Resolve Saved Targets Safely",
    discoveryTitle: "Screeps Game.getObjectById(): Resolve Saved Targets Safely",
    updatedAt: "2026-07-31",
    beforeScore: 92,
    registry: foundationRegistry,
  },
  "screeps-roomvisual-debug": {
    path: "/en/blog/screeps-roomvisual-debug",
    chinesePath: "/blog/screeps-roomvisual-debug",
    title: "Screeps RoomVisual Debugging: Draw Current State Within a Budget",
    discoveryTitle: "Screeps RoomVisual: Coordinate One Room-Bound Debug Layer",
    updatedAt: "2026-08-05",
    beforeScore: 92,
    registry: observabilityRegistry,
  },
  "screeps-require-modules": {
    path: "/en/blog/screeps-require-modules",
    chinesePath: "/blog/screeps-modules-require",
    title: "Screeps Modules: One Main Loop, Small Contracts, Fresh Tick Data",
    discoveryTitle: "Screeps Modules: One Main Loop, Small Contracts, Fresh Tick Data",
    updatedAt: "2026-07-31",
    beforeScore: 93,
    registry: configRegistry,
  },
};

const scorecards = Object.fromEntries(
  Object.keys(expected).map((slug) => [
    slug,
    {
      technicalAccuracy: 23,
      searchIntent: 18,
      originalValue: 14,
      englishQuality: 12,
      structure: 10,
      evidenceTransparency: 8,
      seo: 8,
      accessibility: 5,
    },
  ]),
);
const minimums = {
  technicalAccuracy: 22,
  searchIntent: 17,
  originalValue: 13,
  englishQuality: 11,
  evidenceTransparency: 7,
};
const banned = [
  "in today's fast-paced world",
  "in this comprehensive guide",
  "whether you are a beginner or an expert",
  "let's dive in",
  "delve into",
  "unlock the power of",
  "seamlessly",
  "robust",
  "game-changing",
  "it is important to note that",
  "by following these steps",
];
const failures = [];

for (const [slug, identity] of Object.entries(expected)) {
  const article = overrides[slug];
  if (!article) {
    failures.push(`${slug}: override missing`);
    continue;
  }
  if (article.title !== identity.title) {
    failures.push(`${slug}: historical title mismatch`);
  }
  if (article.finalScore !== 98) {
    failures.push(`${slug}: final score must be 98`);
  }
  if (!Array.isArray(article.faq) || article.faq.length !== 0) {
    failures.push(`${slug}: redundant FAQ data remains`);
  }
  if (!identity.registry.includes(`href: "${identity.path}"`)) {
    failures.push(`${slug}: existing URL missing`);
  }
  if (!identity.registry.includes(`chinesePath: "${identity.chinesePath}"`)) {
    failures.push(`${slug}: Chinese mapping changed or missing`);
  }
  if (!identity.registry.includes(identity.discoveryTitle)) {
    failures.push(`${slug}: current discovery title is not synchronized`);
  }
  if (!auditDoc.includes(`| ${identity.path} | ${identity.beforeScore} |`)) {
    failures.push(`${slug}: before score evidence is missing`);
  }

  const components = scorecards[slug];
  for (const [name, minimum] of Object.entries(minimums)) {
    if (components[name] < minimum) {
      failures.push(`${slug}: ${name} below ${minimum}`);
    }
  }
  const total = Object.values(components)
    .reduce((sum, value) => sum + value, 0);
  if (total !== 98) {
    failures.push(`${slug}: score components total ${total}, expected 98`);
  }
  if (!auditDoc.includes(
    `| ${identity.path} | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |`,
  )) {
    failures.push(`${slug}: final score evidence is missing`);
  }
}

for (const identity of Object.values(expected)) {
  const registry = identity.registry;
  const path = identity.path;
  const start = registry.indexOf(`href: "${path}"`);
  const next = registry.indexOf("\n  {", start + 1);
  const record = registry.slice(start, next < 0 ? registry.length : next);
  if (!record.includes('publishedAt: "2026-07-25"')
      && !record.includes('publishedAt: "2026-07-26"')) {
    failures.push(`${path}: publication date changed or missing`);
  }
  if (!record.includes(`updatedAt: "${identity.updatedAt}"`)) {
    failures.push(`${path}: current scoped updatedAt is missing`);
  }
}

if (!publication.includes("englishEditorialTargetsVisualModulesOverrides20260731")) {
  failures.push("Historical editorial overrides are not imported");
}
if (!publication.includes("...englishEditorialTargetsVisualModulesOverrides20260731")) {
  failures.push("Historical editorial overrides are not published");
}
if (!publication.includes("englishEditorialObservabilityEvidenceOverrides20260805")) {
  failures.push("Current observability overrides are not imported");
}
if (!publication.includes("...englishEditorialObservabilityEvidenceOverrides20260805")) {
  failures.push("Current observability overrides are not published");
}
if (!packageJson.includes("englisheditorialtargetsvisualmodules20260731check")) {
  failures.push("Dedicated editorial gate is not wired into package scripts");
}

for (const required of [
  "englishEditorialRoomVisualEvidenceFinalArticle20260805",
  "JSON.parse(JSON.stringify(layer))",
]) {
  if (!roomVisualFinal.includes(required)) {
    failures.push(`Current RoomVisual final wrapper is missing: ${required}`);
  }
}
for (const required of [
  "englishEditorialRoomVisualEvidenceFinalArticle20260805",
  "englishEditorialObservabilityEvidenceOverrides20260805",
]) {
  if (!observabilityFinalIndex.includes(required)) {
    failures.push(`Current observability index is missing: ${required}`);
  }
}

const articles = Object.values(overrides);
const combinedText = articles
  .map((article) => `${article.title}\n${article.headline}\n${article.articleHtml}`)
  .join("\n")
  .toLowerCase();

for (const phrase of banned) {
  if (combinedText.includes(phrase)) {
    failures.push(`Prohibited phrase remains: ${phrase}`);
  }
}
if (combinedText.includes("quick answer")) {
  failures.push("Generic Quick answer heading remains in selected rewrites");
}

for (const required of [
  "Game.getObjectById(record.id)",
  "'vision-unavailable'",
  "'missing-visible-room'",
  "task logic",
  "visual.getSize()",
  "480000",
  "module.exports.loop",
  "run(creep, context)",
  "global.roleCountCache",
  "Screeps Console test",
  "Live multi-tick verification",
  "https://docs.screeps.com/",
]) {
  if (!JSON.stringify(overrides).includes(required)) {
    failures.push(`Missing historical technical or evidence boundary: ${required}`);
  }
}

let tocCount = 0;
let codeCount = 0;
for (const [slug, article] of Object.entries(overrides)) {
  const headingIds = new Set(
    [...article.articleHtml.matchAll(/<h[2-6] id="([^"]+)"/g)]
      .map((match) => match[1]),
  );
  tocCount += article.toc.length;
  for (const [id] of article.toc) {
    if (!headingIds.has(id)) {
      failures.push(`${slug}: TOC target #${id} is missing`);
    }
  }

  const blocks = [...article.articleHtml.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  )];
  codeCount += blocks.length;
  for (const [index, match] of blocks.entries()) {
    const file = join(tmpdir(), `english-editorial-tvm-${slug}-${index}.js`);
    const code = match[1]
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&amp;", "&")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'");
    writeFileSync(file, code);
    try {
      execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    } catch (error) {
      failures.push(
        `${slug}: JavaScript block ${index + 1} failed node --check: ${error.message}`,
      );
    } finally {
      unlinkSync(file);
    }
  }
}

if (tocCount !== 35) {
  failures.push(`Expected 35 historical TOC entries, received ${tocCount}`);
}
if (codeCount !== 14) {
  failures.push(`Expected 14 historical JavaScript blocks, received ${codeCount}`);
}
if (Object.keys(expected).length !== 3 || articles.length !== 3) {
  failures.push("Historical editorial batch must contain exactly three existing pages");
}

if (failures.length) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `\nTarget, visual, and modules editorial gate failed: ${failures.length} item(s).`,
  );
  process.exit(1);
}

console.log(
  `Target, visual, and modules editorial gate passed: 3 historical pages, ${codeCount} JavaScript blocks, ${tocCount} TOC anchors, stable URLs, current discovery metadata, reviewed RoomVisual supersession, Pending live evidence, and 98-point internal scores.`,
);
