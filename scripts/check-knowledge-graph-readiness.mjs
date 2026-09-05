import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  CONTENT_ID_PATTERN,
  loadContentIdentityRegistry,
} from "./lib/content-identity-registry.mjs";
import {
  ENGLISH_CONTENT_ID_PATTERN,
  loadEnglishContentIdentityReadiness,
} from "./lib/knowledge-graph-durable-identities.mjs";

const root = process.cwd();
const UUID_SUFFIX = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const TOOL_ID_PATTERN = new RegExp(`tool_${UUID_SUFFIX}`, "g");
const EXPERIMENT_ID_PATTERN = new RegExp(`experiment_${UUID_SUFFIX}`, "g");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function parseJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const knowledge = parseJson("content/knowledge-identities.json");
const roadmap = parseJson("content/roadmap-identities.json");
assert.equal(knowledge.schemaVersion, 1, "knowledge identities schemaVersion");
assert.equal(roadmap.schemaVersion, 1, "roadmap identities schemaVersion");
assert.equal(knowledge.records.length, 68, "Knowledge durable identity coverage");
assert.equal(roadmap.records.length, 12, "Beginner durable identity coverage");

const chinese = loadContentIdentityRegistry(root);
assert.equal(chinese.records.length, 80, "Chinese Article/Beginner durable identity coverage");
const chineseIds = new Set();
for (const record of chinese.records) {
  assert.match(record.contentId, CONTENT_ID_PATTERN, `${record.slug} durable contentId`);
  assert.equal(chineseIds.has(record.contentId), false, `duplicate Chinese contentId ${record.contentId}`);
  chineseIds.add(record.contentId);
}

const english = loadEnglishContentIdentityReadiness(root);
assert.equal(english.records.length, 80, "English durable identity coverage");
assert.equal(english.bilingualRecords.length, 77, "English source-derived identity coverage");
assert.equal(english.standaloneRecords.length, 3, "English-original durable identity coverage");
for (const record of english.records) {
  assert.match(record.contentId, ENGLISH_CONTENT_ID_PATTERN, `${record.href} English durable contentId`);
  assert.equal(chineseIds.has(record.contentId), false, `${record.href} must not reuse a Chinese contentId`);
  if (record.sourceContentId) {
    assert.equal(record.contentId, `en_${record.sourceContentId}`, `${record.href} must derive only from its permanent Chinese contentId`);
  }
}

const associations = parseJson("content/article-language-associations.json");
assert.equal(associations.schemaVersion, 1, "language association schemaVersion");
assert.equal(associations.records.length, 3, "explicit counterpart association coverage");
const expectedAssociationPaths = new Set([
  "/blog/screeps-creep-attack|/en/blog/screeps-creep-attack",
  "/blog/screeps-creep-pull|/en/blog/screeps-creep-pull",
  "/blog/screeps-pathfinder-search|/en/blog/screeps-pathfinder-search",
]);
assert.deepEqual(
  new Set(associations.records.map((record) => `${record.chinesePath}|${record.englishPath}`)),
  expectedAssociationPaths,
  "explicit language associations must preserve the three real counterpart pairs",
);

const toolIds = read("src/lib/tool-catalog.ts").match(TOOL_ID_PATTERN) ?? [];
assert.equal(toolIds.length, 8, "Tool durable identity coverage");
assert.equal(new Set(toolIds).size, toolIds.length, "Tool IDs must be unique");

const experimentIds = read("src/lib/tick-lab-experiments.ts").match(EXPERIMENT_ID_PATTERN) ?? [];
assert.equal(experimentIds.length, 3, "Tick Lab durable identity coverage");
assert.equal(new Set(experimentIds).size, experimentIds.length, "Tick Lab experiment IDs must be unique");

const apiSource = read("src/lib/screeps-api-reference.ts");
for (const owner of ["creep-transfer", "spawn-spawn-creep", "spawn-renew-creep", "spawn-recycle-creep"]) {
  const ownerIndex = apiSource.indexOf(`id: \"${owner}\"`);
  assert.notEqual(ownerIndex, -1, `missing API owner ${owner}`);
  const nextEntry = apiSource.indexOf("\n  {", ownerIndex + 1);
  const block = apiSource.slice(ownerIndex, nextEntry === -1 ? apiSource.length : nextEntry);
  assert.match(block, /returnCodeNames\s*:\s*\[/, `${owner} must declare explicit ReturnCode ownership`);
}

const evidenceSchema = read("scripts/lib/verification-evidence-validation.mjs");
assert.match(evidenceSchema, /evidence_key|evidenceKey/, "Runtime Evidence must expose a stable evidence key");
const evidenceReadPaths = [
  "src/lib/verification-evidence.ts",
  "src/lib/verification-evidence-public.ts",
  "scripts/verification-evidence-list.mjs",
].filter((relativePath) => fs.existsSync(path.join(root, relativePath)));
assert.ok(evidenceReadPaths.length > 0, "Runtime Evidence read boundary must exist");
const evidenceReadSource = evidenceReadPaths.map(read).join("\n");
assert.match(evidenceReadSource, /accepted|verification_evidence_public/, "public Runtime Evidence boundary must remain accepted-only");

console.log(
  "[knowledge-graph-readiness] PASS: 80 Chinese + 80 English durable article identities, 3 explicit language associations, 8 Tool IDs, 3 Tick Lab experiment IDs, API ReturnCode ownership, and Runtime Evidence identity boundaries are ready.",
);
