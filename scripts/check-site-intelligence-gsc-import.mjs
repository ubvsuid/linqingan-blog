import assert from "node:assert/strict";
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
console.log("Historical GSC import planner passed.");
