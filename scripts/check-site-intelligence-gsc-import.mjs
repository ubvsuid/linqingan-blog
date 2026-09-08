import assert from "node:assert/strict";

import { buildSiteAssetMaster } from "./lib/site-asset-master.mjs";
import { loadSiteIntelligenceKeywordOwnership } from "./lib/site-intelligence-keyword-ownership.mjs";
import { planGscHistoricalImport } from "./lib/site-intelligence-gsc-import.mjs";

const assetMaster = { assets: [
  { assetId:"zh-CN:article:a",assetType:"article",language:"zh-CN",path:"/blog/a",routeKind:"page",slug:"a",primaryKeyword:"Screeps A",keywordRole:"owner" },
  { assetId:"en:article:a",assetType:"article",language:"en",path:"/en/blog/a",routeKind:"page",slug:"a",primaryKeyword:"Screeps A",keywordRole:"owner" },
] };
const rows = [
  { rowNumber:2,page:"https://www.linqingan.com/blog/a",query:"Screeps A",clicks:5,impressions:100,ctr:0.05,position:4 },
  { rowNumber:3,page:"https://www.linqingan.com/en/blog/a",query:"Screeps A",clicks:3,impressions:100,ctr:0.03,position:5 },
  { rowNumber:4,page:"https://www.linqingan.com/blog/ghost",query:"ghost",clicks:0,impressions:10,ctr:0,position:20 },
  { rowNumber:5,page:"",query:"bad",clicks:0,impressions:1,ctr:0,position:10 },
];
const plan = planGscHistoricalImport({ rows, assetMaster, periodStart:"2026-07-01", periodEnd:"2026-07-28" });
assert.deepEqual(plan.counts,{rowsReceived:4,rowsAccepted:3,rowsRejected:1,rowsUnmapped:1});
assert.equal(plan.accepted[0].ownerStatus,"matched");
assert.equal(plan.accepted[1].assetId,"en:article:a");
assert.equal(plan.accepted[1].ownerAssetId,"en:article:a");
assert.equal(plan.accepted[2].ownerStatus,"unmapped");
assert.equal(plan.issues.filter((x)=>x.issueType==="missing_asset").length,1);
assert.equal(plan.issues.filter((x)=>x.issueType==="invalid_row").length,1);
assert.equal(plan.relationships.length,2);
assert.equal(plan.issues.filter((x)=>x.issueType==="unknown_keyword_owner").length,1);
assert.equal(plan.resolvedIssueFingerprints.length,4);
assert.notEqual(plan.accepted[0].rowFingerprint,plan.accepted[1].rowFingerprint);

const root = process.cwd();
const currentAssetMaster = buildSiteAssetMaster(root);
const registry = loadSiteIntelligenceKeywordOwnership(root);
const batchId = "gsc-owner-batch-01-20260908";
const batchOwners = registry.owners.filter((record) => record.batchId === batchId);
const batchExclusions = registry.exclusions.filter((record) => record.batchId === batchId);
assert.equal(batchOwners.length, 26);
assert.equal(batchExclusions.length, 11);

const byId = new Map(currentAssetMaster.assets.map((asset) => [asset.assetId, asset]));
const ownerRows = batchOwners.map((record, index) => {
  const asset = byId.get(record.ownerAssetId);
  assert.ok(asset, `Missing owner asset ${record.ownerAssetId}`);
  return { rowNumber:index+2,page:`https://www.linqingan.com${asset.path}`,query:record.query,clicks:0,impressions:1,ctr:0,position:10 };
});
const ownerPlan = planGscHistoricalImport({ rows:ownerRows,assetMaster:currentAssetMaster,keywordOwnership:registry,periodStart:"2026-07-10",periodEnd:"2026-09-03" });
assert.equal(ownerPlan.counts.rowsAccepted,26);
assert.equal(ownerPlan.counts.rowsRejected,0);
assert.equal(ownerPlan.counts.rowsUnmapped,0);
assert.equal(ownerPlan.accepted.filter((row)=>row.ownerStatus==="matched").length,26);
assert.equal(ownerPlan.accepted.filter((row)=>row.metadata.ownerResolutionSource==="owner-query-curated").length,26);
assert.equal(ownerPlan.accepted.filter((row)=>row.metadata.ownerDecisionBatch===batchId).length,26);
assert.equal(ownerPlan.issues.filter((issue)=>issue.issueType==="unknown_keyword_owner").length,0);

const exclusionRows = batchExclusions.map((record,index) => {
  const asset = byId.get(record.candidateOwnerAssetId);
  assert.ok(asset, `Missing excluded candidate asset ${record.candidateOwnerAssetId}`);
  return { rowNumber:index+2,page:`https://www.linqingan.com${asset.path}`,query:record.query,clicks:0,impressions:1,ctr:0,position:10 };
});
const exclusionPlan = planGscHistoricalImport({ rows:exclusionRows,assetMaster:currentAssetMaster,keywordOwnership:registry,periodStart:"2026-07-10",periodEnd:"2026-09-03" });
assert.equal(exclusionPlan.counts.rowsAccepted,11);
assert.equal(exclusionPlan.accepted.filter((row)=>row.ownerStatus==="unowned").length,11);
assert.equal(exclusionPlan.accepted.filter((row)=>row.metadata.ownerResolutionSource==="owner-query-excluded").length,11);
assert.equal(exclusionPlan.accepted.filter((row)=>row.metadata.ownerExclusionBatch===batchId).length,11);
assert.equal(exclusionPlan.issues.filter((issue)=>issue.issueType==="unknown_keyword_owner").length,11);

const mismatchOwner = batchOwners[0];
const mismatchTarget = batchOwners.find((record)=>record.ownerAssetId!==mismatchOwner.ownerAssetId && record.language===mismatchOwner.language);
assert.ok(mismatchTarget);
const mismatchAsset = byId.get(mismatchTarget.ownerAssetId);
const mismatchPlan = planGscHistoricalImport({ rows:[{rowNumber:2,page:`https://www.linqingan.com${mismatchAsset.path}`,query:mismatchOwner.query,clicks:0,impressions:1,ctr:0,position:10}],assetMaster:currentAssetMaster,keywordOwnership:registry,periodStart:"2026-07-10",periodEnd:"2026-09-03" });
assert.equal(mismatchPlan.accepted[0].ownerStatus,"mismatch");
assert.equal(mismatchPlan.accepted[0].ownerAssetId,mismatchOwner.ownerAssetId);

console.log("Historical GSC import planner and curated keyword ownership registry passed.");
