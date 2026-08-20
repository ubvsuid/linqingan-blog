import assert from "node:assert/strict";

import { buildSiteIntelligenceSignals, behavioralSampleGate, renderSiteIntelligenceSignalsMarkdown } from "./lib/site-intelligence-signals.mjs";

const assetMaster = {
  assets: [
    {
      assetId: "zh-CN:article:moveto",
      assetType: "article",
      language: "zh-CN",
      path: "/blog/moveto",
      canonicalPath: "/blog/moveto",
      routeKind: "page",
      slug: "moveto",
      title: "moveTo guide",
      contentSystem: "knowledge",
      module: "movement-vision",
      roadmap: null,
      stage: "movement",
      primaryKeyword: "Screeps moveTo",
      keywordRole: "owner",
    },
    {
      assetId: "zh-CN:article:other",
      assetType: "article",
      language: "zh-CN",
      path: "/blog/other",
      canonicalPath: "/blog/other",
      routeKind: "page",
      slug: "other",
      title: "Other guide",
      contentSystem: "knowledge",
      module: "movement-vision",
      roadmap: null,
      stage: "movement",
      primaryKeyword: "Screeps fatigue",
      keywordRole: "owner",
    },
    {
      assetId: "zh-CN:tool:room-diagnostics",
      assetType: "tool",
      language: "zh-CN",
      path: "/tools/room-diagnostics",
      canonicalPath: "/tools/room-diagnostics",
      routeKind: "page",
      slug: "room-diagnostics",
      title: "Room diagnostics",
      contentSystem: "utility",
      module: null,
      roadmap: null,
      stage: null,
      primaryKeyword: null,
      keywordRole: null,
    },
  ],
};

assert.equal(behavioralSampleGate(19), "observe-only");
assert.equal(behavioralSampleGate(20), "eligible-for-ranking");

const snapshot = buildSiteIntelligenceSignals({
  assetMaster,
  generatedAt: "2026-08-20T00:00:00.000Z",
  gscRecords: [
    {
      pagePath: "/blog/other",
      query: "Screeps moveTo",
      ownerKeyword: "Screeps moveTo",
      ownerStatus: "owner-mismatch",
      expectedOwnerHref: "/blog/moveto",
      priority: "P0",
      clicks: 4,
      impressions: 140,
      ctr: 1.2,
      position: 7.1,
      action: "Review keyword ownership / cannibalization",
    },
    {
      pagePath: "/blog/moveto",
      query: "Screeps moveTo",
      ownerKeyword: "Screeps moveTo",
      ownerStatus: "owner-match",
      priority: "P0",
      clicks: 5,
      impressions: 200,
      ctr: 1.5,
      position: 6.2,
      action: "Improve title and description",
    },
    {
      pagePath: "/blog/not-in-master",
      query: "unknown query",
      priority: "P1",
      action: "Review unmapped article URL",
    },
  ],
  internalSearchRows: [
    { normalized_query: "screeps moveto", example_query: "Screeps moveTo", searches: 5, zero_results: 5, clicks: 0 },
  ],
  toolUsageRows: [
    { tool_id: "room-diagnostics", action: "view", events: 11, latest_at: "2026-08-20T00:00:00.000Z" },
  ],
  feedbackRows: [],
  evidenceRows: [
    { article_slug: "moveto", verification_type: "live", status: "accepted", evidence: 2, latest_at: "2026-08-19T00:00:00.000Z" },
    { article_slug: "moveto", verification_type: "console", status: "rejected", evidence: 1, latest_at: "2026-08-18T00:00:00.000Z" },
  ],
});

assert.equal(snapshot.sourceSummary.internalSearches, 5);
assert.equal(snapshot.sourceSummary.internalSearchGate, "observe-only");
assert.equal(snapshot.sourceSummary.toolEvents, 11);
assert.equal(snapshot.sourceSummary.toolUsageGate, "observe-only");
assert.equal(snapshot.sourceSummary.evidenceRows, 3);
assert.equal(snapshot.coverage.unmappedSignals, 1);

const moveTo = snapshot.assets.find((asset) => asset.assetId === "zh-CN:article:moveto");
const other = snapshot.assets.find((asset) => asset.assetId === "zh-CN:article:other");
const tool = snapshot.assets.find((asset) => asset.assetId === "zh-CN:tool:room-diagnostics");

assert.ok(moveTo);
assert.ok(other);
assert.ok(tool);
assert.equal(moveTo.signals.filter((item) => item.source === "runtime-evidence").length, 2);
assert.equal(moveTo.signals.find((item) => item.kind === "internal-search-zero-result")?.sampleGate, "observe-only");
assert.equal(moveTo.signals.find((item) => item.kind === "internal-search-zero-result")?.rankingEligible, false);
assert.equal(other.signals.find((item) => item.kind === "gsc-owner-mismatch")?.relatedAssetId, "zh-CN:article:moveto");
assert.equal(tool.signals.find((item) => item.kind === "tool-view")?.rankingEligible, false);
assert.equal(snapshot.unmappedSignals[0].kind, "gsc-unmapped-article");

const markdown = renderSiteIntelligenceSignalsMarkdown(snapshot);
assert.match(markdown, /Behavioral minimum for ranking: 20/);
assert.match(markdown, /Unmapped signals retained for review: 1/);
assert.match(markdown, /observe-only/);

console.log("Site Intelligence Signals validation passed.");
console.log(`Assets: ${snapshot.coverage.totalAssets}`);
console.log(`Assets with signals: ${snapshot.coverage.assetsWithSignals}`);
console.log(`Unmapped signals: ${snapshot.coverage.unmappedSignals}`);
