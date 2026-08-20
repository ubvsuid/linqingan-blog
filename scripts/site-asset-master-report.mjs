import fs from "node:fs";
import path from "node:path";

import { buildSiteAssetMaster } from "./lib/site-asset-master.mjs";

const root = process.cwd();
const jsonOutput = process.argv[2] ? path.resolve(process.argv[2]) : null;
const markdownOutput = process.argv[3] ? path.resolve(process.argv[3]) : null;
const master = buildSiteAssetMaster(root);

const typeCounts = Object.fromEntries(
  [...new Set(master.assets.map((asset) => asset.assetType))]
    .sort()
    .map((type) => [type, master.assets.filter((asset) => asset.assetType === type).length]),
);
const systemCounts = Object.fromEntries(
  [...new Set(master.assets.map((asset) => asset.contentSystem))]
    .sort()
    .map((system) => [system, master.assets.filter((asset) => asset.contentSystem === system).length]),
);

const payload = {
  schemaVersion: master.schemaVersion,
  generatedAt: new Date().toISOString(),
  generatedFrom: master.generatedFrom,
  summary: {
    assets: master.assets.length,
    byType: typeCounts,
    bySystem: systemCounts,
  },
  assets: master.assets,
};

const markdown = [
  "# Linqingan Site Asset Master",
  "",
  `- Schema version: ${master.schemaVersion}`,
  `- Total assets: ${master.assets.length}`,
  `- Article assets: ${typeCounts.article ?? 0}`,
  `- Tool assets: ${typeCounts.tool ?? 0}`,
  `- Diagnostic nodes: ${typeCounts.diagnostic ?? 0}`,
  `- API Hub assets: ${typeCounts["api-hub"] ?? 0}`,
  "",
  "## Asset types",
  "",
  "| Type | Count |",
  "| --- | ---: |",
  ...Object.entries(typeCounts).map(([type, count]) => `| ${type} | ${count} |`),
  "",
  "## Content systems",
  "",
  "| System | Count |",
  "| --- | ---: |",
  ...Object.entries(systemCounts).map(([system, count]) => `| ${system} | ${count} |`),
  "",
  "## Decision-layer status",
  "",
  "This foundation intentionally leaves health and opportunity values as `not-scored` / `null`. GSC, internal-search, verification and behavior signals are joined in later decision-layer work rather than guessed from sparse data.",
  "",
].join("\n");

if (jsonOutput) {
  fs.mkdirSync(path.dirname(jsonOutput), { recursive: true });
  fs.writeFileSync(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
if (markdownOutput) {
  fs.mkdirSync(path.dirname(markdownOutput), { recursive: true });
  fs.writeFileSync(markdownOutput, markdown, "utf8");
}

if (!jsonOutput && !markdownOutput) process.stdout.write(markdown);
else console.log(`Site Asset Master report generated: ${master.assets.length} assets`);
