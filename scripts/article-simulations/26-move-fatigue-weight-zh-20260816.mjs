import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const MOVE = "move";
const CARRY = "carry";
const WORK = "work";
const TOUGH = "tough";
const ATTACK = "attack";
const CARRY_CAPACITY = 50;

function countActiveParts(body, type) {
  return body.filter(
    (part) => part.type === type && part.hits > 0,
  ).length;
}

function countLoadedCarryParts(body, usedCapacity) {
  if (
    !Array.isArray(body)
    || !Number.isFinite(usedCapacity)
    || usedCapacity <= 0
  ) {
    return 0;
  }

  const activeCarryParts = countActiveParts(body, CARRY);
  return Math.min(
    activeCarryParts,
    Math.ceil(usedCapacity / CARRY_CAPACITY),
  );
}

function countOrdinaryWeightParts(body) {
  if (!Array.isArray(body)) return 0;
  return body.filter(
    (part) => part.type !== MOVE && part.type !== CARRY,
  ).length;
}

function countWeightParts(body, usedCapacity) {
  return countOrdinaryWeightParts(body)
    + countLoadedCarryParts(body, usedCapacity);
}

function estimate({ body, usedCapacity, terrainCost }) {
  const activeMoveParts = countActiveParts(body, MOVE);
  if (activeMoveParts <= 0) {
    return {
      movable: false,
      activeMoveParts,
      weightParts: countWeightParts(body, usedCapacity),
    };
  }

  const weightParts = countWeightParts(body, usedCapacity);
  const fatigueGenerated = weightParts * terrainCost;
  const fatigueRecoveredPerTick = activeMoveParts * 2;

  return {
    movable: true,
    activeMoveParts,
    weightParts,
    fatigueGenerated,
    fatigueRecoveredPerTick,
    estimatedTicksPerStep: Math.max(
      1,
      Math.ceil(fatigueGenerated / fatigueRecoveredPerTick),
    ),
  };
}

const damagedWorker = [
  { type: WORK, hits: 0 },
  { type: CARRY, hits: 100 },
  { type: MOVE, hits: 100 },
];

// Destroyed ordinary parts still count as movement weight.
assert.equal(countOrdinaryWeightParts(damagedWorker), 1);
assert.equal(countLoadedCarryParts(damagedWorker, 0), 0);
assert.equal(countLoadedCarryParts(damagedWorker, 50), 1);
assert.equal(countWeightParts(damagedWorker, 50), 2);
assert.deepEqual(
  estimate({ body: damagedWorker, usedCapacity: 50, terrainCost: 2 }),
  {
    movable: true,
    activeMoveParts: 1,
    weightParts: 2,
    fatigueGenerated: 4,
    fatigueRecoveredPerTick: 2,
    estimatedTicksPerStep: 2,
  },
);

const mixedOrdinary = [
  { type: WORK, hits: 0 },
  { type: TOUGH, hits: 0 },
  { type: ATTACK, hits: 100 },
  { type: MOVE, hits: 100 },
];
assert.equal(countOrdinaryWeightParts(mixedOrdinary), 3);

// Destroyed MOVE no longer contributes recovery.
const destroyedMove = [
  { type: WORK, hits: 100 },
  { type: MOVE, hits: 0 },
];
assert.deepEqual(
  estimate({ body: destroyedMove, usedCapacity: 0, terrainCost: 2 }),
  {
    movable: false,
    activeMoveParts: 0,
    weightParts: 1,
  },
);

// Only active CARRY capacity can represent loaded-resource weight.
const carryDamage = [
  { type: CARRY, hits: 0 },
  { type: CARRY, hits: 100 },
  { type: MOVE, hits: 100 },
];
assert.equal(countLoadedCarryParts(carryDamage, 0), 0);
assert.equal(countLoadedCarryParts(carryDamage, 1), 1);
assert.equal(countLoadedCarryParts(carryDamage, 50), 1);
assert.equal(countLoadedCarryParts(carryDamage, 100), 1);

const twoActiveCarry = [
  { type: CARRY, hits: 100 },
  { type: CARRY, hits: 100 },
  { type: MOVE, hits: 100 },
];
assert.equal(countLoadedCarryParts(twoActiveCarry, 1), 1);
assert.equal(countLoadedCarryParts(twoActiveCarry, 50), 1);
assert.equal(countLoadedCarryParts(twoActiveCarry, 51), 2);
assert.equal(countLoadedCarryParts(twoActiveCarry, 100), 2);

// Terrain multipliers remain road=1, plain=2, swamp=10.
assert.equal(
  estimate({ body: damagedWorker, usedCapacity: 50, terrainCost: 1 })
    .fatigueGenerated,
  2,
);
assert.equal(
  estimate({ body: damagedWorker, usedCapacity: 50, terrainCost: 2 })
    .fatigueGenerated,
  4,
);
assert.equal(
  estimate({ body: damagedWorker, usedCapacity: 50, terrainCost: 10 })
    .fatigueGenerated,
  20,
);

const article = fs.readFileSync(
  path.join(
    process.cwd(),
    "content",
    "posts",
    "screeps-move-fatigue-body-ratio.md",
  ),
  "utf8",
);

for (const requiredText of [
  "普通非 `MOVE` / 非 `CARRY` 部件：无论当前 hits 是否为 0",
  "creep.getActiveBodyparts(MOVE)",
  "countOrdinaryWeightParts",
  "countLoadedCarryParts",
  "part.type !== MOVE",
  "part.type !== CARRY",
  "consoleTested: false",
  "liveTested: false",
  'checkedAt: "2026-08-16"',
]) {
  assert.ok(
    article.includes(requiredText),
    `MOVE/fatigue article missing corrected boundary: ${requiredText}`,
  );
}

for (const stalePattern of [
  "part.hits <= 0 || part.type === MOVE",
  "part.hits > 0\n    && part.type !== MOVE\n    && part.type !== CARRY",
]) {
  assert.ok(
    !article.includes(stalePattern),
    `MOVE/fatigue article reintroduced stale destroyed-part weight logic: ${stalePattern}`,
  );
}

console.log(
  "中文 MOVE/fatigue 模拟通过：损坏普通 body entry 仍计重、active MOVE 恢复、loaded active CARRY、road/plain/swamp 与受伤组合案例均符合当前文章模型。",
);
