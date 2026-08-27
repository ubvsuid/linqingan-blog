import { createIsolatedNeon } from "./lib/database-environment-isolation.mjs";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required to generate the verification evidence report.");
  process.exit(1);
}

const sql = createIsolatedNeon(databaseUrl);

const [summary] = await sql`
  SELECT
    count(*)::int AS evidence_rows,
    count(DISTINCT article_slug)::int AS evidence_articles,
    count(*) FILTER (WHERE verification_type = 'console')::int AS console_rows,
    count(*) FILTER (WHERE verification_type = 'live')::int AS live_rows,
    count(*) FILTER (WHERE status = 'captured')::int AS captured_rows,
    count(*) FILTER (WHERE status = 'reviewed')::int AS reviewed_rows,
    count(*) FILTER (WHERE status = 'accepted')::int AS accepted_rows,
    count(*) FILTER (WHERE status = 'rejected')::int AS rejected_rows,
    count(*) FILTER (WHERE status = 'revoked')::int AS revoked_rows,
    count(DISTINCT article_slug) FILTER (WHERE verification_type = 'console' AND status = 'accepted')::int AS accepted_console_articles,
    count(DISTINCT article_slug) FILTER (WHERE verification_type = 'live' AND status = 'accepted')::int AS accepted_live_articles
  FROM verification_evidence;
`;

const latest = await sql`
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
    shard,
    room_name,
    source_ref,
    verified_at
  FROM verification_evidence
  ORDER BY verified_at DESC, id DESC
  LIMIT 20;
`;

console.log("Verification Evidence Report");
console.log(`Evidence rows: ${summary?.evidence_rows ?? 0}`);
console.log(`Articles with captured evidence: ${summary?.evidence_articles ?? 0}`);
console.log(`Console evidence: ${summary?.console_rows ?? 0}`);
console.log(`Live multi-tick evidence: ${summary?.live_rows ?? 0}`);
console.log(`Lifecycle: captured=${summary?.captured_rows ?? 0}, reviewed=${summary?.reviewed_rows ?? 0}, accepted=${summary?.accepted_rows ?? 0}, rejected=${summary?.rejected_rows ?? 0}, revoked=${summary?.revoked_rows ?? 0}`);
console.log(`Accepted Console articles: ${summary?.accepted_console_articles ?? 0}`);
console.log(`Accepted live articles: ${summary?.accepted_live_articles ?? 0}`);
console.log("Public verified status is controlled separately by Markdown verification frontmatter.");

console.log("\nLatest evidence");
if (latest.length === 0) {
  console.log("  No runtime evidence recorded yet.");
} else {
  console.table(
    latest.map((row) => ({
      evidence: row.evidence_key,
      article: row.article_slug,
      type: row.verification_type,
      status: row.status,
      api: row.api_name,
      return: row.return_code ?? "—",
      gameTime: row.game_time ?? "—",
      ticks:
        row.tick_start !== null && row.tick_end !== null
          ? `${row.tick_start}-${row.tick_end}`
          : "—",
      environment: [row.shard, row.room_name].filter(Boolean).join(" / ") || "—",
      source: row.source_ref,
      capturedAt: row.verified_at,
    })),
  );
}
