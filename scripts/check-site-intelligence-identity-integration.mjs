import assert from 'node:assert/strict';
import { buildSiteIntelligenceSignals } from './lib/site-intelligence-signals.mjs';

const assetMaster={assets:[
 {assetId:'zh-CN:article:move',assetType:'article',language:'zh-CN',routeKind:'page',path:'/blog/move',canonicalPath:'/blog/move',slug:'move',title:'移动',contentSystem:'knowledge',module:'movement',roadmap:null,stage:null,primaryKeyword:'Screeps moveTo',keywordRole:'owner'},
 {assetId:'en:article:move',assetType:'article',language:'en',routeKind:'page',path:'/en/blog/move',canonicalPath:'/en/blog/move',slug:'move',title:'Move',contentSystem:'knowledge',module:'movement',roadmap:null,stage:null,primaryKeyword:'Screeps moveTo',keywordRole:'owner'},
]};
const facts=[
 {pagePath:'/blog/move',query:'Screeps moveTo',ownerKeyword:'Screeps moveTo',ownerStatus:'owner-match',priority:'P1',action:'Protect and expand',impressions:100},
 {pagePath:'/en/blog/move',query:'Screeps moveTo',ownerKeyword:'Screeps moveTo',ownerStatus:'owner-mismatch',expectedOwnerHref:'/blog/move',priority:'P0',action:'Review keyword ownership / cannibalization',impressions:100},
];
const one=buildSiteIntelligenceSignals({assetMaster,gscRecords:facts,generatedAt:'2026-08-20T00:00:00Z'});
const two=buildSiteIntelligenceSignals({assetMaster,gscRecords:[...facts].reverse(),generatedAt:'2026-08-20T00:00:00Z'});
const ids=(s)=>[...s.assets.flatMap((a)=>a.signals),...s.unmappedSignals].map((x)=>x.signalId).sort();
assert.deepEqual(ids(one),ids(two),'reordering facts must not change signal IDs');
const en=one.assets.find((a)=>a.assetId==='en:article:move');
assert.ok(en);
assert.ok(!en.signals.some((s)=>s.kind==='gsc-owner-mismatch'),'cross-language expectedOwnerHref must not create P0 mismatch');
assert.ok(en.signals.some((s)=>s.payload.ownerStatus==='owner-match'),'same-language English owner must be resolved');

const zhOnly={assets:assetMaster.assets.filter((a)=>a.language==='zh-CN')};
const safe=buildSiteIntelligenceSignals({assetMaster:zhOnly,gscRecords:[facts[1]],generatedAt:'2026-08-20T00:00:00Z'});
assert.equal(safe.unmappedSignals[0].kind,'gsc-language-review');
assert.equal(safe.unmappedSignals[0].rankingEligible,false);
console.log('Identity + language safety integration validation passed.');
