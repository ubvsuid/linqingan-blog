import {
  getEvidenceByKey,
  getEvidenceSql,
  normalizeEvidenceKey,
  printEvidenceSummary,
} from "./lib/verification-evidence-maintenance.mjs";

const evidenceKey = normalizeEvidenceKey(process.argv[2]);
const sql = getEvidenceSql();
const evidence = await getEvidenceByKey(sql, evidenceKey);

if (!evidence) {
  console.error(`Evidence not found: ${evidenceKey}`);
  process.exit(1);
}

printEvidenceSummary(evidence);
console.log("\nInternal state");
console.dir(
  {
    beforeState: evidence.before_state,
    afterState: evidence.after_state,
    reviewedAt: evidence.reviewed_at,
    reviewNote: evidence.review_note,
    acceptedAt: evidence.accepted_at,
    revokedAt: evidence.revoked_at,
    revokedReason: evidence.revoked_reason,
    createdAt: evidence.created_at,
  },
  { depth: 8 },
);
