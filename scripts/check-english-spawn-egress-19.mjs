import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const contentPath = path.join(root, "src/lib/english-spawn-egress-content-19.ts");
const publishedPath = path.join(root, "src/lib/english-spawn-egress-published-19.ts");
const registryPath = path.join(root, "src/lib/english-link-source-registry-18.ts");
const staticRoutePath = path.join(root, "src/app/(en)/en/blog/screeps-spawn-exit-blocked/page.tsx");
const completePath = path.join(root, "src/lib/english-articles-complete.ts");
const supplementalTopicsPath = path.join(root, "src/lib/english-discovery-topic-overrides-20260806.ts");

const source = fs.readFileSync(contentPath, "utf8");
const published = fs.readFileSync(publishedPath, "utf8");
const registry = fs.readFileSync(registryPath, "utf8");
const staticRoute = fs.readFileSync(staticRoutePath, "utf8");
const complete = fs.readFileSync(completePath, "utf8");
const supplementalTopics = fs.readFileSync(supplementalTopicsPath, "utf8");
const failures = [];

const slug = "screeps-spawn-exit-blocked";
const href = "/en/blog/screeps-spawn-exit-blocked";
const chinesePath = "/blog/screeps-spawn-exit-blocked";

for (const [label, text] of [
  ["slug", `slug: "${slug}"`],
  ["English path", `path: "${href}"`],
  ["Chinese source", `chinesePath: "${chinesePath}"`],
  ["score", "finalScore: 98"],
  ["headline", "How to Diagnose a Creep That Finishes Spawning but Cannot Exit"],
]) {
  if (!source.includes(text)) failures.push(`Content lacks ${label}: ${text}`);
}

for (const text of [
  `href: "${href}"`,
  `chinesePath: "${chinesePath}"`,
  "category: \"SPAWNING · EXIT BLOCKAGE DIAGNOSIS\"",
  "finalScore: 98",
]) {
  if (!registry.includes(text)) failures.push(`Registry lacks ${text}`);
}

for (const text of [
  "englishSpawnEgressPublishedArticle",
  "english-spawn-egress-content-19",
  "english-spawn-egress-published-19",
  "EnglishArticlePage",
  "FAQPage",
  "getEnglishDiscoveryArticle",
]) {
  if (!staticRoute.includes(text)) failures.push(`Static route lacks ${text}`);
}

for (const text of [
  "unsafeDirectionsSnippet",
  "safeDirectionsSnippet",
  "Array.isArray(",
  "TOP_LEFT",
  "Screeps Spawn Exit Blocked: Directions and Egress Recovery",
]) {
  if (!published.includes(text)) failures.push(`Published normalization lacks ${text}`);
}
if (!published.includes("articleHtml: rawArticle.articleHtml.replace(")) {
  failures.push("Published normalization does not replace the unsafe directions snippet");
}

if (!complete.includes("englishLinkSourceBatchEighteenRegistry")) {
  failures.push("Complete English registry does not include the static-pair registry");
}
if (!supplementalTopics.includes(`"${href}": [`)) {
  failures.push("Supplemental English discovery map lacks the Spawn egress article");
}
for (const tag of ["spawn", "creeps", "movement", "debugging"]) {
  if (!supplementalTopics.includes(`"${tag}"`)) {
    failures.push(`Supplemental English discovery map lacks topic ${tag}`);
  }
}

for (const text of [
  "Quick answer",
  "Debugging checklist",
  "Frequently asked questions",
  "Official documentation and source",
  "Chinese source article",
  "Reviewed in full",
  "Public engine source",
  "open current snapshot is not a guarantee",
  "Screeps Console test",
  "Pending",
  "Live multi-Creep traffic, hostile occupancy, Power effects, and CPU-cost test",
  "cancelled spawning does not refund the Energy already spent",
]) {
  if (!source.includes(text)) failures.push(`Required evidence or section is missing: ${text}`);
}

const chineseCharacters = source.match(/[\u3400-\u9fff]/g) ?? [];
if (chineseCharacters.length > 0) {
  failures.push(`English content contains ${chineseCharacters.length} Chinese characters`);
}

const tocPairs = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)]
  .map((match) => ({ id: match[1], label: match[2] }));
if (tocPairs.length < 18) failures.push(`TOC has only ${tocPairs.length} items`);
for (const { id, label } of tocPairs) {
  if (!source.includes(`<h2 id="${id}">`) && !source.includes(`<h3 id="${id}">`)) {
    failures.push(`TOC anchor missing for ${label}: ${id}`);
  }
}

const codeBlocks = [...source.matchAll(/<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g)]
  .map((match) => match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&"));
if (codeBlocks.length < 10) failures.push(`Only ${codeBlocks.length} JavaScript blocks found`);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "english-spawn-egress-19-"));
try {
  codeBlocks.forEach((code, index) => {
    const filePath = path.join(tempDir, `block-${index + 1}.js`);
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", filePath], { encoding: "utf8" });
    if (result.status !== 0) {
      failures.push(`JavaScript block ${index + 1} failed syntax: ${result.stderr.trim()}`);
    }
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function classifySpawn({ exists, spawning, remainingTime }) {
  if (!exists) return "spawn-missing";
  if (!spawning) return "idle";
  return remainingTime <= 0 ? "egress-pending" : "spawning";
}

for (const [input, expected] of [
  [{ exists: false, spawning: false, remainingTime: 0 }, "spawn-missing"],
  [{ exists: true, spawning: false, remainingTime: 0 }, "idle"],
  [{ exists: true, spawning: true, remainingTime: 1 }, "spawning"],
  [{ exists: true, spawning: true, remainingTime: 0 }, "egress-pending"],
]) {
  if (classifySpawn(input) !== expected) failures.push(`Spawn-state case failed: ${expected}`);
}

function normalizeDirections(directions) {
  return Array.isArray(directions) && directions.length > 0
    ? [...directions]
    : [1, 2, 3, 4, 5, 6, 7, 8];
}
if (normalizeDirections(undefined).join(",") !== "1,2,3,4,5,6,7,8") {
  failures.push("Undefined Spawn directions did not fall back to all eight directions");
}
if (normalizeDirections([3, 2]).join(",") !== "3,2") {
  failures.push("Configured Spawn direction order was not preserved");
}

function chooseDirections(report) {
  return report
    .filter((item) => item.status === "open-in-current-snapshot")
    .map((item) => item.direction);
}
const directionReport = [
  { direction: 1, status: "blocked-in-current-snapshot" },
  { direction: 2, status: "open-in-current-snapshot" },
  { direction: 3, status: "open-in-current-snapshot" },
];
if (chooseDirections(directionReport).join(",") !== "2,3") {
  failures.push("Open direction order was not preserved");
}
if (chooseDirections(directionReport.slice(0, 1)).length !== 0) {
  failures.push("No-open-direction case failed");
}

function classifyTile({ wall, blockingStructure, blockingSite, creep, powerCreep }) {
  const blockers = [];
  if (wall) blockers.push("terrain-wall");
  if (blockingStructure) blockers.push("structure");
  if (blockingSite) blockers.push("site");
  if (creep) blockers.push("creep");
  if (powerCreep) blockers.push("power-creep");
  return blockers.length === 0 ? "open-in-current-snapshot" : "blocked-in-current-snapshot";
}
for (const [input, expected] of [
  [{ wall: false, blockingStructure: false, blockingSite: false, creep: false, powerCreep: false }, "open-in-current-snapshot"],
  [{ wall: true, blockingStructure: false, blockingSite: false, creep: false, powerCreep: false }, "blocked-in-current-snapshot"],
  [{ wall: false, blockingStructure: true, blockingSite: false, creep: false, powerCreep: false }, "blocked-in-current-snapshot"],
  [{ wall: false, blockingStructure: false, blockingSite: true, creep: false, powerCreep: false }, "blocked-in-current-snapshot"],
  [{ wall: false, blockingStructure: false, blockingSite: false, creep: true, powerCreep: false }, "blocked-in-current-snapshot"],
]) {
  if (classifyTile(input) !== expected) failures.push(`Tile classification failed: ${expected}`);
}

function logDue(lastLogAt, now, interval) {
  return !Number.isInteger(lastLogAt) || now - lastLogAt >= interval;
}
if (!logDue(null, 100, 20) || logDue(90, 100, 20) || !logDue(80, 100, 20)) {
  failures.push("Rate-limited blockage logging failed");
}

function verifyRelease({ spawningName, expectedName, creepExists, creepSpawning }) {
  if (spawningName === expectedName) return "still-spawning";
  if (!creepExists) return "creep-not-observed";
  return creepSpawning ? "creep-still-spawning" : "released";
}
for (const [input, expected] of [
  [{ spawningName: "Worker1", expectedName: "Worker1", creepExists: true, creepSpawning: true }, "still-spawning"],
  [{ spawningName: null, expectedName: "Worker1", creepExists: false, creepSpawning: false }, "creep-not-observed"],
  [{ spawningName: null, expectedName: "Worker1", creepExists: true, creepSpawning: true }, "creep-still-spawning"],
  [{ spawningName: null, expectedName: "Worker1", creepExists: true, creepSpawning: false }, "released"],
]) {
  if (verifyRelease(input) !== expected) failures.push(`Release verification failed: ${expected}`);
}

if (source.includes("automaticCancel") || source.includes("cancel-on-blockage")) {
  failures.push("Article contains an automatic cancellation strategy");
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nBatch 19 Spawn egress quality check failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  `Batch 19 Spawn egress check passed: 1 article, ${tocPairs.length} TOC anchors, ${codeBlocks.length} JavaScript blocks, safe default directions, and offline Spawn-state, direction, blocker, logging, and release cases.`,
);
