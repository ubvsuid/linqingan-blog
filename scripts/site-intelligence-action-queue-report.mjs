import fs from "node:fs";
import path from "node:path";

import { buildSiteIntelligenceActionQueue, renderSiteIntelligenceActionQueueMarkdown } from "./lib/site-intelligence-action-queue.mjs";

const args = process.argv.slice(2);
function argValue(name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

const signalsInput = argValue("--signals");
if (!signalsInput) {
  console.error("Usage: node scripts/site-intelligence-action-queue-report.mjs --signals <site-intelligence-signals.json> [--json output.json] [--markdown output.md] [--limit 50]");
  process.exit(1);
}

const absoluteInput = path.resolve(signalsInput);
const snapshot = JSON.parse(fs.readFileSync(absoluteInput, "utf8"));
const limit = Math.max(1, Math.min(500, Number.parseInt(argValue("--limit", "50"), 10) || 50));
const queue = buildSiteIntelligenceActionQueue(snapshot, { limit });
const jsonOutput = path.resolve(argValue("--json", "reports/site-intelligence-action-queue.json"));
const markdownOutput = path.resolve(argValue("--markdown", "reports/site-intelligence-action-queue.md"));

const output = {
  ...queue,
  inputs: {
    signals: path.basename(absoluteInput),
  },
};

fs.mkdirSync(path.dirname(jsonOutput), { recursive: true });
fs.mkdirSync(path.dirname(markdownOutput), { recursive: true });
fs.writeFileSync(jsonOutput, `${JSON.stringify(output, null, 2)}\n`, "utf8");
fs.writeFileSync(markdownOutput, renderSiteIntelligenceActionQueueMarkdown(output), "utf8");

console.log("Site Intelligence Action Queue generated.");
console.log(`Actions: ${output.summary.actions}`);
console.log(`P0/P1/P2: ${output.summary.P0}/${output.summary.P1}/${output.summary.P2}`);
console.log(`Assets represented: ${output.summary.assetsRepresented}`);
console.log(`JSON: ${jsonOutput}`);
console.log(`Markdown: ${markdownOutput}`);
