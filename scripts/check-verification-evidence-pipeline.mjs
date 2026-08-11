import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { validateVerificationEvidenceRecord } from "./lib/verification-evidence-validation.mjs";

const validConsole = {
  articleSlug: "screeps-err-not-in-range",
  language: "zh-CN",
  verificationType: "console",
  gameTime: 123456,
  shard: "shard3",
  roomName: "W0N0",
  apiName: "Creep.transfer",
  returnCode: "ERR_NOT_IN_RANGE",
  beforeState: { range: 2 },
  afterState: { range: 2 },
  evidenceNote: "Synthetic validator fixture only; not runtime evidence.",
  sourceRef: "capture:CAP-20260810-SMOKE-CONSOLE",
  verifiedAt: "2026-08-10T00:00:00.000Z",
};

const validLive = {
  articleSlug: "screeps-spawncreep-return-codes",
  language: "en",
  verificationType: "live",
  gameTime: 200000,
  shard: "shard3",
  roomName: "W0N0",
  apiName: "StructureSpawn.spawnCreep",
  returnCode: "OK",
  beforeState: { spawning: false },
  afterState: { spawning: true },
  tickStart: 200000,
  tickEnd: 200002,
  evidenceNote: "Synthetic validator fixture only; not runtime evidence.",
  sourceRef: "capture:CAP-20260810-SMOKE-LIVE",
  verifiedAt: "2026-08-10T00:00:00.000Z",
};

const normalizedConsole = validateVerificationEvidenceRecord(validConsole);
const normalizedLive = validateVerificationEvidenceRecord(validLive);
if (!/^EV-[A-F0-9]{20}$/.test(normalizedConsole.evidenceKey)) {
  throw new Error("Console evidence must receive a deterministic stable evidence key.");
}
if (normalizedConsole.evidenceKey === normalizedLive.evidenceKey) {
  throw new Error("Different evidence identities must not share the same stable evidence key.");
}

const invalidFixtures = [
  { ...validConsole, gameTime: null },
  { ...validLive, tickEnd: validLive.tickStart },
  { ...validConsole, beforeState: null, afterState: null },
  { ...validConsole, sourceRef: "fixture:console" },
  { ...validConsole, unexpectedField: true },
];

for (const fixture of invalidFixtures) {
  let failed = false;
  try {
    validateVerificationEvidenceRecord(fixture);
  } catch {
    failed = true;
  }
  if (!failed) {
    throw new Error("Verification evidence validator accepted an invalid fixture.");
  }
}

const publicWriteRoute = path.join(
  process.cwd(),
  "src",
  "app",
  "api",
  "verification-evidence",
  "route.ts",
);
if (fs.existsSync(publicWriteRoute)) {
  throw new Error("Public verification evidence API route is forbidden.");
}

const schemaSource = fs.readFileSync(path.join(process.cwd(), "src/db/schema.ts"), "utf8");
for (const requiredSchemaToken of [
  'evidenceKey: text("evidence_key").notNull()',
  'status: text("status").notNull().default("captured")',
  'uniqueIndex("verification_evidence_key_uidx")',
]) {
  if (!schemaSource.includes(requiredSchemaToken)) {
    throw new Error(`Verification evidence schema is missing governance token: ${requiredSchemaToken}`);
  }
}

const evidenceReaderSource = fs.readFileSync(
  path.join(process.cwd(), "src/lib/verification-evidence.ts"),
  "utf8",
);
if (!evidenceReaderSource.includes('eq(verificationEvidence.status, "accepted")')) {
  throw new Error("Public evidence reads must be restricted to internally accepted rows.");
}

const verifiedContentSource = fs.readFileSync(
  path.join(process.cwd(), "src/lib/verified-content.ts"),
  "utf8",
);
if (!verifiedContentSource.includes("function keepAcceptedEvidence")) {
  throw new Error("Structured evidence must pass the Markdown acceptance boundary before public rendering.");
}
if (
  !verifiedContentSource.includes(
    "post.verification.consoleTested || post.verification.liveTested",
  )
) {
  throw new Error("Markdown runtime verification flags must remain the public verified-list source of truth.");
}
if (
  !verifiedContentSource.includes("verification.liveTested") ||
  !verifiedContentSource.includes("verification.consoleTested")
) {
  throw new Error("Structured Console/live evidence must be filtered by the matching accepted Markdown level.");
}

for (const pagePath of [
  "src/app/(zh)/verified/page.tsx",
  "src/app/(en)/en/verified/page.tsx",
]) {
  const source = fs.readFileSync(path.join(process.cwd(), pagePath), "utf8");
  if (!source.includes("getVerifiedContentWithEvidence")) {
    throw new Error(`${pagePath} must read the controlled evidence data layer.`);
  }
  if (!source.includes("revalidate = 300")) {
    throw new Error(`${pagePath} must keep bounded ISR freshness for runtime evidence.`);
  }
}

const maintenanceScripts = [
  "verification-evidence-write.mjs",
  "verification-evidence-list.mjs",
  "verification-evidence-show.mjs",
  "verification-evidence-accept.mjs",
  "verification-evidence-revoke.mjs",
  "verification-evidence-report.mjs",
  "verification-evidence-health.mjs",
];
for (const script of maintenanceScripts) {
  const syntax = spawnSync(process.execPath, ["--check", path.join(process.cwd(), "scripts", script)], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (syntax.status !== 0) {
    throw new Error(`${script} syntax check failed: ${syntax.stderr || syntax.stdout}`);
  }
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "linqingan-evidence-smoke-"));
try {
  const fixturePath = path.join(tempDir, "console-evidence.json");
  fs.writeFileSync(fixturePath, JSON.stringify(validConsole), "utf8");

  const writer = spawnSync(
    process.execPath,
    [path.join(process.cwd(), "scripts/verification-evidence-write.mjs"), fixturePath],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  if (writer.status !== 0) {
    throw new Error(
      `verification-evidence-write dry run failed: ${writer.stderr || writer.stdout}`,
    );
  }
  if (!writer.stdout.includes("Dry run only") || !writer.stdout.includes(normalizedConsole.evidenceKey)) {
    throw new Error("verification-evidence-write must default to a non-writing dry run and preview the stable evidence key.");
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log(
  "Verification evidence pipeline check passed: stable evidence identity, controlled capture references, lifecycle schema, accepted-only public reads, Markdown acceptance gating, bilingual verified-page integration, maintenance CLI syntax, no public write route, and writer dry-run behavior are verified.",
);
