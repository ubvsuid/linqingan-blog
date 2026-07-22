import assert from "node:assert/strict";

const results = [];

function record(name, detail, callback) {
  callback();
  results.push({ name, detail });
}

record(
  "screeps-move-fatigue-body-ratio",
  "覆盖地形成本、空载与满载CARRY、MOVE受伤和每步tick估算。",
  () => {
    const terrainCosts = {
      road: 1,
      plain: 2,
      swamp: 10,
    };

    function estimate(input) {
      const terrainCost = terrainCosts[input.terrain];
      if (
        !Number.isInteger(input.activeMoveParts)
        || input.activeMoveParts <= 0
        || !Number.isInteger(input.loadParts)
        || input.loadParts < 0
        || !Number.isInteger(terrainCost)
      ) {
        return { movable: false, reason: "invalid-input" };
      }

      const fatigueGenerated = input.loadParts * terrainCost;
      const fatigueRecoveredPerTick = input.activeMoveParts * 2;
      return {
        movable: true,
        fatigueGenerated,
        fatigueRecoveredPerTick,
        ticksPerStep: Math.max(
          1,
          Math.ceil(fatigueGenerated / fatigueRecoveredPerTick),
        ),
        movesEveryTick:
          fatigueRecoveredPerTick >= fatigueGenerated,
      };
    }

    assert.equal(estimate({
      activeMoveParts: 0,
      loadParts: 1,
      terrain: "plain",
    }).movable, false);

    assert.deepEqual(estimate({
      activeMoveParts: 1,
      loadParts: 1,
      terrain: "plain",
    }), {
      movable: true,
      fatigueGenerated: 2,
      fatigueRecoveredPerTick: 2,
      ticksPerStep: 1,
      movesEveryTick: true,
    });

    assert.equal(estimate({
      activeMoveParts: 1,
      loadParts: 2,
      terrain: "road",
    }).movesEveryTick, true);
    assert.equal(estimate({
      activeMoveParts: 1,
      loadParts: 1,
      terrain: "swamp",
    }).ticksPerStep, 5);
    assert.equal(estimate({
      activeMoveParts: 2,
      loadParts: 2,
      terrain: "plain",
    }).ticksPerStep, 1);
    assert.equal(estimate({
      activeMoveParts: 1,
      loadParts: 2,
      terrain: "plain",
    }).ticksPerStep, 2);
  },
);

record(
  "screeps-room-visibility",
  "覆盖房间名、世界坐标、Observer距离、对象状态、请求和下一tick检查。",
  () => {
    function parseRoomName(roomName) {
      const match = /^([WE])(\d+)([NS])(\d+)$/.exec(roomName);
      if (!match) return null;
      const horizontalNumber = Number(match[2]);
      const verticalNumber = Number(match[4]);
      return {
        x: match[1] === "E"
          ? horizontalNumber
          : -horizontalNumber - 1,
        y: match[3] === "S"
          ? verticalNumber
          : -verticalNumber - 1,
      };
    }

    function distance(fromRoom, toRoom) {
      const from = parseRoomName(fromRoom);
      const to = parseRoomName(toRoom);
      if (!from || !to) return null;
      return Math.max(
        Math.abs(from.x - to.x),
        Math.abs(from.y - to.y),
      );
    }

    function evaluate(input) {
      if (!input.roomNameValid) return "room-name-invalid";
      if (input.roomAlreadyVisible) return "room-already-visible";
      if (!input.observerExists) return "observer-missing";
      if (!input.observerOwned || !input.observerActive) {
        return "observer-inactive";
      }
      if (!Number.isInteger(input.roomDistance) || input.roomDistance > 10) {
        return "observer-out-of-range";
      }
      if (input.observeResult !== undefined && input.observeResult !== 0) {
        return "observe-call-failed";
      }
      return "observe-request-ready";
    }

    assert.deepEqual(parseRoomName("E0S0"), { x: 0, y: 0 });
    assert.deepEqual(parseRoomName("W0N0"), { x: -1, y: -1 });
    assert.equal(parseRoomName("room"), null);
    assert.equal(distance("W1N1", "W3N2"), 2);
    assert.equal(distance("W0N0", "E0S0"), 1);

    const base = {
      roomNameValid: true,
      roomAlreadyVisible: false,
      observerExists: true,
      observerOwned: true,
      observerActive: true,
      roomDistance: 10,
      observeResult: 0,
    };

    assert.equal(evaluate({ ...base, roomNameValid: false }), "room-name-invalid");
    assert.equal(evaluate({ ...base, roomAlreadyVisible: true }), "room-already-visible");
    assert.equal(evaluate({ ...base, observerExists: false }), "observer-missing");
    assert.equal(evaluate({ ...base, observerOwned: false }), "observer-inactive");
    assert.equal(evaluate({ ...base, roomDistance: 11 }), "observer-out-of-range");
    assert.equal(evaluate({ ...base, observeResult: -10 }), "observe-call-failed");
    assert.equal(evaluate(base), "observe-request-ready");
  },
);

for (const result of results) {
  console.log(`批次模拟通过：${result.name} — ${result.detail}`);
}

console.log(
  `第十一批文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`,
);
