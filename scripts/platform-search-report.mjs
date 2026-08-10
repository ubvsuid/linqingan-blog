import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required to generate the platform search report.");
  process.exit(1);
}

const daysArg = Number.parseInt(process.argv[2] ?? "30", 10);
const days = Number.isFinite(daysArg) ? Math.max(1, Math.min(daysArg, 365)) : 30;
const sql = neon(databaseUrl);

const [summary] = await sql`
  WITH period_queries AS (
    SELECT id, result_count
    FROM search_queries
    WHERE created_at >= now() - (${days} * interval '1 day')
  ),
  clicked_queries AS (
    SELECT DISTINCT search_query_id
    FROM search_clicks
    WHERE search_query_id IS NOT NULL
      AND created_at >= now() - (${days} * interval '1 day')
  )
  SELECT
    count(*)::int AS total_queries,
    count(*) FILTER (WHERE result_count = 0)::int AS zero_result_queries,
    count(clicked_queries.search_query_id)::int AS clicked_queries
  FROM period_queries
  LEFT JOIN clicked_queries ON clicked_queries.search_query_id = period_queries.id;
`;

const topSearches = await sql`
  SELECT
    normalized_query,
    max(query) AS example_query,
    count(*)::int AS searches,
    count(*) FILTER (WHERE result_count = 0)::int AS zero_results,
    round(avg(result_count)::numeric, 1) AS avg_results
  FROM search_queries
  WHERE created_at >= now() - (${days} * interval '1 day')
  GROUP BY normalized_query
  ORDER BY searches DESC, normalized_query ASC
  LIMIT 15;
`;

const zeroResults = await sql`
  SELECT
    normalized_query,
    max(query) AS example_query,
    count(*)::int AS searches
  FROM search_queries
  WHERE created_at >= now() - (${days} * interval '1 day')
    AND result_count = 0
  GROUP BY normalized_query
  ORDER BY searches DESC, normalized_query ASC
  LIMIT 15;
`;

const noClickQueries = await sql`
  SELECT
    q.normalized_query,
    max(q.query) AS example_query,
    count(*)::int AS searches
  FROM search_queries q
  LEFT JOIN search_clicks c ON c.search_query_id = q.id
  WHERE q.created_at >= now() - (${days} * interval '1 day')
    AND q.result_count > 0
    AND c.id IS NULL
  GROUP BY q.normalized_query
  ORDER BY searches DESC, q.normalized_query ASC
  LIMIT 15;
`;

const topClicked = await sql`
  SELECT
    result_href,
    max(result_type) AS result_type,
    count(*)::int AS clicks,
    round(avg(position)::numeric, 1) AS avg_position
  FROM search_clicks
  WHERE created_at >= now() - (${days} * interval '1 day')
  GROUP BY result_href
  ORDER BY clicks DESC, result_href ASC
  LIMIT 15;
`;

const totalQueries = Number(summary?.total_queries ?? 0);
const clickedQueries = Number(summary?.clicked_queries ?? 0);
const zeroResultQueries = Number(summary?.zero_result_queries ?? 0);
const clickThroughRate = totalQueries > 0 ? (clickedQueries / totalQueries) * 100 : 0;
const zeroResultRate = totalQueries > 0 ? (zeroResultQueries / totalQueries) * 100 : 0;

console.log(`Platform Search Analytics — last ${days} day(s)`);
console.log(`Queries: ${totalQueries}`);
console.log(`Zero-result queries: ${zeroResultQueries} (${zeroResultRate.toFixed(1)}%)`);
console.log(`Queries with a tracked click: ${clickedQueries} (${clickThroughRate.toFixed(1)}%)`);

function printRows(title, rows, columns) {
  console.log(`\n${title}`);
  if (!rows.length) {
    console.log("  No data yet.");
    return;
  }
  console.table(rows.map((row) => Object.fromEntries(columns.map((column) => [column, row[column]]))));
}

printRows("Top searches", topSearches, [
  "example_query",
  "searches",
  "zero_results",
  "avg_results",
]);
printRows("Top zero-result searches", zeroResults, ["example_query", "searches"]);
printRows("Top no-click searches with results", noClickQueries, ["example_query", "searches"]);
printRows("Top clicked results", topClicked, [
  "result_href",
  "result_type",
  "clicks",
  "avg_position",
]);
