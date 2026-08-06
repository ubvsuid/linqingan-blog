import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";

const root = process.cwd();
const sourcePath = join(
  root,
  "src/lib/english-editorial-runtime-notify-20260806.ts",
);
const routePath = join(root, "src/app/(en)/en/blog/[slug]/page.tsx");
const smokePath = join(root, "scripts/smoke-english-runtime-8.mjs");
const auditPath = join(
  root,
  "docs/english-editorial-runtime-notify-batch-20260806.md",
);

const source = readFileSync(sourcePath, "utf8");
const route = readFileSync(routePath, "utf8");
const smoke = readFileSync(smokePath, "utf8");
const audit = readFileSync(auditPath, "utf8");
const failures = [];
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) failures.push(message);
}

for (const required of [
  'getEnglishEditorialCorePublished20260731',
  '"screeps-cpu-getused-bucket"',
  'zero-sample-inconclusive',
  'global.cpuProbe',
  'minimumBucket = 2000',
  'runDefense()',
  'remaining > reserveCpu',
  'screeps-cpu-bucket-degradation',
  'getSegmentCoordinator()',
  'activation-already-finalized',
  'segment-request-invalid',
  'RawMemory.setActiveSegments(activeNextTick)',
  'coordinator.requested.clear()',
  'segment-unavailable',
  'not cryptographic, collision-resistant, secret',
  'buildNotificationPayloadDigest(request)',
  'Screeps Console test',
  'Live multi-tick verification',
  'static analysis only',
]) {
  if (!source.includes(required)) {
    failures.push(`Editorial override is missing required boundary: ${required}`);
  }
}

for (const forbidden of [
  'replace-with-current-payload-digest',
  'status: start === 0 && end === 0\n      ? \'simulation\'',
]) {
  if (source.includes(forbidden)) {
    failures.push(`Editorial override still contains forbidden pattern: ${forbidden}`);
  }
}

const blocks = [
  ...source.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  ),
].map((match) => match[1]
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'"));

if (blocks.length !== 5) {
  failures.push(`Expected 5 revised JavaScript blocks, received ${blocks.length}`);
}

for (const [index, code] of blocks.entries()) {
  const temporaryPath = join(
    tmpdir(),
    `english-editorial-runtime-notify-20260806-${index + 1}.js`,
  );
  writeFileSync(temporaryPath, code);
  try {
    execFileSync(process.execPath, ["--check", temporaryPath], {
      stdio: "pipe",
    });
  } catch (error) {
    failures.push(
      `Revised JavaScript block ${index + 1} failed node --check: ${error.message}`,
    );
  } finally {
    unlinkSync(temporaryPath);
  }
}

if (blocks.length >= 5) {
  const cpuContext = vm.createContext({
    Game: {
      time: 101,
      cpu: { getUsed: () => 0 },
    },
  });
  vm.runInContext(blocks[0], cpuContext);
  const invalid = vm.runInContext("measureCpu('invalid', null)", cpuContext);
  assert(invalid.status === "function-required", "CPU invalid callback state failed");

  const zero = vm.runInContext("measureCpu('zero', () => 7)", cpuContext);
  assert(zero.status === "zero-sample-inconclusive", "CPU zero sample was not inconclusive");

  const readings = [1.25, 1.75];
  cpuContext.Game.cpu.getUsed = () => readings.shift();
  const measured = vm.runInContext("measureCpu('measured', () => 7)", cpuContext);
  assert(measured.status === "sample-recorded", "CPU positive sample state failed");
  assert(measured.cpu === 0.5, "CPU delta calculation failed");

  const activeCalls = [];
  const segmentContext = vm.createContext({
    Game: { time: 200 },
    RawMemory: {
      setActiveSegments(ids) {
        activeCalls.push([...ids]);
      },
    },
    global: {},
    Map,
    Number,
  });
  vm.runInContext(blocks[1], segmentContext);

  const invalidSegment = vm.runInContext("requestSegment(100, 1)", segmentContext);
  assert(!invalidSegment.accepted, "Segment ID 100 was accepted");

  vm.runInContext("requestSegment(4, 1); requestSegment(4, 9)", segmentContext);
  for (let id = 0; id < 12; id += 1) {
    vm.runInContext(`requestSegment(${id}, ${id})`, segmentContext);
  }
  const firstPlan = vm.runInContext("finalizeSegmentRequests()", segmentContext);
  assert(firstPlan.activeNextTick.length === 10, "Segment active cap was not 10");
  assert(firstPlan.deferred.length === 2, "Segment deferred set was not retained");
  assert(firstPlan.activeNextTick[0] === 11, "Segment priority ordering failed");
  assert(activeCalls.length === 1, "Segment API was not called exactly once on first finalize");

  const repeatedPlan = vm.runInContext("finalizeSegmentRequests()", segmentContext);
  assert(
    repeatedPlan.status === "activation-already-finalized",
    "Repeated Segment finalization did not return the guarded state",
  );
  assert(activeCalls.length === 1, "Repeated Segment finalization called the API again");

  const lateRequest = vm.runInContext("requestSegment(20, 100)", segmentContext);
  assert(
    lateRequest.status === "activation-already-finalized",
    "Late Segment request was not rejected",
  );

  segmentContext.Game.time = 201;
  const nextTickRequest = vm.runInContext("requestSegment(20, 100)", segmentContext);
  assert(nextTickRequest.accepted, "Next-tick Segment request did not recover");

  const notifyContext = vm.createContext({
    Memory: {},
    Game: { time: 300 },
    Math,
  });
  vm.runInContext(blocks[3], notifyContext);
  vm.runInContext(blocks[4], notifyContext);
  const confirmation = vm.runInContext(
    "Memory.notificationRequests['spawn-energy-low'].confirmation",
    notifyContext,
  );
  assert(
    confirmation.startsWith("SUBMIT_NOTIFICATION_spawn-energy-low_3_"),
    "Notification confirmation identity was not generated",
  );

  const stable = vm.runInContext(
    "buildNotificationPayloadDigest(Memory.notificationRequests['spawn-energy-low'])",
    notifyContext,
  );
  const repeated = vm.runInContext(
    "buildNotificationPayloadDigest(Memory.notificationRequests['spawn-energy-low'])",
    notifyContext,
  );
  assert(stable === repeated, "Notification digest was not deterministic");

  notifyContext.Memory.notificationRequests["spawn-energy-low"].message = "changed";
  const changed = vm.runInContext(
    "buildNotificationPayloadDigest(Memory.notificationRequests['spawn-energy-low'])",
    notifyContext,
  );
  assert(stable !== changed, "Notification digest did not detect payload drift");
}

const overrideIndex = route.indexOf(
  "getEnglishEditorialRuntimeNotifyArticle20260806(slug)",
);
const previousEditorialIndex = route.indexOf(
  "getEnglishEditorialPublished20260731(slug)",
);
if (
  overrideIndex < 0
  || previousEditorialIndex < 0
  || overrideIndex > previousEditorialIndex
) {
  failures.push("August editorial override is not first in the publication chain");
}
if (!route.includes("getEnglishEditorialRuntimeNotifyUpdatedAt20260806")) {
  failures.push("August dateModified override is not integrated");
}

for (const signal of [
  'modifiedDate: "2026-08-06"',
  'zero-sample-inconclusive',
  'coordinator.requested.clear()',
  'activation-already-finalized',
]) {
  if (!smoke.includes(signal)) failures.push(`Production smoke is missing: ${signal}`);
}

for (const signal of [
  "CPU profiling | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98**",
  "RawMemory Segments | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98**",
  "Game.notify | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98**",
  "Search Console data was not available",
  "Screeps Console test — Pending",
  "Live multi-tick verification — Pending",
]) {
  if (!audit.includes(signal)) failures.push(`Audit record is missing: ${signal}`);
}

if (assertions !== 15) {
  failures.push(`Expected 15 offline assertions, executed ${assertions}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nAugust English editorial gate failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log(
  `August English editorial gate passed: 3 existing URLs, 5 revised JavaScript blocks, ${assertions} offline boundary assertions, stable publication order, scoped dateModified, 98-point internal scorecards, and Pending live evidence.`,
);
