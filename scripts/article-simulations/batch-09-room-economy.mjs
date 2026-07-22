import assert from "node:assert/strict";

const results = [];

function record(name, detail, callback) {
  callback();
  results.push({ name, detail });
}

record(
  "screeps-creep-withdraw-container-energy",
  "覆盖库存、容量、requestedAmount与Container候选排序。",
  () => {
    function amount(targetEnergy, free, requested) {
      if (
        !Number.isFinite(targetEnergy)
        || !Number.isFinite(free)
        || targetEnergy <= 0
        || free <= 0
      ) return 0;
      const maximum = Math.min(targetEnergy, free);
      if (requested === undefined) return maximum;
      if (!Number.isFinite(requested) || requested <= 0) return 0;
      return Math.min(maximum, requested);
    }

    assert.equal(amount(100, 50), 50);
    assert.equal(amount(20, 50), 20);
    assert.equal(amount(100, 50, 30), 30);
    assert.equal(amount(100, 0), 0);
    assert.equal(amount(0, 50), 0);
    assert.equal(amount(100, 50, -1), 0);

    const selected = [
      { id: "b", pathLength: 3, energy: 500 },
      { id: "c", pathLength: 2, energy: 100 },
      { id: "a", pathLength: 2, energy: 100 },
    ].sort((left, right) =>
      left.pathLength - right.pathLength
      || right.energy - left.energy
      || left.id.localeCompare(right.id)
    )[0];
    assert.equal(selected.id, "a");
  },
);

record(
  "screeps-creep-pickup-dropped-energy",
  "覆盖Resource类型、可拾取量、路径与稳定排序。",
  () => {
    function select(resources, free) {
      return resources
        .filter((item) =>
          item.type === "energy"
          && Number.isFinite(item.amount)
          && item.amount > 0
          && item.reachable
          && free > 0
        )
        .map((item) => ({
          ...item,
          collectible: Math.min(item.amount, free),
        }))
        .sort((left, right) =>
          right.collectible - left.collectible
          || left.pathLength - right.pathLength
          || left.id.localeCompare(right.id)
        )[0] ?? null;
    }

    assert.equal(select([], 50), null);
    assert.equal(select([{ id: "x", type: "mineral", amount: 100, reachable: true, pathLength: 1 }], 50), null);
    assert.equal(select([{ id: "x", type: "energy", amount: 100, reachable: true, pathLength: 1 }], 0), null);
    const selected = select([
      { id: "b", type: "energy", amount: 50, reachable: true, pathLength: 1 },
      { id: "c", type: "energy", amount: 100, reachable: true, pathLength: 4 },
      { id: "a", type: "energy", amount: 100, reachable: true, pathLength: 4 },
      { id: "z", type: "energy", amount: 1000, reachable: false, pathLength: 0 },
    ], 100);
    assert.equal(selected.id, "a");
    assert.equal(selected.collectible, 100);
  },
);

record(
  "screeps-select-source-by-path",
  "覆盖活跃、可达、路径、分配数量与ID排序。",
  () => {
    function select(candidates) {
      return candidates
        .filter((candidate) =>
          candidate.energy > 0
          && candidate.reachable
          && candidate.pathLength >= 0
          && candidate.assignmentCount >= 0
        )
        .sort((left, right) =>
          left.pathLength - right.pathLength
          || left.assignmentCount - right.assignmentCount
          || left.id.localeCompare(right.id)
        )[0] ?? null;
    }

    assert.equal(select([]), null);
    assert.equal(select([{ id: "x", energy: 0, reachable: true, pathLength: 1, assignmentCount: 0 }]), null);
    assert.equal(select([{ id: "x", energy: 100, reachable: false, pathLength: 1, assignmentCount: 0 }]), null);
    const selected = select([
      { id: "b", energy: 100, reachable: true, pathLength: 3, assignmentCount: 0 },
      { id: "c", energy: 100, reachable: true, pathLength: 2, assignmentCount: 2 },
      { id: "a", energy: 100, reachable: true, pathLength: 2, assignmentCount: 1 },
    ]);
    assert.equal(selected.id, "a");
  },
);

record(
  "screeps-storage-energy-usage",
  "覆盖保留线、Creep容量和配送目标优先级。",
  () => {
    function withdrawable(storageEnergy, reserve, free) {
      if (
        !Number.isFinite(storageEnergy)
        || !Number.isFinite(reserve)
        || !Number.isFinite(free)
        || storageEnergy < 0
        || reserve < 0
        || free <= 0
      ) return 0;
      return Math.min(Math.max(0, storageEnergy - reserve), free);
    }

    assert.equal(withdrawable(20000, 20000, 100), 0);
    assert.equal(withdrawable(20100, 20000, 50), 50);
    assert.equal(withdrawable(20500, 20000, 100), 100);
    assert.equal(withdrawable(10000, 20000, 100), 0);

    const selected = [
      { id: "e", typePriority: 1, range: 1, free: 50 },
      { id: "s2", typePriority: 0, range: 4, free: 300 },
      { id: "s1", typePriority: 0, range: 4, free: 300 },
    ].sort((left, right) =>
      left.typePriority - right.typePriority
      || left.range - right.range
      || right.free - left.free
      || left.id.localeCompare(right.id)
    )[0];
    assert.equal(selected.id, "s1");
  },
);

record(
  "screeps-link-transfer-energy",
  "覆盖对象、房间、结构状态、cooldown、阈值、amount与损耗估算。",
  () => {
    function evaluate(input) {
      if (!input.sourceExists || !input.targetExists) return "link-missing";
      if (input.sameObject) return "same-link";
      if (!input.sameRoom) return "different-room";
      if (!input.sourceActive || !input.targetActive) return "link-inactive";
      if (input.sourceCooldown > 0) return "source-not-ready";
      const amount = Math.min(input.sourceEnergy, input.targetFree);
      if (amount < input.minimumSend) return "amount-below-threshold";
      return { reason: "ready", amount };
    }

    const base = {
      sourceExists: true,
      targetExists: true,
      sameObject: false,
      sameRoom: true,
      sourceActive: true,
      targetActive: true,
      sourceCooldown: 0,
      sourceEnergy: 800,
      targetFree: 500,
      minimumSend: 200,
    };

    assert.equal(evaluate({ ...base, sourceExists: false }), "link-missing");
    assert.equal(evaluate({ ...base, sameObject: true }), "same-link");
    assert.equal(evaluate({ ...base, sameRoom: false }), "different-room");
    assert.equal(evaluate({ ...base, sourceCooldown: 1 }), "source-not-ready");
    assert.equal(evaluate({ ...base, targetFree: 100 }), "amount-below-threshold");
    assert.deepEqual(evaluate(base), { reason: "ready", amount: 500 });
    const loss = Math.ceil(500 * 0.03);
    assert.equal(loss, 15);
    assert.equal(500 - loss, 485);
  },
);

for (const result of results) {
  console.log(`批次模拟通过：${result.name} — ${result.detail}`);
}

console.log(
  `第九批文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`,
);
