import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  evaluateCpuBudget,
  getModeledCpuTickLimit,
} from "../src/lib/tick-lab-cpu.ts";
import {
  evaluateSpawnCreep,
  evaluateTransfer,
} from "../src/lib/tick-lab.ts";

const root = process.cwd();

const transferCases = [
  {
    name: "full transfer",
    input: { range: 1, creepEnergy: 50, targetFreeCapacity: 50 },
    expected: { returnName: "OK", returnCode: 0, intentSubmitted: true, transferred: 50, nextCreepEnergy: 0, nextTargetFreeCapacity: 0 },
  },
  {
    name: "partial transfer when target has less free capacity",
    input: { range: 1, creepEnergy: 50, targetFreeCapacity: 20 },
    expected: { returnName: "OK", returnCode: 0, intentSubmitted: true, transferred: 20, nextCreepEnergy: 30, nextTargetFreeCapacity: 0 },
  },
  {
    name: "range failure",
    input: { range: 2, creepEnergy: 50, targetFreeCapacity: 50 },
    expected: { returnName: "ERR_NOT_IN_RANGE", returnCode: -9, intentSubmitted: false, transferred: 0, nextCreepEnergy: 50, nextTargetFreeCapacity: 50 },
  },
  {
    name: "resource failure",
    input: { range: 1, creepEnergy: 0, targetFreeCapacity: 50 },
    expected: { returnName: "ERR_NOT_ENOUGH_RESOURCES", returnCode: -6, intentSubmitted: false, transferred: 0, nextCreepEnergy: 0, nextTargetFreeCapacity: 50 },
  },
  {
    name: "capacity failure",
    input: { range: 1, creepEnergy: 50, targetFreeCapacity: 0 },
    expected: { returnName: "ERR_FULL", returnCode: -8, intentSubmitted: false, transferred: 0, nextCreepEnergy: 50, nextTargetFreeCapacity: 0 },
  },
  {
    name: "range is checked before resources in the constrained model",
    input: { range: 3, creepEnergy: 0, targetFreeCapacity: 0 },
    expected: { returnName: "ERR_NOT_IN_RANGE", returnCode: -9, intentSubmitted: false, transferred: 0, nextCreepEnergy: 0, nextTargetFreeCapacity: 0 },
  },
  {
    name: "resources are checked before target fullness in the constrained model",
    input: { range: 1, creepEnergy: 0, targetFreeCapacity: 0 },
    expected: { returnName: "ERR_NOT_ENOUGH_RESOURCES", returnCode: -6, intentSubmitted: false, transferred: 0, nextCreepEnergy: 0, nextTargetFreeCapacity: 0 },
  },
];

for (const testCase of transferCases) {
  const result = evaluateTransfer(testCase.input);
  for (const [key, value] of Object.entries(testCase.expected)) {
    assert.equal(result[key], value, `${testCase.name}: ${key}`);
  }
}

const spawnCases = [
  {
    name: "standard Worker spawn",
    input: { bodyPreset: "worker", energyAvailable: 300, spawnBusy: false, nameExists: false },
    expected: { returnName: "OK", returnCode: 0, intentSubmitted: true, bodyCost: 200, spawnTime: 9, nextEnergyAvailable: 100, nextSpawnBusy: true, spawningName: "Worker1" },
  },
  {
    name: "exact energy still schedules the spawn",
    input: { bodyPreset: "worker", energyAvailable: 200, spawnBusy: false, nameExists: false },
    expected: { returnName: "OK", returnCode: 0, intentSubmitted: true, bodyCost: 200, spawnTime: 9, nextEnergyAvailable: 0, nextSpawnBusy: true, spawningName: "Worker1" },
  },
  {
    name: "Builder body exposes energy shortage",
    input: { bodyPreset: "builder", energyAvailable: 250, spawnBusy: false, nameExists: false },
    expected: { returnName: "ERR_NOT_ENOUGH_ENERGY", returnCode: -6, intentSubmitted: false, bodyCost: 300, spawnTime: 12, nextEnergyAvailable: 250, nextSpawnBusy: false, spawningName: null },
  },
  {
    name: "busy Spawn is checked before energy",
    input: { bodyPreset: "worker", energyAvailable: 0, spawnBusy: true, nameExists: false },
    expected: { returnName: "ERR_BUSY", returnCode: -4, intentSubmitted: false, bodyCost: 200, nextEnergyAvailable: 0, nextSpawnBusy: true, spawningName: null },
  },
  {
    name: "name conflict is checked before busy and energy",
    input: { bodyPreset: "worker", energyAvailable: 0, spawnBusy: true, nameExists: true },
    expected: { returnName: "ERR_NAME_EXISTS", returnCode: -3, intentSubmitted: false, bodyCost: 200, nextEnergyAvailable: 0, nextSpawnBusy: true, spawningName: null },
  },
  {
    name: "Hauler cost and official three-ticks-per-part spawn time",
    input: { bodyPreset: "hauler", energyAvailable: 250, spawnBusy: false, nameExists: false },
    expected: { returnName: "OK", returnCode: 0, intentSubmitted: true, bodyCost: 250, spawnTime: 15, nextEnergyAvailable: 0, nextSpawnBusy: true, spawningName: "Worker1" },
  },
];

for (const testCase of spawnCases) {
  const result = evaluateSpawnCreep(testCase.input);
  for (const [key, value] of Object.entries(testCase.expected)) {
    assert.equal(result[key], value, `${testCase.name}: ${key}`);
  }
}

const cpuCases = [
  {
    name: "unused baseline CPU replenishes bucket",
    input: { bucket: 4000, used: 40, plannedTaskCost: 20 },
    expected: { limit: 100, tickLimit: 500, decision: "RUN", taskRuns: true, modeledTotalUsed: 60, bucketDelta: 40, nextBucket: 4040, bucketDirection: "replenish", wouldExceedTickLimitIfForced: false },
  },
  {
    name: "exact baseline keeps bucket steady",
    input: { bucket: 4000, used: 60, plannedTaskCost: 40 },
    expected: { tickLimit: 500, decision: "RUN", modeledTotalUsed: 100, bucketDelta: 0, nextBucket: 4000, bucketDirection: "steady" },
  },
  {
    name: "CPU above baseline spends bucket reserve",
    input: { bucket: 4000, used: 80, plannedTaskCost: 120 },
    expected: { tickLimit: 500, decision: "RUN", modeledTotalUsed: 200, bucketDelta: -100, nextBucket: 3900, bucketDirection: "spend" },
  },
  {
    name: "exact tickLimit can consume the available reserve",
    input: { bucket: 400, used: 350, plannedTaskCost: 150 },
    expected: { tickLimit: 500, headroomBeforeTask: 150, decision: "RUN", modeledTotalUsed: 500, bucketDelta: -400, nextBucket: 0, bucketDirection: "spend" },
  },
  {
    name: "local guard skips an optional task that would exceed tickLimit",
    input: { bucket: 50, used: 100, plannedTaskCost: 80 },
    expected: { tickLimit: 150, headroomBeforeTask: 50, decision: "SKIP", taskRuns: false, modeledTotalUsed: 100, bucketDelta: 0, nextBucket: 50, wouldExceedTickLimitIfForced: true },
  },
  {
    name: "empty bucket collapses tickLimit to baseline limit",
    input: { bucket: 0, used: 70, plannedTaskCost: 30 },
    expected: { tickLimit: 100, decision: "RUN", modeledTotalUsed: 100, bucketDelta: 0, nextBucket: 0 },
  },
  {
    name: "full bucket caps tickLimit and cannot replenish beyond 10000",
    input: { bucket: 10000, used: 20, plannedTaskCost: 20 },
    expected: { tickLimit: 500, decision: "RUN", modeledTotalUsed: 40, bucketDelta: 0, nextBucket: 10000, bucketDirection: "steady" },
  },
];

for (const testCase of cpuCases) {
  const result = evaluateCpuBudget(testCase.input);
  for (const [key, value] of Object.entries(testCase.expected)) {
    assert.equal(result[key], value, `${testCase.name}: ${key}`);
  }
}

assert.equal(getModeledCpuTickLimit(0), 100, "empty bucket tickLimit");
assert.equal(getModeledCpuTickLimit(50), 150, "partial reserve tickLimit");
assert.equal(getModeledCpuTickLimit(400), 500, "500 CPU tickLimit cap");
assert.throws(
  () => evaluateCpuBudget({ bucket: 0, used: 110, plannedTaskCost: 0 }),
  /used cannot exceed/,
  "inconsistent CPU snapshots fail closed",
);

const requiredFiles = [
  "src/app/(zh)/tick-lab/page.tsx",
  "src/app/(en)/en/tick-lab/page.tsx",
  "src/components/tick-lab/tick-lab.tsx",
  "src/components/tick-lab/transfer-experiment.tsx",
  "src/components/tick-lab/spawn-creep-experiment.tsx",
  "src/components/tick-lab/spawn-creep-experiment.module.css",
  "src/components/tick-lab/cpu-bucket-experiment.tsx",
  "src/components/tick-lab/tick-lab.module.css",
  "src/lib/tick-lab-cpu.ts",
];
for (const relativePath of requiredFiles) {
  assert.equal(fs.existsSync(path.join(root, relativePath)), true, `missing ${relativePath}`);
}

const componentSources = [
  "src/components/tick-lab/tick-lab.tsx",
  "src/components/tick-lab/transfer-experiment.tsx",
  "src/components/tick-lab/spawn-creep-experiment.tsx",
  "src/components/tick-lab/cpu-bucket-experiment.tsx",
].map((relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8")).join("\n");

assert.match(componentSources, /Deterministic educational model/);
assert.match(componentSources, /intentSubmitted/);
assert.match(componentSources, /presetGrid/);
assert.match(componentSources, /StructureSpawn\.spawnCreep\(\)/);
assert.match(componentSources, /nameExists/);
assert.match(componentSources, /spawnBusy/);
assert.match(componentSources, /Game\.cpu/);
assert.match(componentSources, /plannedTaskCost/);
assert.match(componentSources, /Budget Decision/);
assert.match(componentSources, /not a Screeps API return code or intent/);
assert.match(componentSources, /\/verified/);
assert.match(componentSources, /\/en\/verified/);
assert.doesNotMatch(componentSources, /eval\s*\(/);
assert.doesNotMatch(componentSources, /new\s+Function\s*\(/);

const i18nSource = fs.readFileSync(path.join(root, "src/lib/i18n.ts"), "utf8");
assert.match(i18nSource, /"\/tick-lab": "\/en\/tick-lab"/);

const sitemapSource = fs.readFileSync(path.join(root, "src/lib/sitemaps.ts"), "utf8");
assert.match(sitemapSource, /staticPageEntry\("\/tick-lab"\)/);
assert.match(sitemapSource, /staticPageEntry\("\/en\/tick-lab"\)/);

const staticRevisions = JSON.parse(fs.readFileSync(path.join(root, "src/data/static-page-revisions.json"), "utf8"));
assert.equal(staticRevisions["/tick-lab"], "2026-09-01");
assert.equal(staticRevisions["/en/tick-lab"], "2026-09-01");

console.log(`Tick Lab check passed: ${transferCases.length} transfer + ${spawnCases.length} spawnCreep + ${cpuCases.length} CPU/Bucket deterministic cases, plus route/discovery/interaction contracts.`);
