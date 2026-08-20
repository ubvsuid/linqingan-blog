import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { neon } from "@neondatabase/serverless";

import { buildSiteAssetMaster } from "./lib/site-asset-master.mjs";
import { classifyWarehouseObservation, resolveGscSource } from "./lib/site-intelligence-gsc.mjs";
import { buildSiteIntelligenceSignals, renderSiteIntelligenceSignalsMarkdown } from "./lib/site-intelligence-signals.mjs";

const root = process.cwd();
const args = process.argv.slice(2);

function argValue(name, fallback = null) {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  return args[index + 1] ?? fallback;
}

function boundedDays(value) {
  const parsed = Number.parseInt(String(value ?? "30"), 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 365)) : 30;
}

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

function readGscFileRecords(inputPath) {
  if (!inputPath) return [];
  const absolutePath = path.resolve(inputPath);
  const payload = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  if (!Array.isArray(payload.records)) {
    throw new Error("The GSC JSON must contain a records array.");
  }
  return payload.records;
}

async function readWarehouseGsc(sql, { importId = null, periodStart = null, periodEnd = null } = {}) {
  if ((periodStart && !periodEnd) || (!periodStart && periodEnd)) {
    throw new Error("Use both --gsc-period-start and --gsc-period-end together.");
  }

  let rows;
  let selection;
  if (importId) {
    rows = await sql`
      SELECT * FROM site_intelligence_gsc_observations
      WHERE source_import_id = ${importId}
      ORDER BY page_path ASC, query ASC;
    `;
    selection = `import ${importId}`;
  } else if (periodStart && periodEnd) {
    rows = await sql`
      SELECT * FROM site_intelligence_gsc_observations
      WHERE period_start = ${periodStart}::date AND period_end = ${periodEnd}::date
      ORDER BY page_path ASC, query ASC;
    `;
    selection = `${periodStart} → ${periodEnd}`;
  } else {
    const [latest] = await sql`
      SELECT period_start, period_end
      FROM site_intelligence_gsc_observations
      ORDER BY period_end DESC, period_start DESC
      LIMIT 1;
    `;
    if (!latest) return { records: [], selection: "warehouse empty" };
    rows = await sql`
      SELECT * FROM site_intelligence_gsc_observations
      WHERE period_start = ${latest.period_start} AND period_end = ${latest.period_end}
      ORDER BY page_path ASC, query ASC;
    `;
    selection = `${latest.period_start} → ${latest.period_end} (latest)`;
  }
  return { records: rows.map(classifyWarehouseObservation), selection };
}

async function readNeonSignals(days, gscOptions) {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return {
      internalSearchRows: [], toolUsageRows: [], feedbackRows: [], evidenceRows: [],
      warehouseGsc: { records: [], selection: null }, databaseConnected: false,
    };
  }

  const sql = neon(databaseUrl);
  const internalSearchRows = await sql`
    WITH query_clicks AS (
      SELECT search_query_id, count(*)::int AS clicks
      FROM search_clicks
      WHERE search_query_id IS NOT NULL
        AND created_at >= now() - (${days} * interval '1 day')
      GROUP BY search_query_id
    )
    SELECT
      q.language,
      q.normalized_query,
      max(q.query) AS example_query,
      count(*)::int AS searches,
      count(*) FILTER (WHERE q.result_count = 0)::int AS zero_results,
      coalesce(sum(query_clicks.clicks), 0)::int AS clicks
    FROM search_queries q
    LEFT JOIN query_clicks ON query_clicks.search_query_id = q.id
    WHERE q.created_at >= now() - (${days} * interval '1 day')
    GROUP BY q.language, q.normalized_query
    ORDER BY searches DESC, q.language ASC, q.normalized_query ASC
    LIMIT 100;
  `;

  const toolUsageRows = await sql`
    SELECT tool_id, action, count(*)::int AS events, max(created_at) AS latest_at
    FROM tool_events
    WHERE created_at >= now() - (${days} * interval '1 day')
    GROUP BY tool_id, action
    ORDER BY events DESC, tool_id ASC, action ASC;
  `;

  const feedbackRows = await sql`
    SELECT article_slug, count(*)::int AS votes,
      count(*) FILTER (WHERE helpful IS TRUE)::int AS helpful,
      count(*) FILTER (WHERE helpful IS FALSE)::int AS not_helpful,
      max(created_at) AS latest_at
    FROM article_feedback
    WHERE created_at >= now() - (${days} * interval '1 day')
    GROUP BY article_slug
    ORDER BY votes DESC, article_slug ASC;
  `;

  const evidenceRows = await sql`
    SELECT article_slug, verification_type, status, count(*)::int AS evidence, max(verified_at) AS latest_at
    FROM verification_evidence
    GROUP BY article_slug, verification_type, status
    ORDER BY article_slug ASC, verification_type ASC, status ASC;
  `;

  const warehouseGsc = await readWarehouseGsc(sql, gscOptions);
  return { internalSearchRows, toolUsageRows, feedbackRows, evidenceRows, warehouseGsc, databaseConnected: true };
}

const days = boundedDays(argValue("--days", process.env.PLATFORM_REPORT_DAYS ?? "30"));
const gscInput = argValue("--gsc");
const requestedGscSource = argValue("--gsc-source");
const gscImportId = argValue("--gsc-import-id");
const gscPeriodStart = argValue("--gsc-period-start");
const gscPeriodEnd = argValue("--gsc-period-end");
const jsonOutput = path.resolve(argValue("--json", "reports/site-intelligence-signals.json"));
const markdownOutput = path.resolve(argValue("--markdown", "reports/site-intelligence-signals.md"));

if (!args.includes("--skip-refresh")) refreshContentRegistries();
const assetMaster = buildSiteAssetMaster(root);
const databaseConnected = Boolean(process.env.DATABASE_URL?.trim());
const gscSource = resolveGscSource({ fileInput: gscInput, databaseConnected, requested: requestedGscSource });
const neonSignals = await readNeonSignals(days, { importId: gscImportId, periodStart: gscPeriodStart, periodEnd: gscPeriodEnd });
const gscRecords = gscSource === "file" ? readGscFileRecords(gscInput) : gscSource === "warehouse" ? neonSignals.warehouseGsc.records : [];

const snapshot = buildSiteIntelligenceSignals({
  assetMaster,
  gscRecords,
  internalSearchRows: neonSignals.internalSearchRows,
  toolUsageRows: neonSignals.toolUsageRows,
  feedbackRows: neonSignals.feedbackRows,
  evidenceRows: neonSignals.evidenceRows,
});

const output = {
  ...snapshot,
  inputs: {
    gscSource,
    gsc: gscSource === "file" ? path.basename(path.resolve(gscInput)) : gscSource === "warehouse" ? neonSignals.warehouseGsc.selection : null,
    neon: neonSignals.databaseConnected ? `last ${days} day(s) for behavior; all retained evidence` : null,
  },
};

fs.mkdirSync(path.dirname(jsonOutput), { recursive: true });
fs.mkdirSync(path.dirname(markdownOutput), { recursive: true });
fs.writeFileSync(jsonOutput, `${JSON.stringify(output, null, 2)}\n`, "utf8");
fs.writeFileSync(markdownOutput, renderSiteIntelligenceSignalsMarkdown(output), "utf8");

console.log("Site Intelligence Signals report generated.");
console.log(`GSC source: ${output.inputs.gscSource}${output.inputs.gsc ? ` (${output.inputs.gsc})` : ""}`);
console.log(`Assets: ${output.coverage.totalAssets}`);
console.log(`Assets with signals: ${output.coverage.assetsWithSignals}`);
console.log(`Unmapped signals: ${output.coverage.unmappedSignals}`);
console.log(`Internal search gate: ${output.sourceSummary.internalSearchGate}`);
console.log(`Tool usage gate: ${output.sourceSummary.toolUsageGate}`);
console.log(`Feedback gate: ${output.sourceSummary.feedbackGate}`);
console.log(`JSON: ${jsonOutput}`);
console.log(`Markdown: ${markdownOutput}`);
