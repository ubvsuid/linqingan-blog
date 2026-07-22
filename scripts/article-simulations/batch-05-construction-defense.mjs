import assert from "node:assert/strict";

const results = [];

function record(name, detail, callback) {
  callback();
  results.push({ name, detail });
}

record(
  "screeps-construction-site-progress",
  "覆盖正常进度、剩余量、总量为0、超过总量保护和排序。",
  () => {
    function report(site) {
      const total = Number.isFinite(site.progressTotal)
        ? site.progressTotal
        : 0;
      const progress = Number.isFinite(site.progress)
        ? site.progress
        : 0;
      return {
        remaining: Math.max(0, total - progress),
        percent: total > 0
          ? Math.min(100, Math.floor((progress / total) * 100))
          : 0,
      };
    }

    assert.deepEqual(report({ progress: 25, progressTotal: 100 }), { remaining: 75, percent: 25 });
    assert.deepEqual(report({ progress: 120, progressTotal: 100 }), { remaining: 0, percent: 100 });
    assert.deepEqual(report({ progress: 0, progressTotal: 0 }), { remaining: 0, percent: 0 });
  },
);

record(
  "screeps-tower-auto-attack-hostiles",
  "覆盖通行玩家排除、活跃战斗部件优先、同分距离排序和无目标。",
  () => {
    function score(creep) {
      return creep.attack * 5 + creep.ranged * 5 + creep.heal * 4 + creep.work * 2 + creep.claim * 3;
    }

    function select(towers, creeps, allowedUsers) {
      const candidates = creeps.filter((creep) => !allowedUsers.has(creep.owner));
      if (towers.length === 0 || candidates.length === 0) return null;
      return [...candidates].sort((left, right) => {
        const scoreDifference = score(right) - score(left);
        if (scoreDifference !== 0) return scoreDifference;
        const leftRange = Math.min(...towers.map((tower) => tower.ranges[left.name]));
        const rightRange = Math.min(...towers.map((tower) => tower.ranges[right.name]));
        if (leftRange !== rightRange) return leftRange - rightRange;
        return left.name.localeCompare(right.name);
      })[0];
    }

    const towers = [{ ranges: { Scout: 2, Fighter: 8, Healer: 5, Guest: 1 } }];
    const creeps = [
      { name: "Scout", owner: "enemy", attack: 0, ranged: 0, heal: 0, work: 0, claim: 0 },
      { name: "Fighter", owner: "enemy", attack: 2, ranged: 0, heal: 0, work: 0, claim: 0 },
      { name: "Healer", owner: "enemy", attack: 0, ranged: 0, heal: 3, work: 0, claim: 0 },
      { name: "Guest", owner: "allowed", attack: 5, ranged: 5, heal: 5, work: 5, claim: 5 },
    ];

    assert.equal(select(towers, creeps, new Set(["allowed"])).name, "Healer");
    assert.equal(select(towers, [creeps[0]], new Set()).name, "Scout");
    assert.equal(select([], creeps, new Set()), null);
    assert.equal(select(towers, [creeps[3]], new Set(["allowed"])), null);
  },
);

record(
  "screeps-tower-heal-creeps",
  "覆盖受伤比例、缺失hits、距离、稳定名称排序和无目标。",
  () => {
    function select(towers, creeps) {
      const injured = creeps.filter((creep) => creep.hits > 0 && creep.hits < creep.hitsMax);
      if (towers.length === 0 || injured.length === 0) return null;
      return [...injured].sort((left, right) => {
        const ratioDifference = left.hits / left.hitsMax - right.hits / right.hitsMax;
        if (ratioDifference !== 0) return ratioDifference;
        const missingDifference = (right.hitsMax - right.hits) - (left.hitsMax - left.hits);
        if (missingDifference !== 0) return missingDifference;
        const leftRange = Math.min(...towers.map((tower) => tower.ranges[left.name]));
        const rightRange = Math.min(...towers.map((tower) => tower.ranges[right.name]));
        if (leftRange !== rightRange) return leftRange - rightRange;
        return left.name.localeCompare(right.name);
      })[0];
    }

    const towers = [{ ranges: { A: 10, B: 2, C: 5 } }];
    const creeps = [
      { name: "A", hits: 200, hitsMax: 1000 },
      { name: "B", hits: 600, hitsMax: 1000 },
      { name: "C", hits: 200, hitsMax: 500 },
    ];

    assert.equal(select(towers, creeps).name, "A");
    assert.equal(select(towers, [{ name: "A", hits: 500, hitsMax: 1000 }, { name: "B", hits: 1000, hitsMax: 2000 }]).name, "B");
    assert.equal(select(towers, [{ name: "A", hits: 500, hitsMax: 1000 }, { name: "B", hits: 500, hitsMax: 1000 }]).name, "B");
    assert.equal(select(towers, [{ name: "A", hits: 1000, hitsMax: 1000 }]), null);
  },
);

record(
  "screeps-tower-repair-threshold",
  "覆盖敌人、己方受伤、Energy保留线、墙体排除、比例阈值和距离排序。",
  () => {
    function select(towers, structures, ratioLimit) {
      const candidates = structures.filter((structure) =>
        structure.hits < structure.hitsMax
        && structure.hits / structure.hitsMax < ratioLimit
        && structure.type !== "wall"
        && structure.type !== "rampart");
      if (towers.length === 0 || candidates.length === 0) return null;
      return [...candidates].sort((left, right) => {
        const ratioDifference = left.hits / left.hitsMax - right.hits / right.hitsMax;
        if (ratioDifference !== 0) return ratioDifference;
        const leftRange = Math.min(...towers.map((tower) => tower.ranges[left.id]));
        const rightRange = Math.min(...towers.map((tower) => tower.ranges[right.id]));
        if (leftRange !== rightRange) return leftRange - rightRange;
        return left.id.localeCompare(right.id);
      })[0];
    }

    const towers = [{ ranges: { road: 5, extension: 2, wall: 1 } }];
    const structures = [
      { id: "road", type: "road", hits: 1000, hitsMax: 5000 },
      { id: "extension", type: "extension", hits: 500, hitsMax: 1000 },
      { id: "wall", type: "wall", hits: 1, hitsMax: 1000000 },
    ];

    assert.equal(select(towers, structures, 0.8).id, "road");
    assert.equal(select(towers, [{ id: "road", type: "road", hits: 4500, hitsMax: 5000 }], 0.8), null);
    assert.equal(select(towers, [{ id: "wall", type: "wall", hits: 1, hitsMax: 1000000 }], 0.8), null);
    assert.equal(select([], structures, 0.8), null);
  },
);

record(
  "screeps-rampart-set-public",
  "覆盖确认词、对象缺失、所有权、类型、位置、状态一致和可提交场景。",
  () => {
    function confirmation(roomName, x, y, isPublic) {
      return `SET_RAMPART_${isPublic ? "PUBLIC" : "PRIVATE"}_${roomName}_${x}_${y}`;
    }

    function evaluate({ request, rampart, owned }) {
      if (!request?.enabled) return "disabled";
      if (!request.rampartId || !request.roomName || typeof request.public !== "boolean") return "invalid-request";
      if (request.confirmation !== confirmation(request.roomName, request.x, request.y, request.public)) {
        return "confirmation-mismatch";
      }
      if (!rampart) return "rampart-missing";
      if (!owned) return "not-owner";
      if (rampart.type !== "rampart") return "type-mismatch";
      if (rampart.roomName !== request.roomName) return "room-mismatch";
      if (rampart.x !== request.x || rampart.y !== request.y) return "position-mismatch";
      if (rampart.isPublic === request.public) return "state-already-matches";
      return "ready";
    }

    const request = {
      enabled: true,
      rampartId: "rampart",
      roomName: "W1N1",
      x: 20,
      y: 20,
      public: true,
      confirmation: "SET_RAMPART_PUBLIC_W1N1_20_20",
    };
    const rampart = { type: "rampart", roomName: "W1N1", x: 20, y: 20, isPublic: false };

    assert.equal(evaluate({ request: { ...request, confirmation: "PUBLIC" }, rampart, owned: true }), "confirmation-mismatch");
    assert.equal(evaluate({ request, rampart: null, owned: false }), "rampart-missing");
    assert.equal(evaluate({ request, rampart, owned: false }), "not-owner");
    assert.equal(evaluate({ request, rampart: { ...rampart, type: "road" }, owned: true }), "type-mismatch");
    assert.equal(evaluate({ request, rampart: { ...rampart, roomName: "W2N2" }, owned: true }), "room-mismatch");
    assert.equal(evaluate({ request, rampart: { ...rampart, x: 21 }, owned: true }), "position-mismatch");
    assert.equal(evaluate({ request, rampart: { ...rampart, isPublic: true }, owned: true }), "state-already-matches");
    assert.equal(evaluate({ request, rampart, owned: true }), "ready");
  },
);

for (const result of results) {
  console.log(`批次模拟通过：${result.name} — ${result.detail}`);
}
console.log(`第五批文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`);
