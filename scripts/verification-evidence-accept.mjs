import fs from "node:fs";

import {
  buildAcceptanceChanges,
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
const noteArg = args.find((arg) => arg.startsWith("--note="));
const reviewNote = noteArg?.slice("--note=".length).trim() || "Accepted through controlled verification maintenance workflow.";

const sql = getEvidenceSql();
const evidence = await getEvidenceByKey(sql, evidenceKey);
if (!evidence) {
  console.error(`Evidence not found: ${evidenceKey}`);
  process.exit(1);
}
if (["rejected", "revoked"].includes(evidence.status)) {
  console.error(`Evidence ${evidenceKey} cannot be accepted from status ${evidence.status}.`);
  process.exit(1);
}

const { articlePath, source } = readArticleSource(evidence.article_slug);
const changes = buildAcceptanceChanges(evidence);
const nextSource = patchArticleVerification(source, changes);

printEvidenceSummary(evidence);
console.log("\nProposed public acceptance changes");
console.table(changes);
console.log(`Article file: ${articlePath}`);

if (!commit) {
  console.log("Dry run only. Re-run with --commit to mark the evidence accepted and update the local Markdown verification block.");
  process.exit(0);
}

const updated = await sql`
  UPDATE verification_evidence
  SET
    status = 'accepted',
    reviewed_at = COALESCE(reviewed_at, now()),
    review_note = ${reviewNote},
    accepted_at = COALESCE(accepted_at, now()),
    revoked_at = NULL,
    revoked_reason = NULL
  WHERE evidence_key = ${evidenceKey}
    AND status IN ('captured', 'reviewed', 'accepted')
  RETURNING evidence_key;
`;

if (updated.length === 0) {
  console.error(`Evidence ${evidenceKey} changed state before acceptance; no files were modified.`);
  process.exit(1);
}

if (nextSource !== source) {
  fs.writeFileSync(articlePath, nextSource, "utf8");
  console.log(`Updated article verification frontmatter: ${articlePath}`);
} else {
  console.log("Article verification frontmatter already matches the accepted evidence.");
}

console.log(`Accepted evidence: ${evidenceKey}`);
console.log("The database acceptance is internal. The public site changes only after the Markdown change is reviewed, committed, and deployed.");
