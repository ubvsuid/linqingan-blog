import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { createIsolatedNeon } from "./lib/database-environment-isolation.mjs";
import { loadContentAssetIndex } from "./lib/content-asset-index.mjs";
import { buildPlatformSearchAnalysis, renderPlatformSearchMarkdown } from "./lib/platform-search-opportunities.mjs";

const root = process.cwd();
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required to generate the platform search report.");
  process.exit(1);
}

const daysArg = Number.parseInt(process.argv[2] ?? process.env.PLATFORM_REPORT_DAYS ?? "30", 10);
const days = Number.isFinite(daysArg) ? Math.max(1, Math.min(daysArg, 365)) : 30;
const markdownOutputPath = process.argv[3] ?? null;
const jsonOutputPath = process.argv[4] ?? null;
const sql = createIsolatedNeon(databaseUrl);

function refreshContentRegistries() {
  for (const script of [
    "scripts/generate-knowledge-article-registry.mjs",
    "scripts/generate-beginner-roadmap-registry.mjs",
  ]) {
    execFileSync(process.execPath, [path.join(root, script)], {
      cwd: root,
      stdio: ["ignore", "ignore", "inherit"],
    });
  }
}

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

refreshContentRegistries();
const assetIndex = loadContentAssetIndex(root);
const analysis = buildPlatformSearchAnalysis({
  summary: summary ?? {},
  topSearches,
  zeroResults,
  noClickQueries,
  topClicked,
  assetIndex,
});

console.log(`Platform Search Analytics — last ${days} day(s)`);
console.log(`Queries: ${analysis.summary.totalQueries}`);
console.log(`Zero-result queries: ${analysis.summary.zeroResultQueries} (${analysis.summary.zeroResultRate.toFixed(1)}%)`);
console.log(`Queries with a tracked click: ${analysis.summary.clickedQueries} (${analysis.summary.clickThroughRate.toFixed(1)}%)`);

function printRows(title, rows, columns) {
  console.log(`\n${title}`);
  if (!rows.length) {
    console.log("  No data yet.");
    return;
  }
  console.table(rows.map((row) => Object.fromEntries(columns.map((column) => [column, row[column]]))));
}

printRows("Action queue", analysis.actionQueue, [
  "priority",
  "signal",
  "query",
  "searches",
  "system",
  "module",
  "stage",
  "ownerKeyword",
  "action",
]);
printRows("Top searches", analysis.topSearches, [
  "query",
  "searches",
  "zeroResults",
  "zeroResultRate",
  "avgResults",
  "ownerKeyword",
  "module",
  "stage",
]);
printRows("Top clicked results", analysis.topClicked, [
  "href",
  "resultType",
  "clicks",
  "avgPosition",
  "system",
  "nodeType",
  "module",
  "stage",
]);

const generatedAt = new Date().toISOString();
if (markdownOutputPath) {
  const absoluteMarkdownOutput = path.resolve(markdownOutputPath);
  fs.mkdirSync(path.dirname(absoluteMarkdownOutput), { recursive: true });
  fs.writeFileSync(
    absoluteMarkdownOutput,
    renderPlatformSearchMarkdown(analysis, { days, generatedAt }),
    "utf8",
  );
  console.log(`Platform Search Markdown report written to ${absoluteMarkdownOutput}`);
}

if (jsonOutputPath) {
  const absoluteJsonOutput = path.resolve(jsonOutputPath);
  fs.mkdirSync(path.dirname(absoluteJsonOutput), { recursive: true });
  fs.writeFileSync(
    absoluteJsonOutput,
    `${JSON.stringify({ generatedAt, days, ...analysis }, null, 2)}\n`,
    "utf8",
  );
  console.log(`Platform Search JSON report written to ${absoluteJsonOutput}`);
}
