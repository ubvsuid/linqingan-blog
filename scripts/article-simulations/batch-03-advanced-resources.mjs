import assert from "node:assert/strict";

const results = [];

function record(name, detail, callback) {
  callback();
  results.push({ name, detail });
}

record(
  "screeps-lab-boost-creep",
  "覆盖化合物匹配、已强化部件、指定数量、资源预算、相邻判断和可执行场景。",
  () => {
    const boosts = {
      work: { XUH2O: { harvest: 3 } },
      move: { XZHO2: { fatigue: 4 } },
    };

    function getBoostBodyPart(mineralType) {
      for (const [bodyPart, compounds] of Object.entries(boosts)) {
        if (compounds[mineralType]) return bodyPart;
      }
      return null;
    }

    function evaluate({ mineralType, body, requestedCount, mineral, energy, adjacent }) {
      const bodyPart = getBoostBodyPart(mineralType);
      if (!bodyPart) return "invalid-mineral";
      const eligible = body.filter((part) => part.type === bodyPart && !part.boost).length;
      if (eligible === 0) return "no-eligible-parts";
      const count = Number.isInteger(requestedCount) && requestedCount > 0
        ? Math.min(requestedCount, eligible)
        : eligible;
      if (mineral < count * 30 || energy < count * 20) return "resources-insufficient";
      if (!adjacent) return "not-adjacent";
      return { status: "ready", bodyPart, count };
    }

    const body = [
      { type: "work", boost: null },
      { type: "work", boost: "UH" },
      { type: "work", boost: null },
      { type: "move", boost: null },
    ];

    assert.equal(evaluate({ mineralType: "U", body, mineral: 100, energy: 100, adjacent: true }), "invalid-mineral");
    assert.equal(evaluate({ mineralType: "XUH2O", body: [{ type: "work", boost: "UH" }], mineral: 100, energy: 100, adjacent: true }), "no-eligible-parts");
    assert.equal(evaluate({ mineralType: "XUH2O", body, requestedCount: 2, mineral: 59, energy: 100, adjacent: true }), "resources-insufficient");
    assert.equal(evaluate({ mineralType: "XUH2O", body, requestedCount: 2, mineral: 60, energy: 39, adjacent: true }), "resources-insufficient");
    assert.equal(evaluate({ mineralType: "XUH2O", body, requestedCount: 9, mineral: 60, energy: 40, adjacent: false }), "not-adjacent");
    assert.deepEqual(evaluate({ mineralType: "XUH2O", body, requestedCount: 9, mineral: 60, energy: 40, adjacent: true }), {
      status: "ready",
      bodyPart: "work",
      count: 2,
    });
  },
);

record(
  "screeps-factory-produce",
  "覆盖配方、组件、输出容量、Factory等级、Power效果、等待状态和任意等级商品。",
  () => {
    function evaluate({ recipe, store, freeCapacity, factoryLevel, operateLevel, waitingTicks }) {
      if (!recipe) return "recipe-missing";
      if (waitingTicks > 0) return "factory-waiting";
      for (const [resourceType, amount] of Object.entries(recipe.components)) {
        if ((store[resourceType] || 0) < amount) return "component-shortage";
      }
      if (freeCapacity < recipe.amount) return "output-full";
      if (recipe.level !== undefined && factoryLevel !== recipe.level) {
        return "factory-level-mismatch";
      }
      if (recipe.level !== undefined && operateLevel !== recipe.level) {
        return "operate-factory-missing";
      }
      return "ready";
    }

    const basic = { amount: 50, components: { energy: 600 } };
    const advanced = { amount: 20, level: 1, components: { energy: 20, utriumBar: 20 } };

    assert.equal(evaluate({ recipe: null, store: {}, freeCapacity: 100, waitingTicks: 0 }), "recipe-missing");
    assert.equal(evaluate({ recipe: basic, store: { energy: 600 }, freeCapacity: 100, waitingTicks: 1 }), "factory-waiting");
    assert.equal(evaluate({ recipe: basic, store: { energy: 599 }, freeCapacity: 100, waitingTicks: 0 }), "component-shortage");
    assert.equal(evaluate({ recipe: basic, store: { energy: 600 }, freeCapacity: 49, waitingTicks: 0 }), "output-full");
    assert.equal(evaluate({ recipe: advanced, store: { energy: 20, utriumBar: 20 }, freeCapacity: 100, factoryLevel: 2, operateLevel: 1, waitingTicks: 0 }), "factory-level-mismatch");
    assert.equal(evaluate({ recipe: advanced, store: { energy: 20, utriumBar: 20 }, freeCapacity: 100, factoryLevel: 1, operateLevel: null, waitingTicks: 0 }), "operate-factory-missing");
    assert.equal(evaluate({ recipe: basic, store: { energy: 600 }, freeCapacity: 50, factoryLevel: null, operateLevel: null, waitingTicks: 0 }), "ready");
    assert.equal(evaluate({ recipe: advanced, store: { energy: 20, utriumBar: 20 }, freeCapacity: 20, factoryLevel: 1, operateLevel: 1, waitingTicks: 0 }), "ready");
  },
);

record(
  "screeps-power-spawn-process-power",
  "覆盖启用状态、基础比例、Power效果计划量、资源不足、Energy保留线和前后快照差值。",
  () => {
    function evaluate({ enabled, plannedPower, powerAvailable, energyAvailable, roomEnergyStock, energyReserve }) {
      if (!enabled) return "disabled";
      if (!Number.isInteger(plannedPower) || plannedPower <= 0) return "invalid-plan";
      const energyRequired = plannedPower * 50;
      if (powerAvailable < plannedPower) return "power-shortage";
      if (energyAvailable < energyRequired) return "power-spawn-energy-shortage";
      if (roomEnergyStock - energyRequired < energyReserve) return "room-energy-reserve";
      return { status: "ready", plannedPower, energyRequired };
    }

    function inspect(before, after) {
      return {
        gplDelta: after.gpl - before.gpl,
        powerDelta: before.power - after.power,
        energyDelta: before.energy - after.energy,
      };
    }

    assert.equal(evaluate({ enabled: false, plannedPower: 1, powerAvailable: 10, energyAvailable: 500, roomEnergyStock: 10000, energyReserve: 0 }), "disabled");
    assert.equal(evaluate({ enabled: true, plannedPower: 0, powerAvailable: 10, energyAvailable: 500, roomEnergyStock: 10000, energyReserve: 0 }), "invalid-plan");
    assert.equal(evaluate({ enabled: true, plannedPower: 3, powerAvailable: 2, energyAvailable: 500, roomEnergyStock: 10000, energyReserve: 0 }), "power-shortage");
    assert.equal(evaluate({ enabled: true, plannedPower: 3, powerAvailable: 3, energyAvailable: 149, roomEnergyStock: 10000, energyReserve: 0 }), "power-spawn-energy-shortage");
    assert.equal(evaluate({ enabled: true, plannedPower: 1, powerAvailable: 1, energyAvailable: 50, roomEnergyStock: 1000, energyReserve: 951 }), "room-energy-reserve");
    assert.deepEqual(evaluate({ enabled: true, plannedPower: 1, powerAvailable: 1, energyAvailable: 50, roomEnergyStock: 1000, energyReserve: 950 }), {
      status: "ready",
      plannedPower: 1,
      energyRequired: 50,
    });
    assert.deepEqual(evaluate({ enabled: true, plannedPower: 4, powerAvailable: 4, energyAvailable: 200, roomEnergyStock: 1000, energyReserve: 800 }), {
      status: "ready",
      plannedPower: 4,
      energyRequired: 200,
    });
    assert.deepEqual(inspect(
      { gpl: 100, power: 10, energy: 500 },
      { gpl: 104, power: 6, energy: 300 },
    ), { gplDelta: 4, powerDelta: 4, energyDelta: 200 });
  },
);

record(
  "screeps-market-deal",
  "覆盖订单快照、类型、资源、价格、当前amount、Credits保留线、Terminal Energy和可提交场景。",
  () => {
    function evaluate({ request, order, credits, terminalEnergy, transactionEnergy }) {
      if (!request.enabled) return "disabled";
      if (!order) return "order-missing";
      if (order.type !== "sell") return "order-type-mismatch";
      if (order.resourceType !== request.resourceType) return "resource-mismatch";
      if (order.price > request.maxUnitPrice) return "price-limit";
      if (request.amount <= 0 || request.amount > order.amount) return "amount-unavailable";
      const creditCost = request.amount * order.price;
      if (credits - creditCost < request.creditReserve) return "credit-reserve";
      if (terminalEnergy - transactionEnergy < request.terminalEnergyReserve) {
        return "terminal-energy-reserve";
      }
      return { status: "ready", creditCost, transactionEnergy };
    }

    const request = {
      enabled: true,
      resourceType: "H",
      amount: 1000,
      maxUnitPrice: 0.2,
      creditReserve: 1000,
      terminalEnergyReserve: 500,
    };
    const order = { type: "sell", resourceType: "H", price: 0.1, amount: 1000 };

    assert.equal(evaluate({ request: { ...request, enabled: false }, order, credits: 2000, terminalEnergy: 1000, transactionEnergy: 100 }), "disabled");
    assert.equal(evaluate({ request, order: null, credits: 2000, terminalEnergy: 1000, transactionEnergy: 100 }), "order-missing");
    assert.equal(evaluate({ request, order: { ...order, type: "buy" }, credits: 2000, terminalEnergy: 1000, transactionEnergy: 100 }), "order-type-mismatch");
    assert.equal(evaluate({ request, order: { ...order, resourceType: "O" }, credits: 2000, terminalEnergy: 1000, transactionEnergy: 100 }), "resource-mismatch");
    assert.equal(evaluate({ request, order: { ...order, price: 0.21 }, credits: 2000, terminalEnergy: 1000, transactionEnergy: 100 }), "price-limit");
    assert.equal(evaluate({ request, order: { ...order, amount: 999 }, credits: 2000, terminalEnergy: 1000, transactionEnergy: 100 }), "amount-unavailable");
    assert.equal(evaluate({ request, order, credits: 1099, terminalEnergy: 1000, transactionEnergy: 100 }), "credit-reserve");
    assert.equal(evaluate({ request, order, credits: 2000, terminalEnergy: 599, transactionEnergy: 100 }), "terminal-energy-reserve");
    assert.deepEqual(evaluate({ request, order, credits: 2000, terminalEnergy: 600, transactionEnergy: 100 }), {
      status: "ready",
      creditCost: 100,
      transactionEnergy: 100,
    });
  },
);

record(
  "screeps-terminal-send-resources",
  "覆盖最小发送量、目标与说明、普通资源、发送Energy、库存不足、Energy保留线和可提交场景。",
  () => {
    function evaluate({ request, resourceAvailable, energyAvailable, transactionEnergy }) {
      if (!request.enabled) return "disabled";
      if (!request.resourceType || !request.destination) return "invalid-arguments";
      if (!Number.isInteger(request.amount) || request.amount < 100) return "amount-too-small";
      if (request.description && request.description.length > 100) return "description-too-long";
      if (resourceAvailable < request.amount) return "resource-shortage";
      const requiredEnergy = transactionEnergy + (request.resourceType === "energy" ? request.amount : 0);
      if (energyAvailable - requiredEnergy < request.energyReserve) return "energy-reserve";
      return { status: "ready", requiredEnergy, transactionEnergy };
    }

    const base = {
      enabled: true,
      resourceType: "U",
      destination: "W2N2",
      amount: 1000,
      description: "manual",
      energyReserve: 500,
    };

    assert.equal(evaluate({ request: { ...base, amount: 99 }, resourceAvailable: 1000, energyAvailable: 1000, transactionEnergy: 100 }), "amount-too-small");
    assert.equal(evaluate({ request: { ...base, destination: "" }, resourceAvailable: 1000, energyAvailable: 1000, transactionEnergy: 100 }), "invalid-arguments");
    assert.equal(evaluate({ request: { ...base, description: "a".repeat(101) }, resourceAvailable: 1000, energyAvailable: 1000, transactionEnergy: 100 }), "description-too-long");
    assert.equal(evaluate({ request: base, resourceAvailable: 999, energyAvailable: 1000, transactionEnergy: 100 }), "resource-shortage");
    assert.equal(evaluate({ request: base, resourceAvailable: 1000, energyAvailable: 599, transactionEnergy: 100 }), "energy-reserve");
    assert.deepEqual(evaluate({ request: base, resourceAvailable: 1000, energyAvailable: 600, transactionEnergy: 100 }), {
      status: "ready",
      requiredEnergy: 100,
      transactionEnergy: 100,
    });

    const energyRequest = { ...base, resourceType: "energy" };
    assert.equal(evaluate({ request: energyRequest, resourceAvailable: 1000, energyAvailable: 1599, transactionEnergy: 100 }), "energy-reserve");
    assert.deepEqual(evaluate({ request: energyRequest, resourceAvailable: 1600, energyAvailable: 1600, transactionEnergy: 100 }), {
      status: "ready",
      requiredEnergy: 1100,
      transactionEnergy: 100,
    });
  },
);

for (const result of results) {
  console.log(`批次模拟通过：${result.name} — ${result.detail}`);
}
console.log(`第三批文章离线模拟通过：${results.length} 篇。真实 Screeps Console 与主循环仍待环境验证。`);
