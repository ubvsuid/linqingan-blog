import fs from "node:fs";
import path from "node:path";

import { getEvidenceSql } from "./lib/verification-evidence-maintenance.mjs";

const captureRefPattern = /^capture:CAP-\d{8}-[A-Z0-9][A-Z0-9-]{2,80}$/;
const postsDir = path.join(process.cwd(), "content", "posts");

function readMarkdownVerification(articleSlug) {
  const articlePath = path.join(postsDir, `${articleSlug}.md`);
  if (!fs.existsSync(articlePath)) return null;
  const source = fs.readFileSync(articlePath, "utf8");
  const verificationMatch = source.match(/(^verification:\n[\s\S]*?)(?=^[A-Za-z][A-Za-z0-9_-]*:|\s*$)/m);
  if (!verificationMatch) return { articlePath, consoleTested: false, liveTested: false, missingVerificationBlock: true };
  const block = verificationMatch[1];
  return {
    articlePath,
    consoleTested: /^  consoleTested:\s*true\s*$/m.test(block),
    liveTested: /^  liveTested:\s*true\s*$/m.test(block),
    missingVerificationBlock: false,
  };
}

const sql = getEvidenceSql();
const rows = await sql`
  SELECT
    evidence_key,
    article_slug,
    verification_type,
    status,
    api_name,
    source_ref,
    game_time,
    tick_start,
    tick_end,
    verified_at,
    revoked_at
  FROM verification_evidence
  ORDER BY article_slug, verification_type, verified_at DESC;
`;

const duplicateIdentities = await sql`
  SELECT
    article_slug,
    verification_type,
    api_name,
    source_ref,
    COALESCE(game_time, -1) AS game_time_key,
    COALESCE(tick_start, -1) AS tick_start_key,
    COALESCE(tick_end, -1) AS tick_end_key,
    count(*)::int AS count
  FROM verification_evidence
  GROUP BY
    article_slug,
    verification_type,
    api_name,
    source_ref,
    COALESCE(game_time, -1),
    COALESCE(tick_start, -1),
    COALESCE(tick_end, -1)
  HAVING count(*) > 1;
`;

const sequenceStateRows = await sql`
  WITH evidence_state AS (
    SELECT COALESCE(MAX(id), 0)::bigint AS max_id
    FROM verification_evidence
  )
  SELECT
    evidence_state.max_id,
    verification_evidence_id_seq.last_value,
    verification_evidence_id_seq.is_called,
    CASE
      WHEN verification_evidence_id_seq.is_called THEN verification_evidence_id_seq.last_value + 1
      ELSE verification_evidence_id_seq.last_value
    END AS next_generated_id,
    CASE
      WHEN verification_evidence_id_seq.is_called THEN verification_evidence_id_seq.last_value + 1
      ELSE verification_evidence_id_seq.last_value
    END > evidence_state.max_id AS sequence_safe
  FROM verification_evidence_id_seq
  CROSS JOIN evidence_state;
`;

const issues = [];
const sequenceState = sequenceStateRows[0];
if (sequenceState && !sequenceState.sequence_safe) {
  issues.push({
    severity: "error",
    evidence: "—",
    issue: `identity sequence drift: next generated id ${sequenceState.next_generated_id} does not exceed current max id ${sequenceState.max_id}`,
  });
}

const acceptedByArticleType = new Map();
for (const row of rows) {
  const markdown = readMarkdownVerification(row.article_slug);
  if (!markdown) {
    issues.push({ severity: "error", evidence: row.evidence_key, issue: `orphan evidence: article ${row.article_slug} does not exist` });
  }
  if (!captureRefPattern.test(row.source_ref ?? "")) {
    issues.push({ severity: "error", evidence: row.evidence_key, issue: `invalid source_ref: ${row.source_ref ?? "null"}` });
  }
  if (row.verification_type === "live" && !(row.tick_start !== null && row.tick_end !== null && row.tick_end > row.tick_start)) {
    issues.push({ severity: "error", evidence: row.evidence_key, issue: "live evidence has an invalid tick window" });
  }
  if (row.verification_type === "console" && row.game_time === null) {
    issues.push({ severity: "error", evidence: row.evidence_key, issue: "console evidence is missing Game.time" });
  }
  if (new Date(row.verified_at).getTime() > Date.now() + 5 * 60 * 1000) {
    issues.push({ severity: "error", evidence: row.evidence_key, issue: "verified_at is unexpectedly in the future" });
  }
  if (row.status === "revoked" && !row.revoked_at) {
    issues.push({ severity: "error", evidence: row.evidence_key, issue: "revoked evidence is missing revoked_at" });
  }
  if (row.status === "accepted") {
    const key = `${row.article_slug}|${row.verification_type}`;
    acceptedByArticleType.set(key, (acceptedByArticleType.get(key) ?? 0) + 1);
    if (markdown) {
      const flag = row.verification_type === "live" ? markdown.liveTested : markdown.consoleTested;
      if (!flag) {
        issues.push({ severity: "warning", evidence: row.evidence_key, issue: `accepted ${row.verification_type} evidence is not yet accepted in Markdown` });
      }
    }
  }
}

for (const fileName of fs.readdirSync(postsDir).filter((name) => name.endsWith(".md"))) {
  const articleSlug = fileName.slice(0, -3);
  const markdown = readMarkdownVerification(articleSlug);
  if (!markdown || markdown.missingVerificationBlock) continue;
  if (markdown.consoleTested && !acceptedByArticleType.has(`${articleSlug}|console`)) {
    issues.push({ severity: "error", evidence: "—", issue: `${articleSlug}: consoleTested=true without accepted Console evidence` });
  }
  if (markdown.liveTested && !acceptedByArticleType.has(`${articleSlug}|live`)) {
    issues.push({ severity: "error", evidence: "—", issue: `${articleSlug}: liveTested=true without accepted live evidence` });
  }
}

for (const duplicate of duplicateIdentities) {
  issues.push({
    severity: "error",
    evidence: "—",
    issue: `duplicate identity (${duplicate.count} rows): ${duplicate.article_slug} / ${duplicate.verification_type} / ${duplicate.api_name} / ${duplicate.source_ref}`,
  });
}

const summary = {
  rows: rows.length,
  captured: rows.filter((row) => row.status === "captured").length,
  reviewed: rows.filter((row) => row.status === "reviewed").length,
  accepted: rows.filter((row) => row.status === "accepted").length,
  rejected: rows.filter((row) => row.status === "rejected").length,
  revoked: rows.filter((row) => row.status === "revoked").length,
  sequenceSafe: Boolean(sequenceState?.sequence_safe),
  issues: issues.length,
};

console.log("Verification Evidence Integrity Report");
console.table(summary);
if (issues.length === 0) {
  console.log("Integrity check passed: no evidence lifecycle, Markdown acceptance, duplicate identity, or identity sequence issues found.");
  process.exit(0);
}

console.table(issues);
process.exitCode = 1;
