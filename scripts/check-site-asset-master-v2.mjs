import assert from "node:assert/strict";
import { glossaryAnchor, extractErrorCodeRecords, extractGlossaryRecords } from "./lib/site-asset-extensions.mjs";

const mock = {
  zh: { assetId:"zh-CN:article:a",language:"zh-CN",assetType:"article",path:"/blog/a",routeKind:"page",primaryKeyword:"A",keywordRole:"owner" },
  en: { assetId:"en:article:a",language:"en",assetType:"article",path:"/en/blog/a",routeKind:"page",primaryKeyword:"A",keywordRole:"owner",languagePairAssetId:"zh-CN:article:a" },
  error: { assetId:"zh-CN:error-code:err_no_path",language:"zh-CN",assetType:"error-code",path:"/screeps-errors#err_no_path",canonicalPath:"/screeps-errors",routeKind:"fragment" },
  glossary: { assetId:`zh-CN:glossary-term:${glossaryAnchor("Body Part")}`,language:"zh-CN",assetType:"glossary-term",path:"/glossary#body-part",canonicalPath:"/glossary",routeKind:"fragment" },
};
assert.equal(mock.en.languagePairAssetId,mock.zh.assetId);
assert.notEqual(mock.en.path,mock.zh.path);
assert.equal(mock.error.canonicalPath,"/screeps-errors");
assert.equal(mock.glossary.path,"/glossary#body-part");
assert.equal(extractErrorCodeRecords(`[{ name:"ERR_NO_PATH", value:-2 }]`).length,1);
assert.equal(extractGlossaryRecords(`[{ term:"CPU", chinese:"计算额度" }]`).length,1);
console.log("Asset Master V2 model boundary passed.");
