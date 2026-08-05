import assert from "node:assert/strict";

const TOWER_POWER_ATTACK = 600;
const TOWER_OPTIMAL_RANGE = 5;
const TOWER_FALLOFF_RANGE = 20;
const TOWER_FALLOFF = 0.75;

function towerAttackAtRange(range) {
  if (!Number.isInteger(range) || range < 0) return null;
  if (range <= TOWER_OPTIMAL_RANGE) return TOWER_POWER_ATTACK;
  if (range >= TOWER_FALLOFF_RANGE) {
    return Math.floor(TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF));
  }
  const progress =
    (range - TOWER_OPTIMAL_RANGE)
    / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);
  return Math.floor(
    TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF * progress)
  );
}

function applyTowerEffects(baseAmount, operateFactor = 0, disruptFactor = 0) {
  if (
    !Number.isFinite(baseAmount) || baseAmount < 0
    || !Number.isFinite(operateFactor) || operateFactor < 0
    || !Number.isFinite(disruptFactor) || disruptFactor < 0 || disruptFactor > 1
  ) return null;
  return Math.floor(baseAmount * (1 + operateFactor) * (1 - disruptFactor));
}

function estimateVolley(entries) {
  if (!Array.isArray(entries)) return null;
  const estimates = entries.map((entry) => {
    const base = towerAttackAtRange(entry.range);
    if (base === null) return null;
    return applyTowerEffects(base, entry.operateFactor ?? 0, entry.disruptFactor ?? 0);
  });
  if (estimates.some((value) => value === null)) return null;
  return estimates.reduce((sum, value) => sum + value, 0);
}

function verifyVolley({ now, submittedAt, towerIds, targetId, events }) {
  if (!Number.isInteger(now) || !Number.isInteger(submittedAt)) {
    return { status: "invalid-window" };
  }
  if (now !== submittedAt + 1) {
    return { status: now <= submittedAt ? "pending" : "missed-window" };
  }
  const expectedIds = new Set(towerIds);
  const attackEvents = events.filter((event) =>
    event.event === "attack"
    && expectedIds.has(event.objectId)
    && event.data?.targetId === targetId
    && event.data?.attackType === "ranged"
  );
  const matchedIds = new Set(attackEvents.map((event) => event.objectId));
  const damage = attackEvents.reduce(
    (sum, event) => sum + (Number.isFinite(event.data?.damage) ? event.data.damage : 0),
    0
  );
  const hostileHealing = events
    .filter((event) => event.event === "heal" && event.data?.targetId === targetId)
    .reduce(
      (sum, event) => sum + (Number.isFinite(event.data?.amount) ? event.data.amount : 0),
      0
    );
  return {
    status:
      matchedIds.size === expectedIds.size
        ? "verified"
        : matchedIds.size > 0
          ? "partial"
          : "missing",
    expectedTowerCount: expectedIds.size,
    matchedTowerCount: matchedIds.size,
    damage,
    hostileHealing
  };
}

const tests = [
  () => assert.equal(towerAttackAtRange(0), 600),
  () => assert.equal(towerAttackAtRange(5), 600),
  () => assert.equal(towerAttackAtRange(6), 570),
  () => assert.equal(towerAttackAtRange(10), 450),
  () => assert.equal(towerAttackAtRange(15), 300),
  () => assert.equal(towerAttackAtRange(20), 150),
  () => assert.equal(towerAttackAtRange(50), 150),
  () => assert.equal(towerAttackAtRange(-1), null),
  () => assert.equal(towerAttackAtRange(5.5), null),
  () => assert.equal(applyTowerEffects(600), 600),
  () => assert.equal(applyTowerEffects(600, 0.1, 0), 660),
  () => assert.equal(applyTowerEffects(600, 0, 0.1), 540),
  () => assert.equal(applyTowerEffects(600, 0.1, 0.1), 594),
  () => assert.equal(applyTowerEffects(600, 0, 1.1), null),
  () => assert.equal(estimateVolley([{ range: 5 }, { range: 10 }, { range: 20 }]), 1200),
  () => assert.equal(estimateVolley([{ range: 6, operateFactor: 0.2 }]), 684),
  () => assert.equal(estimateVolley([{ range: -1 }]), null),
  () => assert.equal(verifyVolley({ now: 100, submittedAt: 100, towerIds: ["a"], targetId: "x", events: [] }).status, "pending"),
  () => assert.equal(verifyVolley({ now: 103, submittedAt: 100, towerIds: ["a"], targetId: "x", events: [] }).status, "missed-window"),
  () => assert.deepEqual(
    verifyVolley({
      now: 101,
      submittedAt: 100,
      towerIds: ["a", "b"],
      targetId: "x",
      events: [
        { event: "attack", objectId: "a", data: { targetId: "x", attackType: "ranged", damage: 600 } },
        { event: "attack", objectId: "b", data: { targetId: "x", attackType: "ranged", damage: 450 } }
      ]
    }),
    { status: "verified", expectedTowerCount: 2, matchedTowerCount: 2, damage: 1050, hostileHealing: 0 }
  ),
  () => assert.equal(
    verifyVolley({
      now: 101,
      submittedAt: 100,
      towerIds: ["a", "b"],
      targetId: "x",
      events: [{ event: "attack", objectId: "a", data: { targetId: "x", attackType: "ranged", damage: 600 } }]
    }).status,
    "partial"
  ),
  () => assert.equal(
    verifyVolley({ now: 101, submittedAt: 100, towerIds: ["a"], targetId: "x", events: [] }).status,
    "missing"
  ),
  () => assert.equal(
    verifyVolley({
      now: 101,
      submittedAt: 100,
      towerIds: ["a"],
      targetId: "x",
      events: [
        { event: "attack", objectId: "a", data: { targetId: "x", attackType: "ranged", damage: 420 } },
        { event: "heal", objectId: "h", data: { targetId: "x", amount: 300 } }
      ]
    }).hostileHealing,
    300
  ),
  () => assert.equal(
    verifyVolley({
      now: 101,
      submittedAt: 100,
      towerIds: ["a"],
      targetId: "x",
      events: [{ event: "attack", objectId: "a", data: { targetId: "y", attackType: "ranged", damage: 600 } }]
    }).status,
    "missing"
  )
];

for (const test of tests) test();
console.log(`Tower damage diagnostics passed: ${tests.length} offline cases.`);
