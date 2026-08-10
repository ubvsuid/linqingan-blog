import fs from "node:fs";
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
  sourceRef: "fixture:console",
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
  sourceRef: "fixture:live",
  verifiedAt: "2026-08-10T00:00:00.000Z",
};

validateVerificationEvidenceRecord(validConsole);
validateVerificationEvidenceRecord(validLive);

const invalidFixtures = [
  { ...validConsole, gameTime: null },
  { ...validLive, tickEnd: validLive.tickStart },
  { ...validConsole, beforeState: null, afterState: null },
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
  throw new Error("Public verification evidence API route is forbidden in Phase 3A.");
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

console.log(
  "Verification evidence pipeline check passed: bounded payload validation, no public write route, and bilingual verified-page integration are present.",
);
