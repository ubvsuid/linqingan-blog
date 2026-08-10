import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required to generate the verification evidence report.");
  process.exit(1);
}

const sql = neon(databaseUrl);

const [summary] = await sql`
  SELECT
    count(*)::int AS evidence_rows,
    count(DISTINCT article_slug)::int AS verified_articles,
    count(*) FILTER (WHERE verification_type = 'console')::int AS console_rows,
    count(*) FILTER (WHERE verification_type = 'live')::int AS live_rows,
    count(DISTINCT article_slug) FILTER (WHERE verification_type = 'console')::int AS console_articles,
    count(DISTINCT article_slug) FILTER (WHERE verification_type = 'live')::int AS live_articles
  FROM verification_evidence;
`;

const latest = await sql`
  SELECT
    article_slug,
    verification_type,
    api_name,
    return_code,
    game_time,
    tick_start,
    tick_end,
    shard,
    room_name,
    verified_at
  FROM verification_evidence
  ORDER BY verified_at DESC, id DESC
  LIMIT 20;
`;

console.log("Verification Evidence Report");
console.log(`Evidence rows: ${summary?.evidence_rows ?? 0}`);
console.log(`Verified articles: ${summary?.verified_articles ?? 0}`);
console.log(`Console: ${summary?.console_rows ?? 0} row(s) across ${summary?.console_articles ?? 0} article(s)`);
console.log(`Live multi-tick: ${summary?.live_rows ?? 0} row(s) across ${summary?.live_articles ?? 0} article(s)`);

console.log("\nLatest evidence");
if (latest.length === 0) {
  console.log("  No runtime evidence recorded yet.");
} else {
  console.table(
    latest.map((row) => ({
      article: row.article_slug,
      type: row.verification_type,
      api: row.api_name,
      return: row.return_code ?? "—",
      gameTime: row.game_time ?? "—",
      ticks:
        row.tick_start !== null && row.tick_end !== null
          ? `${row.tick_start}-${row.tick_end}`
          : "—",
      environment: [row.shard, row.room_name].filter(Boolean).join(" / ") || "—",
      verifiedAt: row.verified_at,
    })),
  );
}
