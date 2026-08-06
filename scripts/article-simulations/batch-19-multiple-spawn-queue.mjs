import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const OK = 0;
const ERR_BUSY = -4;
const ERR_NOT_ENOUGH_ENERGY = -6;
const BODYPART_COST = {
  move: 50,
  work: 100,
  carry: 50,
  attack: 80,
  ranged_attack: 150,
  heal: 250,
  claim: 600,
  tough: 10,
};

let assertions = 0;
function check(condition, message) {
  assert.ok(condition, message);
  assertions += 1;
}
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

function getCreepBodyCost(body) {
  if (!Array.isArray(body) || body.length < 1 || body.length > 50) return null;
  let total = 0;
  for (const part of body) {
    const cost = BODYPART_COST[part];
    if (!Number.isFinite(cost)) return null;
    total += cost;
  }
  return total;
}

function cloneSpawnMemory(memory) {
  try {
    const serialized = JSON.stringify(memory ?? {});
    return serialized === undefined ? null : JSON.parse(serialized);
  } catch {
    return null;
  }
}

function normalizeSpawnRequest(input) {
  const body = Array.isArray(input?.body) ? [...input.body] : null;
  const bodyCost = getCreepBodyCost(body);
  const memory = cloneSpawnMemory(input?.memory);
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const requestKey = typeof input?.requestKey === "string" ? input.requestKey.trim() : "";
  const priority = Number.isInteger(input?.priority) ? input.priority : 100;
  if (bodyCost === null) return { status: "body-invalid" };
  if (name.length < 1 || name.length > 100) return { status: "name-invalid" };
  if (requestKey.length < 1) return { status: "request-key-required" };
  if (memory === null) return { status: "memory-not-json-compatible" };
  return {
    status: "request-valid",
    request: { requestKey, name, body, bodyCost, memory, priority },
  };
}

function sameSpawnRequest(left, right) {
  return left.requestKey === right.requestKey
    && left.name === right.name
    && left.priority === right.priority
    && JSON.stringify(left.body) === JSON.stringify(right.body)
    && JSON.stringify(left.memory) === JSON.stringify(right.memory);
}

function compareSpawnJobs(left, right) {
  return right.priority - left.priority
    || left.createdAt - right.createdAt
    || left.sequence - right.sequence
    || left.id.localeCompare(right.id);
}

function getIdleOwnedSpawns(spawns) {
  return spawns
    .filter((spawn) => spawn.my && spawn.active && spawn.spawning === null)
    .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
}

function isNameReserved(name, world) {
  if (world.creeps.has(name)) return true;
  return Object.values(world.rooms).some((roomState) =>
    roomState.jobs.some((job) => job.name === name && job.status === "queued")
    || roomState.submissions.some((submission) =>
      submission.name === name
      && submission.status !== "born"
      && submission.status !== "failed"));
}

function enqueueSpawnRequest(world, roomName, input) {
  const room = world.visibleRooms[roomName];
  if (!room) return { status: "room-not-visible", jobId: null };
  const normalized = normalizeSpawnRequest(input);
  if (normalized.status !== "request-valid") return { status: normalized.status, jobId: null };
  const request = normalized.request;
  const roomState = world.rooms[roomName];
  const existing = roomState.jobs.find((job) => job.requestKey === request.requestKey && job.status === "queued");
  if (existing) {
    return sameSpawnRequest(existing, request)
      ? { status: "already-queued", jobId: existing.id }
      : { status: "request-key-conflict", jobId: existing.id };
  }
  if (request.bodyCost > room.energyCapacityAvailable) {
    return { status: "body-exceeds-room-capacity", jobId: null };
  }
  if (isNameReserved(request.name, world)) {
    return { status: "creep-name-reserved", jobId: null };
  }
  const sequence = roomState.nextSequence++;
  const job = {
    id: `${roomName}:${world.time}:${sequence}`,
    roomName,
    sequence,
    createdAt: world.time,
    status: "queued",
    ...request,
  };
  roomState.jobs.push(job);
  return { status: "queued", jobId: job.id };
}

function buildRoomSpawnPlan({ energyAvailable, spawns, jobs, existingNames = new Set() }) {
  const idle = getIdleOwnedSpawns(spawns);
  const sortedJobs = jobs.filter((job) => job.status === "queued").sort(compareSpawnJobs);
  const assignments = [];
  const blocked = [];
  let remainingEnergy = energyAvailable;
  for (const spawn of idle) {
    const job = sortedJobs[assignments.length];
    if (!job) break;
    if (existingNames.has(job.name)) {
      blocked.push({ jobId: job.id, status: "name-now-exists" });
      break;
    }
    if (job.bodyCost > remainingEnergy) {
      blocked.push({ jobId: job.id, status: "waiting-for-room-energy", required: job.bodyCost, available: remainingEnergy });
      break;
    }
    assignments.push({ spawnId: spawn.id, spawnName: spawn.name, jobId: job.id, name: job.name, bodyCost: job.bodyCost });
    remainingEnergy -= job.bodyCost;
  }
  return {
    status: assignments.length > 0
      ? "plan-ready"
      : blocked.length > 0
        ? blocked[0].status
        : idle.length === 0
          ? "no-idle-spawn"
          : "queue-empty",
    observedEnergy: energyAvailable,
    remainingPlannedEnergy: remainingEnergy,
    assignments,
    blocked,
  };
}

function finalizePlannedBatch({ gameTime, roomState, plan, spawnStates }) {
  if (roomState.finalizedTick === gameTime) {
    return { status: "already-finalized-this-tick", attempts: [] };
  }
  roomState.finalizedTick = gameTime;
  const attempts = [];
  for (const assignment of plan.assignments) {
    const state = spawnStates[assignment.spawnId];
    const job = roomState.jobs.find((candidate) => candidate.id === assignment.jobId && candidate.status === "queued");
    if (!state || !job) {
      attempts.push({ ...assignment, status: "assignment-stale" });
      break;
    }
    if (state.busy) {
      attempts.push({ ...assignment, status: "spawn-became-busy" });
      break;
    }
    if (state.dryRunResult !== OK) {
      attempts.push({ ...assignment, status: "dry-run-rejected", dryRunResult: state.dryRunResult });
      break;
    }
    const result = state.result;
    attempts.push({ ...assignment, status: result === OK ? "spawn-scheduled" : "spawn-submit-rejected", dryRunResult: OK, result });
    if (result !== OK) break;
    roomState.submissions.push({ jobId: job.id, name: job.name, spawnId: assignment.spawnId, submittedAt: gameTime, needTime: 9, status: "submitted" });
    roomState.jobs = roomState.jobs.filter((candidate) => candidate.id !== job.id);
  }
  return {
    status: attempts.some((attempt) => attempt.status === "spawn-scheduled") ? "batch-submitted" : plan.status,
    attempts,
  };
}

function observeSubmission(submission, gameTime, spawn, creep) {
  if (creep?.spawning === true && spawn?.spawningName === submission.name) return "confirmed-spawning";
  if (creep && creep.spawning === false) return "born";
  if (spawn?.spawningName === submission.name) return "spawn-reports-requested-name";
  if (Number.isInteger(submission.needTime) && gameTime > submission.submittedAt + submission.needTime + 2) return "completion-unverified";
  return "pending-observation";
}

function validateRepositoryIntegration() {
  const root = process.cwd();
  const paths = {
    chinese: "content/posts/screeps-multiple-spawn-queue-coordinator.md",
    english: "src/app/(en)/en/blog/screeps-multiple-spawn-queue-coordinator/page.tsx",
    registry: "src/lib/english-link-source-registry-18.ts",
    knowledge: "src/lib/knowledge-base.ts",
    topics: "src/lib/english-discovery-topic-overrides-20260806.ts",
    smokeAll: "scripts/smoke-all.mjs",
    smoke: "scripts/smoke-english-spawn-queue-19.mjs",
  };
  const missing = Object.entries(paths)
    .filter(([, relative]) => !fs.existsSync(path.join(root, relative)))
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Spawn queue integration files missing: ${missing.join(", ")}`);
  }

  const source = Object.fromEntries(
    Object.entries(paths).map(([key, relative]) => [
      key,
      fs.readFileSync(path.join(root, relative), "utf8"),
    ]),
  );
  const required = [
    [source.chinese, "48 个离线队列规划与观察断言通过"],
    [source.chinese, "already-finalized-this-tick"],
    [source.chinese, "waiting-for-room-energy"],
    [source.english, "48 queue planning, finalization, and observation assertions passed"],
    [source.english, "6 article blocks passed Node.js 22 syntax checks"],
    [source.english, "strict head-of-line policy"],
    [source.registry, 'href: "/en/blog/screeps-multiple-spawn-queue-coordinator"'],
    [source.registry, 'finalScore: 98'],
    [source.knowledge, '"screeps-multiple-spawn-queue-coordinator"'],
    [source.knowledge, 'from: 8, to: 9'],
    [source.topics, '"/en/blog/screeps-multiple-spawn-queue-coordinator"'],
    [source.smokeAll, 'await import("./smoke-english-spawn-queue-19.mjs");'],
    [source.smoke, "Multiple Spawn queue production smoke passed"],
  ];
  const integrationFailures = required
    .filter(([text, needle]) => !text.includes(needle))
    .map(([, needle]) => `missing repository signal: ${needle}`);

  if (source.english.includes('"@type":"FAQPage"') || source.english.includes("Frequently asked questions")) {
    integrationFailures.push("English article unexpectedly contains FAQ output");
  }
  if (!source.english.includes("Screeps Console test") || !source.english.includes("Pending")) {
    integrationFailures.push("English article does not preserve Pending live evidence");
  }

  const blocks = [...source.english.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  )].map((match) => match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("\\`", "`")
    .replaceAll("\\${", "${"));

  if (blocks.length !== 6) {
    integrationFailures.push(`expected 6 English JavaScript blocks, found ${blocks.length}`);
  }

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "spawn-queue-19-"));
  try {
    blocks.forEach((code, index) => {
      const file = path.join(temporary, `${index + 1}.js`);
      fs.writeFileSync(file, code);
      const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
      if (result.status !== 0) {
        integrationFailures.push(
          `English JavaScript block ${index + 1} failed syntax: ${result.stderr.trim()}`,
        );
      }
    });
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }

  if (integrationFailures.length > 0) {
    throw new Error(integrationFailures.join("\n"));
  }

  return blocks.length;
}

// Body and request normalization: 12 assertions.
equal(getCreepBodyCost(null), null, "non-array body fails");
equal(getCreepBodyCost([]), null, "empty body fails");
equal(getCreepBodyCost(Array(51).fill("move")), null, "51-part body fails");
equal(getCreepBodyCost(["move", "unknown"]), null, "unknown body part fails");
equal(getCreepBodyCost(["work", "carry", "move"]), 200, "valid body cost");
equal(normalizeSpawnRequest({ body: ["move"], name: " ", requestKey: "x" }).status, "name-invalid", "blank name fails");
equal(normalizeSpawnRequest({ body: ["move"], name: "x".repeat(101), requestKey: "x" }).status, "name-invalid", "long name fails");
equal(normalizeSpawnRequest({ body: ["move"], name: "A", requestKey: " " }).status, "request-key-required", "blank request key fails");
const circular = {}; circular.self = circular;
equal(normalizeSpawnRequest({ body: ["move"], name: "A", requestKey: "x", memory: circular }).status, "memory-not-json-compatible", "circular memory fails");
const defaultPriority = normalizeSpawnRequest({ body: ["work", "move"], name: "A", requestKey: "x", memory: { role: "h" } });
equal(defaultPriority.request.priority, 100, "default priority");
equal(normalizeSpawnRequest({ body: ["move"], name: "A", requestKey: "x", priority: 500 }).request.priority, 500, "explicit priority");
const sourceMemory = { nested: { value: 1 } };
const cloned = normalizeSpawnRequest({ body: ["move"], name: "A", requestKey: "x", memory: sourceMemory });
sourceMemory.nested.value = 2;
equal(cloned.request.memory.nested.value, 1, "memory clone is frozen from caller mutation");

// Request identity: 4 assertions.
const baseRequest = { requestKey: "k", name: "A", priority: 100, body: ["move"], memory: { role: "h" } };
check(sameSpawnRequest(baseRequest, { ...baseRequest }), "identical request matches");
check(!sameSpawnRequest(baseRequest, { ...baseRequest, priority: 101 }), "priority conflict detected");
check(!sameSpawnRequest(baseRequest, { ...baseRequest, body: ["work"] }), "body conflict detected");
check(!sameSpawnRequest(baseRequest, { ...baseRequest, memory: { role: "b" } }), "memory conflict detected");

// Enqueue and global reservations: 8 assertions.
function makeWorld() {
  return {
    time: 100,
    creeps: new Set(),
    visibleRooms: { W1N1: { energyCapacityAvailable: 800 }, W2N2: { energyCapacityAvailable: 800 } },
    rooms: {
      W1N1: { nextSequence: 1, jobs: [], submissions: [] },
      W2N2: { nextSequence: 1, jobs: [], submissions: [] },
    },
  };
}
const world = makeWorld();
const enqueueInput = { body: ["work", "carry", "move"], name: "Harvester-1", requestKey: "harvester:1", priority: 500, memory: { role: "harvester" } };
equal(enqueueSpawnRequest(world, "W1N1", enqueueInput).status, "queued", "valid request queues");
equal(enqueueSpawnRequest(world, "W1N1", enqueueInput).status, "already-queued", "repeat is idempotent");
equal(enqueueSpawnRequest(world, "W1N1", { ...enqueueInput, priority: 400 }).status, "request-key-conflict", "same key different content conflicts");
equal(enqueueSpawnRequest(world, "W1N1", { ...enqueueInput, requestKey: "too-big", name: "Big", body: ["claim", "claim"] }).status, "body-exceeds-room-capacity", "capacity bound enforced");
world.creeps.add("Existing");
equal(enqueueSpawnRequest(world, "W1N1", { ...enqueueInput, requestKey: "existing", name: "Existing" }).status, "creep-name-reserved", "live name reserved");
equal(enqueueSpawnRequest(world, "W2N2", { ...enqueueInput, requestKey: "other-room", name: "Harvester-1" }).status, "creep-name-reserved", "queued name reserved globally");
world.rooms.W1N1.submissions.push({ name: "Submitted", status: "submitted" });
check(isNameReserved("Submitted", world), "pending submission reserves name");
world.rooms.W1N1.submissions[0].status = "born";
check(!isNameReserved("Submitted", world), "terminal born record releases reservation");

// Stable ordering and idle Spawn selection: 8 assertions.
const jobs = [
  { id: "c", priority: 100, createdAt: 2, sequence: 3 },
  { id: "b", priority: 500, createdAt: 2, sequence: 2 },
  { id: "a", priority: 500, createdAt: 1, sequence: 4 },
  { id: "d", priority: 500, createdAt: 1, sequence: 1 },
];
const sorted = [...jobs].sort(compareSpawnJobs);
equal(sorted[0].id, "d", "higher priority and lower sequence first");
equal(sorted[1].id, "a", "same priority older creation before newer");
equal(sorted.at(-1).id, "c", "lower priority last");
equal([...[{ id: "b", priority: 1, createdAt: 1, sequence: 1 }, { id: "a", priority: 1, createdAt: 1, sequence: 1 }]].sort(compareSpawnJobs)[0].id, "a", "id breaks complete tie");
const spawnCandidates = [
  { id: "2", name: "SpawnB", my: true, active: true, spawning: null },
  { id: "1", name: "SpawnA", my: true, active: true, spawning: null },
  { id: "3", name: "Busy", my: true, active: true, spawning: {} },
  { id: "4", name: "Inactive", my: true, active: false, spawning: null },
  { id: "5", name: "Foreign", my: false, active: true, spawning: null },
];
const idle = getIdleOwnedSpawns(spawnCandidates);
equal(idle.length, 2, "only idle active owned Spawns remain");
equal(idle[0].name, "SpawnA", "Spawn name order stable");
check(!idle.some((spawn) => spawn.name === "Busy"), "busy Spawn excluded");
check(!idle.some((spawn) => spawn.name === "Foreign"), "foreign Spawn excluded");

// Shared Energy planning: 8 assertions.
const idleSpawns = [
  { id: "s1", name: "Spawn1", my: true, active: true, spawning: null },
  { id: "s2", name: "Spawn2", my: true, active: true, spawning: null },
];
const queueJobs = [
  { id: "j1", name: "High", bodyCost: 300, priority: 500, createdAt: 1, sequence: 1, status: "queued" },
  { id: "j2", name: "Low", bodyCost: 200, priority: 100, createdAt: 2, sequence: 2, status: "queued" },
];
equal(buildRoomSpawnPlan({ energyAvailable: 500, spawns: idleSpawns, jobs: [] }).status, "queue-empty", "empty queue status");
equal(buildRoomSpawnPlan({ energyAvailable: 500, spawns: [], jobs: queueJobs }).status, "no-idle-spawn", "no idle Spawn status");
const onePlan = buildRoomSpawnPlan({ energyAvailable: 300, spawns: idleSpawns, jobs: queueJobs });
equal(onePlan.assignments.length, 1, "one affordable assignment");
equal(onePlan.assignments[0].jobId, "j1", "high priority assigned first");
const twoPlan = buildRoomSpawnPlan({ energyAvailable: 500, spawns: idleSpawns, jobs: queueJobs });
equal(twoPlan.assignments.length, 2, "two assignments share one budget");
equal(twoPlan.remainingPlannedEnergy, 0, "planned Energy deducted locally");
const headBlocked = buildRoomSpawnPlan({ energyAvailable: 200, spawns: idleSpawns, jobs: queueJobs });
equal(headBlocked.status, "waiting-for-room-energy", "expensive head blocks cheap lower request");
equal(buildRoomSpawnPlan({ energyAvailable: 500, spawns: idleSpawns, jobs: queueJobs, existingNames: new Set(["High"]) }).status, "name-now-exists", "late name conflict blocks plan");

// Finalization and observation: 8 assertions.
function roomStateForPlan() {
  return { finalizedTick: null, jobs: queueJobs.map((job) => ({ ...job })), submissions: [] };
}
let state = roomStateForPlan();
let finalized = finalizePlannedBatch({
  gameTime: 10,
  roomState: state,
  plan: twoPlan,
  spawnStates: {
    s1: { busy: false, dryRunResult: OK, result: OK },
    s2: { busy: false, dryRunResult: OK, result: OK },
  },
});
equal(finalized.status, "batch-submitted", "successful batch status");
equal(finalized.attempts.length, 2, "each idle Spawn receives at most one attempt");
equal(finalizePlannedBatch({ gameTime: 10, roomState: state, plan: twoPlan, spawnStates: {} }).status, "already-finalized-this-tick", "same-tick finalization is idempotent");
state = roomStateForPlan();
equal(finalizePlannedBatch({ gameTime: 11, roomState: state, plan: twoPlan, spawnStates: { s1: { busy: true }, s2: { busy: false, dryRunResult: OK, result: OK } } }).attempts.length, 1, "busy head stops lower submission");
state = roomStateForPlan();
equal(finalizePlannedBatch({ gameTime: 12, roomState: state, plan: twoPlan, spawnStates: { s1: { busy: false, dryRunResult: ERR_BUSY }, s2: { busy: false, dryRunResult: OK, result: OK } } }).attempts.length, 1, "dryRun rejection stops lower submission");
state = roomStateForPlan();
equal(finalizePlannedBatch({ gameTime: 13, roomState: state, plan: twoPlan, spawnStates: { s1: { busy: false, dryRunResult: OK, result: ERR_NOT_ENOUGH_ENERGY }, s2: { busy: false, dryRunResult: OK, result: OK } } }).attempts.length, 1, "final rejection stops lower submission");
const submission = { name: "High", submittedAt: 20, needTime: 9 };
equal(observeSubmission(submission, 21, { spawningName: "High" }, { spawning: true }), "confirmed-spawning", "exact Spawn and Creep confirm spawning");
equal(observeSubmission(submission, 31, { spawningName: null }, { spawning: false }), "born", "non-spawning Creep confirms birth");

assert.equal(assertions, 48, `expected 48 assertions, got ${assertions}`);
const syntaxBlocks = validateRepositoryIntegration();
console.log(`Multiple Spawn queue simulations passed: ${assertions} assertions, ${syntaxBlocks} JavaScript blocks.`);
