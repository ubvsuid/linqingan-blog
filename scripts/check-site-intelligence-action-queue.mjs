import assert from "node:assert/strict";

import { buildSiteIntelligenceActionQueue, renderSiteIntelligenceActionQueueMarkdown } from "./lib/site-intelligence-action-queue.mjs";

function sig(overrides) {
  return {
    signalId: "signal:base",
    source: "gsc",
    kind: "gsc-monitor",
    assetId: "zh-CN:article:a",
    relatedAssetId: null,
    sampleGate: "report-classified",
    rankingEligible: false,
    observedAt: null,
    payload: {},
    ...overrides,
  };
}

const snapshot = {
  generatedAt: "2026-08-20T00:00:00.000Z",
  policy: {
    behavioralRule: "Below 20 observations per source, behavioral signals are observe-only and cannot independently rank an asset.",
  },
  assets: [
    {
      assetId: "zh-CN:article:a",
      assetType: "article",
      path: "/blog/a",
      title: "A",
      signals: [
        sig({
          signalId: "gsc:mismatch",
          kind: "gsc-owner-mismatch",
          relatedAssetId: "zh-CN:article:b",
          rankingEligible: true,
          payload: { priority: "P0", pagePath: "/blog/a", expectedOwnerHref: "/blog/b", query: "Screeps moveTo", impressions: 140, ctr: 1.2, position: 7.1 },
        }),
        sig({
          signalId: "search:low-sample",
          source: "internal-search",
          kind: "internal-search-zero-result",
          sampleGate: "observe-only",
          rankingEligible: false,
          payload: { query: "Screeps moveTo", searches: 5, zeroResults: 5, clicks: 0 },
        }),
        sig({
          signalId: "evidence:accepted",
          source: "runtime-evidence",
          kind: "runtime-evidence-accepted",
          sampleGate: "direct-evidence",
          rankingEligible: false,
          payload: { status: "accepted", evidence: 2 },
        }),
        sig({
          signalId: "evidence:rejected",
          source: "runtime-evidence",
          kind: "runtime-evidence-rejected",
          sampleGate: "direct-evidence",
          rankingEligible: false,
          payload: { status: "rejected", evidence: 1 },
        }),
      ],
    },
    {
      assetId: "zh-CN:article:b",
      assetType: "article",
      path: "/blog/b",
      title: "B",
      signals: [
        sig({
          signalId: "gsc:intent",
          assetId: "zh-CN:article:b",
          kind: "gsc-intent-review",
          rankingEligible: true,
          payload: { priority: "P1", query: "B query", impressions: 45, position: 33 },
        }),
        sig({
          signalId: "search:mature",
          source: "internal-search",
          assetId: "zh-CN:article:b",
          kind: "internal-search-no-click",
          sampleGate: "eligible-for-ranking",
          rankingEligible: true,
          payload: { query: "B query", searches: 28, zeroResults: 0, clicks: 0 },
        }),
      ],
    },
    {
      assetId: "zh-CN:tool:calc",
      assetType: "tool",
      path: "/tools/calc",
      title: "Calc",
      signals: [
        sig({ signalId: "tool:view", source: "tool-usage", assetId: "zh-CN:tool:calc", kind: "tool-view", sampleGate: "eligible-for-ranking", rankingEligible: true, payload: { action: "view", events: 30 } }),
        sig({ signalId: "tool:use", source: "tool-usage", assetId: "zh-CN:tool:calc", kind: "tool-use", sampleGate: "eligible-for-ranking", rankingEligible: true, payload: { action: "use", events: 1 } }),
      ],
    },
  ],
  unmappedSignals: [
    sig({ signalId: "gsc:unmapped", assetId: null, kind: "gsc-unmapped-article", payload: { priority: "P1", pagePath: "/blog/ghost", query: "ghost" } }),
    sig({ signalId: "search:unowned-low", source: "internal-search", assetId: null, kind: "internal-search-zero-result", sampleGate: "observe-only", payload: { query: "tiny", searches: 5 } }),
    sig({ signalId: "search:unowned-mature", source: "internal-search", assetId: null, kind: "internal-search-zero-result", sampleGate: "eligible-for-ranking", payload: { query: "new concept", searches: 25 } }),
  ],
};

const queue = buildSiteIntelligenceActionQueue(snapshot);
assert.ok(queue.actions.length >= 6);
assert.equal(queue.actions[0].priority, "P0");
assert.equal(queue.actions[0].category, "keyword-ownership");
assert.ok(queue.actions.some((row) => row.action === "Resolve conflicting Runtime Evidence" && row.priority === "P1"));
assert.ok(!queue.actions.some((row) => row.sourceSignalIds.includes("search:low-sample")));
assert.ok(queue.actions.some((row) => row.action === "Review owned internal-search ranking and result snippet" && row.priority === "P1"));
assert.ok(queue.actions.some((row) => row.action === "Review tool activation path and task clarity"));
assert.ok(queue.actions.some((row) => row.action === "Review unmapped GSC article URL"));
assert.ok(queue.actions.some((row) => row.action === "Research an unowned internal-search vocabulary or content gap"));
assert.ok(!queue.actions.some((row) => row.sourceSignalIds.includes("search:unowned-low")));
assert.ok(queue.actions.every((row) => row.sourceSignalIds.length > 0));
assert.equal(queue.policy.mode, "rule-based-no-composite-score");

const markdown = renderSiteIntelligenceActionQueueMarkdown(queue);
assert.match(markdown, /P0 is reserved|P0:/);
assert.match(markdown, /rule-based operating queue/);
assert.match(markdown, /Review keyword ownership/);

console.log("Site Intelligence Action Queue validation passed.");
console.log(`Actions: ${queue.summary.actions}`);
console.log(`P0/P1/P2: ${queue.summary.P0}/${queue.summary.P1}/${queue.summary.P2}`);
