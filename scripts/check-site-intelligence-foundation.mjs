import assert from "node:assert/strict";
import { GSC_GRAIN_CONTRACT, makeDataQualityFingerprint, makeGscRowFingerprint, makeImportId, makeRelationshipId, validateGscGrain, validateImportCounts } from "./lib/site-intelligence-foundation.mjs";
import { ACTION_AGING_POLICY_DAYS, actionTiming } from "./lib/site-intelligence-lifecycle.mjs";

assert.deepEqual(validateImportCounts({ rowsReceived: 100, rowsAccepted: 96, rowsRejected: 4, rowsUnmapped: 7 }), { rowsReceived: 100, rowsAccepted: 96, rowsRejected: 4, rowsUnmapped: 7 });
assert.throws(() => validateImportCounts({ rowsReceived: 10, rowsAccepted: 8, rowsRejected: 3 }), /cannot exceed/);
assert.equal(makeDataQualityFingerprint({ source: "gsc", issueType: "unknown_url", entityKind: "page", entityKey: "/blog/x" }), makeDataQualityFingerprint({ entityKey: "/blog/x", issueType: "unknown_url", source: "gsc", entityKind: "page" }));
assert.deepEqual(GSC_GRAIN_CONTRACT, { version: "gsc-page-query-v1", searchType: "web", country: "all", device: "all", dimensions: ["page", "query"] });
assert.deepEqual(validateGscGrain(), GSC_GRAIN_CONTRACT);
assert.throws(() => validateGscGrain({ device: "mobile" }), /device-segmented/);
assert.throws(() => validateGscGrain({ country: "usa" }), /country-segmented/);
assert.throws(() => validateGscGrain({ searchType: "image" }), /Web search only/);
assert.throws(() => validateGscGrain({ dimensions: ["page", "query", "date"] }), /exactly Page \+ Query/);
assert.throws(() => makeGscRowFingerprint({ periodStart: "2026-07-01", periodEnd: "2026-07-28", pagePath: "/blog/x", query: "" }), /query are required/);
assert.equal(makeGscRowFingerprint({ periodStart: "2026-07-01", periodEnd: "2026-07-28", pagePath: "/blog/x", query: "spawn" }), makeGscRowFingerprint({ pagePath: "/blog/x", query: "spawn", periodEnd: "2026-07-28", periodStart: "2026-07-01", searchType: "web", country: "all", device: "all", dimensions: ["page", "query"] }));
assert.match(makeImportId({ source: "gsc", fingerprint: "abcdef1234567890", startedAt: "2026-08-20T00:00:00Z" }), /^import:gsc:20260820000000:abcdef123456$/);
assert.match(makeRelationshipId({ fromKind: "keyword", fromKey: "spawn queue", relationshipType: "owned_by", toKind: "asset", toKey: "article:spawn-guide" }), /^rel:[a-f0-9]{24}$/);
assert.throws(() => makeRelationshipId({ fromKind: "asset", fromKey: "a", relationshipType: "related_to", toKind: "asset", toKey: "a" }), /Self relationships/);
assert.deepEqual(ACTION_AGING_POLICY_DAYS, { P0: 7, P1: 21, P2: 45 });
const p0Aging = actionTiming({ status: "open", priority: "P0", first_seen_at: "2026-08-01T00:00:00Z" }, { now: "2026-08-09T00:00:00Z" });
assert.equal(p0Aging.agingState, "aging");
assert.equal(p0Aging.agingDays, 8);
const explicitOverdue = actionTiming({ status: "in_progress", priority: "P2", first_seen_at: "2026-08-01T00:00:00Z", due_at: "2026-08-05T00:00:00Z" }, { now: "2026-08-06T00:00:00Z" });
assert.equal(explicitOverdue.agingState, "overdue");
const reviewDue = actionTiming({ status: "done", priority: "P1", first_seen_at: "2026-08-01T00:00:00Z", review_after: "2026-08-10T00:00:00Z", result: null }, { now: "2026-08-11T00:00:00Z" });
assert.equal(reviewDue.reviewDue, true);

console.log("Site Intelligence Database Foundation validation passed.");
