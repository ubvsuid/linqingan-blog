import assert from "node:assert/strict";

import { buildSiteIntelligenceSignals } from "./lib/site-intelligence-signals.mjs";
import { buildSiteIntelligenceActionQueue, renderSiteIntelligenceActionQueueMarkdown } from "./lib/site-intelligence-action-queue.mjs";

const assetMaster = { assets: [
  { assetId:"zh-CN:article:move", assetType:"article", language:"zh-CN", routeKind:"page", path:"/blog/move", canonicalPath:"/blog/move", slug:"move", title:"Move ZH", contentSystem:"knowledge", module:"movement", roadmap:null, stage:null, primaryKeyword:"Screeps moveTo", keywordRole:"owner" },
  { assetId:"en:article:move", assetType:"article", language:"en", routeKind:"page", path:"/en/blog/move", canonicalPath:"/en/blog/move", slug:"move", title:"Move EN", contentSystem:"knowledge", module:"movement", roadmap:null, stage:null, primaryKeyword:"Screeps moveTo", keywordRole:"owner" },
  { assetId:"zh-CN:tool:calc", assetType:"tool", language:"zh-CN", routeKind:"page", path:"/tools/calc", canonicalPath:"/tools/calc", slug:"calc", title:"Calc", contentSystem:"utility", module:null, roadmap:null, stage:null, primaryKeyword:null, keywordRole:null },
] };

const gsc = [
  { pagePath:"/blog/move", query:"Screeps moveTo", ownerKeyword:"Screeps moveTo", ownerStatus:"owner-match", priority:"P0", action:"Improve title and description", clicks:2, impressions:200, ctr:0.01, position:6.5 },
  { pagePath:"/en/blog/move", query:"Screeps moveTo", ownerKeyword:"Screeps moveTo", ownerStatus:"owner-mismatch", expectedOwnerHref:"/blog/move", priority:"P0", action:"Review keyword ownership / cannibalization", clicks:1, impressions:150, ctr:0.008, position:7.0 },
];
const searchRows = [
  { language:"zh-CN", normalized_query:"screeps moveto", example_query:"Screeps moveTo", searches:25, zero_results:0, clicks:0 },
  { language:"zh-CN", normalized_query:"tiny", example_query:"tiny", searches:1, zero_results:1, clicks:0 },
];
const toolRows = [
  { language:"zh-CN", tool_id:"calc", action:"view", events:30 },
  { language:"zh-CN", tool_id:"calc", action:"use", events:1 },
];
const evidenceRows = [
  { language:"zh-CN", article_slug:"move", verification_type:"live", status:"accepted", evidence:2 },
  { language:"zh-CN", article_slug:"move", verification_type:"console", status:"rejected", evidence:1 },
];

function build(records) {
  const signals = buildSiteIntelligenceSignals({ assetMaster, gscRecords:records, internalSearchRows:searchRows, toolUsageRows:toolRows, evidenceRows, generatedAt:"2026-08-20T00:00:00.000Z" });
  return buildSiteIntelligenceActionQueue(signals, { generatedAt:"2026-08-20T00:01:00.000Z" });
}
const first = build(gsc);
const second = build([...gsc].reverse());
assert.deepEqual(first.actions.map((row)=>row.actionId).sort(), second.actions.map((row)=>row.actionId).sort(), "Action IDs must be stable across GSC input ordering");
assert.ok(first.actions.every((row)=>row.actionId.startsWith("act:")));
assert.ok(first.actions.some((row)=>row.category === "serp-snippet" && row.priority === "P0"));
assert.ok(!first.actions.some((row)=>row.category === "keyword-ownership" && row.path?.startsWith("/en/")), "Cross-language page must not produce cannibalization P0");
assert.ok(first.actions.some((row)=>row.category === "internal-search" && row.metrics.searches === 25));
assert.ok(!first.actions.some((row)=>row.metrics?.query === "tiny"), "One-query sample must stay observe-only even when source total is mature");
assert.ok(first.actions.some((row)=>row.category === "evidence-conflict"));
assert.ok(first.actions.some((row)=>row.category === "tool-activation"));
assert.equal(first.policy.mode, "rule-based-no-composite-score");
assert.match(first.policy.identityRule, /semantic/i);
const markdown = renderSiteIntelligenceActionQueueMarkdown(first);
assert.match(markdown, /1\.00%/);
assert.match(markdown, /semantic/i);
console.log("Site Intelligence Action Queue V2 validation passed.");
console.log(`Actions: ${first.summary.actions}`);
console.log(`P0/P1/P2: ${first.summary.P0}/${first.summary.P1}/${first.summary.P2}`);
