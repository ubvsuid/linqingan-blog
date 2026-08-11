import fs from "node:fs";
import path from "node:path";

import {
  VERIFICATION_EVIDENCE_BUNDLE_SCHEMA_VERSION,
  validateVerificationEvidencePayload,
} from "./lib/verification-evidence-validation.mjs";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(fullPath, "utf8");
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

const kit = read("public/screeps-evidence-capture-kit.js");
const docs = read("docs/verification-evidence-capture-kit.md");
const packageJson = read("package.json");
const zhVerification = read("src/app/(zh)/verification/page.tsx");
const enVerification = read("src/app/(en)/en/verification/page.tsx");

for (const required of [
  'var KIT_VERSION = "1.0.0"',
  `var SCHEMA_VERSION = "${VERIFICATION_EVIDENCE_BUNDLE_SCHEMA_VERSION}"`,
  'var MEMORY_KEY = "__linqinganEvidenceCapture"',
  "captureConsole: captureConsole",
  "beginLive: beginLive",
  "sampleLive: sampleLive",
  "finishLive: finishLive",
  "clearLive: clearLive",
]) {
  if (!kit.includes(required)) failures.push(`Capture Kit is missing contract marker: ${required}`);
}

const forbiddenActionPatterns = [
  /\.move\s*\(/,
  /\.moveTo\s*\(/,
  /\.harvest\s*\(/,
  /\.transfer\s*\(/,
  /\.withdraw\s*\(/,
  /\.pickup\s*\(/,
  /\.upgradeController\s*\(/,
  /\.spawnCreep\s*\(/,
  /\.renewCreep\s*\(/,
  /\.recycleCreep\s*\(/,
  /\.transferEnergy\s*\(/,
  /Game\.market\.(?:deal|createOrder|changeOrderPrice|extendOrder|cancelOrder)\s*\(/,
  /\.send\s*\(/,
  /\.runReaction\s*\(/,
  /\.boostCreep\s*\(/,
  /\.produce\s*\(/,
  /\.attack\s*\(/,
  /\.heal\s*\(/,
  /\.repair\s*\(/,
  /\.destroy\s*\(/,
  /\.remove\s*\(/,
  /\.setPublic\s*\(/,
  /\.launchNuke\s*\(/,
  /\.processPower\s*\(/,
];
for (const pattern of forbiddenActionPatterns) {
  if (pattern.test(kit)) {
    failures.push(`Capture Kit must not execute Screeps game actions: ${pattern}`);
  }
}

for (const networkMarker of ["fetch(", "XMLHttpRequest", "WebSocket", "EventSource"]) {
  if (kit.includes(networkMarker)) {
    failures.push(`Capture Kit must not transmit evidence over the network: ${networkMarker}`);
  }
}

if (!kit.includes("Memory[MEMORY_KEY]")) {
  failures.push("Multi-tick capture must use the dedicated Memory[MEMORY_KEY] namespace.");
}
if (/Memory\.[A-Za-z_$]/.test(kit)) {
  failures.push("Capture Kit must not write arbitrary direct Memory properties outside its dedicated namespace.");
}
if (!kit.includes("sample budget exceeded (30)")) {
  failures.push("Multi-tick capture must retain an explicit bounded sample budget.");
}

const now = new Date(Date.now() - 1_000).toISOString();
const validBundle = {
  schemaVersion: VERIFICATION_EVIDENCE_BUNDLE_SCHEMA_VERSION,
  captureKitVersion: "1.0.0",
  generatedAt: now,
  records: [
    {
      articleSlug: "screeps-moveto-not-moving",
      language: "en",
      verificationType: "console",
      gameTime: 123456,
      shard: "shard0",
      roomName: "E51S44",
      apiName: "Creep.moveTo",
      returnCode: "0",
      beforeState: { creep: { pos: { x: 10, y: 10, roomName: "E51S44" }, fatigue: 0 } },
      afterState: { creep: { pos: { x: 11, y: 10, roomName: "E51S44" }, fatigue: 0 } },
      tickStart: null,
      tickEnd: null,
      evidenceNote: "Governance fixture only; never imported as real Evidence.",
      sourceRef: "capture:CAP-20260811-MOVE-001",
      verifiedAt: now,
    },
  ],
};

try {
  const records = validateVerificationEvidencePayload(validBundle);
  if (records.length !== 1 || !records[0].evidenceKey.startsWith("EV-")) {
    failures.push("Versioned capture bundle did not normalize into one deterministic Evidence record.");
  }
} catch (error) {
  failures.push(`Versioned capture bundle validation failed: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  validateVerificationEvidencePayload({ ...validBundle, schemaVersion: "linqingan-evidence-bundle/v999" });
  failures.push("Unknown Evidence Bundle schema versions must be rejected.");
} catch {
  // Expected.
}

try {
  const legacyRecords = validateVerificationEvidencePayload(validBundle.records);
  if (legacyRecords.length !== 1) failures.push("Legacy array Evidence payload compatibility regressed.");
} catch (error) {
  failures.push(`Legacy Evidence payload compatibility failed: ${error instanceof Error ? error.message : String(error)}`);
}

for (const marker of [
  "linqingan-evidence-bundle/v1",
  "Memory.__linqinganEvidenceCapture",
  "verification:evidence-validate",
  "verification:evidence-write",
  "captured",
  "reviewed",
  "accepted",
]) {
  if (!docs.includes(marker)) failures.push(`Capture Kit documentation is missing workflow marker: ${marker}`);
}

for (const [label, source] of [
  ["Chinese verification page", zhVerification],
  ["English verification page", enVerification],
]) {
  if (!source.includes("/screeps-evidence-capture-kit.js")) {
    failures.push(`${label} must link to the public Capture Kit.`);
  }
}

if (!packageJson.includes('"capturekitcheck": "node scripts/check-evidence-capture-kit.mjs"')) {
  failures.push("package.json must expose capturekitcheck.");
}
if (!packageJson.includes("npm run capturekitcheck")) {
  failures.push("prebuild must execute capturekitcheck.");
}
if (!packageJson.includes('"verification:evidence-validate": "node scripts/verification-evidence-write.mjs"')) {
  failures.push("package.json must expose an explicit dry-run verification:evidence-validate command.");
}

const apiFiles = listFiles(path.join(root, "src", "app", "api"));
for (const apiFile of apiFiles) {
  const source = fs.readFileSync(apiFile, "utf8");
  if (
    /verification_evidence/i.test(source) &&
    /\b(?:INSERT|UPDATE|DELETE)\b/i.test(source)
  ) {
    failures.push(`Public API route must not mutate verification_evidence: ${path.relative(root, apiFile)}`);
  }
}

if (failures.length > 0) {
  console.error("Evidence Capture Kit governance failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  "Evidence Capture Kit governance passed (versioned bundle, read-only action boundary, bounded multi-tick Memory staging, no public Evidence write API).",
);
