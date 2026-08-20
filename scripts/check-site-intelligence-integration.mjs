import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { buildSiteIntelligenceSignals } from "./lib/site-intelligence-signals.mjs";
import { buildSiteIntelligenceActionQueue } from "./lib/site-intelligence-action-queue.mjs";
import { parseGscCtr, formatGscCtr, classifyWarehouseObservation } from "./lib/site-intelligence-gsc.mjs";
import { parseGscCsv } from "./lib/site-intelligence-gsc-csv.mjs";
import { planGscHistoricalImport } from "./lib/site-intelligence-gsc-import.mjs";
import { makeDataQualityFingerprint, validateGscGrain } from "./lib/site-intelligence-foundation.mjs";

const root = process.cwd();
const assetMaster = { assets: [
  { assetId:"zh-CN:article:move", assetType:"article", language:"zh-CN", routeKind:"page", path:"/blog/move", canonicalPath:"/blog/move", slug:"move", title:"Move ZH", contentSystem:"knowledge", module:"movement", roadmap:null, stage:null, primaryKeyword:"Screeps moveTo", keywordRole:"owner", searchIntent:"zh move" },
  { assetId:"en:article:move", assetType:"article", language:"en", routeKind:"page", path:"/en/blog/move", canonicalPath:"/en/blog/move", slug:"move", title:"Move EN", contentSystem:"knowledge", module:"movement", roadmap:null, stage:null, primaryKeyword:"Screeps moveTo", keywordRole:"owner", searchIntent:"en move", languagePairAssetId:"zh-CN:article:move", languagePairPath:"/blog/move" },
] };

// Metric contract: ratio internally, percentage only at display.
assert.equal(parseGscCtr("1.2%"), 0.012);
assert.equal(formatGscCtr(0.012), "1.20%");
assert.equal(parseGscCsv("Page,Query,Clicks,Impressions,CTR,Position\nhttps://www.linqingan.com/blog/move,Screeps moveTo,1,100,1.2%,7", { requirePageQuery:true })[0].ctr, 0.012);
assert.throws(() => validateGscGrain({ device:"mobile" }), /Invalid GSC grain|device-segmented/i);

// Warehouse enum -> Signals vocabulary remains explicit.
const warehouseMismatch = classifyWarehouseObservation({ page_path:"/blog/move", query:"Screeps moveTo", clicks:2, impressions:200, ctr:0.01, position:7, owner_status:"mismatch", asset_id:"zh-CN:article:move", metadata:{} });
assert.equal(warehouseMismatch.ownerStatus, "owner-mismatch");
assert.equal(warehouseMismatch.action, "Review keyword ownership / cannibalization");

// Same facts in different order must preserve Signal and Action identities.
const facts = [
  { pagePath:"/blog/move", query:"Screeps moveTo", ownerKeyword:"Screeps moveTo", ownerStatus:"owner-match", priority:"P0", action:"Improve title and description", clicks:2, impressions:200, ctr:0.01, position:7 },
  { pagePath:"/en/blog/move", query:"Screeps moveTo", ownerKeyword:"Screeps moveTo", ownerStatus:"owner-mismatch", expectedOwnerHref:"/blog/move", priority:"P0", action:"Review keyword ownership / cannibalization", clicks:2, impressions:200, ctr:0.01, position:7 },
];
const behavior = [
  { language:"zh-CN", normalized_query:"screeps moveto", example_query:"Screeps moveTo", searches:20, zero_results:0, clicks:0 },
  { language:"zh-CN", normalized_query:"tiny", example_query:"tiny", searches:1, zero_results:1, clicks:0 },
];
function build(records) {
  const signals = buildSiteIntelligenceSignals({ assetMaster, gscRecords:records, internalSearchRows:behavior, generatedAt:"2026-08-20T00:00:00.000Z" });
  const queue = buildSiteIntelligenceActionQueue(signals, { generatedAt:"2026-08-20T00:01:00.000Z" });
  return { signals, queue };
}
const first = build(facts), second = build([...facts].reverse());
const signalIds = (snapshot) => [...snapshot.assets.flatMap((a)=>a.signals), ...snapshot.unmappedSignals].map((s)=>s.signalId).sort();
assert.deepEqual(signalIds(first.signals), signalIds(second.signals));
assert.deepEqual(first.queue.actions.map((a)=>a.actionId).sort(), second.queue.actions.map((a)=>a.actionId).sort());
const changedMetrics = build(facts.map((row, index) => index === 0 ? { ...row, clicks:9, impressions:260, ctr:0.015, position:5.5 } : row));
assert.deepEqual(first.queue.actions.map((a)=>a.actionId).sort(), changedMetrics.queue.actions.map((a)=>a.actionId).sort(), "mutable metrics must not change Action identity");
assert.ok(!first.queue.actions.some((a)=>a.category === "keyword-ownership" && a.path?.startsWith("/en/")), "cross-language pair cannot create cannibalization P0");
assert.ok(!first.queue.actions.some((a)=>a.metrics?.query === "tiny"), "one-query behavior row must remain observe-only");

// Historical importer: same fact is identity-stable; missing mapping is preserved and becomes resolvable later.
const ghostRows = [{ rowNumber:2, page:"https://www.linqingan.com/blog/ghost", query:"ghost query", clicks:0, impressions:10, ctr:0, position:20 }];
const missing = planGscHistoricalImport({ rows:ghostRows, assetMaster, periodStart:"2026-07-01", periodEnd:"2026-07-28" });
const repeated = planGscHistoricalImport({ rows:ghostRows, assetMaster, periodStart:"2026-07-01", periodEnd:"2026-07-28" });
assert.equal(missing.accepted[0].rowFingerprint, repeated.accepted[0].rowFingerprint);
assert.equal(missing.counts.rowsUnmapped, 1);
assert.equal(missing.issues[0].issueType, "missing_asset");
const missingFingerprint = makeDataQualityFingerprint({ source:"gsc", issueType:"missing_asset", entityKind:"path", entityKey:"/blog/ghost" });
assert.equal(missing.issues[0].issueFingerprint, missingFingerprint);

const mappedMaster = { assets:[...assetMaster.assets, { assetId:"zh-CN:article:ghost", assetType:"article", language:"zh-CN", routeKind:"page", path:"/blog/ghost", canonicalPath:"/blog/ghost", slug:"ghost", title:"Ghost", contentSystem:"knowledge", module:"movement", roadmap:null, stage:null, primaryKeyword:"ghost query", keywordRole:"owner", searchIntent:"ghost" }] };
const mapped = planGscHistoricalImport({ rows:ghostRows, assetMaster:mappedMaster, periodStart:"2026-07-01", periodEnd:"2026-07-28" });
assert.equal(mapped.counts.rowsUnmapped, 0);
assert.ok(mapped.resolvedIssueFingerprints.includes(missingFingerprint));

// Transaction and human-state boundaries are permanent source contracts.
const lifecycleSync = fs.readFileSync(path.join(root, "scripts", "site-intelligence-lifecycle-sync.mjs"), "utf8");
const actionUpdate = fs.readFileSync(path.join(root, "scripts", "site-intelligence-action-update.mjs"), "utf8");
assert.match(lifecycleSync, /await sql\.transaction\(queries\)/);
assert.match(actionUpdate, /await sql\.transaction\(queries\)/);
const machineUpdate = lifecycleSync.match(/UPDATE site_intelligence_actions[\s\S]*?WHERE action_id =/i)?.[0] ?? "";
assert.doesNotMatch(machineUpdate, /\bstatus\s*=/i, "machine sync must preserve human lifecycle status");
assert.match(lifecycleSync, /missing actions are not auto-closed/i);

// Runner is read-only by default and only enables writes under explicit --commit.
const runner = fs.readFileSync(path.join(root, "scripts", "site-intelligence-run.mjs"), "utf8");
assert.match(runner, /const commit = flag\("--commit"\)/);
assert.match(runner, /if \(commit\) importerArgs\.push\("--commit"\)/);
assert.match(runner, /if \(commit\) \{[\s\S]*site-intelligence-lifecycle-sync\.mjs/);
assert.match(runner, /No article, title, URL, canonical, redirect, or deployment change/i);

assert.equal(first.queue.policy.mode, "rule-based-no-composite-score");
assert.match(first.queue.policy.automationRule, /no content/i);
console.log("Site Intelligence end-to-end integration boundary passed.");
