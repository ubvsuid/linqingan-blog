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

if (evidence.status === "revoked") {
  console.log(`Evidence ${evidenceKey} is already revoked; no further changes are required.`);
  process.exit(0);
}

let markdownChange = null;
if (evidence.status === "accepted") {
  const remaining = await sql`
    SELECT count(*)::int AS count
    FROM verification_evidence
    WHERE article_slug = ${evidence.article_slug}
      AND verification_type = ${evidence.verification_type}
      AND status = 'accepted'
      AND evidence_key <> ${evidenceKey};
  `;
  const remainingAccepted = remaining[0]?.count ?? 0;

  if (remainingAccepted === 0) {
    const { articlePath, source } = readArticleSource(evidence.article_slug);
    const flag = evidence.verification_type === "live" ? "liveTested" : "consoleTested";
    const nextSource = patchArticleVerification(source, {
      [flag]: false,
      testResult: `Runtime verification revoked for ${evidenceKey}: ${reason}`,
    });
    markdownChange = {
      articlePath,
      source,
      nextSource,
      flag,
    };
    console.log(`This is the final accepted ${evidence.verification_type} evidence for the article; ${flag} will be set to false before the database row is revoked.`);
  } else {
    console.log(`${remainingAccepted} other accepted ${evidence.verification_type} evidence record(s) remain for this article; Markdown verification flag will stay unchanged.`);
  }
}

if (!commit) {
  console.log("Dry run only. Re-run with --commit to apply the conservative public-state downgrade (if needed) and then revoke the database evidence.");
  process.exit(0);
}

if (markdownChange && markdownChange.nextSource !== markdownChange.source) {
  fs.writeFileSync(markdownChange.articlePath, markdownChange.nextSource, "utf8");
  console.log(`Updated ${markdownChange.flag}=false before database revocation: ${markdownChange.articlePath}`);
}

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
  console.error(`Evidence ${evidenceKey} changed state before revocation. Public Markdown may already be conservatively downgraded; run the integrity check before proceeding.`);
  process.exit(1);
}

console.log(`Revoked evidence: ${evidenceKey}`);
console.log("Review and commit any generated Markdown change before deployment. If the database update failed after a Markdown downgrade, keep the safer under-claim and resolve it through the integrity report.");
