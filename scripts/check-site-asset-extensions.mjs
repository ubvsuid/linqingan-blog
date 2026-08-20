import assert from "node:assert/strict";
import { extractEnglishArticleRecords, extractEnglishOverrides, extractErrorCodeRecords, extractGlossaryRecords, glossaryAnchor } from "./lib/site-asset-extensions.mjs";

const english = `export const x=[{ href: "/en/blog/a", chinesePath: "/blog/a", title: "A", primaryKeyword: "Screeps A", searchIntent: "Learn A", status: "published" }];`;
assert.deepEqual(extractEnglishArticleRecords(english,"fixture")[0],{href:"/en/blog/a",chinesePath:"/blog/a",title:"A",primaryKeyword:"Screeps A",searchIntent:"Learn A",sourceName:"fixture"});
const overrides = extractEnglishOverrides(`const x={ "/en/blog/a": { title: "A2", primaryKeyword: "A keyword" } };`);
assert.equal(overrides.get("/en/blog/a").title,"A2");
assert.deepEqual(extractErrorCodeRecords(`[{ name: "OK", value: 0 }, { name: "ERR_NO_PATH", value: -2 }]`),[{name:"OK",value:0},{name:"ERR_NO_PATH",value:-2}]);
assert.deepEqual(extractGlossaryRecords(`[{ term: "Body Part", chinese: "身体部件" }, { term: "CPU", chinese: "计算额度" }]`),[{term:"Body Part",chinese:"身体部件"},{term:"CPU",chinese:"计算额度"}]);
assert.equal(glossaryAnchor("Body Part"),"body-part");
assert.equal(glossaryAnchor("RoomPosition"),"roomposition");
console.log("Asset extension extraction passed.");
