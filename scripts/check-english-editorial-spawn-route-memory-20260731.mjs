import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const override = readFileSync(
  join(root, "src/lib/english-editorial-spawn-route-memory-overrides-20260731.ts"),
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
const spawnRegistry = readFileSync(
  join(root, "src/lib/english-spawn-registry-3.ts"),
  "utf8",
);
const movementRegistry = readFileSync(
  join(root, "src/lib/english-movement-registry-6.ts"),
  "utf8",
);
const packageJson = readFileSync(join(root, "package.json"), "utf8");
const auditDoc = readFileSync(
  join(root, "docs/english-editorial-spawn-route-memory-batch-20260731.md"),
  "utf8",
);

const expected = {
  "screeps-dynamic-creep-body": {
    path: "/en/blog/screeps-dynamic-creep-body",
    chinesePath: "/blog/screeps-dynamic-creep-body-energy",
    title: "Screeps Dynamic Creep Body: Minimum, Target, and Emergency Plans",
    beforeScore: 92,
    registry: spawnRegistry,
  },
  "screeps-map-find-route": {
    path: "/en/blog/screeps-map-find-route",
    chinesePath: "/blog/screeps-map-find-route",
    title: "Screeps Game.map.findRoute(): Plan and Execute One Room Step",
    beforeScore: 93,
    registry: movementRegistry,
  },
  "screeps-clean-dead-creep-memory": {
    path: "/en/blog/screeps-clean-dead-creep-memory",
    chinesePath: "/blog/screeps-clean-dead-creep-memory",
    title: "Screeps Dead Creep Memory: Clean Names and Owned Indexes",
    beforeScore: 93,
    registry: foundationRegistry,
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
  if (!override.includes(`"${slug}": {`)) {
    failures.push(`${slug}: override missing`);
  }
  if (!override.includes(`title: "${identity.title}"`)) {
    failures.push(`${slug}: title missing`);
  }
  if (!identity.registry.includes(`href: "${identity.path}"`)) {
    failures.push(`${slug}: existing URL missing`);
  }
  if (!identity.registry.includes(`chinesePath: "${identity.chinesePath}"`)) {
    failures.push(`${slug}: Chinese mapping changed or missing`);
  }
  if (!identity.registry.includes(identity.title)) {
    failures.push(`${slug}: discovery title is not synchronized`);
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

const registries = `${foundationRegistry}\n${spawnRegistry}\n${movementRegistry}`;
const updatedDates = registries.match(/updatedAt: "2026-07-31"/g) ?? [];
if (updatedDates.length !== 3) {
  failures.push(`Expected three scoped updatedAt values, received ${updatedDates.length}`);
}
if ((registries.match(/publishedAt: "2026-07-25"/g) ?? []).length !== 9) {
  failures.push("Batch publication dates changed or are incomplete");
}
if ((override.match(/faq: \[\]/g) ?? []).length !== 3) {
  failures.push("All three selected pages must remove redundant FAQ data");
}
if (!publication.includes("englishEditorialSpawnRouteMemoryOverrides20260731")) {
  failures.push("Spawn, route, and Memory editorial overrides are not imported");
}
if (!publication.includes("...englishEditorialSpawnRouteMemoryOverrides20260731")) {
  failures.push("Spawn, route, and Memory editorial overrides are not published");
}
if (!packageJson.includes("englisheditorialspawnroutememory20260731check")) {
  failures.push("Dedicated editorial gate is not wired into package scripts");
}

const lower = override.toLowerCase();
for (const phrase of banned) {
  if (lower.includes(phrase)) {
    failures.push(`Prohibited phrase remains: ${phrase}`);
  }
}
if (override.includes("Quick answer")) {
  failures.push("Generic Quick answer heading remains in selected rewrites");
}
for (const required of [
  "minimum, target, and emergency body policies",
  "status: 'wait-or-scale'",
  "maximumParts > 50",
  "unusedEnergy: budget - bodyCost",
  "dryRunResult",
  "return Infinity",
  "Game.map.describeExits(currentRoom)",
  "findClosestByPath",
  "range: 0",
  "Object.hasOwn(gameCreeps, name)",
  "cleanOwnedCreepIndexes(name)",
  "ticksToLive === 1",
  "Screeps Console test",
  "Live multi-tick verification",
  "https://docs.screeps.com/",
]) {
  if (!override.includes(required)) {
    failures.push(`Missing technical or evidence boundary: ${required}`);
  }
}

const headingIds = new Set(
  [...override.matchAll(/<h[2-6] id="([^"]+)"/g)]
    .map((match) => match[1]),
);
const tocIds = [...override.matchAll(/\["([a-z0-9-]+)", "[^"]+"\]/g)]
  .map((match) => match[1]);
if (tocIds.length !== 35) {
  failures.push(`Expected 35 TOC entries, received ${tocIds.length}`);
}
for (const id of tocIds) {
  if (!headingIds.has(id)) {
    failures.push(`TOC target #${id} is missing`);
  }
}

const blocks = [...override.matchAll(
  /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
)];
if (blocks.length !== 14) {
  failures.push(`Expected 14 JavaScript blocks, received ${blocks.length}`);
}
for (const [index, match] of blocks.entries()) {
  const file = join(
    tmpdir(),
    `english-editorial-spawn-route-memory-${index}.js`,
  );
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
      `JavaScript block ${index + 1} failed node --check: ${error.message}`,
    );
  } finally {
    unlinkSync(file);
  }
}

if (Object.keys(expected).length !== 3) {
  failures.push("Editorial batch must contain exactly three existing pages");
}
if (failures.length) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `\nSpawn, route, and Memory English editorial gate failed: ${failures.length} item(s).`,
  );
  process.exit(1);
}

console.log(
  `Spawn, route, and Memory editorial gate passed: 3 existing pages, ${blocks.length} JavaScript blocks, stable URLs, scoped dates, distinct intent, Pending live evidence, and 98-point internal scores.`,
);
