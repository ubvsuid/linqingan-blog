import fs from "node:fs";
import path from "node:path";

import { neon } from "@neondatabase/serverless";

import { validateVerificationEvidencePayload } from "./lib/verification-evidence-validation.mjs";

const args = process.argv.slice(2);
const commit = args.includes("--commit");
const fileArg = args.find((arg) => !arg.startsWith("--"));

if (!fileArg) {
  console.error("Usage: npm run verification:evidence-write -- <evidence.json> [--commit]");
  console.error("Without --commit the command validates and previews the import only.");
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

for (const record of records) {
  const articlePath = path.join(process.cwd(), "content", "posts", `${record.articleSlug}.md`);
  if (!fs.existsSync(articlePath)) {
    console.error(`Evidence validation failed: article does not exist: ${record.articleSlug}`);
    process.exit(1);
  }
}

console.log(`Verification evidence validation passed: ${records.length} record(s).`);
for (const record of records) {
  const tickWindow =
    record.tickStart !== null && record.tickEnd !== null
      ? ` ticks=${record.tickStart}-${record.tickEnd}`
      : "";
  const gameTime = record.gameTime !== null ? ` Game.time=${record.gameTime}` : "";
  console.log(
    `- ${record.articleSlug} | ${record.verificationType} | ${record.apiName}${gameTime}${tickWindow} | ${record.verifiedAt}`,
  );
}

if (!commit) {
  console.log("Dry run only. Re-run with --commit to write these records to Neon.");
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required when --commit is used.");
  process.exit(1);
}

const sql = neon(databaseUrl);
let inserted = 0;
let skipped = 0;

for (const record of records) {
  const existing = await sql`
    SELECT id
    FROM verification_evidence
    WHERE article_slug = ${record.articleSlug}
      AND verification_type = ${record.verificationType}
      AND api_name = ${record.apiName}
      AND source_ref = ${record.sourceRef}
      AND game_time IS NOT DISTINCT FROM ${record.gameTime}
      AND tick_start IS NOT DISTINCT FROM ${record.tickStart}
      AND tick_end IS NOT DISTINCT FROM ${record.tickEnd}
    LIMIT 1;
  `;

  if (existing.length > 0) {
    skipped += 1;
    console.log(`Skipped existing evidence: ${record.articleSlug} / ${record.apiName}`);
    continue;
  }

  const beforeStateJson = record.beforeState === null ? null : JSON.stringify(record.beforeState);
  const afterStateJson = record.afterState === null ? null : JSON.stringify(record.afterState);

  await sql`
    INSERT INTO verification_evidence (
      article_slug,
      language,
      verification_type,
      game_time,
      shard,
      room_name,
      api_name,
      return_code,
      before_state,
      after_state,
      tick_start,
      tick_end,
      evidence_note,
      source_ref,
      verified_at
    ) VALUES (
      ${record.articleSlug},
      ${record.language},
      ${record.verificationType},
      ${record.gameTime},
      ${record.shard},
      ${record.roomName},
      ${record.apiName},
      ${record.returnCode},
      ${beforeStateJson}::jsonb,
      ${afterStateJson}::jsonb,
      ${record.tickStart},
      ${record.tickEnd},
      ${record.evidenceNote},
      ${record.sourceRef},
      ${record.verifiedAt}::timestamptz
    );
  `;

  inserted += 1;
  console.log(`Inserted evidence: ${record.articleSlug} / ${record.apiName}`);
}

console.log(`Verification evidence import complete: inserted=${inserted}, skipped=${skipped}.`);
