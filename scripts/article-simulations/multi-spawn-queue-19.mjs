import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const chinesePath = path.join(
  root,
  "content/posts/screeps-multi-spawn-queue.md",
);
const englishPath = path.join(
  root,
  "src/app/(en)/en/blog/screeps-multi-spawn-queue/page.tsx",
);
const registryPath = path.join(
  root,
  "src/lib/english-link-source-registry-18.ts",
);
const knowledgePath = path.join(
  root,
  "src/lib/knowledge-base.ts",
);
const discoveryPath = path.join(
  root,
  "src/lib/english-discovery-topic-overrides-20260806.ts",
);

const chinese = fs.readFileSync(chinesePath, "utf8");
const english = fs.readFileSync(englishPath, "utf8");
const registry = fs.readFileSync(registryPath, "utf8");
const knowledge = fs.readFileSync(knowledgePath, "utf8");
const discovery = fs.readFileSync(discoveryPath, "utf8");
const failures = [];

for (const expected of [
  "Screeps 多 Spawn 队列怎么设计",
  "requestKey",
  "submitted-locally",
  "spawning-observed",
  "creep-released",
  "dryRun: true",
  "reservedEnergy",
  "consoleTested: false",
  "liveTested: false",
]) {
  if (!chinese.includes(expected)) {
    failures.push(`Chinese article lacks ${expected}`);
  }
}

for (const expected of [
  "Screeps Multi-Spawn Queue: Priority, Deduplication, and Shared Energy",
  "Centralize demand before touching a Spawn",
  "reserveEnergy",
  "submitted-locally",
  "Screeps Console test",
  "Official-shard multi-Spawn test",
  "Pending",
  "EnglishArticlePage",
  "BlogPosting",
]) {
  if (!english.includes(expected)) {
    failures.push(`English page lacks ${expected}`);
  }
}

for (const expected of [
  'href: "/en/blog/screeps-multi-spawn-queue"',
  'chinesePath: "/blog/screeps-multi-spawn-queue"',
  "finalScore: 98",
]) {
  if (!registry.includes(expected)) {
    failures.push(`English registry lacks ${expected}`);
  }
}

if (!knowledge.includes('"screeps-multi-spawn-queue"')) {
  failures.push("Chinese knowledge module lacks the multi-Spawn queue slug");
}
if (!discovery.includes('"/en/blog/screeps-multi-spawn-queue"')) {
  failures.push("English discovery lacks the multi-Spawn queue path");
}
for (const tag of ["spawn", "creeps", "automation", "debugging"]) {
  if (!discovery.includes(`"${tag}"`)) {
    failures.push(`English discovery lacks the ${tag} topic`);
  }
}

const chineseBlocks = [...chinese.matchAll(/```js\n([\s\S]*?)```/g)]
  .map((match) => match[1]);
const englishBlocks = [...english.matchAll(
  /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
)].map((match) => match[1]
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&"));
const blocks = [...chineseBlocks, ...englishBlocks];

if (chineseBlocks.length < 15) {
  failures.push(`Chinese JavaScript block count is only ${chineseBlocks.length}`);
}
if (englishBlocks.length < 10) {
  failures.push(`English JavaScript block count is only ${englishBlocks.length}`);
}

const tempDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "multi-spawn-queue-19-"),
);
try {
  blocks.forEach((code, index) => {
    const filePath = path.join(
      tempDirectory,
      `block-${index + 1}.js`,
    );
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(
      process.execPath,
      ["--check", filePath],
      { encoding: "utf8" },
    );

    if (result.status !== 0) {
      failures.push(
        `JavaScript block ${index + 1} failed syntax: ${result.stderr.trim()}`,
      );
    }
  });
} finally {
  fs.rmSync(tempDirectory, {
    recursive: true,
    force: true,
  });
}

function fingerprint(request) {
  return JSON.stringify({
    roomName: request.roomName,
    role: request.role,
    body: request.body,
  });
}

function deduplicate(requests) {
  const byKey = new Map();
  const conflicts = [];

  for (const request of requests) {
    const previous = byKey.get(request.requestKey);
    if (!previous) {
      byKey.set(request.requestKey, request);
      continue;
    }
    if (fingerprint(previous) !== fingerprint(request)) {
      conflicts.push(request.requestKey);
      continue;
    }
    if (
      request.priority > previous.priority
      || (
        request.priority === previous.priority
        && request.createdAt < previous.createdAt
      )
    ) {
      byKey.set(request.requestKey, request);
    }
  }

  return {
    requests: [...byKey.values()],
    conflicts,
  };
}

const deduplicated = deduplicate([
  {
    requestKey: "harvester:0",
    roomName: "W1N1",
    role: "harvester",
    body: ["work", "carry", "move"],
    priority: 700,
    createdAt: 10,
  },
  {
    requestKey: "harvester:0",
    roomName: "W1N1",
    role: "harvester",
    body: ["work", "carry", "move"],
    priority: 800,
    createdAt: 11,
  },
  {
    requestKey: "upgrader:0",
    roomName: "W1N1",
    role: "upgrader",
    body: ["work", "carry", "move"],
    priority: 400,
    createdAt: 9,
  },
  {
    requestKey: "upgrader:0",
    roomName: "W1N1",
    role: "upgrader",
    body: ["work", "move"],
    priority: 400,
    createdAt: 9,
  },
]);
if (deduplicated.requests.length !== 2) {
  failures.push("Deduplication did not retain exactly two business requests");
}
if (deduplicated.requests.find((item) => item.requestKey === "harvester:0")?.priority !== 800) {
  failures.push("Deduplication did not retain the higher-priority equivalent request");
}
if (deduplicated.conflicts.join(",") !== "upgrader:0") {
  failures.push("Fingerprint conflict was not preserved");
}

function effectivePriority(request, now, waitStep = 50, maxBonus = 100) {
  return request.priority + Math.min(
    maxBonus,
    Math.floor(Math.max(0, now - request.createdAt) / waitStep),
  );
}
if (effectivePriority({ priority: 400, createdAt: 0 }, 10000) !== 500) {
  failures.push("Priority aging did not stop at its configured cap");
}

const sorted = [
  { requestKey: "b", priority: 700, createdAt: 20 },
  { requestKey: "a", priority: 700, createdAt: 10 },
  { requestKey: "c", priority: 900, createdAt: 30 },
].sort((left, right) =>
  right.priority - left.priority
  || left.createdAt - right.createdAt
  || left.requestKey.localeCompare(right.requestKey)
);
if (sorted.map((item) => item.requestKey).join(",") !== "c,a,b") {
  failures.push("Stable Spawn request priority order failed");
}

function createBudget(energy) {
  return {
    observedEnergy: energy,
    reservedEnergy: 0,
  };
}
function remaining(budget) {
  return budget.observedEnergy - budget.reservedEnergy;
}
function reserve(budget, amount) {
  if (amount <= 0 || amount > remaining(budget)) return false;
  budget.reservedEnergy += amount;
  return true;
}
const budget = createBudget(800);
if (!reserve(budget, 500) || reserve(budget, 400) || !reserve(budget, 300)) {
  failures.push("Shared room Energy reservation cases failed");
}
if (budget.reservedEnergy !== 800 || remaining(budget) !== 0) {
  failures.push("Shared room Energy budget totals are incorrect");
}

function assign(spawnNames, requestKeys) {
  const assigned = new Set();
  const outcomes = [];

  for (const requestKey of requestKeys) {
    const spawnName = spawnNames.find((name) => !assigned.has(name));
    if (!spawnName) {
      outcomes.push({ requestKey, status: "no-idle-spawn" });
      continue;
    }
    assigned.add(spawnName);
    outcomes.push({ requestKey, status: "submitted-locally", spawnName });
  }

  return outcomes;
}
const assignments = assign(["Spawn1", "Spawn2"], ["a", "b", "c"]);
if (assignments.filter((item) => item.status === "submitted-locally").length !== 2) {
  failures.push("Exactly two idle Spawns were not assigned");
}
if (new Set(assignments.map((item) => item.spawnName).filter(Boolean)).size !== 2) {
  failures.push("One Spawn was assigned more than once");
}
if (assignments.at(-1)?.status !== "no-idle-spawn") {
  failures.push("The excess request was not retained as no-idle-spawn");
}

function verify({ spawnName, expectedName, creepExists, creepSpawning }) {
  if (spawnName === expectedName) return "spawning-observed";
  if (creepExists) return creepSpawning
    ? "spawning-creep-observed"
    : "creep-released";
  return "not-observed-yet";
}
for (const [input, expected] of [
  [{ spawnName: "Worker1", expectedName: "Worker1", creepExists: true, creepSpawning: true }, "spawning-observed"],
  [{ spawnName: null, expectedName: "Worker1", creepExists: true, creepSpawning: true }, "spawning-creep-observed"],
  [{ spawnName: null, expectedName: "Worker1", creepExists: true, creepSpawning: false }, "creep-released"],
  [{ spawnName: null, expectedName: "Worker1", creepExists: false, creepSpawning: false }, "not-observed-yet"],
]) {
  if (verify(input) !== expected) {
    failures.push(`Pending verification failed for ${expected}`);
  }
}

function timedOut(submittedAt, now, timeoutTicks = 2) {
  return now - submittedAt >= timeoutTicks;
}
if (timedOut(100, 101) || !timedOut(100, 102)) {
  failures.push("Pending timeout boundary failed");
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nMulti-Spawn queue simulation failed: ${failures.length} finding(s).`);
  process.exit(1);
}

console.log(
  `Multi-Spawn queue simulation passed: ${chineseBlocks.length} Chinese and ${englishBlocks.length} English JavaScript blocks, registry and knowledge integration, deduplication, stable priority, bounded aging, shared Energy reservation, one-assignment-per-Spawn, and later pending-state verification.`,
);
