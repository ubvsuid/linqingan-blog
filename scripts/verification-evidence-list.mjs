import { getEvidenceSql } from "./lib/verification-evidence-maintenance.mjs";

const args = process.argv.slice(2);
const statusArg = args.find((arg) => arg.startsWith("--status="));
const articleArg = args.find((arg) => arg.startsWith("--article="));
const limitArg = args.find((arg) => arg.startsWith("--limit="));

const status = statusArg?.slice("--status=".length).trim() || null;
const article = articleArg?.slice("--article=".length).trim() || null;
const requestedLimit = Number(limitArg?.slice("--limit=".length) ?? 50);
const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(Math.floor(requestedLimit), 200)) : 50;

const allowedStatuses = new Set(["captured", "reviewed", "accepted", "rejected", "revoked"]);
if (status && !allowedStatuses.has(status)) {
  console.error(`Unsupported status: ${status}`);
  process.exit(1);
}

const sql = getEvidenceSql();
const rows = await sql`
  SELECT
    evidence_key,
    article_slug,
    verification_type,
    status,
    api_name,
    return_code,
    game_time,
    tick_start,
    tick_end,
    source_ref,
    verified_at
  FROM verification_evidence
  WHERE (${status}::text IS NULL OR status = ${status})
    AND (${article}::text IS NULL OR article_slug = ${article})
  ORDER BY verified_at DESC, id DESC
  LIMIT ${limit};
`;

console.log(`Verification evidence rows: ${rows.length}`);
if (rows.length === 0) {
  console.log("No evidence matches the requested filters.");
  process.exit(0);
}

console.table(
  rows.map((row) => ({
    evidence: row.evidence_key,
    article: row.article_slug,
    type: row.verification_type,
    status: row.status,
    api: row.api_name,
    result: row.return_code ?? "—",
    gameTime: row.game_time ?? "—",
    ticks:
      row.tick_start !== null && row.tick_end !== null
        ? `${row.tick_start}-${row.tick_end}`
        : "—",
    source: row.source_ref,
    verifiedAt: row.verified_at,
  })),
);
