import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const articlePath = path.join(
  root,
  "content",
  "posts",
  "screeps-creep-body-parts.md",
);
const article = fs.readFileSync(articlePath, "utf8");

function getActiveBodyparts(body, type) {
  return body.filter(
    (part) => part.type === type && Number(part.hits) > 0,
  ).length;
}

function getWorkerSnapshot({ body, usedEnergy, freeEnergyCapacity, fatigue }) {
  return {
    work: getActiveBodyparts(body, "work"),
    carry: getActiveBodyparts(body, "carry"),
    move: getActiveBodyparts(body, "move"),
    usedEnergy,
    freeEnergyCapacity,
    fatigue,
  };
}

function chooseEnergyPhase(freeEnergyCapacity) {
  if (!Number.isFinite(freeEnergyCapacity) || freeEnergyCapacity < 0) {
    return "invalid-store-state";
  }
  return freeEnergyCapacity > 0 ? "harvest" : "deliver";
}

function evaluateSourceHarvest({
  my = true,
  spawning = false,
  activeWork = 1,
  targetValid = true,
  sourceEnergy = 3000,
  inRange = true,
  controllerAccess = true,
}) {
  if (!my) return "ERR_NOT_OWNER";
  if (spawning) return "ERR_BUSY";
  if (activeWork <= 0) return "ERR_NO_BODYPART";
  if (!targetValid) return "ERR_INVALID_TARGET";
  if (sourceEnergy <= 0) return "ERR_NOT_ENOUGH_RESOURCES";
  if (!inRange) return "ERR_NOT_IN_RANGE";
  if (!controllerAccess) return "ERR_NOT_OWNER";
  return "OK";
}

const body = [
  { type: "work", hits: 100 },
  { type: "work", hits: 0 },
  { type: "carry", hits: 100 },
  { type: "move", hits: 100 },
  { type: "move", hits: 0 },
];

assert.equal(getActiveBodyparts(body, "work"), 1);
assert.equal(getActiveBodyparts(body, "carry"), 1);
assert.equal(getActiveBodyparts(body, "move"), 1);
assert.equal(getActiveBodyparts(body, "attack"), 0);

assert.deepEqual(
  getWorkerSnapshot({
    body,
    usedEnergy: 40,
    freeEnergyCapacity: 10,
    fatigue: 2,
  }),
  {
    work: 1,
    carry: 1,
    move: 1,
    usedEnergy: 40,
    freeEnergyCapacity: 10,
    fatigue: 2,
  },
);

assert.equal(chooseEnergyPhase(50), "harvest");
assert.equal(chooseEnergyPhase(1), "harvest");
assert.equal(chooseEnergyPhase(0), "deliver");
assert.equal(chooseEnergyPhase(-1), "invalid-store-state");
assert.equal(chooseEnergyPhase(Number.NaN), "invalid-store-state");

assert.equal(evaluateSourceHarvest({}), "OK");
assert.equal(evaluateSourceHarvest({ my: false }), "ERR_NOT_OWNER");
assert.equal(evaluateSourceHarvest({ spawning: true }), "ERR_BUSY");
assert.equal(
  evaluateSourceHarvest({ activeWork: 0 }),
  "ERR_NO_BODYPART",
);
assert.equal(
  evaluateSourceHarvest({ targetValid: false }),
  "ERR_INVALID_TARGET",
);
assert.equal(
  evaluateSourceHarvest({ sourceEnergy: 0 }),
  "ERR_NOT_ENOUGH_RESOURCES",
);
assert.equal(
  evaluateSourceHarvest({ inRange: false }),
  "ERR_NOT_IN_RANGE",
);
assert.equal(
  evaluateSourceHarvest({ controllerAccess: false }),
  "ERR_NOT_OWNER",
);

// Store capacity is an application phase boundary for the beginner loop.
// It is intentionally not an ERR_FULL branch in the Source harvest preflight.
assert.equal(
  evaluateSourceHarvest({ activeWork: 1, sourceEnergy: 3000, inRange: true }),
  "OK",
);
assert.ok(!evaluateSourceHarvest({}).includes("ERR_FULL"));

for (const requiredText of [
  "creep.getActiveBodyparts(WORK)",
  "creep.store.getFreeCapacity(RESOURCE_ENERGY)",
  "当前官方 `Creep.harvest()` 返回码中**没有 `ERR_FULL`**",
  "不要用 `harvest() === ERR_FULL` 判断采集阶段结束",
  "creep.pickup(resource)",
  "creep.withdraw(target, resourceType)",
  "creep.transfer(target, resourceType)",
  "consoleTested: false",
  "liveTested: false",
  'checkedAt: "2026-08-16"',
]) {
  assert.ok(
    article.includes(requiredText),
    `article missing required boundary: ${requiredText}`,
  );
}

for (const forbiddenText of [
  "继续执行 `harvest()` 会得到 `ERR_FULL`",
  "harvest(source) === ERR_FULL",
  "harvest() === ERR_FULL) {",
]) {
  assert.ok(
    !article.includes(forbiddenText),
    `article reintroduced stale harvest capacity claim: ${forbiddenText}`,
  );
}

console.log(
  "中文 Creep body parts 模拟通过：active WORK/CARRY/MOVE、受损部件、Store 阶段判断、Source harvest 返回码边界与 ERR_FULL 误归因防回归均通过。",
);
