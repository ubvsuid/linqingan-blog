import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
function argValue(name, fallback = null) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] ?? fallback : fallback; }
function flag(name) { return args.includes(name); }
function run(script, scriptArgs = []) {
  execFileSync(process.execPath, [path.join(root, script), ...scriptArgs], { cwd: root, stdio: "inherit", env: process.env });
}
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

const commit = flag("--commit");
const gscInput = argValue("--gsc-input");
const periodStart = argValue("--period-start");
const periodEnd = argValue("--period-end");
const days = argValue("--days", process.env.PLATFORM_REPORT_DAYS ?? "30");
const reportsDir = path.resolve(argValue("--reports-dir", "reports/site-intelligence-run"));
const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

if (commit && !hasDatabase) throw new Error("--commit requires DATABASE_URL.");
if (gscInput && (!periodStart || !periodEnd)) throw new Error("--gsc-input requires --period-start and --period-end.");
if (!gscInput && (periodStart || periodEnd)) throw new Error("Period arguments require --gsc-input.");
ensureDir(reportsDir);

const assetJson = path.join(reportsDir, "site-assets.json");
const assetMd = path.join(reportsDir, "site-assets.md");
const signalsJson = path.join(reportsDir, "site-intelligence-signals.json");
const signalsMd = path.join(reportsDir, "site-intelligence-signals.md");
const queueJson = path.join(reportsDir, "site-intelligence-action-queue.json");
const queueMd = path.join(reportsDir, "site-intelligence-action-queue.md");
const importPlan = path.join(reportsDir, "gsc-import-plan.json");
const compatibilityMd = path.join(reportsDir, "gsc-opportunities-preview.md");
const compatibilityJson = path.join(reportsDir, "gsc-opportunities-preview.json");

run("scripts/generate-knowledge-article-registry.mjs");
run("scripts/generate-beginner-roadmap-registry.mjs");
run("scripts/check-site-asset-master.mjs");
run("scripts/site-asset-master-report.mjs", [assetJson, assetMd]);

let importedId = null;
if (gscInput) {
  const importerArgs = ["--input", path.resolve(gscInput), "--period-start", periodStart, "--period-end", periodEnd, "--json", importPlan, "--skip-refresh"];
  if (commit) importerArgs.push("--commit");
  run("scripts/site-intelligence-gsc-import.mjs", importerArgs);
  const importResult = JSON.parse(fs.readFileSync(importPlan, "utf8"));
  importedId = importResult.importId;

  if (!commit) {
    run("scripts/search-console-opportunity-report.mjs", [path.resolve(gscInput), compatibilityMd, compatibilityJson, "--skip-refresh"]);
  }
}

const signalArgs = ["--skip-refresh", "--days", String(days), "--json", signalsJson, "--markdown", signalsMd];
if (gscInput && !commit) signalArgs.push("--gsc-source", "file", "--gsc", compatibilityJson);
else if (gscInput && commit) signalArgs.push("--gsc-source", "warehouse", "--gsc-import-id", importedId);
else signalArgs.push("--gsc-source", hasDatabase ? "warehouse" : "none");
run("scripts/site-intelligence-signals-report.mjs", signalArgs);
run("scripts/site-intelligence-action-queue-report.mjs", ["--signals", signalsJson, "--json", queueJson, "--markdown", queueMd]);

if (commit) {
  run("scripts/site-intelligence-lifecycle-sync.mjs", ["--signals", signalsJson, "--queue", queueJson, "--window-days", String(days)]);
}

if (hasDatabase) {
  run("scripts/site-intelligence-foundation-report.mjs");
  run("scripts/site-intelligence-lifecycle-report.mjs");
}

console.log("Site Intelligence end-to-end run completed.");
console.log(`Mode: ${commit ? "commit" : "preview/read-only"}`);
console.log(`Reports: ${reportsDir}`);
if (gscInput) console.log(`GSC import: ${commit ? `committed as ${importedId}` : "dry-run only"}`);
console.log("No article, title, URL, canonical, redirect, or deployment change is performed by this runner.");
