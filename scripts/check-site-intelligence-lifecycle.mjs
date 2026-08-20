import assert from "node:assert/strict";
import { actionSeed, fingerprintSnapshot, makeSnapshotId, normalizeLifecycleResult, snapshotSeed, validateLifecycleTransition } from "./lib/site-intelligence-lifecycle.mjs";

assert.deepEqual(validateLifecycleTransition("open", "in_progress"), { allowed: true, noop: false, from: "open", to: "in_progress" });
assert.deepEqual(validateLifecycleTransition("done", "done"), { allowed: true, noop: true, from: "done", to: "done" });
assert.throws(() => validateLifecycleTransition("open", "done"), /Invalid action transition/);
assert.throws(() => validateLifecycleTransition("done", "rejected"), /Invalid action transition/);
assert.equal(normalizeLifecycleResult("improved"), "improved");
assert.equal(normalizeLifecycleResult(""), null);
assert.throws(() => normalizeLifecycleResult("great"), /Invalid action result/);

const action = actionSeed({
  actionId: "keyword-ownership:zh-CN:article:test:gsc:1",
  assetId: "zh-CN:article:test",
  path: "/blog/test",
  category: "keyword-ownership",
  action: "Review keyword ownership / cannibalization",
  priority: "P0",
  rationale: "Owner mismatch",
  sources: ["gsc", "gsc"],
  sourceSignalIds: ["sig-1", "sig-1"],
  metrics: { impressions: 140, position: 7.1 },
});
assert.equal(action.priority, "P0");
assert.deepEqual(action.sourceSignalIds, ["sig-1"]);
assert.deepEqual(action.beforeMetrics, { impressions: 140, position: 7.1 });

const input = { generatedAt: "2026-08-20T00:00:00.000Z", summary: { actions: 1 }, actions: [{ actionId: "a" }] };
const fp1 = fingerprintSnapshot(input);
const fp2 = fingerprintSnapshot({ actions: [{ actionId: "a" }], summary: { actions: 1 }, generatedAt: "2026-08-20T00:00:00.000Z" });
assert.equal(fp1, fp2);
assert.match(makeSnapshotId("action_queue", input.generatedAt, fp1), /^action_queue:20260820000000:/);
const snapshot = snapshotSeed("action_queue", input, { windowDays: 28 });
assert.equal(snapshot.windowDays, 28);
assert.equal(snapshot.summary.actions, 1);

console.log("Site Intelligence Lifecycle validation passed.");
