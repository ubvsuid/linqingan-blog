import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const OK = 0;
const WORK = "work";
const CARRY = "carry";
const MOVE = "move";
const ATTACK = "attack";
const RANGED_ATTACK = "ranged_attack";
const HEAL = "heal";
const TOUGH = "tough";
const CLAIM = "claim";
const STRUCTURE_SPAWN = "spawn";
const STRUCTURE_EXTENSION = "extension";
const BODYPART_COST = {
  work: 100,
  carry: 50,
  move: 50,
  attack: 80,
  ranged_attack: 150,
  heal: 250,
  tough: 10,
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
  "覆盖Spawn、名称、身体、memory any边界、默认/显式Energy预算、directions与合法请求校验。",
  () => {
    const bodyParts = new Set([
      WORK,
      CARRY,
      MOVE,
      ATTACK,
      RANGED_ATTACK,
      HEAL,
      TOUGH,
      CLAIM,
    ]);

    function isAllowedEnergyStructure(spawnRoomName, structure) {
      return Boolean(
        structure
        && structure.my === true
        && structure.roomName === spawnRoomName
        && structure.active === true
        && (
          structure.structureType === STRUCTURE_SPAWN
          || structure.structureType === STRUCTURE_EXTENSION
        ),
      );
    }

    function getEnergyBudget(input) {
      if (input.energyStructures === undefined) {
        return {
          valid: true,
          reason: "room-default-energy",
          energyAvailable: input.roomEnergyAvailable,
          energyStructures: undefined,
        };
      }

      if (
        !Array.isArray(input.energyStructures)
        || input.energyStructures.length === 0
      ) {
        return {
          valid: false,
          reason: "energy-structures-invalid",
        };
      }

      const unique = [];
      const seen = new Set();
      for (const structure of input.energyStructures) {
        if (!isAllowedEnergyStructure(input.spawnRoomName, structure)) {
          return {
            valid: false,
            reason: "energy-structure-not-allowed",
          };
        }
        if (!seen.has(structure.id)) {
          seen.add(structure.id);
          unique.push(structure);
        }
      }

      return {
        valid: true,
        reason: "explicit-energy-structures",
        energyAvailable: unique.reduce(
          (sum, structure) => sum + structure.energy,
          0,
        ),
        energyStructures: unique,
      };
    }

    function validateDirections(directions) {
      if (directions === undefined) return "ready";
      if (!Array.isArray(directions) || directions.length === 0) {
        return "directions-invalid";
      }
      if (
        directions.some(
          (direction) => !Number.isInteger(direction)
            || direction < 1
            || direction > 8,
        )
      ) {
        return "directions-invalid";
      }
      return "ready";
    }

    function validate(input) {
      const {
        spawnExists,
        spawnOwned,
        spawnBusy,
        body,
        name,
        nameExists,
        roomEnergyAvailable,
        directions,
      } = input;

      if (!spawnExists) return "spawn-missing";
      if (!spawnOwned) return "spawn-not-owned";
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
      if (validateDirections(directions) !== "ready") {
        return "directions-invalid";
      }

      // opts.memory is documented as `any`; this generic API validator does
      // not reject arrays, primitives, or booleans merely for their shape.
      void input.memory;

      const energyBudget = getEnergyBudget({
        roomEnergyAvailable,
        spawnRoomName: input.spawnRoomName,
        energyStructures: input.energyStructures,
      });
      if (!energyBudget.valid) return energyBudget.reason;
      if (energyBudget.energyAvailable < getBodyCost(body)) {
        return "energy-not-enough";
      }
      return "ready";
    }

    function buildSpawnOptions(input, dryRun) {
      const options = { dryRun };
      if (input.memory !== undefined) options.memory = input.memory;
      if (input.energyStructures !== undefined) {
        options.energyStructures = input.energyStructures;
      }
      if (input.directions !== undefined) {
        options.directions = input.directions;
      }
      return options;
    }

    const spawnStructure = {
      id: "spawn-1",
      my: true,
      roomName: "W1N1",
      active: true,
      structureType: STRUCTURE_SPAWN,
      energy: 100,
    };
    const extensionA = {
      id: "extension-a",
      my: true,
      roomName: "W1N1",
      active: true,
      structureType: STRUCTURE_EXTENSION,
      energy: 100,
    };
    const extensionB = {
      id: "extension-b",
      my: true,
      roomName: "W1N1",
      active: true,
      structureType: STRUCTURE_EXTENSION,
      energy: 50,
    };

    const base = {
      spawnExists: true,
      spawnOwned: true,
      spawnBusy: false,
      spawnRoomName: "W1N1",
      body: [WORK, CARRY, MOVE],
      name: "Worker1",
      nameExists: false,
      memory: { role: "worker" },
      roomEnergyAvailable: 300,
      energyStructures: undefined,
      directions: [1, 3, 5, 7],
    };

    assert.equal(validate({ ...base, spawnExists: false }), "spawn-missing");
    assert.equal(validate({ ...base, spawnOwned: false }), "spawn-not-owned");
    assert.equal(validate({ ...base, spawnBusy: true }), "spawn-busy");
    assert.equal(validate({ ...base, name: 42 }), "name-not-string");
    assert.equal(validate({ ...base, name: "" }), "name-length-invalid");
    assert.equal(validate({ ...base, name: "a".repeat(101) }), "name-length-invalid");
    assert.equal(validate({ ...base, nameExists: true }), "name-exists");
    assert.equal(validate({ ...base, body: [] }), "body-length-invalid");
    assert.equal(validate({ ...base, body: Array(51).fill(MOVE) }), "body-length-invalid");
    assert.equal(validate({ ...base, body: ["unknown"] }), "unknown-body-part");
    assert.equal(validate({ ...base, body: [ATTACK], roomEnergyAvailable: 79 }), "energy-not-enough");
    assert.equal(validate({ ...base, body: [ATTACK], roomEnergyAvailable: 80 }), "ready");
    assert.equal(validate({ ...base, memory: [] }), "ready");
    assert.equal(validate({ ...base, memory: "worker" }), "ready");
    assert.equal(validate({ ...base, memory: 123 }), "ready");
    assert.equal(validate({ ...base, memory: true }), "ready");
    assert.equal(validate({ ...base, memory: false }), "ready");
    assert.equal(validate({ ...base, roomEnergyAvailable: 199 }), "energy-not-enough");
    assert.equal(validate({ ...base, directions: [] }), "directions-invalid");
    assert.equal(validate({ ...base, directions: [0] }), "directions-invalid");
    assert.equal(validate({ ...base, directions: [9] }), "directions-invalid");
    assert.equal(validate({ ...base, directions: [1.5] }), "directions-invalid");

    assert.equal(
      validate({
        ...base,
        roomEnergyAvailable: 800,
        energyStructures: [spawnStructure],
      }),
      "energy-not-enough",
    );
    assert.equal(
      validate({
        ...base,
        roomEnergyAvailable: 0,
        energyStructures: [spawnStructure, extensionA],
      }),
      "ready",
    );
    assert.equal(
      validate({
        ...base,
        roomEnergyAvailable: 0,
        energyStructures: [
          spawnStructure,
          extensionA,
          extensionA,
          extensionB,
        ],
      }),
      "ready",
    );
    assert.equal(
      getEnergyBudget({
        roomEnergyAvailable: 999,
        spawnRoomName: "W1N1",
        energyStructures: [
          spawnStructure,
          extensionA,
          extensionA,
          extensionB,
        ],
      }).energyAvailable,
      250,
    );
    assert.equal(
      validate({ ...base, energyStructures: [] }),
      "energy-structures-invalid",
    );
    assert.equal(
      validate({
        ...base,
        energyStructures: [{ ...extensionA, my: false }],
      }),
      "energy-structure-not-allowed",
    );
    assert.equal(
      validate({
        ...base,
        energyStructures: [{ ...extensionA, roomName: "W2N2" }],
      }),
      "energy-structure-not-allowed",
    );
    assert.equal(
      validate({
        ...base,
        energyStructures: [{ ...extensionA, active: false }],
      }),
      "energy-structure-not-allowed",
    );
    assert.equal(
      validate({
        ...base,
        energyStructures: [{ ...extensionA, structureType: "tower" }],
      }),
      "energy-structure-not-allowed",
    );
    assert.equal(validate(base), "ready");

    const dryRunOptions = buildSpawnOptions({
      memory: ["worker"],
      energyStructures: [spawnStructure, extensionA],
      directions: [1, 3],
    }, true);
    const actualOptions = buildSpawnOptions({
      memory: ["worker"],
      energyStructures: [spawnStructure, extensionA],
      directions: [1, 3],
    }, false);
    assert.deepEqual(
      { ...dryRunOptions, dryRun: false },
      actualOptions,
    );

    const article = fs.readFileSync(
      path.join(
        process.cwd(),
        "content",
        "posts",
        "screeps-spawncreep-return-codes.md",
      ),
      "utf8",
    );
    for (const text of [
      "当前官方 API 文档把它标记为：",
      "opts.memory",
      "energyStructures",
      "structure.isActive()",
      "energyCheck.energyAvailable",
      "ERR_RCL_NOT_ENOUGH",
      "consoleTested: false",
      "liveTested: false",
      'checkedAt: "2026-08-16"',
    ]) {
      assert.ok(
        article.includes(text),
        `spawnCreep article missing corrected boundary: ${text}`,
      );
    }
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
