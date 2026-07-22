import assert from "node:assert/strict";

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

console.log(
  "批次模拟通过：screeps-creep-working-state-capacity — 总容量为0时拒绝，两阶段边界与中间值保持符合文章规则。",
);
