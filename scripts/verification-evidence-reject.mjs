import {
  getEvidenceByKey,
  getEvidenceSql,
  normalizeEvidenceKey,
  printEvidenceSummary,
} from "./lib/verification-evidence-maintenance.mjs";

const args = process.argv.slice(2);
const commit = args.includes("--commit");
const evidenceKey = normalizeEvidenceKey(args.find((arg) => !arg.startsWith("--")));
const reasonArg = args.find((arg) => arg.startsWith("--reason="));
const reason = reasonArg?.slice("--reason=".length).trim();

if (!reason) {
  console.error("A rejection reason is required: --reason=\"why this capture is not acceptable\"");
  process.exit(1);
}

const sql = getEvidenceSql();
const evidence = await getEvidenceByKey(sql, evidenceKey);
if (!evidence) {
  console.error(`Evidence not found: ${evidenceKey}`);
  process.exit(1);
}
if (["accepted", "revoked"].includes(evidence.status)) {
  console.error(`Evidence ${evidenceKey} cannot be rejected from status ${evidence.status}; use revoke for previously accepted evidence.`);
  process.exit(1);
}

printEvidenceSummary(evidence);
console.log(`\nRejection reason: ${reason}`);
if (!commit) {
  console.log("Dry run only. Re-run with --commit to reject this captured evidence.");
  process.exit(0);
}

const updated = await sql`
  UPDATE verification_evidence
  SET
    status = 'rejected',
    reviewed_at = now(),
    review_note = ${reason}
  WHERE evidence_key = ${evidenceKey}
    AND status IN ('captured', 'reviewed', 'rejected')
  RETURNING evidence_key;
`;

if (updated.length === 0) {
  console.error(`Evidence ${evidenceKey} changed state before rejection.`);
  process.exit(1);
}

console.log(`Rejected evidence: ${evidenceKey}`);
console.log("Rejected evidence remains in the internal audit trail and is never returned by public evidence readers.");
