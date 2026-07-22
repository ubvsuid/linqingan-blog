import assert from "node:assert/strict";

const results = [];

function record(name, detail, callback) {
  callback();
  results.push({ name, detail });
}

record(
  "screeps-wall-rampart-repair-limit",
  "覆盖配置无效、上限过滤、结构类型、最低hits、同值距离和稳定ID排序。",
  () => {
    function selectTarget(structures, hitsLimit) {
      if (!Number.isFinite(hitsLimit) || hitsLimit <= 0) {
        return null;
      }

      const candidates = structures.filter((structure) =>
        ["constructedWall", "rampart"].includes(
          structure.structureType,
        )
        && Number.isFinite(structure.hits)
        && structure.hits < hitsLimit,
      );

      return [...candidates].sort((left, right) => {
        if (left.hits !== right.hits) {
          return left.hits - right.hits;
        }

        if (left.range !== right.range) {
          return left.range - right.range;
        }

        return left.id.localeCompare(right.id);
      })[0] ?? null;
    }

    const structures = [
      {
        id: "wall-a",
        structureType: "constructedWall",
        hits: 5000,
        range: 5,
      },
      {
        id: "rampart-a",
        structureType: "rampart",
        hits: 1000,
        range: 4,
      },
      {
        id: "road-a",
        structureType: "road",
        hits: 100,
        range: 1,
      },
    ];

    assert.equal(selectTarget(structures, 0), null);
    assert.equal(selectTarget(structures, 900), null);
    assert.equal(selectTarget(structures, 10000).id, "rampart-a");
    assert.equal(
      selectTarget([
        {
          id: "wall-b",
          structureType: "constructedWall",
          hits: 1000,
          range: 6,
        },
        {
          id: "wall-a",
          structureType: "constructedWall",
          hits: 1000,
          range: 2,
        },
      ], 10000).id,
      "wall-a",
    );
    assert.equal(
      selectTarget([
        {
          id: "wall-b",
          structureType: "constructedWall",
          hits: 1000,
          range: 2,
        },
        {
          id: "wall-a",
          structureType: "constructedWall",
          hits: 1000,
          range: 2,
        },
      ], 10000).id,
      "wall-a",
    );
  },
);

record(
  "screeps-controller-downgrade",
  "覆盖Controller不可用、阈值无效、进入风险、持续风险、恢复和正常状态。",
  () => {
    function evaluate(input) {
      const {
        owned,
        ticksToDowngrade,
        emergencyThreshold,
        recoveryThreshold,
        emergencyActive,
      } = input;

      if (!owned || !Number.isFinite(ticksToDowngrade)) {
        return {
          active: false,
          reason: "controller-unavailable",
        };
      }

      if (
        !Number.isFinite(emergencyThreshold)
        || !Number.isFinite(recoveryThreshold)
        || emergencyThreshold <= 0
        || recoveryThreshold <= emergencyThreshold
      ) {
        return {
          active: false,
          reason: "invalid-thresholds",
        };
      }

      if (emergencyActive) {
        return ticksToDowngrade >= recoveryThreshold
          ? { active: false, reason: "recovered" }
          : { active: true, reason: "risk-continues" };
      }

      return ticksToDowngrade < emergencyThreshold
        ? { active: true, reason: "risk-entered" }
        : { active: false, reason: "normal" };
    }

    assert.equal(evaluate({
      owned: false,
      ticksToDowngrade: 1000,
      emergencyThreshold: 5000,
      recoveryThreshold: 10000,
      emergencyActive: false,
    }).reason, "controller-unavailable");

    assert.equal(evaluate({
      owned: true,
      ticksToDowngrade: 1000,
      emergencyThreshold: 5000,
      recoveryThreshold: 4000,
      emergencyActive: false,
    }).reason, "invalid-thresholds");

    assert.deepEqual(evaluate({
      owned: true,
      ticksToDowngrade: 4999,
      emergencyThreshold: 5000,
      recoveryThreshold: 10000,
      emergencyActive: false,
    }), { active: true, reason: "risk-entered" });

    assert.deepEqual(evaluate({
      owned: true,
      ticksToDowngrade: 7000,
      emergencyThreshold: 5000,
      recoveryThreshold: 10000,
      emergencyActive: true,
    }), { active: true, reason: "risk-continues" });

    assert.deepEqual(evaluate({
      owned: true,
      ticksToDowngrade: 10000,
      emergencyThreshold: 5000,
      recoveryThreshold: 10000,
      emergencyActive: true,
    }), { active: false, reason: "recovered" });

    assert.deepEqual(evaluate({
      owned: true,
      ticksToDowngrade: 12000,
      emergencyThreshold: 5000,
      recoveryThreshold: 10000,
      emergencyActive: false,
    }), { active: false, reason: "normal" });
  },
);

record(
  "screeps-reserve-vs-claim-controller",
  "覆盖任务无效、CLAIM部件缺失、所有权、敌对预订、确认条件、GCL和可执行场景。",
  () => {
    function evaluate(input) {
      const {
        action,
        activeClaimParts,
        controllerOwned,
        reservationUsername,
        creepUsername,
        ownedRoomCount,
        gclLevel,
        claimConfirmed,
      } = input;

      if (!["reserve", "claim"].includes(action)) {
        return { ready: false, reason: "invalid-action" };
      }

      if (
        !Number.isInteger(activeClaimParts)
        || activeClaimParts <= 0
      ) {
        return {
          ready: false,
          reason: "no-active-claim-part",
        };
      }

      if (controllerOwned) {
        return { ready: false, reason: "controller-owned" };
      }

      if (
        reservationUsername
        && reservationUsername !== creepUsername
      ) {
        return {
          ready: false,
          reason: "hostile-reservation",
        };
      }

      if (action === "claim") {
        if (claimConfirmed !== true) {
          return {
            ready: false,
            reason: "claim-not-confirmed",
          };
        }

        if (
          !Number.isInteger(ownedRoomCount)
          || !Number.isInteger(gclLevel)
          || ownedRoomCount >= gclLevel
        ) {
          return {
            ready: false,
            reason: "gcl-not-enough",
          };
        }
      }

      return { ready: true, reason: "ready" };
    }

    const base = {
      action: "reserve",
      activeClaimParts: 1,
      controllerOwned: false,
      reservationUsername: null,
      creepUsername: "me",
      ownedRoomCount: 2,
      gclLevel: 3,
      claimConfirmed: false,
    };

    assert.equal(evaluate({ ...base, action: "attack" }).reason, "invalid-action");
    assert.equal(evaluate({ ...base, activeClaimParts: 0 }).reason, "no-active-claim-part");
    assert.equal(evaluate({ ...base, controllerOwned: true }).reason, "controller-owned");
    assert.equal(evaluate({ ...base, reservationUsername: "enemy" }).reason, "hostile-reservation");
    assert.deepEqual(evaluate({ ...base, reservationUsername: "me" }), { ready: true, reason: "ready" });
    assert.equal(evaluate({ ...base, action: "claim" }).reason, "claim-not-confirmed");
    assert.equal(evaluate({
      ...base,
      action: "claim",
      claimConfirmed: true,
      ownedRoomCount: 3,
    }).reason, "gcl-not-enough");
    assert.deepEqual(evaluate({
      ...base,
      action: "claim",
      claimConfirmed: true,
    }), { ready: true, reason: "ready" });
  },
);

record(
  "screeps-flags-config",
  "覆盖配置缺失、关闭、版本、任务、名称、范围、合法配置和指定前缀Memory清理。",
  () => {
    function normalize(raw) {
      if (
        !raw
        || typeof raw !== "object"
        || Array.isArray(raw)
      ) {
        return {
          valid: false,
          reason: "config-missing",
        };
      }

      if (raw.version !== 1) {
        return {
          valid: false,
          reason: "version-mismatch",
        };
      }

      if (raw.enabled !== true) {
        return { valid: false, reason: "disabled" };
      }

      if (raw.task !== "move") {
        return {
          valid: false,
          reason: "invalid-task",
        };
      }

      if (
        typeof raw.creepName !== "string"
        || raw.creepName.trim().length === 0
      ) {
        return {
          valid: false,
          reason: "invalid-creep-name",
        };
      }

      const range = raw.range ?? 0;

      if (
        !Number.isInteger(range)
        || range < 0
        || range > 49
      ) {
        return {
          valid: false,
          reason: "invalid-range",
        };
      }

      return {
        valid: true,
        reason: "ready",
        value: {
          task: "move",
          creepName: raw.creepName.trim(),
          range,
        },
      };
    }

    function clean(memoryFlags, gameFlags, prefix) {
      if (
        !memoryFlags
        || typeof memoryFlags !== "object"
      ) {
        return 0;
      }

      let removed = 0;

      for (const name of Object.keys(memoryFlags)) {
        if (!name.startsWith(prefix)) continue;
        if (gameFlags[name]) continue;
        delete memoryFlags[name];
        removed += 1;
      }

      return removed;
    }

    assert.equal(normalize(null).reason, "config-missing");
    assert.equal(normalize({ version: 1, enabled: false }).reason, "disabled");
    assert.equal(normalize({ version: 2, enabled: true }).reason, "version-mismatch");
    assert.equal(normalize({
      version: 1,
      enabled: true,
      task: "repair",
      creepName: "Worker1",
    }).reason, "invalid-task");
    assert.equal(normalize({
      version: 1,
      enabled: true,
      task: "move",
      creepName: "   ",
    }).reason, "invalid-creep-name");
    assert.equal(normalize({
      version: 1,
      enabled: true,
      task: "move",
      creepName: "Worker1",
      range: 50,
    }).reason, "invalid-range");
    assert.deepEqual(normalize({
      version: 1,
      enabled: true,
      task: "move",
      creepName: " Worker1 ",
      range: 1,
    }), {
      valid: true,
      reason: "ready",
      value: {
        task: "move",
        creepName: "Worker1",
        range: 1,
      },
    });

    const memoryFlags = {
      TASK_A: {},
      TASK_B: {},
      Manual: {},
    };

    assert.equal(clean(
      memoryFlags,
      { TASK_A: { name: "TASK_A" } },
      "TASK_",
    ), 1);
    assert.deepEqual(Object.keys(memoryFlags).sort(), [
      "Manual",
      "TASK_A",
    ]);
  },
);

record(
  "screeps-roomvisual-debug",
  "覆盖配置关闭、对象缺失、同房间目标、跨房间目标、标签裁剪、字节停止线和稳定排序。",
  () => {
    function trimLabel(value, maximumLength = 40) {
      const text = String(value);
      return text.length <= maximumLength
        ? text
        : `${text.slice(0, maximumLength - 3)}...`;
    }

    function buildPlan(input) {
      const {
        enabled,
        creep,
        target,
        showLabels,
        showTargets,
        showEnergy,
      } = input;

      if (enabled !== true) {
        return {
          ready: false,
          reason: "disabled",
          items: [],
        };
      }

      if (!creep || !creep.pos) {
        return {
          ready: false,
          reason: "creep-missing",
          items: [],
        };
      }

      const items = [];
      const labelParts = [creep.name || "creep"];

      if (
        showEnergy === true
        && Number.isFinite(creep.energy)
      ) {
        labelParts.push(`${creep.energy}E`);
      }

      if (showLabels === true) {
        items.push({
          type: "text",
          text: labelParts.join(" "),
        });
      }

      items.push({ type: "circle" });

      if (
        showTargets === true
        && target?.pos
        && target.pos.roomName === creep.pos.roomName
      ) {
        items.push({ type: "line" });
      }

      return {
        ready: true,
        reason: "ready",
        items,
      };
    }

    function canDraw(currentBytes, maximumBytes) {
      return Number.isFinite(currentBytes)
        && Number.isFinite(maximumBytes)
        && currentBytes < maximumBytes;
    }

    const creep = {
      name: "Worker1",
      energy: 50,
      pos: {
        x: 10,
        y: 10,
        roomName: "W1N1",
      },
    };

    assert.equal(buildPlan({
      enabled: false,
      creep,
    }).reason, "disabled");
    assert.equal(buildPlan({
      enabled: true,
      creep: null,
    }).reason, "creep-missing");

    const sameRoom = buildPlan({
      enabled: true,
      creep,
      target: {
        pos: {
          x: 20,
          y: 20,
          roomName: "W1N1",
        },
      },
      showLabels: true,
      showTargets: true,
      showEnergy: true,
    });

    assert.deepEqual(
      sameRoom.items.map((item) => item.type),
      ["text", "circle", "line"],
    );
    assert.equal(sameRoom.items[0].text, "Worker1 50E");

    const crossRoom = buildPlan({
      enabled: true,
      creep,
      target: {
        pos: {
          x: 20,
          y: 20,
          roomName: "W2N2",
        },
      },
      showLabels: true,
      showTargets: true,
      showEnergy: false,
    });

    assert.deepEqual(
      crossRoom.items.map((item) => item.type),
      ["text", "circle"],
    );
    assert.equal(trimLabel("a".repeat(50), 10), "aaaaaaa...");
    assert.equal(canDraw(479999, 480000), true);
    assert.equal(canDraw(480000, 480000), false);

    const names = ["WorkerC", "WorkerA", "WorkerB"]
      .sort((left, right) => left.localeCompare(right));
    assert.deepEqual(names, ["WorkerA", "WorkerB", "WorkerC"]);
  },
);

for (const result of results) {
  console.log(
    `批次模拟通过：${result.name} — ${result.detail}`,
  );
}

console.log(
  `第六批文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`,
);
