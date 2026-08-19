import { loadContentAssetIndex } from "./lib/content-asset-index.mjs";
import { buildPlatformSearchAnalysis, renderPlatformSearchMarkdown } from "./lib/platform-search-opportunities.mjs";

const assetIndex = loadContentAssetIndex(process.cwd());
const analysis = buildPlatformSearchAnalysis({
  summary: {
    total_queries: 12,
    zero_result_queries: 4,
    clicked_queries: 5,
  },
  topSearches: [
    { normalized_query: "screeps memory", example_query: "Screeps Memory", searches: 5, zero_results: 2, avg_results: 3.2 },
    { normalized_query: "remote mining", example_query: "remote mining", searches: 3, zero_results: 3, avg_results: 0 },
  ],
  zeroResults: [
    { normalized_query: "screeps memory", example_query: "Screeps Memory", searches: 2 },
    { normalized_query: "remote mining", example_query: "remote mining", searches: 3 },
  ],
  noClickQueries: [
    { normalized_query: "screeps spawncreep return codes", example_query: "Screeps spawnCreep return codes", searches: 4 },
    { normalized_query: "tower calculator", example_query: "tower calculator", searches: 2 },
  ],
  topClicked: [
    { result_href: "/blog/screeps-memory-basics", result_type: "article", clicks: 7, avg_position: 1.4 },
    { result_href: "/tools/creep-body-calculator", result_type: "tool", clicks: 5, avg_position: 2.1 },
    { result_href: "/diagnostics/creep-not-moving", result_type: "diagnostic", clicks: 3, avg_position: 2.8 },
  ],
  assetIndex,
});

if (analysis.summary.totalQueries !== 12 || analysis.summary.zeroResultQueries !== 4) {
  throw new Error("Platform Search summary normalization failed");
}

const ownedZero = analysis.zeroResultActions.find((row) => row.query === "Screeps Memory");
if (!ownedZero || ownedZero.priority !== "P0" || ownedZero.module !== "memory-engineering") {
  throw new Error("Owned zero-result query was not mapped to Memory / P0");
}
if (ownedZero.action !== "Fix search alias / indexing for owned concept") {
  throw new Error(`Unexpected owned zero-result action: ${ownedZero.action}`);
}

const gap = analysis.zeroResultActions.find((row) => row.query === "remote mining");
if (!gap || gap.priority !== "P1" || gap.ownerKeyword !== "") {
  throw new Error("Unowned zero-result query was not kept as a research gap");
}
if (gap.action !== "Research content or search vocabulary gap") {
  throw new Error(`Unexpected gap action: ${gap.action}`);
}

const ownedNoClick = analysis.noClickActions.find((row) => row.query === "Screeps spawnCreep return codes");
if (!ownedNoClick || ownedNoClick.priority !== "P1" || ownedNoClick.module !== "spawn-lifecycle") {
  throw new Error("Owned no-click query was not mapped to the Spawn module");
}

const articleClick = analysis.topClicked.find((row) => row.href === "/blog/screeps-memory-basics");
if (!articleClick || articleClick.system !== "knowledge" || articleClick.ownerKeyword !== "Screeps Memory") {
  throw new Error("Clicked article asset mapping failed");
}
const toolClick = analysis.topClicked.find((row) => row.href === "/tools/creep-body-calculator");
if (!toolClick || toolClick.system !== "utility" || toolClick.nodeType !== "tool") {
  throw new Error("Clicked Tool path inference failed");
}
const diagnosticClick = analysis.topClicked.find((row) => row.href === "/diagnostics/creep-not-moving");
if (!diagnosticClick || diagnosticClick.system !== "diagnostics" || diagnosticClick.nodeType !== "diagnostic") {
  throw new Error("Clicked Diagnostic path inference failed");
}

if (analysis.actionQueue[0]?.priority !== "P0") {
  throw new Error("Action queue priority ordering failed");
}

const markdown = renderPlatformSearchMarkdown(analysis, { days: 30, generatedAt: "2026-08-19T00:00:00.000Z" });
for (const expected of [
  "Fix search alias / indexing for owned concept",
  "Research content or search vocabulary gap",
  "memory-engineering",
  "/tools/creep-body-calculator",
]) {
  if (!markdown.includes(expected)) throw new Error(`Markdown report is missing ${expected}`);
}

console.log("Platform Search opportunity check passed: owned zero-result, unowned gap, no-click and clicked asset mappings verified.");
