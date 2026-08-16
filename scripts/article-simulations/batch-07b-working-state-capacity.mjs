import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function getNextWorkingState(input) {
  const {
    usedEnergy,
    freeEnergyCapacity,
    totalEnergyCapacity,
    previousWorking,
  } = input;

  if (
    !Number.isFinite(usedEnergy)
    || !Number.isFinite(freeEnergyCapacity)
    || !Number.isFinite(totalEnergyCapacity)
    || usedEnergy < 0
    || freeEnergyCapacity < 0
    || totalEnergyCapacity <= 0
  ) {
    return {
      valid: false,
      working: false,
      reason: "invalid-store-values",
    };
  }

  if (usedEnergy === 0) {
    return {
      valid: true,
      working: false,
      reason: "energy-empty",
    };
  }

  if (freeEnergyCapacity === 0) {
    return {
      valid: true,
      working: true,
      reason: "energy-full",
    };
  }

  return {
    valid: true,
    working: previousWorking === true,
    reason: "keep-previous-state",
  };
}

function applyWorkingState(memory, decision, tick) {
  if (!decision.valid) {
    return { changed: false, working: memory.working };
  }

  const changed = memory.working !== decision.working;
  if (changed) {
    memory.working = decision.working;
    memory.workingChangedAt = tick;
    memory.lastStateReason = decision.reason;
  }

  return { changed, working: decision.working };
}

assert.equal(getNextWorkingState({
  usedEnergy: 0,
  freeEnergyCapacity: 0,
  totalEnergyCapacity: 0,
  previousWorking: false,
}).reason, "invalid-store-values");

assert.equal(getNextWorkingState({
  usedEnergy: 0,
  freeEnergyCapacity: 50,
  totalEnergyCapacity: 50,
  previousWorking: true,
}).working, false);

assert.equal(getNextWorkingState({
  usedEnergy: 50,
  freeEnergyCapacity: 0,
  totalEnergyCapacity: 50,
  previousWorking: false,
}).working, true);

assert.equal(getNextWorkingState({
  usedEnergy: 20,
  freeEnergyCapacity: 30,
  totalEnergyCapacity: 50,
  previousWorking: true,
}).working, true);

assert.equal(getNextWorkingState({
  usedEnergy: 20,
  freeEnergyCapacity: 30,
  totalEnergyCapacity: 50,
  previousWorking: undefined,
}).working, false);

assert.equal(getNextWorkingState({
  usedEnergy: -1,
  freeEnergyCapacity: 51,
  totalEnergyCapacity: 50,
  previousWorking: false,
}).valid, false);

assert.equal(getNextWorkingState({
  usedEnergy: Number.NaN,
  freeEnergyCapacity: 50,
  totalEnergyCapacity: 50,
  previousWorking: false,
}).valid, false);

const stableMemory = {
  working: false,
  workingChangedAt: 100,
  lastStateReason: "energy-empty",
};
const stableDecision = getNextWorkingState({
  usedEnergy: 20,
  freeEnergyCapacity: 30,
  totalEnergyCapacity: 50,
  previousWorking: false,
});
assert.deepEqual(
  applyWorkingState(stableMemory, stableDecision, 200),
  { changed: false, working: false },
);
assert.deepEqual(stableMemory, {
  working: false,
  workingChangedAt: 100,
  lastStateReason: "energy-empty",
});

const transitionMemory = { working: false };
const transitionDecision = getNextWorkingState({
  usedEnergy: 50,
  freeEnergyCapacity: 0,
  totalEnergyCapacity: 50,
  previousWorking: false,
});
assert.deepEqual(
  applyWorkingState(transitionMemory, transitionDecision, 300),
  { changed: true, working: true },
);
assert.deepEqual(transitionMemory, {
  working: true,
  workingChangedAt: 300,
  lastStateReason: "energy-full",
});

const initialPartialMemory = {};
const initialPartialDecision = getNextWorkingState({
  usedEnergy: 20,
  freeEnergyCapacity: 30,
  totalEnergyCapacity: 50,
  previousWorking: undefined,
});
assert.deepEqual(
  applyWorkingState(initialPartialMemory, initialPartialDecision, 400),
  { changed: true, working: false },
);
assert.deepEqual(initialPartialMemory, {
  working: false,
  workingChangedAt: 400,
  lastStateReason: "keep-previous-state",
});

const article = fs.readFileSync(
  path.join(
    process.cwd(),
    "content",
    "posts",
    "screeps-creep-working-state.md",
  ),
  "utf8",
);

for (const requiredText of [
  "creep.store.getFreeCapacity(",
  "当前 Source `Creep.harvest()` 的返回码边界里**没有 `ERR_FULL`**",
  "workingChangedAt",
  "previousWorking !== decision.working",
  "consoleTested: false",
  "liveTested: false",
  'checkedAt: "2026-08-16"',
]) {
  assert.ok(
    article.includes(requiredText),
    `working-state article missing required boundary: ${requiredText}`,
  );
}

assert.ok(
  !/^\| `ERR_FULL` \|/m.test(article),
  "working-state article must not list ERR_FULL as a harvest return-code row",
);
assert.ok(
  !article.includes("`ERR_FULL` | Creep没有剩余容量"),
  "working-state article reintroduced the stale harvest capacity row",
);

console.log(
  "批次模拟通过：screeps-creep-working-state-capacity — 总容量为0拒绝、两阶段滞回、首次部分Energy、仅状态变化时写Memory，以及Source harvest无ERR_FULL返回码表均符合文章规则。",
);
