import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { buildSiteAssetMaster } from "./lib/site-asset-master.mjs";
import { normalizePagePath, inferSiteNode } from "./lib/content-asset-index.mjs";
import { classifyGscMetrics, formatGscCtr, priorityForGscAction } from "./lib/site-intelligence-gsc.mjs";
import { parseGscCsv } from "./lib/site-intelligence-gsc-csv.mjs";
import { buildSiteAssetLookup, resolveGscOwnership } from "./lib/site-intelligence-mapping.mjs";

const root = process.cwd();
const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? "reports/search-console-opportunities.md";
const jsonOutputPath = process.argv[4] ?? null;
if (!inputPath) {
  console.error("Usage: npm run searchconsole:report -- <search-console.csv> [output.md] [output.json]");
  process.exit(1);
}

if (!process.argv.includes("--skip-refresh")) {
  for (const script of ["scripts/generate-knowledge-article-registry.mjs", "scripts/generate-beginner-roadmap-registry.mjs"]) {
    execFileSync(process.execPath, [path.join(root, script)], { cwd: root, stdio: ["ignore", "ignore", "inherit"] });
  }
}

const absoluteInput = path.resolve(inputPath);
const rows = parseGscCsv(fs.readFileSync(absoluteInput, "utf8"));
const assetMaster = buildSiteAssetMaster(root);
const lookup = buildSiteAssetLookup(assetMaster);

const records = rows.map((row) => {
  const pagePath = normalizePagePath(row.page);
  const ownership = resolveGscOwnership({ pagePath, query: row.query }, lookup);
  const asset = ownership.actualAsset ?? ownership.expectedAsset;
  let action = classifyGscMetrics(row);
  if (ownership.ownerStatus === "owner-mismatch") action = "Review keyword ownership / cannibalization";
  else if (ownership.ownerStatus === "owner-language-unmapped") action = "Review language-scoped Owner mapping";
  else if (!ownership.actualAsset && pagePath && (pagePath.startsWith("/blog/") || pagePath.startsWith("/en/blog/"))) action = "Review unmapped article URL";

  const inferred = asset ? null : inferSiteNode(pagePath);
  return {
    priority: priorityForGscAction(action),
    subject: row.page || row.query || "Unknown",
    page: row.page,
    pagePath,
    query: row.query,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
    action,
    language: ownership.pageLanguage,
    system: asset?.contentSystem ?? inferred?.system ?? "unmapped",
    nodeType: asset?.assetType ?? inferred?.nodeType ?? (row.query ? "query" : "unknown"),
    module: asset?.module ?? inferred?.module ?? "",
    stage: asset?.stage ?? inferred?.stage ?? "",
    ownerKeyword: ownership.expectedAsset?.primaryKeyword ?? "",
    ownerStatus: ownership.ownerStatus ?? "owner-unmapped",
    expectedOwnerHref: ownership.expectedAsset?.path ?? "",
    mappingSource: ownership.actualAsset ? "asset-path" : ownership.ownerResolution.source ?? (inferred ? "site-path" : "unmapped"),
  };
}).filter((record) => record.subject);

const priorityWeight = { P0: 3, P1: 2, P2: 1 };
records.sort((left, right) =>
  (priorityWeight[right.priority] ?? 0) - (priorityWeight[left.priority] ?? 0)
  || right.impressions - left.impressions
  || String(left.pagePath || left.query).localeCompare(String(right.pagePath || right.query)),
);

const ownerMismatches = records.filter((record) => record.ownerStatus === "owner-mismatch").length;
const languageReviews = records.filter((record) => record.ownerStatus === "owner-language-unmapped").length;
const unmappedArticles = records.filter((record) => record.action === "Review unmapped article URL").length;
const report = [
  "# Google Search Console opportunity report",
  "",
  `Source: \`${path.basename(absoluteInput)}\``,
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `- Rows: ${records.length}`,
  `- Owner mismatches requiring review: ${ownerMismatches}`,
  `- Language-scoped Owner mappings requiring review: ${languageReviews}`,
  `- Unmapped article URLs requiring review: ${unmappedArticles}`,
  "",
  "## Prioritized pages or queries",
  "",
  "| Priority | Page or query | Query | Lang | Owner status | Clicks | Impressions | CTR | Position | Recommended action |",
  "|---|---|---|---|---|---:|---:|---:|---:|---|",
  ...records.map((record) => `| ${record.priority} | ${record.subject.replaceAll("|", "\\|")} | ${record.query.replaceAll("|", "\\|")} | ${record.language} | ${record.ownerStatus} | ${record.clicks} | ${record.impressions} | ${formatGscCtr(record.ctr)} | ${record.position === null ? "—" : record.position.toFixed(1)} | ${record.action} |`),
  "",
  "## Interpretation boundaries",
  "",
  "CTR is normalized internally as a ratio (0–1) and formatted as a percentage only for display. Owner resolution is language-scoped; an English page can never create a Chinese cannibalization P0 merely because the same query exists in both languages. This compatibility report does not persist historical facts; the Site Intelligence Historical Importer is the authoritative warehouse path.",
  "",
].join("\n");

const absoluteOutput = path.resolve(outputPath);
fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
fs.writeFileSync(absoluteOutput, report, "utf8");
console.log(`Search Console opportunity report written to ${absoluteOutput}`);
if (jsonOutputPath) {
  const absoluteJsonOutput = path.resolve(jsonOutputPath);
  fs.mkdirSync(path.dirname(absoluteJsonOutput), { recursive: true });
  fs.writeFileSync(absoluteJsonOutput, `${JSON.stringify({ generatedAt: new Date().toISOString(), source: path.basename(absoluteInput), metricContract: { ctr: "ratio-0-to-1" }, records }, null, 2)}\n`, "utf8");
  console.log(`Search Console opportunity JSON written to ${absoluteJsonOutput}`);
}
