import fs from "node:fs";
import path from "node:path";

import { createIsolatedNeon } from "./lib/database-environment-isolation.mjs";
import { readResolverDemandGscRows } from "./lib/resolver-demand-gsc-source.mjs";
import { buildResolverDemandRanking } from "./lib/resolver-demand-ranking.mjs";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is required to generate Resolver demand ranking.");
  process.exit(1);
}

const gscInputPath = process.argv[2] ?? process.env.RESOLVER_GSC_REPORT ?? null;
const outputPath = process.argv[3] ?? "reports/resolver-demand-ranking-v1.json";
const daysArg = Number.parseInt(process.argv[4] ?? process.env.RESOLVER_DEMAND_DAYS ?? "30", 10);
const days = Number.isFinite(daysArg) ? Math.max(1, Math.min(daysArg, 365)) : 30;
const sql = createIsolatedNeon(databaseUrl);

async function readResolverRows() {
  try {
    return await sql`
      SELECT
        flow_id,
        count(*) FILTER (WHERE event_name = 'flow_started')::int AS starts,
        count(*) FILTER (WHERE event_name = 'outcome_reached')::int AS outcomes,
        count(*) FILTER (
          WHERE event_name IN ('diagnostics_clicked', 'guide_clicked', 'tool_clicked', 'ticklab_clicked')
        )::int AS downstream_clicks
      FROM resolver_events
      WHERE created_at >= now() - (${days} * interval '1 day')
      GROUP BY flow_id
      ORDER BY flow_id ASC;
    `;
  } catch {
    console.warn("Resolver telemetry source is unavailable; ranking will fail closed as INSUFFICIENT_DATA.");
    return null;
  }
}

async function readSearchRows() {
  try {
    return await sql`
      SELECT
        normalized_query,
        count(*)::int AS searches
      FROM search_queries
      WHERE created_at >= now() - (${days} * interval '1 day')
      GROUP BY normalized_query
      ORDER BY searches DESC, normalized_query ASC
      LIMIT 500;
    `;
  } catch {
    console.warn("Search telemetry source is unavailable; ranking will fail closed as INSUFFICIENT_DATA.");
    return null;
  }
}

const [resolverRows, searchRows, gsc] = await Promise.all([
  readResolverRows(),
  readSearchRows(),
  readResolverDemandGscRows({ sql, inputPath: gscInputPath }),
]);
const ranking = buildResolverDemandRanking({
  resolverRows,
  searchRows,
  gscRows: gsc.rows,
});

const report = {
  generatedAt: new Date().toISOString(),
  days,
  gscSource: gsc.source,
  privacyBoundary:
    "Output contains only aggregate counts, stable candidate IDs, component scores, and mapping provenance; raw Search/GSC query text is not emitted.",
  ...ranking,
};

const absoluteOutput = path.resolve(outputPath);
fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
fs.writeFileSync(absoluteOutput, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Resolver Demand Ranking — last ${days} day(s)`);
console.log(`Status: ${report.status}`);
console.log(`Recommendation: ${report.recommendation.candidateId ?? "none"}`);
console.log(`GSC source: ${report.gscSource.kind}/${report.gscSource.status}`);
if (report.reasons.length > 0) console.log(`Reasons: ${report.reasons.join(", ")}`);
console.log(`Report written to ${absoluteOutput}`);
