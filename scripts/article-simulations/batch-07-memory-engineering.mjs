import assert from "node:assert/strict";

const results = [];

function record(name, detail, callback) {
  callback();
  results.push({ name, detail });
}

record(
  "screeps-memory-basics",
  "覆盖旧字段迁移、角色与布尔类型修正、目标ID清理和有限历史。",
  () => {
    const allowedRoles = new Set([
      "harvester",
      "upgrader",
      "builder",
    ]);

    function normalize(memory, roomName) {
      const result = { ...memory };
      const version = Number.isInteger(result.memoryVersion)
        ? result.memoryVersion
        : 0;

      if (version < 1) {
        if (result.job === "harvest") {
          result.role = "harvester";
        }

        delete result.job;
        result.memoryVersion = 1;
      }

      if (!allowedRoles.has(result.role)) {
        result.role = "harvester";
      }

      if (typeof result.working !== "boolean") {
        result.working = false;
      }

      if (
        result.targetId !== undefined
        && result.targetId !== null
        && typeof result.targetId !== "string"
      ) {
        delete result.targetId;
      }

      if (
        typeof result.homeRoom !== "string"
        || result.homeRoom.length === 0
      ) {
        result.homeRoom = roomName;
      }

      return result;
    }

    function appendLimited(list, entry, limit) {
      const next = [...list, entry];
      while (next.length > limit) next.shift();
      return next;
    }

    assert.deepEqual(normalize({
      job: "harvest",
      working: "yes",
      targetId: 123,
    }, "W1N1"), {
      memoryVersion: 1,
      role: "harvester",
      working: false,
      homeRoom: "W1N1",
    });

    assert.equal(normalize({
      memoryVersion: 1,
      role: "builder",
      working: true,
      targetId: "abc",
      homeRoom: "W2N2",
    }, "W1N1").role, "builder");

    assert.deepEqual(
      appendLimited([1, 2, 3], 4, 3),
      [2, 3, 4],
    );
    assert.throws(() => JSON.stringify({ self: (() => {
      const value = {};
      value.self = value;
      return value;
    })() }));
  },
);

record(
  "screeps-clean-dead-creep-memory",
  "覆盖存活保留、死亡删除、缺失集合、受控索引同步和未知数据保留。",
  () => {
    function findDead(memoryCreeps, gameCreeps) {
      if (
        !memoryCreeps
        || typeof memoryCreeps !== "object"
      ) {
        return [];
      }

      const live = gameCreeps
        && typeof gameCreeps === "object"
        ? gameCreeps
        : {};

      return Object.keys(memoryCreeps)
        .filter((name) => !live[name])
        .sort();
    }

    const memoryCreeps = {
      Alive: { role: "worker" },
      DeadB: {},
      DeadA: {},
    };
    const gameCreeps = {
      Alive: { name: "Alive" },
    };
    const tasks = {
      Alive: {},
      DeadA: {},
      Other: {},
    };
    const unrelated = {
      DeadA: "keep",
    };

    const dead = findDead(memoryCreeps, gameCreeps);
    assert.deepEqual(dead, ["DeadA", "DeadB"]);

    for (const name of dead) {
      delete memoryCreeps[name];
      delete tasks[name];
    }

    assert.deepEqual(Object.keys(memoryCreeps), ["Alive"]);
    assert.deepEqual(Object.keys(tasks).sort(), ["Alive", "Other"]);
    assert.deepEqual(unrelated, { DeadA: "keep" });
    assert.deepEqual(findDead(null, gameCreeps), []);
    assert.deepEqual(findDead({ A: {} }, null), ["A"]);
  },
);

record(
  "screeps-creep-working-state",
  "覆盖首次空载、首次部分Energy、满载、耗尽、中间状态、无容量和非法值。",
  () => {
    function nextState(input) {
      const {
        usedEnergy,
        freeEnergyCapacity,
        previousWorking,
      } = input;

      if (
        !Number.isFinite(usedEnergy)
        || !Number.isFinite(freeEnergyCapacity)
        || usedEnergy < 0
        || freeEnergyCapacity < 0
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

    assert.equal(nextState({
      usedEnergy: 0,
      freeEnergyCapacity: 50,
      previousWorking: undefined,
    }).working, false);
    assert.equal(nextState({
      usedEnergy: 20,
      freeEnergyCapacity: 30,
      previousWorking: undefined,
    }).working, false);
    assert.equal(nextState({
      usedEnergy: 50,
      freeEnergyCapacity: 0,
      previousWorking: false,
    }).working, true);
    assert.equal(nextState({
      usedEnergy: 0,
      freeEnergyCapacity: 50,
      previousWorking: true,
    }).working, false);
    assert.equal(nextState({
      usedEnergy: 20,
      freeEnergyCapacity: 30,
      previousWorking: true,
    }).working, true);
    assert.equal(nextState({
      usedEnergy: -1,
      freeEnergyCapacity: 51,
      previousWorking: true,
    }).valid, false);
  },
);

record(
  "screeps-game-get-object-by-id",
  "覆盖无ID、无视野保留、可见目标消失、类型不符和合法恢复。",
  () => {
    function evaluate(input) {
      const {
        id,
        roomName,
        roomVisible,
        object,
        expectedType,
      } = input;

      if (typeof id !== "string" || id.length === 0) {
        return {
          usable: false,
          removeStoredTarget: true,
          reason: "invalid-id",
        };
      }

      if (
        typeof roomName === "string"
        && roomName.length > 0
        && roomVisible !== true
      ) {
        return {
          usable: false,
          removeStoredTarget: false,
          reason: "room-not-visible",
        };
      }

      if (!object) {
        return {
          usable: false,
          removeStoredTarget: true,
          reason: "object-not-found",
        };
      }

      if (expectedType && object.type !== expectedType) {
        return {
          usable: false,
          removeStoredTarget: true,
          reason: "type-mismatch",
        };
      }

      return {
        usable: true,
        removeStoredTarget: false,
        reason: "ready",
      };
    }

    assert.equal(evaluate({ id: null }).reason, "invalid-id");
    assert.deepEqual(evaluate({
      id: "abc",
      roomName: "W2N2",
      roomVisible: false,
      object: null,
      expectedType: "source",
    }), {
      usable: false,
      removeStoredTarget: false,
      reason: "room-not-visible",
    });
    assert.equal(evaluate({
      id: "abc",
      roomName: "W2N2",
      roomVisible: true,
      object: null,
      expectedType: "source",
    }).reason, "object-not-found");
    assert.equal(evaluate({
      id: "abc",
      roomName: "W2N2",
      roomVisible: true,
      object: { type: "structure" },
      expectedType: "source",
    }).reason, "type-mismatch");
    assert.deepEqual(evaluate({
      id: "abc",
      roomName: "W2N2",
      roomVisible: true,
      object: { type: "source" },
      expectedType: "source",
    }), {
      usable: true,
      removeStoredTarget: false,
      reason: "ready",
    });
  },
);

record(
  "screeps-modules-require",
  "覆盖模块契约、未知角色、角色缺失、异常隔离、成功返回和状态汇总。",
  () => {
    function dispatch(creep, modules) {
      if (!creep) return { status: "creep-missing" };

      const role = creep.memory?.role;
      if (typeof role !== "string" || role.length === 0) {
        return { status: "role-missing" };
      }

      const roleModule = modules[role];
      if (!roleModule) {
        return { status: "role-module-missing" };
      }

      if (typeof roleModule.run !== "function") {
        return { status: "invalid-module-contract" };
      }

      try {
        return {
          status: "role-finished",
          result: roleModule.run(creep) ?? null,
        };
      } catch (error) {
        return {
          status: "role-threw",
          error: error instanceof Error
            ? error.message
            : String(error),
        };
      }
    }

    assert.equal(dispatch(null, {}).status, "creep-missing");
    assert.equal(dispatch({ memory: {} }, {}).status, "role-missing");
    assert.equal(dispatch({
      memory: { role: "unknown" },
    }, {}).status, "role-module-missing");
    assert.equal(dispatch({
      memory: { role: "worker" },
    }, { worker: {} }).status, "invalid-module-contract");
    assert.deepEqual(dispatch({
      memory: { role: "worker" },
    }, {
      worker: {
        run: () => ({ status: "done" }),
      },
    }), {
      status: "role-finished",
      result: { status: "done" },
    });
    assert.equal(dispatch({
      memory: { role: "worker" },
    }, {
      worker: {
        run: () => {
          throw new Error("boom");
        },
      },
    }).status, "role-threw");

    const outcomes = [
      { status: "role-finished" },
      { status: "role-finished" },
      { status: "role-threw" },
    ];
    const summary = {};
    for (const outcome of outcomes) {
      summary[outcome.status] =
        (summary[outcome.status] || 0) + 1;
    }
    assert.deepEqual(summary, {
      "role-finished": 2,
      "role-threw": 1,
    });
  },
);

for (const result of results) {
  console.log(
    `批次模拟通过：${result.name} — ${result.detail}`,
  );
}

console.log(
  `第七批文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`,
);
