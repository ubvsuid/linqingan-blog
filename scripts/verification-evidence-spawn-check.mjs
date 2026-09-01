import fs from "node:fs";
import path from "node:path";

import { validateVerificationEvidencePayload } from "./lib/verification-evidence-validation.mjs";
import { validateSpawnEvidenceRecord } from "./lib/verification-spawn-evidence-guard.mjs";

const args = process.argv.slice(2);
const fileArg = args.find((arg) => !arg.startsWith("--"));

if (!fileArg) {
  console.error("Usage: node scripts/verification-evidence-spawn-check.mjs <evidence.json>");
  process.exit(1);
}

const evidencePath = path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(evidencePath)) {
  console.error(`Evidence file not found: ${evidencePath}`);
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
} catch (error) {
  console.error(`Evidence file is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

let records;
try {
  records = validateVerificationEvidencePayload(payload);
} catch (error) {
  console.error(`Evidence validation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

if (records.length !== 1) {
  console.error(`Spawn Evidence guard expects exactly one record per operator file; received ${records.length}.`);
  process.exit(1);
}

let result;
try {
  result = validateSpawnEvidenceRecord(records[0]);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

console.log(
  `Spawn Evidence guard passed: ${result.branch} (${result.returnCode}) | ${result.evidenceKey} | ${result.sourceRef}`,
);
console.log("This bundle is still captured material. Do not auto-accept it.");
console.log(`Next dry run: npm run verification:evidence-validate -- ${fileArg}`);
console.log(`Only after operator review: npm run verification:evidence-write -- ${fileArg} --commit`);
