import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadContentAssetIndex, normalizePagePath } from "./lib/content-asset-index.mjs";

const root = process.cwd();
const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? "reports/search-console-opportunities.md";
const jsonOutputPath = process.argv[4] ?? null;

if (!inputPath) {
  console.error("Usage: npm run searchconsole:report -- <search-console.csv> [output.md] [output.json]");
  process.exit(1);
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function number(value) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/[%,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function classify({ clicks, impressions, ctr, position }) {
  if (clicks >= 10 && ctr >= 3 && position <= 10) return "Protect and expand";
  if (impressions >= 100 && position <= 12 && ctr < 2) return "Improve title and description";
  if (impressions >= 50 && position > 12 && position <= 30) return "Strengthen content and internal links";
  if (impressions >= 20 && position > 30) return "Reassess intent or consolidate";
  if (impressions === 0) return "No Search Console signal";
  return "Monitor";
}

function priorityForAction(action) {
  if (action === "Improve title and description" || action === "Strengthen content and internal links") return "P0";
  if (action === "Review keyword ownership / cannibalization") return "P0";
  if (action === "Reassess intent or consolidate" || action === "Protect and expand" || action === "Review unmapped article URL") return "P1";
  return "P2";
}

function inferSiteNode(pathname) {
  if (!pathname) return null;
  const parts = pathname.split("/").filter(Boolean);

  if (pathname === "/beginner") return { system: "roadmap", nodeType: "roadmap-hub", module: "beginner", stage: "" };
  if (pathname === "/knowledge") return { system: "knowledge", nodeType: "knowledge-hub", module: "", stage: "" };
  if (parts[0] === "knowledge" && parts[1]) return { system: "knowledge", nodeType: "knowledge-module", module: parts[1], stage: "" };
  if (parts[0] === "tools") return { system: "utility", nodeType: parts[1] ? "tool" : "tools-hub", module: parts[1] ?? "", stage: "" };
  if (parts[0] === "diagnostics") return { system: "diagnostics", nodeType: parts[1] ? "diagnostic" : "diagnostics-hub", module: parts[1] ?? "", stage: "" };
  if (parts[0] === "screeps-api") return { system: "reference", nodeType: parts[1] ? "api" : "api-hub", module: parts[1] ?? "", stage: "" };
  if (parts[0] === "screeps-errors") return { system: "reference", nodeType: parts[1] ? "error" : "errors-hub", module: parts[1] ?? "", stage: "" };
  if (parts[0] === "verification") return { system: "evidence", nodeType: "verification", module: parts[1] ?? "", stage: "" };
  if (parts[0] === "tags") return { system: "navigation", nodeType: parts[1] ? "tag" : "tags-hub", module: parts[1] ?? "", stage: "" };
  if (parts[0] === "blog" && parts[1]) return { system: "unmapped", nodeType: "article", module: "", stage: "" };
  if (parts[0] === "en") return { system: "english", nodeType: "english-page", module: parts[1] ?? "", stage: "" };
  return { system: "site", nodeType: "site-page", module: "", stage: "" };
}

function escapeTable(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

refreshContentRegistries();
const assetIndex = loadContentAssetIndex(root);
const absoluteInput = path.resolve(inputPath);
const rows = parseCsv(fs.readFileSync(absoluteInput, "utf8"));
if (rows.length < 2) throw new Error("The Search Console CSV does not contain data rows.");

const headers = rows[0].map(normalizeHeader);
const indexOf = (...names) =>
  names.map(normalizeHeader).map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;

const queryIndex = indexOf("Top queries", "Query", "热门查询", "查询", "查询词");
const pageIndex = indexOf("Top pages", "Page", "Landing page", "热门网页", "网页", "页面", "着陆页");
const clicksIndex = indexOf("Clicks", "点击次数", "点击");
const impressionsIndex = indexOf("Impressions", "展示次数", "展现次数", "展示", "展现");
const ctrIndex = indexOf("CTR", "点击率");
const positionIndex = indexOf("Position", "Average position", "排名", "平均排名", "平均位置");

if (queryIndex < 0 && pageIndex < 0) {
  throw new Error("Neither a Page nor Query column was found in the Search Console export.");
}
if (clicksIndex < 0 || impressionsIndex < 0 || ctrIndex < 0 || positionIndex < 0) {
  throw new Error("Required columns were not found. Export Clicks, Impressions, CTR, and Position from Google Search Console.");
}

const records = rows.slice(1).map((row) => {
  const page = pageIndex >= 0 ? String(row[pageIndex] ?? "").trim() : "";
  const query = queryIndex >= 0 ? String(row[queryIndex] ?? "").trim() : "";
  const clicks = number(row[clicksIndex]);
  const impressions = number(row[impressionsIndex]);
  const ctr = number(row[ctrIndex]);
  const position = number(row[positionIndex]);
  const pagePath = page ? normalizePagePath(page) : "";
  const pageAsset = page ? assetIndex.resolvePage(page) : null;
  const queryResolution = query ? assetIndex.resolveQuery(query) : { asset: null, source: null };

  let asset = pageAsset;
  let mappingSource = pageAsset ? "page-url" : "";
  let ownerStatus = "";
  let expectedOwnerHref = "";

  if (queryResolution.asset) {
    expectedOwnerHref = queryResolution.asset.href;
    if (pagePath) {
      ownerStatus = pagePath === expectedOwnerHref ? "owner-match" : "owner-mismatch";
    } else {
      ownerStatus = "query-owner";
      asset = queryResolution.asset;
      mappingSource = queryResolution.source ?? "owner-keyword";
    }
  } else if (query) {
    ownerStatus = "owner-unmapped";
  }

  const inferred = asset ? null : inferSiteNode(pagePath);
  const system = asset?.system ?? inferred?.system ?? "unmapped";
  const nodeType = asset?.nodeType ?? inferred?.nodeType ?? (query ? "query" : "unknown");
  const moduleId = asset?.module ?? inferred?.module ?? "";
  const stage = asset?.stage ?? inferred?.stage ?? "";
  const ownerKeyword = asset?.ownerKeyword ?? queryResolution.asset?.ownerKeyword ?? "";

  let action = classify({ clicks, impressions, ctr, position });
  if (ownerStatus === "owner-mismatch") action = "Review keyword ownership / cannibalization";
  else if (!asset && pagePath.startsWith("/blog/")) action = "Review unmapped article URL";

  const priority = priorityForAction(action);
  const subject = page || query || "Unknown";

  return {
    priority,
    subject,
    page,
    pagePath,
    query,
    clicks,
    impressions,
    ctr,
    position,
    action,
    system,
    nodeType,
    module: moduleId,
    stage,
    ownerKeyword,
    ownerStatus,
    expectedOwnerHref,
    mappingSource: mappingSource || (inferred ? "site-path" : "unmapped"),
  };
}).filter((record) => record.subject);

const priorityWeight = { P0: 3, P1: 2, P2: 1 };
const actionWeight = {
  "Review keyword ownership / cannibalization": 7,
  "Improve title and description": 6,
  "Strengthen content and internal links": 5,
  "Review unmapped article URL": 4,
  "Reassess intent or consolidate": 3,
  "Protect and expand": 2,
  Monitor: 1,
  "No Search Console signal": 0,
};
records.sort((left, right) =>
  (priorityWeight[right.priority] ?? 0) - (priorityWeight[left.priority] ?? 0)
  || (actionWeight[right.action] ?? 0) - (actionWeight[left.action] ?? 0)
  || right.impressions - left.impressions,
);

const actionSummary = new Map();
const systemSummary = new Map();
for (const record of records) {
  actionSummary.set(record.action, (actionSummary.get(record.action) ?? 0) + 1);
  systemSummary.set(record.system, (systemSummary.get(record.system) ?? 0) + 1);
}
const mappedContent = records.filter((record) => record.mappingSource === "page-url" || record.mappingSource.startsWith("owner-keyword")).length;
const ownerMismatches = records.filter((record) => record.ownerStatus === "owner-mismatch").length;
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
  `- Rows mapped to a Knowledge/Roadmap article: ${mappedContent}`,
  `- Owner mismatches requiring review: ${ownerMismatches}`,
  `- Unmapped /blog/ URLs requiring review: ${unmappedArticles}`,
  ...[...actionSummary.entries()].map(([action, count]) => `- ${action}: ${count}`),
  "",
  "## Content systems",
  "",
  ...[...systemSummary.entries()].map(([system, count]) => `- ${system}: ${count}`),
  "",
  "## Prioritized pages or queries",
  "",
  "| Priority | Page or query | Query | System | Module / roadmap | Stage | Owner keyword | Owner status | Clicks | Impressions | CTR | Position | Recommended action |",
  "|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---|",
  ...records.map((record) =>
    `| ${record.priority} | ${escapeTable(record.subject)} | ${escapeTable(record.query)} | ${escapeTable(record.system)} | ${escapeTable(record.module)} | ${escapeTable(record.stage)} | ${escapeTable(record.ownerKeyword)} | ${escapeTable(record.ownerStatus)} | ${record.clicks} | ${record.impressions} | ${record.ctr.toFixed(2)}% | ${record.position.toFixed(1)} | ${escapeTable(record.action)} |`,
  ),
  "",
  "## Interpretation boundaries",
  "",
  "This report only classifies rows from a user-supplied Search Console export; it does not fetch private Search Console data. Article mapping uses the current generated Knowledge and Beginner Roadmap registries. Query-to-Owner mapping is exact or punctuation-normalized only; it deliberately avoids fuzzy matching. An Owner mismatch is a review signal, not an automatic merge/redirect instruction. Review date range, query intent, country, device, SERP changes, and content history before modifying URLs.",
  "",
].join("\n");

const absoluteOutput = path.resolve(outputPath);
fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
fs.writeFileSync(absoluteOutput, report, "utf8");
console.log(`Search Console opportunity report written to ${absoluteOutput}`);

if (jsonOutputPath) {
  const absoluteJsonOutput = path.resolve(jsonOutputPath);
  fs.mkdirSync(path.dirname(absoluteJsonOutput), { recursive: true });
  fs.writeFileSync(
    absoluteJsonOutput,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), source: path.basename(absoluteInput), records }, null, 2)}\n`,
    "utf8",
  );
  console.log(`Search Console opportunity JSON written to ${absoluteJsonOutput}`);
}
