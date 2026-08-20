import assert from "node:assert/strict";
import fs from "node:fs";

const baselinePaths = [
  "database/migrations/0001a_production_baseline_core_20260820.sql",
  "database/migrations/0001b_production_baseline_intelligence_20260820.sql",
  "database/migrations/0001c_production_baseline_indexes_views_20260820.sql",
];
const hardeningPath = "database/migrations/0002_site_intelligence_hardening.sql";
const readmePath = "database/README.md";
const gscContractPath = "docs/gsc-historical-data-contract.md";

for (const path of [...baselinePaths, hardeningPath, readmePath, gscContractPath]) assert.ok(fs.existsSync(path), `Missing ${path}`);
const baseline = baselinePaths.map((path) => fs.readFileSync(path, "utf8")).join("\n");
const hardening = fs.readFileSync(hardeningPath, "utf8");
const readme = fs.readFileSync(readmePath, "utf8");
const gscContract = fs.readFileSync(gscContractPath, "utf8");

const tables = [
  "article_feedback", "search_clicks", "search_documents", "search_queries", "site_intelligence_action_events",
  "site_intelligence_action_links", "site_intelligence_actions", "site_intelligence_data_quality_issues",
  "site_intelligence_gsc_observations", "site_intelligence_import_runs", "site_intelligence_relationships",
  "site_intelligence_snapshots", "tool_events", "verification_evidence",
];
const views = ["site_intelligence_action_operating_view", "site_intelligence_gsc_period_summary", "verification_evidence_public"];
for (const table of tables) assert.match(baseline, new RegExp(`CREATE TABLE public\\.${table}\\b`), `Baseline missing table ${table}`);
for (const view of views) assert.match(baseline, new RegExp(`CREATE VIEW public\\.${view}\\b`), `Baseline missing view ${view}`);
assert.match(baseline, /CREATE EXTENSION IF NOT EXISTS pg_trgm;/);
assert.equal((baseline.match(/CREATE TABLE public\./g) ?? []).length, 14);
assert.equal((baseline.match(/CREATE VIEW public\./g) ?? []).length, 3);

for (const constraint of [
  "site_intelligence_actions_done_requires_completed_at",
  "site_intelligence_actions_result_requires_done",
  "site_intelligence_actions_superseded_requires_target",
  "site_intelligence_gsc_ctr_upper_bound",
  "site_intelligence_gsc_clicks_not_above_impressions",
  "site_intelligence_gsc_position_positive",
]) assert.match(hardening, new RegExp(constraint), `Hardening migration missing ${constraint}`);
assert.equal((hardening.match(/ADD CONSTRAINT/g) ?? []).length, 6);
assert.match(readme, /append-only/);
assert.match(readme, /lexical order/);
assert.match(gscContract, /gsc-page-query-v1/);
assert.match(gscContract, /Search type: \*\*Web\*\*/);
assert.match(gscContract, /Device: \*\*All\*\*/);
assert.match(gscContract, /Dimensions: \*\*Page \+ Query\*\*/);

console.log("Database schema baseline validation passed: 14 tables, 3 views, 4 ordered migration files, 6 hardening constraints.");
