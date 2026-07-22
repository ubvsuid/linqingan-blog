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

record(
  "screeps-rawmemory-segments",
  "区分未加载、空字符串、合法对象 JSON、损坏 JSON 和非对象 JSON，损坏内容不会被覆盖。",
  () => {
    function parseSegment(raw) {
      if (raw === undefined) return { status: "unavailable", value: null };
      if (raw === "") return { status: "ok", value: {} };

      try {
        const value = JSON.parse(raw);
        if (!value || Array.isArray(value) || typeof value !== "object") {
          return { status: "invalid", value: null };
        }
        return { status: "ok", value };
      } catch {
        return { status: "invalid", value: null };
      }
    }

    assert.deepEqual(parseSegment(undefined), { status: "unavailable", value: null });
    assert.deepEqual(parseSegment(""), { status: "ok", value: {} });
    assert.deepEqual(parseSegment('{"count":2}'), { status: "ok", value: { count: 2 } });
    assert.deepEqual(parseSegment("{"), { status: "invalid", value: null });
    assert.deepEqual(parseSegment("[]"), { status: "invalid", value: null });
  },
);

record(
  "screeps-global-cache",
  "同房间缓存命中、到期重建、不同房间隔离，以及全局重置后空缓存重建场景通过。",
  () => {
    function readCache(cache, key, tick, ttl, loader) {
      const current = cache.get(key);
      if (current && current.expiresAt > tick) return current.value;
      const value = loader();
      cache.set(key, { value, expiresAt: tick + ttl });
      return value;
    }

    const cache = new Map();
    let loads = 0;
    const loadA = () => {
      loads += 1;
      return ["source-a"];
    };

    assert.deepEqual(readCache(cache, "W1N1", 100, 10, loadA), ["source-a"]);
    assert.deepEqual(readCache(cache, "W1N1", 105, 10, loadA), ["source-a"]);
    assert.equal(loads, 1);
    assert.deepEqual(readCache(cache, "W1N1", 110, 10, loadA), ["source-a"]);
    assert.equal(loads, 2);
    assert.deepEqual(readCache(cache, "W2N2", 110, 10, () => ["source-b"]), ["source-b"]);
    assert.deepEqual(readCache(new Map(), "W1N1", 200, 10, loadA), ["source-a"]);
    assert.equal(loads, 3);
  },
);

record(
  "screeps-cpu-getused-bucket",
  "固定长度样本窗口会丢弃最旧数据，并正确计算样本数、平均值和最大值。",
  () => {
    function appendSample(samples, value, limit) {
      samples.push(value);
      while (samples.length > limit) samples.shift();
    }

    function summarize(samples) {
      if (samples.length === 0) return { count: 0, average: 0, maximum: 0 };
      const total = samples.reduce((sum, value) => sum + value, 0);
      return {
        count: samples.length,
        average: total / samples.length,
        maximum: Math.max(...samples),
      };
    }

    const samples = [];
    appendSample(samples, 1, 3);
    appendSample(samples, 2, 3);
    appendSample(samples, 3, 3);
    appendSample(samples, 4, 3);
    assert.deepEqual(samples, [2, 3, 4]);
    assert.deepEqual(summarize(samples), { count: 3, average: 3, maximum: 4 });
    assert.deepEqual(summarize([]), { count: 0, average: 0, maximum: 0 });
  },
);

record(
  "screeps-room-event-log",
  "只保留攻击事件，忽略缺少 targetId 的损坏记录，并识别目标仍存在且属于自己的攻击。",
  () => {
    function selectOwnedAttacks(events, objectsById) {
      return events
        .filter((event) => event.event === 1)
        .map((event) => {
          const data = event.data && typeof event.data === "object" ? event.data : {};
          const targetId = typeof data.targetId === "string" ? data.targetId : null;
          const target = targetId ? objectsById[targetId] : null;
          if (!target || target.my !== true) return null;
          return {
            attackerId: event.objectId ?? null,
            targetId,
            damage: Number.isFinite(data.damage) ? data.damage : 0,
          };
        })
        .filter(Boolean);
    }

    const result = selectOwnedAttacks([
      { event: 1, objectId: "enemy", data: { targetId: "mine", damage: 30 } },
      { event: 1, objectId: "mine", data: { targetId: "enemy", damage: 10 } },
      { event: 1, objectId: "broken", data: null },
      { event: 4, objectId: "builder", data: { targetId: "site" } },
    ], {
      mine: { my: true },
      enemy: { my: false },
    });

    assert.deepEqual(result, [
      { attackerId: "enemy", targetId: "mine", damage: 30 },
    ]);
  },
);

record(
  "screeps-market-create-order",
  "覆盖参数校验、5% 挂单费用、Credits 不足、重复订单和可提交场景。",
  () => {
    function inspectOrderRequest(request, existingOrders, credits) {
      if (!request || request.enabled !== true) return { status: "disabled" };
      if (!["buy", "sell"].includes(request.type)) return { status: "invalid" };
      if (typeof request.resourceType !== "string" || request.resourceType.length === 0) {
        return { status: "invalid" };
      }
      if (!Number.isFinite(request.price) || request.price <= 0) return { status: "invalid" };
      if (!Number.isInteger(request.totalAmount) || request.totalAmount <= 0) {
        return { status: "invalid" };
      }

      const duplicate = existingOrders.some((order) =>
        order.type === request.type
        && order.resourceType === request.resourceType
        && order.roomName === request.roomName,
      );
      if (duplicate) return { status: "duplicate" };

      const fee = request.price * request.totalAmount * 0.05;
      if (credits < fee) return { status: "insufficient-credits", fee };
      return { status: "ready", fee };
    }

    const base = {
      enabled: true,
      type: "sell",
      resourceType: "U",
      price: 1,
      totalAmount: 10000,
      roomName: "W1N1",
    };

    assert.deepEqual(inspectOrderRequest({ ...base, price: 0 }, [], 1000), { status: "invalid" });
    assert.deepEqual(inspectOrderRequest(base, [], 499), { status: "insufficient-credits", fee: 500 });
    assert.deepEqual(inspectOrderRequest(base, [{ ...base }], 1000), { status: "duplicate" });
    assert.deepEqual(inspectOrderRequest(base, [], 1000), { status: "ready", fee: 500 });
  },
);

for (const result of results) {
  console.log(`模拟通过：${result.name} — ${result.detail}`);
}
console.log(`核心文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`);
