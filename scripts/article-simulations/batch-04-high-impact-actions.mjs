import assert from "node:assert/strict";

const results = [];

function record(name, detail, callback) {
  callback();
  results.push({ name, detail });
}

record(
  "screeps-controller-activate-safe-mode",
  "覆盖Controller缺失、所有权、已开启、激活次数、等待状态、upgradeBlocked、降级限制和可提交场景。",
  () => {
    function evaluate(input) {
      if (!input.roomVisible || !input.hasController) return "controller-missing";
      if (!input.owned) return "not-owner";
      if (input.safeMode > 0) return "already-active";
      if (!Number.isInteger(input.safeModeAvailable) || input.safeModeAvailable <= 0) return "no-activation";
      if (input.safeModeCooldown > 0) return "activation-waiting";
      if (input.upgradeBlocked > 0) return "upgrade-blocked";
      if (Number.isFinite(input.downgradeLimit) && input.ticksToDowngrade <= input.downgradeLimit) {
        return "downgrade-limit";
      }
      return "ready";
    }

    const base = {
      roomVisible: true,
      hasController: true,
      owned: true,
      safeMode: 0,
      safeModeAvailable: 1,
      safeModeCooldown: 0,
      upgradeBlocked: 0,
      ticksToDowngrade: 100000,
      downgradeLimit: 5000,
    };

    assert.equal(evaluate({ ...base, roomVisible: false }), "controller-missing");
    assert.equal(evaluate({ ...base, owned: false }), "not-owner");
    assert.equal(evaluate({ ...base, safeMode: 100 }), "already-active");
    assert.equal(evaluate({ ...base, safeModeAvailable: 0 }), "no-activation");
    assert.equal(evaluate({ ...base, safeModeCooldown: 10 }), "activation-waiting");
    assert.equal(evaluate({ ...base, upgradeBlocked: 10 }), "upgrade-blocked");
    assert.equal(evaluate({ ...base, ticksToDowngrade: 5000 }), "downgrade-limit");
    assert.equal(evaluate(base), "ready");
  },
);

record(
  "screeps-nuker-launch-checklist",
  "覆盖目标、确认词、结构可用性、等待状态、距离、Energy、Ghodium和可提交场景。",
  () => {
    function confirmation(roomName, x, y) {
      return `LAUNCH_NUKE_${roomName}_${x}_${y}`;
    }

    function evaluate({ request, active, waitingTicks, distance, energy, ghodium }) {
      if (!request?.enabled) return "disabled";
      if (!request.targetRoom || !Number.isInteger(request.x) || !Number.isInteger(request.y)
        || request.x < 0 || request.x > 49 || request.y < 0 || request.y > 49) {
        return "invalid-target";
      }
      if (request.confirmation !== confirmation(request.targetRoom, request.x, request.y)) {
        return "confirmation-mismatch";
      }
      if (!active) return "structure-inactive";
      if (waitingTicks > 0) return "nuker-waiting";
      if (distance > 10) return "target-out-of-range";
      if (energy < 300000) return "energy-shortage";
      if (ghodium < 5000) return "ghodium-shortage";
      return "ready";
    }

    const request = {
      enabled: true,
      targetRoom: "W2N2",
      x: 25,
      y: 25,
      confirmation: "LAUNCH_NUKE_W2N2_25_25",
    };
    const base = { request, active: true, waitingTicks: 0, distance: 5, energy: 300000, ghodium: 5000 };

    assert.equal(evaluate({ ...base, request: { ...request, x: 50 } }), "invalid-target");
    assert.equal(evaluate({ ...base, request: { ...request, confirmation: "LAUNCH" } }), "confirmation-mismatch");
    assert.equal(evaluate({ ...base, active: false }), "structure-inactive");
    assert.equal(evaluate({ ...base, waitingTicks: 1 }), "nuker-waiting");
    assert.equal(evaluate({ ...base, distance: 11 }), "target-out-of-range");
    assert.equal(evaluate({ ...base, energy: 299999 }), "energy-shortage");
    assert.equal(evaluate({ ...base, ghodium: 4999 }), "ghodium-shortage");
    assert.equal(evaluate(base), "ready");
  },
);

record(
  "screeps-room-create-construction-site",
  "覆盖请求参数、房间视野、墙体地形、已有Road、已有工地、账号上限和可提交场景。",
  () => {
    function evaluate({ request, roomVisible, terrain, hasRoad, hasSite, siteCount }) {
      if (!request?.enabled) return "disabled";
      if (!request.roomName || !Number.isInteger(request.x) || !Number.isInteger(request.y)
        || request.x < 0 || request.x > 49 || request.y < 0 || request.y > 49
        || request.structureType !== "road") return "invalid-request";
      if (!roomVisible) return "room-not-visible";
      if (terrain === 1) return "terrain-wall";
      if (hasRoad) return "road-exists";
      if (hasSite) return "site-exists";
      if (siteCount >= 100) return "site-limit";
      return "ready";
    }

    const request = { enabled: true, roomName: "W1N1", x: 20, y: 20, structureType: "road" };
    const base = { request, roomVisible: true, terrain: 0, hasRoad: false, hasSite: false, siteCount: 10 };

    assert.equal(evaluate({ ...base, request: { ...request, x: -1 } }), "invalid-request");
    assert.equal(evaluate({ ...base, roomVisible: false }), "room-not-visible");
    assert.equal(evaluate({ ...base, terrain: 1 }), "terrain-wall");
    assert.equal(evaluate({ ...base, hasRoad: true }), "road-exists");
    assert.equal(evaluate({ ...base, hasSite: true }), "site-exists");
    assert.equal(evaluate({ ...base, siteCount: 100 }), "site-limit");
    assert.equal(evaluate(base), "ready");
  },
);

record(
  "screeps-construction-site-remove",
  "覆盖请求确认、工地缺失、所有权、房间、坐标、类型和可提交场景。",
  () => {
    function evaluate({ request, site }) {
      if (!request?.enabled) return "disabled";
      if (!request.siteId || !request.roomName || !Number.isInteger(request.x)
        || !Number.isInteger(request.y) || request.confirmation !== "REMOVE_CONSTRUCTION_SITE") {
        return "invalid-request";
      }
      if (!site) return "site-missing";
      if (!site.my) return "not-owner";
      if (site.pos.roomName !== request.roomName) return "room-mismatch";
      if (site.pos.x !== request.x || site.pos.y !== request.y) return "position-mismatch";
      if (site.structureType !== request.expectedType) return "type-mismatch";
      return "ready";
    }

    const request = {
      enabled: true,
      siteId: "site",
      roomName: "W1N1",
      x: 20,
      y: 20,
      expectedType: "road",
      confirmation: "REMOVE_CONSTRUCTION_SITE",
    };
    const site = { my: true, structureType: "road", pos: { roomName: "W1N1", x: 20, y: 20 } };

    assert.equal(evaluate({ request: { ...request, confirmation: "REMOVE" }, site }), "invalid-request");
    assert.equal(evaluate({ request, site: null }), "site-missing");
    assert.equal(evaluate({ request, site: { ...site, my: false } }), "not-owner");
    assert.equal(evaluate({ request, site: { ...site, pos: { ...site.pos, roomName: "W2N2" } } }), "room-mismatch");
    assert.equal(evaluate({ request, site: { ...site, pos: { ...site.pos, x: 21 } } }), "position-mismatch");
    assert.equal(evaluate({ request, site: { ...site, structureType: "extension" } }), "type-mismatch");
    assert.equal(evaluate({ request, site }), "ready");
  },
);

record(
  "screeps-structure-destroy",
  "覆盖确认词、对象缺失、所有权、结构类型、房间、坐标、敌对Creep和可提交场景。",
  () => {
    function evaluate({ request, structure, owned, hostileCount }) {
      if (!request?.enabled) return "disabled";
      if (!request.structureId || !request.roomName || request.expectedType !== "extension"
        || request.confirmation !== "DESTROY_EXTENSION") return "invalid-request";
      if (!structure) return "structure-missing";
      if (!owned) return "not-owner";
      if (structure.structureType !== request.expectedType) return "type-mismatch";
      if (structure.pos.roomName !== request.roomName) return "room-mismatch";
      if (structure.pos.x !== request.x || structure.pos.y !== request.y) return "position-mismatch";
      if (hostileCount > 0) return "hostiles-present";
      return "ready";
    }

    const request = {
      enabled: true,
      structureId: "extension",
      roomName: "W1N1",
      x: 20,
      y: 20,
      expectedType: "extension",
      confirmation: "DESTROY_EXTENSION",
    };
    const structure = { structureType: "extension", pos: { roomName: "W1N1", x: 20, y: 20 } };

    assert.equal(evaluate({ request: { ...request, confirmation: "DESTROY" }, structure, owned: true, hostileCount: 0 }), "invalid-request");
    assert.equal(evaluate({ request, structure: null, owned: false, hostileCount: 0 }), "structure-missing");
    assert.equal(evaluate({ request, structure, owned: false, hostileCount: 0 }), "not-owner");
    assert.equal(evaluate({ request, structure: { ...structure, structureType: "spawn" }, owned: true, hostileCount: 0 }), "type-mismatch");
    assert.equal(evaluate({ request, structure: { ...structure, pos: { ...structure.pos, roomName: "W2N2" } }, owned: true, hostileCount: 0 }), "room-mismatch");
    assert.equal(evaluate({ request, structure: { ...structure, pos: { ...structure.pos, y: 21 } }, owned: true, hostileCount: 0 }), "position-mismatch");
    assert.equal(evaluate({ request, structure, owned: true, hostileCount: 1 }), "hostiles-present");
    assert.equal(evaluate({ request, structure, owned: true, hostileCount: 0 }), "ready");
  },
);

for (const result of results) {
  console.log(`批次模拟通过：${result.name} — ${result.detail}`);
}
console.log(`第四批文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`);
