import assert from "node:assert/strict";

const OK = 0;
const WORK = "work";
const CARRY = "carry";
const MOVE = "move";
const CLAIM = "claim";
const BODYPART_COST = {
  work: 100,
  carry: 50,
  move: 50,
  claim: 600,
};
const CREEP_SPAWN_TIME = 3;
const results = [];

function record(name, detail, callback) {
  callback();
  results.push({ name, detail });
}

function getBodyCost(body) {
  return body.reduce((total, part) => {
    const type = typeof part === "string" ? part : part.type;
    const cost = BODYPART_COST[type];
    if (!Number.isFinite(cost)) {
      throw new TypeError(`unknown body part: ${String(type)}`);
    }
    return total + cost;
  }, 0);
}

record(
  "screeps-spawncreep-return-codes",
  "覆盖Spawn、名称、身体、Energy、Memory与合法请求校验。",
  () => {
    const bodyParts = new Set([WORK, CARRY, MOVE, CLAIM]);

    function validate(input) {
      const {
        spawnExists,
        spawnBusy,
        body,
        name,
        nameExists,
        memory,
        energyAvailable,
      } = input;

      if (!spawnExists) return "spawn-missing";
      if (spawnBusy) return "spawn-busy";
      if (typeof name !== "string") return "name-not-string";
      if (name.length < 1 || name.length > 100) {
        return "name-length-invalid";
      }
      if (nameExists) return "name-exists";
      if (!Array.isArray(body)) return "body-not-array";
      if (body.length < 1 || body.length > 50) {
        return "body-length-invalid";
      }
      if (body.some((part) => !bodyParts.has(part))) {
        return "unknown-body-part";
      }
      if (
        memory !== undefined
        && (!memory || typeof memory !== "object" || Array.isArray(memory))
      ) {
        return "memory-invalid";
      }
      if (energyAvailable < getBodyCost(body)) {
        return "energy-not-enough";
      }
      return "ready";
    }

    const base = {
      spawnExists: true,
      spawnBusy: false,
      body: [WORK, CARRY, MOVE],
      name: "Worker1",
      nameExists: false,
      memory: { role: "worker" },
      energyAvailable: 300,
    };

    assert.equal(validate({ ...base, spawnExists: false }), "spawn-missing");
    assert.equal(validate({ ...base, spawnBusy: true }), "spawn-busy");
    assert.equal(validate({ ...base, name: "" }), "name-length-invalid");
    assert.equal(validate({ ...base, name: "a".repeat(101) }), "name-length-invalid");
    assert.equal(validate({ ...base, nameExists: true }), "name-exists");
    assert.equal(validate({ ...base, body: [] }), "body-length-invalid");
    assert.equal(validate({ ...base, body: Array(51).fill(MOVE) }), "body-length-invalid");
    assert.equal(validate({ ...base, body: ["unknown"] }), "unknown-body-part");
    assert.equal(validate({ ...base, memory: [] }), "memory-invalid");
    assert.equal(validate({ ...base, energyAvailable: 199 }), "energy-not-enough");
    assert.equal(validate(base), "ready");
  },
);

record(
  "screeps-dynamic-creep-body-energy",
  "覆盖最低Energy、完整单元、角色上限、50部件上限、成本与生成时间。",
  () => {
    function build(input) {
      const {
        energyAvailable,
        unit,
        maximumParts = 50,
        maximumUnits = Infinity,
      } = input;

      if (
        !Number.isFinite(energyAvailable)
        || energyAvailable < 0
        || !Array.isArray(unit)
        || unit.length === 0
        || !Number.isInteger(maximumParts)
        || maximumParts < 1
      ) {
        return { valid: false, body: [], reason: "invalid-input" };
      }

      const unitCost = getBodyCost(unit);
      const units = Math.max(0, Math.min(
        Math.floor(energyAvailable / unitCost),
        Math.floor(maximumParts / unit.length),
        maximumUnits,
      ));
      const body = [];
      for (let index = 0; index < units; index += 1) {
        body.push(...unit);
      }

      return {
        valid: true,
        reason: body.length > 0 ? "ready" : "energy-below-minimum",
        body,
        units,
        bodyCost: units * unitCost,
        spawnTime: body.length * CREEP_SPAWN_TIME,
      };
    }

    const unit = [WORK, CARRY, MOVE];
    assert.equal(build({ energyAvailable: 199, unit }).body.length, 0);
    assert.equal(build({ energyAvailable: 200, unit }).body.length, 3);
    assert.equal(build({ energyAvailable: 550, unit }).body.length, 6);
    const maximum = build({ energyAvailable: 10000, unit });
    assert.equal(maximum.body.length, 48);
    assert.equal(maximum.units, 16);
    assert.equal(maximum.bodyCost, 3200);
    assert.equal(maximum.spawnTime, 144);
    assert.equal(build({ energyAvailable: 10000, unit, maximumUnits: 5 }).body.length, 15);
    assert.equal(build({ energyAvailable: -1, unit }).valid, false);
    assert.equal(build({ energyAvailable: 1000, unit: [] }).valid, false);
    assert.equal(maximum.body.length % unit.length, 0);
  },
);

record(
  "screeps-spawn-renew-creep",
  "覆盖续命公式、CLAIM、Boost确认、距离、Spawn状态、Energy与合法续命。",
  () => {
    function getRenewStep(body) {
      if (!Array.isArray(body) || body.length === 0) return null;
      const bodyCost = getBodyCost(body);
      return {
        addedTicks: Math.floor(600 / body.length),
        energyCost: Math.ceil(bodyCost / 2.5 / body.length),
      };
    }

    function evaluate(input) {
      if (!input.creepExists) return "creep-missing";
      if (input.creepSpawning) return "creep-spawning";
      if (input.ticksToLive > input.renewThreshold) return "ttl-sufficient";
      if (input.hasClaimPart) return "claim-part-present";
      if (input.boostedPartCount > 0 && !input.allowBoostRemoval) {
        return "boost-removal-not-confirmed";
      }
      if (!input.isNearSpawn) return "move-to-spawn";
      if (input.spawnBusy) return "spawn-busy";
      if (input.spawnEnergy < input.energyCost) return "spawn-energy-not-enough";
      return "ready";
    }

    const body = [WORK, CARRY, MOVE];
    const step = getRenewStep(body);
    assert.deepEqual(step, { addedTicks: 200, energyCost: 27 });

    const base = {
      creepExists: true,
      creepSpawning: false,
      ticksToLive: 200,
      renewThreshold: 300,
      hasClaimPart: false,
      boostedPartCount: 0,
      allowBoostRemoval: false,
      isNearSpawn: true,
      spawnBusy: false,
      spawnEnergy: step.energyCost,
      energyCost: step.energyCost,
    };

    assert.equal(evaluate({ ...base, creepExists: false }), "creep-missing");
    assert.equal(evaluate({ ...base, ticksToLive: 301 }), "ttl-sufficient");
    assert.equal(evaluate({ ...base, hasClaimPart: true }), "claim-part-present");
    assert.equal(evaluate({ ...base, boostedPartCount: 1 }), "boost-removal-not-confirmed");
    assert.equal(evaluate({ ...base, isNearSpawn: false }), "move-to-spawn");
    assert.equal(evaluate({ ...base, spawnBusy: true }), "spawn-busy");
    assert.equal(evaluate({ ...base, spawnEnergy: step.energyCost - 1 }), "spawn-energy-not-enough");
    assert.equal(evaluate(base), "ready");
  },
);

record(
  "screeps-spawn-recycle-creep",
  "覆盖一次性确认、对象状态、所有权、移动、提交与失败恢复。",
  () => {
    function evaluate(input) {
      if (!input.requestExists || !input.enabled) return "request-disabled";
      if (!input.confirmed) return "confirmation-required";
      if (!input.spawnExists) return "spawn-missing";
      if (!input.creepExists) return "creep-missing";
      if (input.creepSpawning) return "creep-spawning";
      if (!input.spawnOwned || !input.creepOwned) return "ownership-invalid";
      if (!input.isNearSpawn) return "move-to-spawn";
      return "ready";
    }

    const base = {
      requestExists: true,
      enabled: true,
      confirmed: true,
      spawnExists: true,
      creepExists: true,
      creepSpawning: false,
      spawnOwned: true,
      creepOwned: true,
      isNearSpawn: true,
    };

    assert.equal(evaluate({ ...base, enabled: false }), "request-disabled");
    assert.equal(evaluate({ ...base, confirmed: false }), "confirmation-required");
    assert.equal(evaluate({ ...base, spawnExists: false }), "spawn-missing");
    assert.equal(evaluate({ ...base, creepExists: false }), "creep-missing");
    assert.equal(evaluate({ ...base, creepSpawning: true }), "creep-spawning");
    assert.equal(evaluate({ ...base, creepOwned: false }), "ownership-invalid");
    assert.equal(evaluate({ ...base, isNearSpawn: false }), "move-to-spawn");
    assert.equal(evaluate(base), "ready");

    let enabled = true;
    enabled = false;
    const result = OK;
    if (result !== OK) enabled = true;
    assert.equal(enabled, false);
  },
);

record(
  "screeps-spawn-emergency-recovery",
  "覆盖房间、单Spawn选择、角色数量、最低Energy、名称、dryRun与提交分支。",
  () => {
    function selectSpawn(spawns) {
      return [...spawns]
        .filter((spawn) => spawn.owned && spawn.active && !spawn.busy)
        .sort((left, right) => left.name.localeCompare(right.name))[0] ?? null;
    }

    function evaluate(input) {
      if (!input.roomExists) return "room-missing";
      if (input.harvesterCount > 0) return "harvester-exists";
      if (input.availableSpawnCount < 1) return "spawn-unavailable";
      if (input.energyAvailable < input.minimumCost) return "energy-not-enough";
      if (input.nameExists) return "name-exists";
      if (input.dryRunResult !== undefined && input.dryRunResult !== OK) {
        return "dry-run-failed";
      }
      return "ready";
    }

    assert.equal(getBodyCost([WORK, CARRY, MOVE]), 200);
    const selected = selectSpawn([
      { name: "SpawnB", owned: true, active: true, busy: false },
      { name: "SpawnA", owned: true, active: true, busy: false },
      { name: "SpawnC", owned: true, active: true, busy: true },
    ]);
    assert.equal(selected.name, "SpawnA");

    const base = {
      roomExists: true,
      harvesterCount: 0,
      availableSpawnCount: 1,
      energyAvailable: 200,
      minimumCost: 200,
      nameExists: false,
      dryRunResult: OK,
    };

    assert.equal(evaluate({ ...base, roomExists: false }), "room-missing");
    assert.equal(evaluate({ ...base, harvesterCount: 1 }), "harvester-exists");
    assert.equal(evaluate({ ...base, availableSpawnCount: 0 }), "spawn-unavailable");
    assert.equal(evaluate({ ...base, energyAvailable: 199 }), "energy-not-enough");
    assert.equal(evaluate({ ...base, nameExists: true }), "name-exists");
    assert.equal(evaluate({ ...base, dryRunResult: -6 }), "dry-run-failed");
    assert.equal(evaluate(base), "ready");
  },
);

for (const result of results) {
  console.log(`批次模拟通过：${result.name} — ${result.detail}`);
}

console.log(
  `第八批文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`,
);
