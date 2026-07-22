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

record(
  "screeps-pathfinder-costmatrix",
  "道路、可穿越结构、不可穿越结构、自定义高成本格和坐标边界场景通过。",
  () => {
    function getStructureCost(structure) {
      if (structure.structureType === "road") return 1;
      if (structure.structureType === "container") return 0;
      if (structure.structureType === "rampart" && structure.my === true) return 0;
      return 255;
    }

    function isValidRoomCoordinate(value) {
      return Number.isInteger(value) && value >= 0 && value <= 49;
    }

    function overlayAvoidCost(current, avoidCost) {
      return current >= 255 ? 255 : Math.max(current, avoidCost);
    }

    assert.equal(getStructureCost({ structureType: "road" }), 1);
    assert.equal(getStructureCost({ structureType: "container" }), 0);
    assert.equal(getStructureCost({ structureType: "rampart", my: true }), 0);
    assert.equal(getStructureCost({ structureType: "rampart", my: false }), 255);
    assert.equal(getStructureCost({ structureType: "spawn", my: true }), 255);
    assert.equal(overlayAvoidCost(0, 20), 20);
    assert.equal(overlayAvoidCost(1, 20), 20);
    assert.equal(overlayAvoidCost(255, 20), 255);
    assert.equal(isValidRoomCoordinate(0), true);
    assert.equal(isValidRoomCoordinate(49), true);
    assert.equal(isValidRoomCoordinate(-1), false);
    assert.equal(isValidRoomCoordinate(50), false);
    assert.equal(isValidRoomCoordinate(1.5), false);
  },
);

record(
  "screeps-map-find-route",
  "明确禁用房间、己方房间、高速公路、普通房间、空路线和当前步骤选择场景通过。",
  () => {
    function isHighwayRoom(roomName) {
      const match = /^[WE](\d+)[NS](\d+)$/.exec(roomName);
      if (!match) return false;
      return Number(match[1]) % 10 === 0 || Number(match[2]) % 10 === 0;
    }

    function getRouteRoomCost(roomName, avoidedRooms, ownedRooms) {
      if (avoidedRooms.has(roomName)) return Infinity;
      if (ownedRooms.has(roomName) || isHighwayRoom(roomName)) return 1;
      return 2.5;
    }

    function selectCurrentStep(roomName, steps, exits) {
      if (!Array.isArray(steps) || steps.length === 0) return null;
      return steps.find((step) => exits[roomName]?.[step.exit] === step.room) ?? null;
    }

    const avoided = new Set(["W5N5"]);
    const owned = new Set(["W4N4"]);
    assert.equal(getRouteRoomCost("W5N5", avoided, owned), Infinity);
    assert.equal(getRouteRoomCost("W4N4", avoided, owned), 1);
    assert.equal(getRouteRoomCost("W10N3", avoided, owned), 1);
    assert.equal(getRouteRoomCost("W3N3", avoided, owned), 2.5);
    assert.equal(isHighwayRoom("invalid"), false);
    assert.equal(selectCurrentStep("W1N1", [], {}), null);
    assert.deepEqual(
      selectCurrentStep(
        "W1N1",
        [{ exit: 3, room: "W0N1" }, { exit: 5, room: "W1N0" }],
        { W1N1: { 3: "W0N1", 5: "W1N0" } },
      ),
      { exit: 3, room: "W0N1" },
    );
  },
);

record(
  "screeps-observer-observe-room",
  "无请求、同tick、下一tick可见、下一tick不可见、过期请求和新请求记录场景通过。",
  () => {
    function getObservationStatus(state, currentTick, visibleRooms) {
      if (!state || typeof state.requestedRoom !== "string") return "none";
      if (state.requestedAt === currentTick) return "waiting";
      if (state.requestedAt !== currentTick - 1) return "expired";
      return visibleRooms.has(state.requestedRoom) ? "visible" : "missing";
    }

    function createRequestState(result, roomName, tick, observerId) {
      if (result !== 0) return null;
      return { requestedRoom: roomName, requestedAt: tick, observerId };
    }

    const visible = new Set(["W2N2"]);
    assert.equal(getObservationStatus(null, 101, visible), "none");
    assert.equal(getObservationStatus({ requestedRoom: "W2N2", requestedAt: 101 }, 101, visible), "waiting");
    assert.equal(getObservationStatus({ requestedRoom: "W2N2", requestedAt: 100 }, 101, visible), "visible");
    assert.equal(getObservationStatus({ requestedRoom: "W3N3", requestedAt: 100 }, 101, visible), "missing");
    assert.equal(getObservationStatus({ requestedRoom: "W2N2", requestedAt: 99 }, 101, visible), "expired");
    assert.equal(createRequestState(-9, "W20N20", 101, "observer"), null);
    assert.deepEqual(createRequestState(0, "W2N2", 101, "observer"), {
      requestedRoom: "W2N2",
      requestedAt: 101,
      observerId: "observer",
    });
  },
);

record(
  "screeps-game-notify",
  "首次进入风险、持续风险、恢复、再次进入、重复间隔和1000字符限制场景通过。",
  () => {
    function evaluateControllerAlert({ ticksToDowngrade, threshold, currentTick, previousState, repeatAfterTicks }) {
      const previous = previousState || { active: false, lastSentTick: null };
      const isRisk = Number.isFinite(ticksToDowngrade) && ticksToDowngrade < threshold;

      if (!isRisk) {
        return {
          shouldNotify: false,
          nextState: { active: false, lastSentTick: previous.lastSentTick },
        };
      }

      const firstEntry = previous.active !== true;
      const lastSentTick = Number.isInteger(previous.lastSentTick) ? previous.lastSentTick : null;
      const repeatDue = lastSentTick !== null && currentTick - lastSentTick >= repeatAfterTicks;
      const shouldNotify = firstEntry || repeatDue;

      return {
        shouldNotify,
        nextState: {
          active: true,
          lastSentTick: shouldNotify ? currentTick : lastSentTick,
        },
      };
    }

    function normalizeNotificationMessage(message) {
      const text = String(message);
      return text.length <= 1000 ? text : `${text.slice(0, 997)}...`;
    }

    const entered = evaluateControllerAlert({
      ticksToDowngrade: 4900,
      threshold: 5000,
      currentTick: 100,
      previousState: null,
      repeatAfterTicks: 5000,
    });
    assert.equal(entered.shouldNotify, true);

    const active = evaluateControllerAlert({
      ticksToDowngrade: 4800,
      threshold: 5000,
      currentTick: 101,
      previousState: entered.nextState,
      repeatAfterTicks: 5000,
    });
    assert.equal(active.shouldNotify, false);

    const repeated = evaluateControllerAlert({
      ticksToDowngrade: 3000,
      threshold: 5000,
      currentTick: 5100,
      previousState: active.nextState,
      repeatAfterTicks: 5000,
    });
    assert.equal(repeated.shouldNotify, true);

    const recovered = evaluateControllerAlert({
      ticksToDowngrade: 6000,
      threshold: 5000,
      currentTick: 5101,
      previousState: repeated.nextState,
      repeatAfterTicks: 5000,
    });
    assert.equal(recovered.shouldNotify, false);
    assert.equal(recovered.nextState.active, false);

    const enteredAgain = evaluateControllerAlert({
      ticksToDowngrade: 4900,
      threshold: 5000,
      currentTick: 5102,
      previousState: recovered.nextState,
      repeatAfterTicks: 5000,
    });
    assert.equal(enteredAgain.shouldNotify, true);
    assert.equal(normalizeNotificationMessage("a".repeat(999)).length, 999);
    assert.equal(normalizeNotificationMessage("a".repeat(1200)).length, 1000);
  },
);

record(
  "screeps-lab-run-reaction",
  "三座Lab缺失、配方无效、输入不足、输出不兼容、输出容量不足、距离超限、等待时间与可执行场景通过。",
  () => {
    const reactions = { H: { O: "OH" } };

    function evaluateReactionPlan({ inputA, inputB, output, reactionAmount }) {
      if (!inputA || !inputB || !output) return { ready: false, reason: "lab-missing" };
      if (output.cooldown > 0) return { ready: false, reason: "output-waiting" };

      const product = reactions[inputA.mineralType]?.[inputB.mineralType];
      if (!product) return { ready: false, reason: "invalid-recipe" };
      if (inputA.amount < reactionAmount || inputB.amount < reactionAmount) {
        return { ready: false, reason: "reagent-shortage", product };
      }
      if (output.mineralType && output.mineralType !== product) {
        return { ready: false, reason: "output-mineral-conflict", product };
      }
      if (output.freeCapacity < reactionAmount) {
        return { ready: false, reason: "output-full", product };
      }
      if (inputA.range > 2 || inputB.range > 2) {
        return { ready: false, reason: "input-out-of-range", product };
      }
      return { ready: true, reason: "ready", product };
    }

    const inputA = { mineralType: "H", amount: 100, range: 2 };
    const inputB = { mineralType: "O", amount: 100, range: 2 };
    const output = { mineralType: null, freeCapacity: 100, cooldown: 0 };

    assert.equal(evaluateReactionPlan({ inputA: null, inputB, output, reactionAmount: 5 }).reason, "lab-missing");
    assert.equal(evaluateReactionPlan({ inputA, inputB, output: { ...output, cooldown: 1 }, reactionAmount: 5 }).reason, "output-waiting");
    assert.equal(evaluateReactionPlan({ inputA: { ...inputA, mineralType: "U" }, inputB, output, reactionAmount: 5 }).reason, "invalid-recipe");
    assert.equal(evaluateReactionPlan({ inputA: { ...inputA, amount: 4 }, inputB, output, reactionAmount: 5 }).reason, "reagent-shortage");
    assert.equal(evaluateReactionPlan({ inputA, inputB, output: { ...output, mineralType: "ZK" }, reactionAmount: 5 }).reason, "output-mineral-conflict");
    assert.equal(evaluateReactionPlan({ inputA, inputB, output: { ...output, freeCapacity: 4 }, reactionAmount: 5 }).reason, "output-full");
    assert.equal(evaluateReactionPlan({ inputA: { ...inputA, range: 3 }, inputB, output, reactionAmount: 5 }).reason, "input-out-of-range");
    assert.deepEqual(evaluateReactionPlan({ inputA, inputB, output, reactionAmount: 5 }), {
      ready: true,
      reason: "ready",
      product: "OH",
    });
  },
);

for (const result of results) {
  console.log(`模拟通过：${result.name} — ${result.detail}`);
}
console.log(`核心文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`);
