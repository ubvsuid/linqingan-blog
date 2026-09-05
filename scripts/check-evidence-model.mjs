import fs from "node:fs";
import path from "node:path";

import {
  loadContentIdentityRegistry,
  resolveContentIdentity,
} from "./lib/content-identity-registry.mjs";
import {
  createVerificationEvidenceKey,
  validateVerificationEvidenceRecord,
  VERIFICATION_EVIDENCE_IDENTITY_VERSION,
} from "./lib/verification-evidence-validation.mjs";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing Evidence Model file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const policyText = read("verification/evidence-model.json");
const docs = read("docs/evidence-model-v1.md");
const migration = read("drizzle/0004_evidence_model_v1.sql");
const schema = read("src/db/schema.ts");
const writer = read("scripts/verification-evidence-write.mjs");
const health = read("scripts/verification-evidence-health.mjs");
const pipeline = read("scripts/check-verification-evidence-pipeline.mjs");
const integrity = read("scripts/check-integrity.mjs");
const workflow = read(".github/workflows/evidence-model.yml");

let policy = {};
try {
  policy = JSON.parse(policyText);
} catch (error) {
  failures.push(`Evidence Model policy JSON is invalid: ${error instanceof Error ? error.message : String(error)}`);
}

expect(policy.schemaVersion === "linqingan-evidence-model/v1", "Evidence Model must use schemaVersion linqingan-evidence-model/v1");
expect(policy.identity?.canonicalOwner === "contentId", "contentId must be the canonical Evidence owner");
expect(policy.identity?.groupKey === "contentGroupId", "contentGroupId must remain the durable grouping key");
expect(policy.identity?.locator === "articleSlug", "articleSlug must be explicitly modeled as a locator");
expect(policy.identity?.slugIsMutable === true, "Evidence Model must declare slug mutable");
expect(policy.identity?.currentEvidenceKeyIdentityVersion === 2, "current Evidence key identity version must be 2");
expect(VERIFICATION_EVIDENCE_IDENTITY_VERSION === 2, "validator Evidence key identity version must be 2");

const levels = (policy.publicEvidenceLevels ?? []).map((level) => level.id);
expect(JSON.stringify(levels) === JSON.stringify(["docs", "offline", "console", "live"]), "public evidence levels must stay docs/offline/console/live");
expect(policy.runtimeEvidence?.publicDatabaseStatus === "accepted", "only accepted structured Evidence may reach the public view");
expect(policy.runtimeEvidence?.publicRequiresMarkdownAcceptance === true, "database acceptance must not bypass Markdown acceptance");
expect(policy.runtimeEvidence?.publicWriteApiAllowed === false, "public Evidence write API must stay forbidden");

let registry = { records: [] };
try {
  registry = loadContentIdentityRegistry(root);
  expect(registry.records.length === 79, `Content Identity registry must own 79 current Chinese articles, found ${registry.records.length}`);
} catch (error) {
  failures.push(`Content Identity registry validation failed: ${error instanceof Error ? error.message : String(error)}`);
}

const fixtureTime = new Date(Date.now() - 1_000).toISOString();
try {
  const normalized = validateVerificationEvidenceRecord({
    articleSlug: "screeps-err-not-in-range",
    language: "zh-CN",
    verificationType: "console",
    gameTime: 123456,
    apiName: "Creep.transfer",
    returnCode: "ERR_NOT_IN_RANGE",
    beforeState: { range: 2 },
    afterState: { range: 2 },
    evidenceNote: "Evidence Model deterministic fixture; not runtime Evidence.",
    sourceRef: "capture:CAP-20260827-EVIDENCE-MODEL",
    verifiedAt: fixtureTime,
  });
  const owned = resolveContentIdentity("screeps-err-not-in-range", root);
  expect(normalized.contentId === owned.contentId, "validator must derive contentId from Content Identity registry");
  expect(normalized.contentGroupId === owned.contentGroupId, "validator must derive contentGroupId from Content Identity registry");
  expect(normalized.identityVersion === 2, "new evidence must use identity version 2");

  const renamedLocatorKey = createVerificationEvidenceKey({
    ...normalized,
    articleSlug: "future-renamed-locator",
  });
  expect(renamedLocatorKey === normalized.evidenceKey, "Evidence key v2 must not change when articleSlug locator changes");
} catch (error) {
  failures.push(`Evidence Model v2 fixture failed: ${error instanceof Error ? error.message : String(error)}`);
}

for (const token of [
  'identityVersion: integer("identity_version").notNull().default(2)',
  'contentId: text("content_id").notNull()',
  'contentGroupId: text("content_group_id").notNull()',
  'check("verification_evidence_identity_version_check"',
  'check("verification_evidence_type_check"',
]) {
  expect(schema.includes(token), `Drizzle schema missing Evidence Model token: ${token}`);
}

for (const token of [
  "ADD COLUMN IF NOT EXISTS identity_version integer",
  "ADD COLUMN IF NOT EXISTS content_id text",
  "ADD COLUMN IF NOT EXISTS content_group_id text",
  "screeps-upgrade-controller",
  "screeps-spawn-create-creep",
  "verification_evidence_identity_uidx",
  "content_id,",
  "verification_evidence_public",
  "IF EXISTS (",
  "content_id IS NULL",
]) {
  expect(migration.includes(token), `Evidence Model migration missing safety token: ${token}`);
}

for (const token of [
  "identity_version,",
  "content_id,",
  "content_group_id,",
  "${record.identityVersion}",
  "${record.contentId}",
  "${record.contentGroupId}",
  "ON CONFLICT DO NOTHING",
]) {
  expect(writer.includes(token), `Evidence writer missing durable-identity token: ${token}`);
}

for (const token of [
  "resolveContentIdentity(row.article_slug)",
  "createVerificationEvidenceKey({",
  "identityV1:",
  "identityV2:",
  "duplicate durable identity",
]) {
  expect(health.includes(token), `Evidence health check missing durable-identity token: ${token}`);
}

expect(pipeline.includes("stable evidence identity"), "existing verification evidence pipeline must remain present");
expect(integrity.includes('["Evidence Model", "scripts/check-evidence-model.mjs"]'), "Evidence Model must be part of integritycheck");

for (const marker of [
  "contentId",
  "articleSlug is a locator",
  "Database accepted + Markdown accepted",
  "docs → offline → console → live",
  "slug rename",
  "Production migration order",
]) {
  expect(docs.includes(marker), `Evidence Model documentation missing marker: ${marker}`);
}

expect(workflow.includes("node scripts/check-evidence-model.mjs"), "Evidence Model workflow must run the deterministic checker");
expect(!workflow.includes("DATABASE_URL"), "Evidence Model workflow must not receive DATABASE_URL");
expect(!workflow.includes("NEON_API_KEY"), "Evidence Model workflow must not receive NEON_API_KEY");
expect(!workflow.toLowerCase().includes("vercel"), "Evidence Model workflow must not invoke Vercel");

if (failures.length > 0) {
  console.error("Evidence Model V1 check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Evidence Model V1 check passed.");
console.log("- 79 current Chinese articles resolve to permanent Content Identity ownership.");
console.log("- New structured runtime Evidence keys are slug-independent identity v2.");
console.log("- Runtime lifecycle and public Markdown acceptance remain separate boundaries.");
console.log("- Migration is fail-closed for unmapped legacy Evidence rows.");
console.log("- Evidence Model CI is credential-free and does not invoke Vercel.");
