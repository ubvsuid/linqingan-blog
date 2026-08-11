import {
  getEvidenceByKey,
  getEvidenceSql,
  normalizeEvidenceKey,
  printEvidenceSummary,
} from "./lib/verification-evidence-maintenance.mjs";

const args = process.argv.slice(2);
const commit = args.includes("--commit");
const evidenceKey = normalizeEvidenceKey(args.find((arg) => !arg.startsWith("--")));
const noteArg = args.find((arg) => arg.startsWith("--note="));
const reviewNote = noteArg?.slice("--note=".length).trim();

if (!reviewNote) {
  console.error("A review note is required: --note=\"what was checked\"");
  process.exit(1);
}

const sql = getEvidenceSql();
const evidence = await getEvidenceByKey(sql, evidenceKey);
if (!evidence) {
  console.error(`Evidence not found: ${evidenceKey}`);
  process.exit(1);
}
if (["accepted", "rejected", "revoked"].includes(evidence.status)) {
  console.error(`Evidence ${evidenceKey} cannot move to reviewed from status ${evidence.status}.`);
  process.exit(1);
}

printEvidenceSummary(evidence);
console.log(`\nReview note: ${reviewNote}`);
if (!commit) {
  console.log("Dry run only. Re-run with --commit to mark this captured evidence as reviewed.");
  process.exit(0);
}

const updated = await sql`
  UPDATE verification_evidence
  SET
    status = 'reviewed',
    reviewed_at = now(),
    review_note = ${reviewNote}
  WHERE evidence_key = ${evidenceKey}
    AND status IN ('captured', 'reviewed')
  RETURNING evidence_key;
`;

if (updated.length === 0) {
  console.error(`Evidence ${evidenceKey} changed state before review was committed.`);
  process.exit(1);
}

console.log(`Reviewed evidence: ${evidenceKey}`);
