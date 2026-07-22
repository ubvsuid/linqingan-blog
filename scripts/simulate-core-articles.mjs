import assert from "node:assert/strict";

const BODYPART_COST = {
  work: 100,
  carry: 50,
  move: 50,
};

const results = [];

function record(name, detail, callback) {
  callback();
  results.push({ name, detail });
}

record(
  "screeps-dynamic-creep-body-energy",
  "0、199、200、550、3200、10000 Energy 的身体长度与成本符合预期，最大 48 部件。",
  () => {
    function buildWorkerBody(energy) {
      const unitCost = BODYPART_COST.work + BODYPART_COST.carry + BODYPART_COST.move;
      const units = Math.min(16, Math.floor(energy / unitCost));
      return Array.from({ length: units }, () => ["work", "carry", "move"]).flat();
    }

    const cost = (body) => body.reduce((sum, part) => sum + BODYPART_COST[part], 0);
    assert.equal(buildWorkerBody(0).length, 0);
    assert.equal(buildWorkerBody(199).length, 0);
    assert.equal(buildWorkerBody(200).length, 3);
    assert.equal(cost(buildWorkerBody(200)), 200);
    assert.equal(buildWorkerBody(550).length, 6);
    assert.equal(cost(buildWorkerBody(550)), 400);
    assert.equal(buildWorkerBody(3200).length, 48);
    assert.equal(cost(buildWorkerBody(3200)), 3200);
    assert.equal(buildWorkerBody(10000).length, 48);
  },
);

record(
  "screeps-clean-dead-creep-memory",
  "保留存活 Creep 的 Memory，删除两个死亡名称；Memory.creeps 缺失时返回 0。",
  () => {
    function cleanDeadCreepMemory(memory, game) {
      if (!memory.creeps) return 0;
      let removed = 0;
      for (const name in memory.creeps) {
        if (!game.creeps[name]) {
          delete memory.creeps[name];
          removed += 1;
        }
      }
      return removed;
    }

    const memory = { creeps: { Alive: { role: "worker" }, DeadA: {}, DeadB: {} } };
    const game = { creeps: { Alive: { name: "Alive" } } };
    assert.equal(cleanDeadCreepMemory(memory, game), 2);
    assert.deepEqual(Object.keys(memory.creeps), ["Alive"]);
    assert.equal(cleanDeadCreepMemory({}, game), 0);
  },
);

record(
  "screeps-construction-site-progress",
  "覆盖正常进度、超过总量保护、总量为 0，以及按剩余量排序。",
  () => {
    function createReport(sites) {
      return sites
        .map((site) => {
          const remaining = Math.max(0, site.progressTotal - site.progress);
          const percent = site.progressTotal > 0
            ? Math.min(100, Math.floor((site.progress / site.progressTotal) * 100))
            : 0;
          return { id: site.id, remaining, percent };
        })
        .sort((left, right) => left.remaining - right.remaining);
    }

    const report = createReport([
      { id: "a", progress: 40, progressTotal: 100 },
      { id: "b", progress: 120, progressTotal: 100 },
      { id: "c", progress: 0, progressTotal: 0 },
    ]);
    assert.deepEqual(report, [
      { id: "b", remaining: 0, percent: 100 },
      { id: "c", remaining: 0, percent: 0 },
      { id: "a", remaining: 60, percent: 40 },
    ]);
  },
);

record(
  "screeps-tower-repair-threshold",
  "有敌人、Energy 不足、只有墙体时不维修；空闲且有受损普通建筑时选择最近目标。",
  () => {
    function selectTowerRepairTarget({ hostiles, energy, structures }) {
      if (hostiles.length > 0 || energy < 500) return null;
      return structures
        .filter((structure) =>
          structure.hits < structure.hitsMax
          && structure.structureType !== "constructedWall"
          && structure.structureType !== "rampart",
        )
        .sort((left, right) => left.range - right.range)[0] ?? null;
    }

    const road = { id: "road", structureType: "road", hits: 100, hitsMax: 5000, range: 4 };
    const extension = { id: "extension", structureType: "extension", hits: 500, hitsMax: 1000, range: 2 };
    const wall = { id: "wall", structureType: "constructedWall", hits: 1, hitsMax: 1000000, range: 1 };
    assert.equal(selectTowerRepairTarget({ hostiles: [{}], energy: 1000, structures: [road] }), null);
    assert.equal(selectTowerRepairTarget({ hostiles: [], energy: 499, structures: [road] }), null);
    assert.equal(selectTowerRepairTarget({ hostiles: [], energy: 1000, structures: [wall] }), null);
    assert.equal(
      selectTowerRepairTarget({ hostiles: [], energy: 1000, structures: [road, extension, wall] }).id,
      "extension",
    );
  },
);

record(
  "screeps-spawn-emergency-recovery",
  "Spawn 缺失、忙碌、已有采集者或 Energy 不足时等待；零采集者且 200 Energy 时生成最小方案。",
  () => {
    function getEmergencyDecision({ hasSpawn, spawning, harvesterCount, energyAvailable }) {
      if (!hasSpawn) return "no-spawn";
      if (spawning) return "busy";
      if (harvesterCount > 0) return "not-needed";
      if (energyAvailable < 200) return "waiting-energy";
      return "spawn-minimal-harvester";
    }

    assert.equal(getEmergencyDecision({ hasSpawn: false, spawning: false, harvesterCount: 0, energyAvailable: 300 }), "no-spawn");
    assert.equal(getEmergencyDecision({ hasSpawn: true, spawning: true, harvesterCount: 0, energyAvailable: 300 }), "busy");
    assert.equal(getEmergencyDecision({ hasSpawn: true, spawning: false, harvesterCount: 1, energyAvailable: 300 }), "not-needed");
    assert.equal(getEmergencyDecision({ hasSpawn: true, spawning: false, harvesterCount: 0, energyAvailable: 199 }), "waiting-energy");
    assert.equal(getEmergencyDecision({ hasSpawn: true, spawning: false, harvesterCount: 0, energyAvailable: 200 }), "spawn-minimal-harvester");
  },
);

for (const result of results) {
  console.log(`模拟通过：${result.name} — ${result.detail}`);
}
console.log(`核心文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`);
