import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";

const root = process.cwd();
const source = readFileSync(
  join(root, "src/lib/english-editorial-runtime-notify-20260806.ts"),
  "utf8",
);
const route = readFileSync(
  join(root, "src/app/(en)/en/blog/[slug]/page.tsx"),
  "utf8",
);
const smoke = readFileSync(
  join(root, "scripts/smoke-english-runtime-8.mjs"),
  "utf8",
);
const audit = readFileSync(
  join(root, "docs/english-editorial-runtime-notify-batch-20260806.md"),
  "utf8",
);

const failures = [];
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) failures.push(message);
}

for (const required of [
  "getEnglishEditorialCorePublished20260731",
  "zero-sample-inconclusive",
  "screeps-cpu-bucket-degradation",
  "getSegmentCoordinator()",
  "activation-already-finalized",
  "segment-request-invalid",
  "RawMemory.setActiveSegments(activeNextTick)",
  "coordinator.requested.clear()",
  "segment-unavailable",
  'title: "Screeps Game.notify(): Send Rate-Limited Alerts Safely"',
  "Game.notify(message, groupInterval)",
  "Memory.notificationIncidents",
  "notification-scheduled",
  "already-reported",
  "local-budget-exhausted",
  "External inbox delivery observation",
  "static analysis only",
]) {
  if (!source.includes(required)) {
    failures.push(`Editorial override is missing required boundary: ${required}`);
  }
}

for (const forbidden of [
  "replace-with-current-payload-digest",
  "buildNotificationPayloadDigest(request)",
  "Console test passed",
  "Live multi-tick verification passed",
]) {
  if (source.includes(forbidden)) {
    failures.push(`Editorial override contains superseded or forbidden evidence: ${forbidden}`);
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

if (blocks.length !== 7) {
  failures.push(`Expected 7 current JavaScript blocks, received ${blocks.length}`);
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
      `Current JavaScript block ${index + 1} failed node --check: ${error.message}`,
    );
  } finally {
    unlinkSync(temporaryPath);
  }
}

const findBlock = (signal) =>
  blocks.find((code) => code.includes(signal)) ?? null;

const cpuBlock = findBlock("function measureCpu");
const segmentBlock = findBlock("function getSegmentCoordinator");
const sendNotificationBlock = findBlock("function sendNotification");
const notifyIncidentBlock = findBlock("function notifyIncident");
const notificationBudgetBlock = findBlock("function createNotificationBudget");

for (const [label, block] of [
  ["CPU probe", cpuBlock],
  ["Segment coordinator", segmentBlock],
  ["Notification sender", sendNotificationBlock],
  ["Notification incident state", notifyIncidentBlock],
  ["Notification shared budget", notificationBudgetBlock],
]) {
  if (!block) failures.push(`${label} executable block is missing`);
}

if (cpuBlock) {
  const cpuContext = vm.createContext({
    Game: { time: 101, cpu: { getUsed: () => 0 } },
  });
  vm.runInContext(cpuBlock, cpuContext);

  const invalid = vm.runInContext("measureCpu('invalid', null)", cpuContext);
  assert(invalid.status === "function-required", "CPU invalid callback state failed");

  const zero = vm.runInContext("measureCpu('zero', () => 7)", cpuContext);
  assert(zero.status === "zero-sample-inconclusive", "CPU zero sample was not inconclusive");

  const readings = [1.25, 1.75];
  cpuContext.Game.cpu.getUsed = () => readings.shift();
  const measured = vm.runInContext("measureCpu('measured', () => 7)", cpuContext);
  assert(measured.status === "sample-recorded", "CPU positive sample state failed");
  assert(measured.cpu === 0.5, "CPU delta calculation failed");
}

if (segmentBlock) {
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
  vm.runInContext(segmentBlock, segmentContext);

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
  assert(activeCalls.length === 1, "Segment API was not called once on first finalize");

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
}

if (sendNotificationBlock && notifyIncidentBlock && notificationBudgetBlock) {
  const notifyResults = [];
  const notifyContext = vm.createContext({
    Memory: {},
    Game: {
      time: 300,
      notify(message, groupInterval) {
        notifyResults.push({ message, groupInterval });
        return 0;
      },
    },
    OK: 0,
    ERR_FULL: -8,
    Math,
    Number,
  });
  vm.runInContext(sendNotificationBlock, notifyContext);
  vm.runInContext(notifyIncidentBlock, notifyContext);
  vm.runInContext(notificationBudgetBlock, notifyContext);

  const invalidMessage = vm.runInContext(
    "sendNotification('', 0)",
    notifyContext,
  );
  assert(invalidMessage.status === "invalid-message", "Empty notification message was accepted");

  const scheduled = vm.runInContext(
    "sendNotification('ready', 30)",
    notifyContext,
  );
  assert(scheduled.status === "notification-scheduled", "OK notification was not marked scheduled");
  assert(scheduled.result === 0, "Notification sender did not preserve the raw OK result");

  notifyContext.Game.notify = () => -8;
  const rejected = vm.runInContext(
    "sendNotification('full', 0)",
    notifyContext,
  );
  assert(rejected.status === "notification-not-scheduled", "ERR_FULL notification was marked scheduled");

  notifyContext.Game.notify = (message, groupInterval) => {
    notifyResults.push({ message, groupInterval });
    return 0;
  };
  const clear = vm.runInContext(
    "notifyIncident({ key: 'spawn-low', active: false, message: 'clear' })",
    notifyContext,
  );
  assert(clear.status === "incident-clear", "Inactive incident did not clear");

  const firstIncident = vm.runInContext(
    "notifyIncident({ key: 'spawn-low', active: true, message: 'low', groupInterval: 30 })",
    notifyContext,
  );
  assert(firstIncident.status === "notification-scheduled", "First active incident was not scheduled");
  assert(notifyContext.Memory.notificationIncidents["spawn-low"].active === true, "Incident state was not activated after OK");
  assert(notifyContext.Memory.notificationIncidents["spawn-low"].lastScheduledAt === 300, "Incident scheduled tick was not stored");

  const repeatedIncident = vm.runInContext(
    "notifyIncident({ key: 'spawn-low', active: true, message: 'low', groupInterval: 30 })",
    notifyContext,
  );
  assert(repeatedIncident.status === "already-reported", "Repeated active incident was not suppressed");

  notifyContext.Game.time = 305;
  const repeatDue = vm.runInContext(
    "notifyIncident({ key: 'spawn-low', active: true, message: 'low', groupInterval: 30, repeatAfterTicks: 5 })",
    notifyContext,
  );
  assert(repeatDue.status === "notification-scheduled", "Due incident reminder did not recover");

  const budgetResult = vm.runInContext(
    `(() => {
      const budget = createNotificationBudget(1);
      return [
        budget.send('first', 0).status,
        budget.send('second', 0).status,
        budget.getScheduledCount()
      ];
    })()`,
    notifyContext,
  );
  assert(budgetResult[0] === "notification-scheduled", "Shared notification budget rejected the first slot");
  assert(budgetResult[1] === "local-budget-exhausted", "Shared notification budget did not enforce its local cap");
  assert(budgetResult[2] === 1, "Shared notification budget count was not preserved");
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
  'modifiedDate: "2026-08-14"',
  "zero-sample-inconclusive",
  "coordinator.requested.clear()",
  "activation-already-finalized",
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

if (assertions !== 26) {
  failures.push(`Expected 26 offline assertions, executed ${assertions}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nAugust English editorial gate failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log(
  `August English editorial gate passed: 3 existing URLs, 7 current JavaScript blocks, ${assertions} offline boundary assertions, stable publication order, scoped dateModified, reviewed Game.notify supersession, 98-point internal scorecards, and Pending live evidence.`,
);