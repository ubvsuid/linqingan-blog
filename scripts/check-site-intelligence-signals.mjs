import assert from "node:assert/strict";

import { buildSiteIntelligenceSignals, behavioralSampleGate, renderSiteIntelligenceSignalsMarkdown } from "./lib/site-intelligence-signals.mjs";

const assetMaster = { assets: [
  { assetId:"zh-CN:article:moveto", assetType:"article", language:"zh-CN", path:"/blog/moveto", canonicalPath:"/blog/moveto", routeKind:"page", slug:"moveto", title:"moveTo guide", contentSystem:"knowledge", module:"movement-vision", roadmap:null, stage:"movement", primaryKeyword:"Screeps moveTo", keywordRole:"owner" },
  { assetId:"zh-CN:article:other", assetType:"article", language:"zh-CN", path:"/blog/other", canonicalPath:"/blog/other", routeKind:"page", slug:"other", title:"Other guide", contentSystem:"knowledge", module:"movement-vision", roadmap:null, stage:"movement", primaryKeyword:"Screeps fatigue", keywordRole:"owner" },
  { assetId:"en:article:moveto", assetType:"article", language:"en", path:"/en/blog/moveto", canonicalPath:"/en/blog/moveto", routeKind:"page", slug:"moveto", title:"moveTo EN", contentSystem:"knowledge", module:"movement-vision", roadmap:null, stage:"movement", primaryKeyword:"Screeps moveTo", keywordRole:"owner" },
  { assetId:"zh-CN:tool:room-diagnostics", assetType:"tool", language:"zh-CN", path:"/tools/room-diagnostics", canonicalPath:"/tools/room-diagnostics", routeKind:"page", slug:"room-diagnostics", title:"Room diagnostics", contentSystem:"utility", module:null, roadmap:null, stage:null, primaryKeyword:null, keywordRole:null },
] };

assert.equal(behavioralSampleGate(19), "observe-only");
assert.equal(behavioralSampleGate(20), "eligible-for-ranking");

const snapshot = buildSiteIntelligenceSignals({
  assetMaster,
  generatedAt:"2026-08-20T00:00:00.000Z",
  gscRecords:[
    { pagePath:"/blog/other", query:"Screeps moveTo", ownerKeyword:"Screeps moveTo", ownerStatus:"owner-mismatch", expectedOwnerHref:"/blog/moveto", priority:"P0", clicks:4, impressions:140, ctr:0.012, position:7.1, action:"Review keyword ownership / cannibalization" },
    { pagePath:"/blog/moveto", query:"Screeps moveTo", ownerKeyword:"Screeps moveTo", ownerStatus:"owner-match", priority:"P0", clicks:5, impressions:200, ctr:0.015, position:6.2, action:"Improve title and description" },
    { pagePath:"/en/blog/moveto", query:"Screeps moveTo", ownerKeyword:"Screeps moveTo", ownerStatus:"owner-mismatch", expectedOwnerHref:"/blog/moveto", priority:"P0", clicks:2, impressions:100, ctr:0.02, position:7, action:"Review keyword ownership / cannibalization" },
    { pagePath:"/blog/not-in-master", query:"unknown query", priority:"P1", action:"Review unmapped article URL" },
  ],
  internalSearchRows:[
    { language:"zh-CN", normalized_query:"screeps moveto", example_query:"Screeps moveTo", searches:20, zero_results:20, clicks:0 },
    { language:"zh-CN", normalized_query:"tiny", example_query:"tiny", searches:1, zero_results:1, clicks:0 },
  ],
  toolUsageRows:[{ tool_id:"room-diagnostics", action:"view", events:11, latest_at:"2026-08-20T00:00:00.000Z" }],
  feedbackRows:[],
  evidenceRows:[
    { article_slug:"moveto", verification_type:"live", status:"accepted", evidence:2, latest_at:"2026-08-19T00:00:00.000Z" },
    { article_slug:"moveto", verification_type:"console", status:"rejected", evidence:1, latest_at:"2026-08-18T00:00:00.000Z" },
  ],
});

assert.equal(snapshot.schemaVersion, 2);
assert.equal(snapshot.sourceSummary.internalSearchGate, "eligible-for-ranking");
assert.equal(snapshot.sourceSummary.toolUsageGate, "observe-only");
const moveTo = snapshot.assets.find((asset)=>asset.assetId === "zh-CN:article:moveto");
const other = snapshot.assets.find((asset)=>asset.assetId === "zh-CN:article:other");
const en = snapshot.assets.find((asset)=>asset.assetId === "en:article:moveto");
assert.equal(moveTo.signals.filter((item)=>item.source === "runtime-evidence").length, 2);
assert.equal(moveTo.signals.find((item)=>item.kind === "internal-search-zero-result")?.rankingEligible, true);
assert.ok(!snapshot.assets.flatMap((asset)=>asset.signals).some((item)=>item.payload?.query === "tiny" && item.rankingEligible), "low row sample must remain observe-only");
assert.equal(other.signals.find((item)=>item.kind === "gsc-owner-mismatch")?.relatedAssetId, "zh-CN:article:moveto");
assert.ok(!en.signals.some((item)=>item.kind === "gsc-owner-mismatch"), "English page cannot inherit Chinese expected Owner mismatch");
assert.equal(snapshot.coverage.unmappedSignals, 2);
assert.ok(snapshot.unmappedSignals.some((item)=>item.kind === "gsc-unmapped-article"));
assert.ok(snapshot.assets.flatMap((a)=>a.signals).every((s)=>s.signalId.startsWith("sig:")));
const markdown = renderSiteIntelligenceSignalsMarkdown(snapshot);
assert.match(markdown, /semantic/i);
assert.match(markdown, /Unmapped signals retained for review: 2/);
console.log("Site Intelligence Signals V2 validation passed.");
