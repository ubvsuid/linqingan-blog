import assert from "node:assert/strict";
import { classifyWarehouseObservation, resolveGscSource } from "./lib/site-intelligence-gsc.mjs";

assert.equal(resolveGscSource({ databaseConnected: true }), "warehouse");
assert.equal(resolveGscSource({ databaseConnected: true, fileInput: "legacy.json" }), "file");
assert.equal(resolveGscSource({ databaseConnected: false }), "none");
assert.throws(() => resolveGscSource({ databaseConnected: false, requested: "warehouse" }), /DATABASE_URL/);

const record = classifyWarehouseObservation({
  period_start: "2026-07-01", period_end: "2026-07-28", page_path: "/blog/a", query: "query",
  clicks: 5, impressions: 200, ctr: "0.015", position: "6.2", owner_status: "owner-match", asset_id: "zh-CN:article:a", source_import_id: "import:1",
});
assert.equal(record.ctr, 0.015);
assert.equal(record.action, "Improve title and description");
assert.equal(record.priority, "P0");
assert.equal(record.mappingSource, "gsc-historical-warehouse");

console.log("GSC warehouse bridge contract passed.");
const mismatch = classifyWarehouseObservation({ page_path: "/blog/a", query: "q", asset_id: "a", owner_status: "mismatch", clicks: 1, impressions: 100, ctr: 0.01, position: 5 });
assert.equal(mismatch.ownerStatus, "owner-mismatch");
assert.equal(mismatch.action, "Review keyword ownership / cannibalization");
const languageGap = classifyWarehouseObservation({ page_path: "/en/blog/a", query: "q", owner_status: "unmapped", metadata: { ownerMappingReason: "owner-language-unmapped" }, clicks: 1, impressions: 10, ctr: 0.1, position: 5 });
assert.equal(languageGap.ownerStatus, "owner-language-unmapped");
