import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

import { buildSiteAssetMaster } from "./lib/site-asset-master.mjs";
import { GSC_GRAIN_CONTRACT, makeImportId } from "./lib/site-intelligence-foundation.mjs";
import { parseGscCsv } from "./lib/site-intelligence-gsc-csv.mjs";
import { planGscHistoricalImport } from "./lib/site-intelligence-gsc-import.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
function argValue(name, fallback = null) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? fallback : fallback; }
function flag(name) { return args.includes(name); }
function json(value) { return JSON.stringify(value ?? {}); }

const input = argValue("--input");
const periodStart = argValue("--period-start");
const periodEnd = argValue("--period-end");
const commit = flag("--commit");
const planOutput = path.resolve(argValue("--json", "reports/site-intelligence-gsc-import-plan.json"));
if (!input || !periodStart || !periodEnd) throw new Error("--input, --period-start, and --period-end are required.");

if (!flag("--skip-refresh")) {
  for (const script of ["scripts/generate-knowledge-article-registry.mjs", "scripts/generate-beginner-roadmap-registry.mjs"]) {
    execFileSync(process.execPath, [path.join(root, script)], { cwd: root, stdio: ["ignore", "ignore", "inherit"] });
  }
}

const absoluteInput = path.resolve(input);
const sourceBytes = fs.readFileSync(absoluteInput);
const inputFingerprint = crypto.createHash("sha256").update(sourceBytes).digest("hex");
const startedAt = new Date().toISOString();
const importId = makeImportId({ source: "gsc", fingerprint: inputFingerprint, startedAt });
const rows = parseGscCsv(sourceBytes.toString("utf8"), { requirePageQuery: true });
const assetMaster = buildSiteAssetMaster(root);
const plan = planGscHistoricalImport({
  rows, assetMaster, periodStart, periodEnd,
  searchType: argValue("--search-type", GSC_GRAIN_CONTRACT.searchType),
  country: argValue("--country", GSC_GRAIN_CONTRACT.country),
  device: argValue("--device", GSC_GRAIN_CONTRACT.device),
  dimensions: GSC_GRAIN_CONTRACT.dimensions,
});

const status = plan.counts.rowsRejected > 0 || plan.counts.rowsUnmapped > 0 ? "partial" : "completed";
const output = {
  importId, mode: commit ? "commit" : "dry-run", source: "gsc", file: path.basename(absoluteInput),
  inputFingerprint, periodStart, periodEnd, status, grain: plan.grain, counts: plan.counts,
  rejected: plan.rejected, issues: plan.issues, relationships: plan.relationships, resolvedIssueFingerprints: plan.resolvedIssueFingerprints,
};
fs.mkdirSync(path.dirname(planOutput), { recursive: true });
fs.writeFileSync(planOutput, `${JSON.stringify(output, null, 2)}\n`, "utf8");

if (!commit) {
  console.log("Historical GSC import dry-run completed; no database writes were made.");
  console.log(`Import ID: ${importId}`);
  console.log(`Rows received/accepted/rejected/unmapped: ${plan.counts.rowsReceived}/${plan.counts.rowsAccepted}/${plan.counts.rowsRejected}/${plan.counts.rowsUnmapped}`);
  console.log(`Plan: ${planOutput}`);
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required with --commit.");
const sql = neon(databaseUrl);
const completedAt = new Date().toISOString();
const observations = plan.accepted.map((row) => ({
  source_import_id: importId, period_start: row.periodStart, period_end: row.periodEnd,
  page_path: row.pagePath, query: row.query, asset_id: row.assetId, owner_keyword: row.ownerKeyword,
  owner_asset_id: row.ownerAssetId, owner_status: row.ownerStatus, clicks: row.clicks,
  impressions: row.impressions, ctr: row.ctr, position: row.position, row_fingerprint: row.rowFingerprint,
  metadata: row.metadata,
}));
const issues = plan.issues.map((issue) => ({
  issue_id: issue.issueId, issue_type: issue.issueType, severity: issue.severity, source: issue.source,
  asset_id: issue.assetId ?? null, entity_kind: issue.entityKind ?? null, entity_key: issue.entityKey ?? null,
  issue_fingerprint: issue.issueFingerprint, first_import_id: importId, last_import_id: importId,
  raw_payload: issue.rawPayload, metadata: issue.metadata,
}));
const relationships = plan.relationships.map((relationship) => ({
  relationship_id: relationship.relationshipId, from_kind: relationship.fromKind, from_key: relationship.fromKey,
  relationship_type: relationship.relationshipType, to_kind: relationship.toKind, to_key: relationship.toKey,
  basis: relationship.basis, source_import_id: importId, metadata: relationship.metadata,
}));

const queries = [sql`
  INSERT INTO site_intelligence_import_runs
    (import_id, source, source_label, original_filename, period_start, period_end, status, input_fingerprint,
     rows_received, rows_accepted, rows_rejected, rows_unmapped, started_at, completed_at, metadata)
  VALUES
    (${importId}, 'gsc', 'Google Search Console Page + Query', ${path.basename(absoluteInput)}, ${periodStart}::date, ${periodEnd}::date,
     ${status}, ${inputFingerprint}, ${plan.counts.rowsReceived}, ${plan.counts.rowsAccepted}, ${plan.counts.rowsRejected}, ${plan.counts.rowsUnmapped},
     ${startedAt}, ${completedAt}, ${json({ grainVersion: plan.grain.version, contract: plan.grain })}::jsonb);
`];

if (observations.length) queries.push(sql`
  WITH incoming AS (
    SELECT * FROM jsonb_to_recordset(${json(observations)}::jsonb) AS x(
      source_import_id text, period_start date, period_end date, page_path text, query text, asset_id text,
      owner_keyword text, owner_asset_id text, owner_status text, clicks bigint, impressions bigint,
      ctr numeric, position numeric, row_fingerprint text, metadata jsonb)
  )
  INSERT INTO site_intelligence_gsc_observations
    (source_import_id, period_start, period_end, page_path, query, asset_id, owner_keyword, owner_asset_id, owner_status,
     clicks, impressions, ctr, position, row_fingerprint, metadata)
  SELECT source_import_id, period_start, period_end, page_path, query, asset_id, owner_keyword, owner_asset_id, owner_status,
    clicks, impressions, ctr, position, row_fingerprint, metadata FROM incoming
  ON CONFLICT (period_start, period_end, page_path, query) DO UPDATE SET
    source_import_id = EXCLUDED.source_import_id, asset_id = EXCLUDED.asset_id, owner_keyword = EXCLUDED.owner_keyword,
    owner_asset_id = EXCLUDED.owner_asset_id, owner_status = EXCLUDED.owner_status, clicks = EXCLUDED.clicks,
    impressions = EXCLUDED.impressions, ctr = EXCLUDED.ctr, position = EXCLUDED.position,
    row_fingerprint = EXCLUDED.row_fingerprint, captured_at = now(), metadata = EXCLUDED.metadata;
`);

if (issues.length) queries.push(sql`
  WITH incoming AS (
    SELECT * FROM jsonb_to_recordset(${json(issues)}::jsonb) AS x(
      issue_id text, issue_type text, severity text, source text, asset_id text, entity_kind text, entity_key text,
      issue_fingerprint text, first_import_id text, last_import_id text, raw_payload jsonb, metadata jsonb)
  )
  INSERT INTO site_intelligence_data_quality_issues
    (issue_id, issue_type, severity, source, asset_id, entity_kind, entity_key, issue_fingerprint,
     first_import_id, last_import_id, raw_payload, metadata)
  SELECT issue_id, issue_type, severity, source, asset_id, entity_kind, entity_key, issue_fingerprint,
    first_import_id, last_import_id, raw_payload, metadata FROM incoming
  ON CONFLICT (issue_fingerprint) DO UPDATE SET
    severity = EXCLUDED.severity, last_import_id = EXCLUDED.last_import_id,
    occurrence_count = site_intelligence_data_quality_issues.occurrence_count + 1,
    last_seen_at = now(), raw_payload = EXCLUDED.raw_payload, metadata = EXCLUDED.metadata,
    status = CASE WHEN site_intelligence_data_quality_issues.status = 'ignored' THEN 'ignored' ELSE 'open' END,
    resolution = CASE WHEN site_intelligence_data_quality_issues.status = 'ignored' THEN site_intelligence_data_quality_issues.resolution ELSE NULL END,
    resolved_at = CASE WHEN site_intelligence_data_quality_issues.status = 'ignored' THEN site_intelligence_data_quality_issues.resolved_at ELSE NULL END,
    updated_at = now();
`);

if (plan.resolvedIssueFingerprints.length) queries.push(sql`
  UPDATE site_intelligence_data_quality_issues
  SET status = 'resolved', resolution = 'Resolved by successful Asset/Owner mapping during GSC historical import',
      resolved_at = now(), last_import_id = ${importId}, updated_at = now()
  WHERE issue_fingerprint = ANY(${plan.resolvedIssueFingerprints}::text[]) AND status = 'open';
`);

if (relationships.length) queries.push(sql`
  WITH incoming AS (
    SELECT * FROM jsonb_to_recordset(${json(relationships)}::jsonb) AS x(
      relationship_id text, from_kind text, from_key text, relationship_type text, to_kind text, to_key text,
      basis text, source_import_id text, metadata jsonb)
  )
  INSERT INTO site_intelligence_relationships
    (relationship_id, from_kind, from_key, relationship_type, to_kind, to_key, basis, source_import_id, metadata)
  SELECT relationship_id, from_kind, from_key, relationship_type, to_kind, to_key, basis, source_import_id, metadata FROM incoming
  ON CONFLICT (from_kind, from_key, relationship_type, to_kind, to_key) DO UPDATE SET
    basis = EXCLUDED.basis, source_import_id = EXCLUDED.source_import_id, status = 'active',
    last_seen_at = now(), metadata = EXCLUDED.metadata, updated_at = now();
`);

await sql.transaction(queries);
console.log("Historical GSC import committed atomically.");
console.log(`Import ID: ${importId}`);
console.log(`Status: ${status}`);
console.log(`Rows received/accepted/rejected/unmapped: ${plan.counts.rowsReceived}/${plan.counts.rowsAccepted}/${plan.counts.rowsRejected}/${plan.counts.rowsUnmapped}`);
console.log(`Plan: ${planOutput}`);
