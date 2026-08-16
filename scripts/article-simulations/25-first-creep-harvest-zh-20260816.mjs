import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const article = fs.readFileSync(
  path.join(root, "content", "posts", "screeps-first-creep-harvest.md"),
  "utf8",
);

function chooseBeginnerHarvestAction({
  creepExists,
  sourceExists,
  freeEnergyCapacity,
  harvestResult,
}) {
  if (!creepExists) return "creep-missing";
  if (!sourceExists) return "source-missing";
  if (!Number.isFinite(freeEnergyCapacity) || freeEnergyCapacity < 0) {
    return "invalid-store-state";
  }
  if (freeEnergyCapacity === 0) return "store-full-stop";

  if (harvestResult === "ERR_NOT_IN_RANGE") return "move-to-source";
  if (harvestResult === "ERR_NOT_ENOUGH_RESOURCES") return "wait-source";
  if (harvestResult === "OK") return "harvest-accepted";
  return `report:${harvestResult}`;
}

assert.equal(
  chooseBeginnerHarvestAction({
    creepExists: false,
    sourceExists: true,
    freeEnergyCapacity: 50,
    harvestResult: "OK",
  }),
  "creep-missing",
);
assert.equal(
  chooseBeginnerHarvestAction({
    creepExists: true,
    sourceExists: false,
    freeEnergyCapacity: 50,
    harvestResult: "OK",
  }),
  "source-missing",
);
assert.equal(
  chooseBeginnerHarvestAction({
    creepExists: true,
    sourceExists: true,
    freeEnergyCapacity: 0,
    harvestResult: "OK",
  }),
  "store-full-stop",
);
assert.equal(
  chooseBeginnerHarvestAction({
    creepExists: true,
    sourceExists: true,
    freeEnergyCapacity: 1,
    harvestResult: "ERR_NOT_IN_RANGE",
  }),
  "move-to-source",
);
assert.equal(
  chooseBeginnerHarvestAction({
    creepExists: true,
    sourceExists: true,
    freeEnergyCapacity: 50,
    harvestResult: "ERR_NOT_ENOUGH_RESOURCES",
  }),
  "wait-source",
);
assert.equal(
  chooseBeginnerHarvestAction({
    creepExists: true,
    sourceExists: true,
    freeEnergyCapacity: 50,
    harvestResult: "OK",
  }),
  "harvest-accepted",
);
assert.equal(
  chooseBeginnerHarvestAction({
    creepExists: true,
    sourceExists: true,
    freeEnergyCapacity: 50,
    harvestResult: "ERR_NO_BODYPART",
  }),
  "report:ERR_NO_BODYPART",
);
assert.equal(
  chooseBeginnerHarvestAction({
    creepExists: true,
    sourceExists: true,
    freeEnergyCapacity: Number.NaN,
    harvestResult: "OK",
  }),
  "invalid-store-state",
);

for (const requiredText of [
  "creep.store.getFreeCapacity(RESOURCE_ENERGY)",
  "当前官方 `Creep.harvest()` 的返回码里**没有 `ERR_FULL`**",
  "result === ERR_NOT_IN_RANGE",
  "result !== ERR_NOT_ENOUGH_RESOURCES",
  "creep.getActiveBodyparts(WORK)",
  "consoleTested: false",
  "liveTested: false",
  'checkedAt: "2026-08-16"',
]) {
  assert.ok(
    article.includes(requiredText),
    `first harvest article missing required boundary: ${requiredText}`,
  );
}

// The article intentionally shows `harvest(source) === ERR_FULL` as a bad
// example, so the guard targets only executable/recommendation patterns that
// would teach ERR_FULL as a real Source-harvest capacity result.
for (const forbiddenText of [
  "result !== ERR_FULL",
  "Store 没有空余空间时，`harvest()` 会返回 `ERR_FULL`",
  "`ERR_FULL` | Creep 的 Store 已经没有空余空间",
]) {
  assert.ok(
    !article.includes(forbiddenText),
    `first harvest article reintroduced stale ERR_FULL teaching: ${forbiddenText}`,
  );
}

assert.ok(
  !/^\| `ERR_FULL` \|/m.test(article),
  "first harvest article must not list ERR_FULL as a harvest return-code row",
);

console.log(
  "中文 first harvest 模拟通过：Creep/Source 判空、Store 满停止、Source harvest OK/距离/资源不足/异常返回值与 ERR_FULL 防回归均通过。",
);
