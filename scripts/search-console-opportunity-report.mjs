import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? "reports/search-console-opportunities.md";

if (!inputPath) {
  console.error("Usage: npm run searchconsole:report -- <search-console.csv> [output.md]");
  process.exit(1);
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
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
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

const absoluteInput = path.resolve(inputPath);
const rows = parseCsv(fs.readFileSync(absoluteInput, "utf8"));
if (rows.length < 2) throw new Error("The Search Console CSV does not contain data rows.");

const headers = rows[0].map(normalizeHeader);
const indexOf = (...names) => names.map(normalizeHeader).map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
const queryIndex = indexOf("Top queries", "Query");
const pageIndex = indexOf("Top pages", "Page", "Landing page");
const clicksIndex = indexOf("Clicks");
const impressionsIndex = indexOf("Impressions");
const ctrIndex = indexOf("CTR");
const positionIndex = indexOf("Position", "Average position");

if (clicksIndex < 0 || impressionsIndex < 0 || ctrIndex < 0 || positionIndex < 0) {
  throw new Error("Required columns were not found. Export Clicks, Impressions, CTR, and Position from Google Search Console.");
}

const records = rows.slice(1).map((row) => {
  const clicks = number(row[clicksIndex]);
  const impressions = number(row[impressionsIndex]);
  const ctr = number(row[ctrIndex]);
  const position = number(row[positionIndex]);
  const subject = String(row[pageIndex >= 0 ? pageIndex : queryIndex] ?? "Unknown").trim();
  return {
    subject,
    query: queryIndex >= 0 ? String(row[queryIndex] ?? "").trim() : "",
    clicks,
    impressions,
    ctr,
    position,
    action: classify({ clicks, impressions, ctr, position }),
  };
}).filter((record) => record.subject);

records.sort((left, right) => {
  const actionWeight = {
    "Improve title and description": 5,
    "Strengthen content and internal links": 4,
    "Reassess intent or consolidate": 3,
    "Protect and expand": 2,
    Monitor: 1,
    "No Search Console signal": 0,
  };
  return (actionWeight[right.action] ?? 0) - (actionWeight[left.action] ?? 0)
    || right.impressions - left.impressions;
});

function escapeTable(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

const summary = new Map();
for (const record of records) summary.set(record.action, (summary.get(record.action) ?? 0) + 1);

const report = [
  "# Google Search Console opportunity report",
  "",
  `Source: \`${path.basename(absoluteInput)}\``,
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  ...[...summary.entries()].map(([action, count]) => `- ${action}: ${count}`),
  "",
  "## Prioritized pages or queries",
  "",
  "| Page or query | Query | Clicks | Impressions | CTR | Position | Recommended action |",
  "|---|---|---:|---:|---:|---:|---|",
  ...records.map((record) => `| ${escapeTable(record.subject)} | ${escapeTable(record.query)} | ${record.clicks} | ${record.impressions} | ${record.ctr.toFixed(2)}% | ${record.position.toFixed(1)} | ${record.action} |`),
  "",
  "## Interpretation boundaries",
  "",
  "This report classifies exported Search Console rows; it does not fetch private Search Console data. Review query intent, date range, country, device, and page changes before merging, deleting, or redirecting content.",
  "",
].join("\n");

const absoluteOutput = path.resolve(outputPath);
fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
fs.writeFileSync(absoluteOutput, report, "utf8");
console.log(`Search Console opportunity report written to ${absoluteOutput}`);
