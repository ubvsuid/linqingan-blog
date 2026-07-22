import assert from "node:assert/strict";

const OK = 0;
const ERR_NO_PATH = -2;
const ERR_NOT_FOUND = -5;
const ERR_NOT_IN_RANGE = -9;
const results = [];

function record(name, detail, callback) {
  callback();
  results.push({ name, detail });
}

record(
  "screeps-mineral-extractor-harvest",
  "覆盖Mineral、Extractor同格、结构状态、cooldown、WORK、Store和距离。",
  () => {
    function evaluate(input) {
      if (!input.mineralExists) return "mineral-missing";
      if (!Number.isFinite(input.mineralAmount) || input.mineralAmount <= 0) {
        return "mineral-depleted";
      }
      if (!input.extractorExists || !input.extractorOnMineral) {
        return "extractor-missing";
      }
      if (!input.extractorOwned || !input.extractorActive) {
        return "extractor-inactive";
      }
      if (!Number.isInteger(input.extractorCooldown) || input.extractorCooldown > 0) {
        return "extractor-not-ready";
      }
      if (!Number.isInteger(input.activeWorkParts) || input.activeWorkParts <= 0) {
        return "no-active-work-part";
      }
      if (!Number.isFinite(input.freeCapacity) || input.freeCapacity <= 0) {
        return "creep-full";
      }
      if (!input.isNearMineral) return "move-to-mineral";
      return "ready";
    }

    const base = {
      mineralExists: true,
      mineralAmount: 10000,
      extractorExists: true,
      extractorOnMineral: true,
      extractorOwned: true,
      extractorActive: true,
      extractorCooldown: 0,
      activeWorkParts: 5,
      freeCapacity: 100,
      isNearMineral: true,
    };

    assert.equal(evaluate({ ...base, mineralExists: false }), "mineral-missing");
    assert.equal(evaluate({ ...base, mineralAmount: 0 }), "mineral-depleted");
    assert.equal(evaluate({ ...base, extractorExists: false }), "extractor-missing");
    assert.equal(evaluate({ ...base, extractorOnMineral: false }), "extractor-missing");
    assert.equal(evaluate({ ...base, extractorActive: false }), "extractor-inactive");
    assert.equal(evaluate({ ...base, extractorCooldown: 5 }), "extractor-not-ready");
    assert.equal(evaluate({ ...base, activeWorkParts: 0 }), "no-active-work-part");
    assert.equal(evaluate({ ...base, freeCapacity: 0 }), "creep-full");
    assert.equal(evaluate({ ...base, isNearMineral: false }), "move-to-mineral");
    assert.equal(evaluate(base), "ready");
  },
);

record(
  "screeps-err-not-in-range",
  "覆盖目标、范围、已到达、其他动作错误、移动成功与移动失败。",
  () => {
    function plan(input) {
      if (!input.targetExists) return "target-missing";
      if (!Number.isInteger(input.requiredRange) || input.requiredRange < 0) {
        return "required-range-invalid";
      }
      if (input.currentRange <= input.requiredRange) {
        return input.actionResult === OK
          ? "action-submitted"
          : "action-failed-in-range";
      }
      if (input.actionResult !== ERR_NOT_IN_RANGE) {
        return "different-action-error";
      }
      return input.moveResult === OK
        ? "move-submitted"
        : "move-failed";
    }

    const base = {
      targetExists: true,
      requiredRange: 1,
      currentRange: 4,
      actionResult: ERR_NOT_IN_RANGE,
      moveResult: OK,
    };

    assert.equal(plan({ ...base, targetExists: false }), "target-missing");
    assert.equal(plan({ ...base, requiredRange: -1 }), "required-range-invalid");
    assert.equal(plan({ ...base, currentRange: 1, actionResult: OK }), "action-submitted");
    assert.equal(plan({ ...base, currentRange: 1, actionResult: -6 }), "action-failed-in-range");
    assert.equal(plan({ ...base, actionResult: -6 }), "different-action-error");
    assert.equal(plan(base), "move-submitted");
    assert.equal(plan({ ...base, moveResult: ERR_NO_PATH }), "move-failed");
  },
);

record(
  "screeps-moveto-not-moving",
  "覆盖目标、生成、MOVE、fatigue、范围、返回值和跨房间位置键。",
  () => {
    function evaluate(input) {
      if (!input.creepExists) return "creep-missing";
      if (!input.targetValid) return "target-invalid";
      if (input.creepSpawning) return "creep-spawning";
      if (input.activeMoveParts <= 0) return "no-active-move-part";
      if (input.fatigue > 0) return "creep-tired";
      if (input.currentRange !== null && input.currentRange <= input.desiredRange) {
        return "already-in-range";
      }
      if (input.moveResult !== OK) return "move-call-failed";
      return "move-needed";
    }

    const base = {
      creepExists: true,
      targetValid: true,
      creepSpawning: false,
      activeMoveParts: 1,
      fatigue: 0,
      currentRange: 4,
      desiredRange: 1,
      moveResult: OK,
    };

    assert.equal(evaluate({ ...base, creepExists: false }), "creep-missing");
    assert.equal(evaluate({ ...base, targetValid: false }), "target-invalid");
    assert.equal(evaluate({ ...base, creepSpawning: true }), "creep-spawning");
    assert.equal(evaluate({ ...base, activeMoveParts: 0 }), "no-active-move-part");
    assert.equal(evaluate({ ...base, fatigue: 2 }), "creep-tired");
    assert.equal(evaluate({ ...base, currentRange: 1 }), "already-in-range");
    assert.equal(evaluate({ ...base, moveResult: ERR_NO_PATH }), "move-call-failed");
    assert.equal(evaluate(base), "move-needed");

    const key = (pos) => `${pos.roomName}:${pos.x}:${pos.y}`;
    assert.notEqual(
      key({ roomName: "W1N1", x: 49, y: 25 }),
      key({ roomName: "W0N1", x: 0, y: 25 }),
    );
  },
);

record(
  "screeps-err-no-path",
  "覆盖目标与范围、已到达、缓存缺失、无路径、PathFinder不完整和回调拒绝。",
  () => {
    function classify(input) {
      if (!input.targetValid) return "target-invalid";
      if (!Number.isInteger(input.desiredRange) || input.desiredRange < 0) {
        return "range-invalid";
      }
      if (input.alreadyInRange) return "already-in-range";
      if (input.callbackRejectedRoom) return "callback-rejected-room";
      if (input.moveResult === ERR_NOT_FOUND) return "cached-path-missing";
      if (input.moveResult === ERR_NO_PATH) return "move-no-path";
      if (input.pathIncomplete) return "pathfinder-incomplete";
      if (!Number.isInteger(input.pathLength) || input.pathLength <= 0) {
        return "path-empty-out-of-range";
      }
      return "path-available";
    }

    const base = {
      targetValid: true,
      desiredRange: 1,
      alreadyInRange: false,
      callbackRejectedRoom: false,
      moveResult: OK,
      pathIncomplete: false,
      pathLength: 10,
    };

    assert.equal(classify({ ...base, targetValid: false }), "target-invalid");
    assert.equal(classify({ ...base, desiredRange: -1 }), "range-invalid");
    assert.equal(classify({ ...base, alreadyInRange: true }), "already-in-range");
    assert.equal(classify({ ...base, callbackRejectedRoom: true }), "callback-rejected-room");
    assert.equal(classify({ ...base, moveResult: ERR_NOT_FOUND }), "cached-path-missing");
    assert.equal(classify({ ...base, moveResult: ERR_NO_PATH }), "move-no-path");
    assert.equal(classify({ ...base, pathIncomplete: true }), "pathfinder-incomplete");
    assert.equal(classify({ ...base, pathLength: 0 }), "path-empty-out-of-range");
    assert.equal(classify(base), "path-available");
  },
);

record(
  "screeps-roomposition-distance",
  "覆盖同格、横纵、对角、范围1与3和跨房间不可比较。",
  () => {
    function range(from, to) {
      if (!from || !to || from.roomName !== to.roomName) return null;
      return Math.max(
        Math.abs(from.x - to.x),
        Math.abs(from.y - to.y),
      );
    }

    const origin = { x: 10, y: 10, roomName: "W1N1" };
    assert.equal(range(origin, origin), 0);
    assert.equal(range(origin, { x: 13, y: 10, roomName: "W1N1" }), 3);
    assert.equal(range(origin, { x: 10, y: 14, roomName: "W1N1" }), 4);
    assert.equal(range(origin, { x: 11, y: 11, roomName: "W1N1" }), 1);
    assert.equal(range(origin, { x: 13, y: 12, roomName: "W1N1" }), 3);
    assert.equal(range(origin, { x: 10, y: 10, roomName: "W2N2" }), null);

    const nearby = [
      { id: "b", x: 12, y: 12, roomName: "W1N1" },
      { id: "a", x: 11, y: 11, roomName: "W1N1" },
      { id: "c", x: 11, y: 11, roomName: "W1N1" },
    ].sort((left, right) =>
      range(origin, left) - range(origin, right)
      || left.id.localeCompare(right.id)
    );
    assert.deepEqual(nearby.map((item) => item.id), ["a", "c", "b"]);
  },
);

for (const result of results) {
  console.log(`批次模拟通过：${result.name} — ${result.detail}`);
}

console.log(
  `第十批文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`,
);
