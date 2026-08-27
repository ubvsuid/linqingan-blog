import fs from "node:fs";
import path from "node:path";

import { createIsolatedNeon } from "./lib/database-environment-isolation.mjs";
import { renderFoundationMarkdown } from "./lib/site-intelligence-foundation.mjs";

const args = process.argv.slice(2);
function argValue(name, fallback = null) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? fallback : fallback; }
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const sql = createIsolatedNeon(databaseUrl);

const actionSummary = await sql`
  SELECT aging_state, count(*)::int AS actions
  FROM site_intelligence_action_operating_view
  GROUP BY aging_state
  ORDER BY CASE aging_state WHEN 'overdue' THEN 0 WHEN 'aging' THEN 1 WHEN 'scheduled' THEN 2 WHEN 'on_track' THEN 3 ELSE 4 END;
`;
const imports = await sql`
  SELECT import_id, source, status, period_start, period_end, rows_received, rows_accepted, rows_rejected, rows_unmapped, started_at, completed_at, input_fingerprint
  FROM site_intelligence_import_runs
  ORDER BY started_at DESC
  LIMIT 20;
`;
const duplicateImports = await sql`
  SELECT source, input_fingerprint, count(*)::int AS runs
  FROM site_intelligence_import_runs
  WHERE input_fingerprint IS NOT NULL
  GROUP BY source, input_fingerprint
  HAVING count(*) > 1
  ORDER BY runs DESC, source
  LIMIT 20;
`;
const dataQuality = await sql`
  SELECT issue_id, issue_type, severity, status, source, asset_id, entity_kind, entity_key, occurrence_count, first_seen_at, last_seen_at
  FROM site_intelligence_data_quality_issues
  WHERE status='open'
  ORDER BY CASE severity WHEN 'error' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, last_seen_at DESC
  LIMIT 50;
`;
const gscPeriods = await sql`
  SELECT period_start, period_end, observation_rows, mapped_rows, owner_mismatch_rows, clicks, impressions, ctr, impression_weighted_position
  FROM site_intelligence_gsc_period_summary
  ORDER BY period_end DESC, period_start DESC
  LIMIT 20;
`;
const relationships = await sql`
  SELECT relationship_type, basis, count(*)::int AS relationships
  FROM site_intelligence_relationships
  WHERE status='active'
  GROUP BY relationship_type, basis
  ORDER BY relationship_type, basis;
`;
const actionLinks = await sql`
  SELECT relationship_type, count(*)::int AS links
  FROM site_intelligence_action_links
  GROUP BY relationship_type
  ORDER BY relationship_type;
`;

const generatedAt = new Date().toISOString();
const output = { generatedAt, actionSummary, imports, duplicateImports, dataQuality, gscPeriods, relationships, actionLinks };
const jsonOutput = path.resolve(argValue("--json", "reports/site-intelligence-database-foundation.json"));
const markdownOutput = path.resolve(argValue("--markdown", "reports/site-intelligence-database-foundation.md"));
fs.mkdirSync(path.dirname(jsonOutput), { recursive: true });
fs.mkdirSync(path.dirname(markdownOutput), { recursive: true });
fs.writeFileSync(jsonOutput, `${JSON.stringify(output, null, 2)}\n`, "utf8");
fs.writeFileSync(markdownOutput, renderFoundationMarkdown(output), "utf8");
console.log("Site Intelligence Database Foundation report generated.");
console.log(`Recent imports: ${imports.length}`);
console.log(`Open data-quality issues: ${dataQuality.length}`);
console.log(`GSC periods: ${gscPeriods.length}`);
console.log(`Active relationship groups: ${relationships.length}`);
console.log(`JSON: ${jsonOutput}`);
console.log(`Markdown: ${markdownOutput}`);
