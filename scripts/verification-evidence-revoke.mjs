import fs from "node:fs";

import {
  getEvidenceByKey,
  getEvidenceSql,
  normalizeEvidenceKey,
  patchArticleVerification,
  printEvidenceSummary,
  readArticleSource,
} from "./lib/verification-evidence-maintenance.mjs";

const args = process.argv.slice(2);
const commit = args.includes("--commit");
const evidenceKey = normalizeEvidenceKey(args.find((arg) => !arg.startsWith("--")));
const reasonArg = args.find((arg) => arg.startsWith("--reason="));
const reason = reasonArg?.slice("--reason=".length).trim();

if (!reason) {
  console.error("A revocation reason is required: --reason=\"why this evidence is no longer valid\"");
  process.exit(1);
}

const sql = getEvidenceSql();
const evidence = await getEvidenceByKey(sql, evidenceKey);
if (!evidence) {
  console.error(`Evidence not found: ${evidenceKey}`);
  process.exit(1);
}

printEvidenceSummary(evidence);
console.log(`\nRevocation reason: ${reason}`);

if (!commit) {
  console.log("Dry run only. Re-run with --commit to revoke this evidence.");
  process.exit(0);
}

const wasAccepted = evidence.status === "accepted";
const updated = await sql`
  UPDATE verification_evidence
  SET
    status = 'revoked',
    reviewed_at = COALESCE(reviewed_at, now()),
    review_note = COALESCE(review_note, ${`Revoked: ${reason}`}),
    revoked_at = now(),
    revoked_reason = ${reason}
  WHERE evidence_key = ${evidenceKey}
    AND status <> 'revoked'
  RETURNING evidence_key;
`;

if (updated.length === 0) {
  console.log(`Evidence ${evidenceKey} is already revoked; no further changes were made.`);
  process.exit(0);
}

if (wasAccepted) {
  const remaining = await sql`
    SELECT count(*)::int AS count
    FROM verification_evidence
    WHERE article_slug = ${evidence.article_slug}
      AND verification_type = ${evidence.verification_type}
      AND status = 'accepted';
  `;
  const remainingAccepted = remaining[0]?.count ?? 0;

  if (remainingAccepted === 0) {
    const { articlePath, source } = readArticleSource(evidence.article_slug);
    const flag = evidence.verification_type === "live" ? "liveTested" : "consoleTested";
    const nextSource = patchArticleVerification(source, {
      [flag]: false,
      testResult: `Runtime verification revoked for ${evidenceKey}: ${reason}`,
    });
    if (nextSource !== source) {
      fs.writeFileSync(articlePath, nextSource, "utf8");
      console.log(`No accepted ${evidence.verification_type} evidence remains; updated ${flag}=false in ${articlePath}`);
    }
  } else {
    console.log(`${remainingAccepted} accepted ${evidence.verification_type} evidence record(s) remain for this article; Markdown verification flag was left unchanged.`);
  }
}

console.log(`Revoked evidence: ${evidenceKey}`);
console.log("Review and commit any generated Markdown change before deployment.");
