import fs from "node:fs";
import path from "node:path";

import { buildSiteAssetMaster } from "./lib/site-asset-master.mjs";

const root = process.cwd();
const jsonOutput = process.argv[2] ? path.resolve(process.argv[2]) : null;
const markdownOutput = process.argv[3] ? path.resolve(process.argv[3]) : null;
const master = buildSiteAssetMaster(root);

const countBy = (key) => Object.fromEntries([...new Set(master.assets.map((asset) => asset[key]))].sort().map((value) => [value, master.assets.filter((asset) => asset[key] === value).length]));
const typeCounts = countBy("assetType");
const systemCounts = countBy("contentSystem");
const languageCounts = countBy("language");
const pairedEnglish = master.assets.filter((asset) => asset.assetType === "article" && asset.language === "en" && asset.languagePairAssetId).length;

const payload = {
  schemaVersion: master.schemaVersion,
  generatedAt: new Date().toISOString(),
  generatedFrom: master.generatedFrom,
  coverage: master.coverage ?? {},
  summary: { assets: master.assets.length, byType: typeCounts, bySystem: systemCounts, byLanguage: languageCounts, pairedEnglishArticles: pairedEnglish },
  assets: master.assets,
};

const markdown = [
  "# Linqingan Site Asset Master",
  "",
  `- Schema version: ${master.schemaVersion}`,
  `- Total assets: ${master.assets.length}`,
  `- Chinese assets: ${languageCounts["zh-CN"] ?? 0}`,
  `- English assets: ${languageCounts.en ?? 0}`,
  `- English article pairs: ${pairedEnglish}`,
  `- Error fragments: ${typeCounts["error-code"] ?? 0}`,
  `- Glossary fragments: ${typeCounts["glossary-term"] ?? 0}`,
  "",
  "## Languages",
  "",
  "| Language | Count |",
  "| --- | ---: |",
  ...Object.entries(languageCounts).map(([language, count]) => `| ${language} | ${count} |`),
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
  "The Asset Master is an identity/composition layer. It does not invent SEO scores. English Owner assets remain language-scoped, and Error/Glossary items are fragment assets under their canonical hub pages.",
  "",
].join("\n");

if (jsonOutput) { fs.mkdirSync(path.dirname(jsonOutput), { recursive: true }); fs.writeFileSync(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`, "utf8"); }
if (markdownOutput) { fs.mkdirSync(path.dirname(markdownOutput), { recursive: true }); fs.writeFileSync(markdownOutput, markdown, "utf8"); }
if (!jsonOutput && !markdownOutput) process.stdout.write(markdown);
else console.log(`Site Asset Master report generated: ${master.assets.length} assets`);
