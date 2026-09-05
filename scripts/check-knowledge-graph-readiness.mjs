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
import { createVerificationEvidenceKey } from "./lib/verification-evidence-validation.mjs";

const root = process.cwd();
const UUID_SUFFIX = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const TOOL_ID_PATTERN = new RegExp(`^tool_${UUID_SUFFIX}$`);
const EXPERIMENT_ID_PATTERN = new RegExp(`^experiment_${UUID_SUFFIX}$`);
const CHINESE_ARTICLE_PATH_PATTERN = /^\/blog\/[a-z0-9-]+$/;
const ENGLISH_ARTICLE_PATH_PATTERN = /^\/en\/blog\/[a-z0-9-]+$/;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function parseJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function objectFromBrace(source, braceIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = braceIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(braceIndex, index + 1);
    }
  }
  return null;
}

function quotedArrayField(objectSource, fieldName) {
  const match = objectSource.match(
    new RegExp(`${fieldName}\\s*:\\s*\\[([\\s\\S]*?)\\]`),
  );
  if (!match) return null;
  return [...match[1].matchAll(/["']([^"']+)["']/g)].map((item) => item[1]);
}

const knowledgeIdentityPayload = parseJson("content/knowledge-identities.json");
const roadmapIdentityPayload = parseJson("content/roadmap-identities.json");
assert.equal(knowledgeIdentityPayload.schemaVersion, 1, "knowledge identities schemaVersion");
assert.equal(roadmapIdentityPayload.schemaVersion, 1, "roadmap identities schemaVersion");
assert.equal(knowledgeIdentityPayload.records.length, 66, "knowledge durable identity coverage");
assert.equal(roadmapIdentityPayload.records.length, 12, "Beginner roadmap durable identity coverage");

const contentIdentities = loadContentIdentityRegistry(root);
assert.equal(contentIdentities.records.length, 78, "Chinese Article/Beginner durable identity coverage");
const chineseIds = new Set();
for (const record of contentIdentities.records) {
  assert.match(record.contentId, CONTENT_ID_PATTERN, `${record.slug} durable contentId`);
  assert.equal(chineseIds.has(record.contentId), false, `duplicate Chinese contentId ${record.contentId}`);
  chineseIds.add(record.contentId);
}

const englishIdentities = loadEnglishContentIdentityReadiness(root);
assert.equal(englishIdentities.records.length, 80, "English article durable identity coverage");
assert.equal(englishIdentities.bilingualRecords.length, 77, "derived bilingual English durable identity coverage");
assert.equal(englishIdentities.standaloneRecords.length, 3, "English-original durable identity provenance coverage");
const expectedStandaloneHrefs = new Set([
  "/en/blog/screeps-pathfinder-search",
  "/en/blog/screeps-creep-pull",
  "/en/blog/screeps-creep-attack",
]);
assert.deepEqual(
  new Set(englishIdentities.standaloneRecords.map((record) => record.href)),
  expectedStandaloneHrefs,
  "English-original identity owners must remain the three published standalone articles",
);
const englishIds = new Set();
for (const record of englishIdentities.records) {
  assert.match(record.contentId, ENGLISH_CONTENT_ID_PATTERN, `${record.href} English durable contentId`);
  assert.equal(englishIds.has(record.contentId), false, `duplicate English contentId ${record.contentId}`);
  assert.equal(chineseIds.has(record.contentId), false, `${record.href} must not reuse a Chinese contentId`);
  if (record.sourceContentId) {
    assert.equal(
      record.contentId,
      `en_${record.sourceContentId}`,
      `${record.href} bilingual identity must derive only from permanent Chinese contentId`,
    );
  }
  englishIds.add(record.contentId);
}

const associationPayload = parseJson("content/article-language-associations.json");
assert.equal(associationPayload.schemaVersion, 1, "explicit article language associations schemaVersion");
assert.ok(Array.isArray(associationPayload.records), "explicit article language associations records[]");
const associationChinesePaths = new Set();
const associationEnglishPaths = new Set();
const standaloneHrefs = new Set(englishIdentities.standaloneRecords.map((record) => record.href));
for (const record of associationPayload.records) {
  const chinesePath = String(record?.chinesePath ?? "").trim();
  const englishPath = String(record?.englishPath ?? "").trim();
  assert.match(chinesePath, CHINESE_ARTICLE_PATH_PATTERN, `valid explicit Chinese path ${chinesePath}`);
  assert.match(englishPath, ENGLISH_ARTICLE_PATH_PATTERN, `valid explicit English path ${englishPath}`);
  assert.equal(associationChinesePaths.has(chinesePath), false, `duplicate explicit Chinese path ${chinesePath}`);
  assert.equal(associationEnglishPaths.has(englishPath), false, `duplicate explicit English path ${englishPath}`);
  associationChinesePaths.add(chinesePath);
  associationEnglishPaths.add(englishPath);

  const chineseSlug = chinesePath.slice("/blog/".length);
  assert.ok(contentIdentities.bySlug.get(chineseSlug), `${chinesePath} has permanent Chinese Content Identity`);
  assert.ok(englishIdentities.byHref.get(englishPath), `${englishPath} has permanent English identity`);
  assert.equal(
    standaloneHrefs.has(englishPath),
    true,
    `${englishPath} explicit counterpart association must preserve standalone identity provenance`,
  );
}
assert.equal(associationPayload.records.length, 1, "current explicit standalone-counterpart association coverage");
assert.deepEqual(
  associationPayload.records[0],
  {
    chinesePath: "/blog/screeps-creep-attack",
    englishPath: "/en/blog/screeps-creep-attack",
  },
  "Creep.attack explicit language association",
);
assert.equal(
  englishIdentities.byHref.get("/en/blog/screeps-creep-attack")?.contentId,
  "en_article_c784e904-4517-4476-ada6-53adbfd7966d",
  "published English Creep.attack durable identity must never change when a Chinese counterpart is added",
);

const toolSource = read("src/lib/tool-catalog.ts");
const toolRecords = [...toolSource.matchAll(
  /\{\s*toolId:\s*["']([^"']+)["']\s*,\s*slug:\s*["']([^"']+)["']/g,
)].map((match) => ({ toolId: match[1], slug: match[2] }));
assert.equal(toolRecords.length, 8, "Tool durable identity coverage");
const toolIds = new Set();
const toolSlugs = new Set();
for (const record of toolRecords) {
  assert.match(record.toolId, TOOL_ID_PATTERN, `${record.slug} toolId`);
  assert.equal(toolIds.has(record.toolId), false, `duplicate toolId ${record.toolId}`);
  assert.equal(toolSlugs.has(record.slug), false, `duplicate Tool slug ${record.slug}`);
  toolIds.add(record.toolId);
  toolSlugs.add(record.slug);
}

const tickLabSource = read("src/lib/tick-lab-experiments.ts");
const tickLabRecords = [...tickLabSource.matchAll(
  /\{\s*experimentId:\s*["']([^"']+)["']\s*,\s*key:\s*["']([^"']+)["']\s*,\s*componentPath:\s*["']([^"']+)["']/g,
)].map((match) => ({ experimentId: match[1], key: match[2], componentPath: match[3] }));
assert.equal(tickLabRecords.length, 3, "Tick Lab durable experiment identity coverage");
assert.deepEqual(
  new Set(tickLabRecords.map((record) => record.key)),
  new Set(["creep-transfer", "spawn-creep", "cpu-bucket"]),
  "Tick Lab authoritative experiment keys",
);
const experimentIds = new Set();
for (const record of tickLabRecords) {
  assert.match(record.experimentId, EXPERIMENT_ID_PATTERN, `${record.key} experimentId`);
  assert.equal(experimentIds.has(record.experimentId), false, `duplicate experimentId ${record.experimentId}`);
  assert.equal(fs.existsSync(path.join(root, record.componentPath)), true, `${record.key} component owner exists`);
  experimentIds.add(record.experimentId);
}

const evidenceIdentityFixture = {
  identityVersion: 2,
  contentId: contentIdentities.records[0].contentId,
  verificationType: "console",
  apiName: "Creep.transfer",
  sourceRef: "capture:CAP-20260904-KG-READINESS",
  gameTime: 1,
  tickStart: null,
  tickEnd: null,
};
const evidenceKeyA = createVerificationEvidenceKey(evidenceIdentityFixture);
const evidenceKeyB = createVerificationEvidenceKey({ ...evidenceIdentityFixture });
const evidenceKeyChanged = createVerificationEvidenceKey({ ...evidenceIdentityFixture, gameTime: 2 });
assert.match(evidenceKeyA, /^EV-[A-F0-9]{20}$/, "Runtime Evidence durable evidenceKey format");
assert.equal(evidenceKeyA, evidenceKeyB, "Runtime Evidence identity must be deterministic");
assert.notEqual(evidenceKeyA, evidenceKeyChanged, "Runtime Evidence identity inputs must affect evidenceKey");
const evidenceReaderSource = read("src/lib/verification-evidence.ts");
assert.match(evidenceReaderSource, /publicVerificationEvidence/, "Runtime Evidence public reader uses public view");
assert.doesNotMatch(evidenceReaderSource, /\.from\(verificationEvidence\)/, "Runtime Evidence public reader must not use base table");
const evidenceViewSource = read("drizzle/0003_public_verification_evidence_view.sql");
assert.match(evidenceViewSource, /WHERE status = 'accepted'/, "Runtime Evidence graph source must remain accepted-only");

const errorRegistrySource = read("src/lib/screeps-errors.ts");
const knownReturnCodes = new Set(
  [...errorRegistrySource.matchAll(/\{\s*name:\s*["']([^"']+)["']\s*,\s*value:\s*-?\d+/g)]
    .map((match) => match[1]),
);
const expectedReturnCodeOwners = new Map([
  ["creep-transfer", [
    "OK", "ERR_NOT_OWNER", "ERR_BUSY", "ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_TARGET", "ERR_FULL", "ERR_NOT_IN_RANGE", "ERR_INVALID_ARGS",
  ]],
  ["spawn-spawn-creep", [
    "OK", "ERR_NOT_OWNER", "ERR_NAME_EXISTS", "ERR_BUSY", "ERR_NOT_ENOUGH_ENERGY", "ERR_INVALID_ARGS", "ERR_RCL_NOT_ENOUGH",
  ]],
  ["spawn-renew-creep", [
    "OK", "ERR_NOT_OWNER", "ERR_BUSY", "ERR_NOT_ENOUGH_ENERGY", "ERR_INVALID_TARGET", "ERR_FULL", "ERR_NOT_IN_RANGE", "ERR_RCL_NOT_ENOUGH",
  ]],
  ["spawn-recycle-creep", [
    "OK", "ERR_NOT_OWNER", "ERR_INVALID_TARGET", "ERR_NOT_IN_RANGE", "ERR_RCL_NOT_ENOUGH",
  ]],
]);
const apiSource = read("src/lib/screeps-api-reference.ts");
const mappedApiMethods = new Map();
for (const match of apiSource.matchAll(/\bid:\s*["']([^"']+)["']/g)) {
  const brace = apiSource.lastIndexOf("{", match.index);
  const objectSource = brace >= 0 ? objectFromBrace(apiSource, brace) : null;
  if (!objectSource) continue;
  const returnCodeNames = quotedArrayField(objectSource, "returnCodeNames");
  if (returnCodeNames) mappedApiMethods.set(match[1], returnCodeNames);
}
assert.equal(mappedApiMethods.size, 4, "only verified API methods may own ReturnCode mappings in Phase 1A");
assert.deepEqual(
  new Set(mappedApiMethods.keys()),
  new Set(expectedReturnCodeOwners.keys()),
  "Phase 1A API ReturnCode owner set",
);
for (const [apiId, expectedCodes] of expectedReturnCodeOwners) {
  const actualCodes = mappedApiMethods.get(apiId);
  assert.deepEqual(actualCodes, expectedCodes, `${apiId} official ReturnCode ownership`);
  assert.equal(new Set(actualCodes).size, actualCodes.length, `${apiId} ReturnCodes must be unique`);
  for (const returnCode of actualCodes) {
    assert.equal(knownReturnCodes.has(returnCode), true, `${apiId} references registered ReturnCode ${returnCode}`);
  }
}

const durableProductIds = [
  ...chineseIds,
  ...englishIds,
  ...toolIds,
  ...experimentIds,
];
assert.equal(
  new Set(durableProductIds).size,
  durableProductIds.length,
  "Phase 1A durable identities must be collision-free across content, Tool, and Tick Lab namespaces",
);

console.log(
  `[knowledge-graph-readiness] PASS: 78 Chinese content identities + 80 English identities (77 derived bilingual, 3 standalone-provenance) + 1 explicit standalone-counterpart language association + 8 Tool IDs + 3 Tick Lab experiment IDs; Runtime Evidence stable/accepted-only identity contract and 4 verified API ReturnCode ownership maps are green.`,
);
