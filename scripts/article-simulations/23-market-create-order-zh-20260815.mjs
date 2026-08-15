import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const articlePath = path.join(
  root,
  "content/posts/screeps-market-create-order.md",
);
const article = fs.readFileSync(articlePath, "utf8");

const requiredArticleSignals = [
  "accepted-pending-order-id",
  "created-order-observed",
  "accepted-order-not-observed",
  "new-order-identity-ambiguous",
  "verification-window-missed",
  "order.created === pending.submittedAt",
  "Terminal 所有权是前置，但 cooldown 和库存不是创建前置",
  "Official engine checked: yes",
  "Live market multi-tick tested: no",
];

for (const signal of requiredArticleSignals) {
  assert.ok(
    article.includes(signal),
    `文章缺少关键边界：${signal}`,
  );
}

function calculateCreateOrderFeeCeiling(price, totalAmount) {
  const raw = price * totalAmount * 0.05;
  return Math.ceil(raw * 1000) / 1000;
}

function evaluateCreateOrderPreflight({
  request,
  terminal,
  credits,
  existingOrders,
}) {
  if (!request || request.enabled !== true) {
    return { status: "request-disabled" };
  }

  if (!["buy", "sell"].includes(request.type)) {
    return { status: "request-invalid" };
  }

  if (
    typeof request.resourceType !== "string"
    || request.resourceType.length === 0
    || typeof request.roomName !== "string"
    || request.roomName.length === 0
    || !Number.isFinite(request.price)
    || request.price <= 0
    || !Number.isInteger(request.totalAmount)
    || request.totalAmount <= 0
  ) {
    return { status: "request-invalid" };
  }

  if (!terminal || terminal.my !== true) {
    return { status: "owned-terminal-not-observed" };
  }

  const duplicate = existingOrders.find((order) =>
    order.type === request.type
    && order.resourceType === request.resourceType
    && order.roomName === request.roomName,
  );

  if (duplicate) {
    return {
      status: "duplicate-order",
      orderId: duplicate.id,
    };
  }

  const fee = calculateCreateOrderFeeCeiling(
    request.price,
    request.totalAmount,
  );

  if (credits - fee < request.creditReserve) {
    return { status: "credit-reserve", fee };
  }

  return {
    status: "creation-ready",
    fee,
    terminalId: terminal.id,
  };
}

function createMarketOrderCoordinator() {
  let reserved = false;

  return {
    reserve() {
      if (reserved) return false;
      reserved = true;
      return true;
    },
  };
}

function verifyCreatedOrder(pending, gameTime, orders) {
  if (gameTime < pending.submittedAt + 1) {
    return { status: "waiting-for-next-tick" };
  }

  if (gameTime > pending.submittedAt + 1) {
    return { status: "verification-window-missed" };
  }

  const before = new Set(pending.orderIdsBefore);
  const candidates = orders.filter((order) =>
    !before.has(order.id)
    && order.type === pending.type
    && order.resourceType === pending.resourceType
    && order.roomName === pending.roomName
    && Math.abs(order.price - pending.price) < 0.0005
    && order.totalAmount === pending.totalAmount
    && order.created === pending.submittedAt,
  );

  if (candidates.length === 0) {
    return { status: "accepted-order-not-observed" };
  }

  if (candidates.length > 1) {
    return {
      status: "new-order-identity-ambiguous",
      candidateIds: candidates.map((order) => order.id),
    };
  }

  const order = candidates[0];
  return {
    status: "created-order-observed",
    orderId: order.id,
    active: order.active,
    amount: order.amount,
    remainingAmount: order.remainingAmount,
  };
}

function shouldAutoResubmitAfterVerification(status) {
  return ![
    "accepted-order-not-observed",
    "new-order-identity-ambiguous",
    "verification-window-missed",
  ].includes(status);
}

const request = {
  requestId: "sell-U-001",
  revision: 1,
  enabled: true,
  type: "sell",
  resourceType: "U",
  roomName: "W1N1",
  price: 1,
  totalAmount: 10000,
  creditReserve: 1000,
};

assert.equal(
  calculateCreateOrderFeeCeiling(1, 10000),
  500,
);
assert.equal(
  calculateCreateOrderFeeCeiling(0.1234, 3),
  0.019,
);

assert.deepEqual(
  evaluateCreateOrderPreflight({
    request,
    terminal: null,
    credits: 2000,
    existingOrders: [],
  }),
  { status: "owned-terminal-not-observed" },
);

const terminalWithNonCreationBlockingState = {
  id: "terminal-1",
  my: true,
  active: false,
  cooldown: 50,
  resourceAvailable: 0,
};

assert.deepEqual(
  evaluateCreateOrderPreflight({
    request,
    terminal: terminalWithNonCreationBlockingState,
    credits: 2000,
    existingOrders: [],
  }),
  {
    status: "creation-ready",
    fee: 500,
    terminalId: "terminal-1",
  },
);

assert.deepEqual(
  evaluateCreateOrderPreflight({
    request,
    terminal: terminalWithNonCreationBlockingState,
    credits: 1499,
    existingOrders: [],
  }),
  { status: "credit-reserve", fee: 500 },
);

assert.deepEqual(
  evaluateCreateOrderPreflight({
    request,
    terminal: terminalWithNonCreationBlockingState,
    credits: 2000,
    existingOrders: [
      {
        id: "old-order",
        type: "sell",
        resourceType: "U",
        roomName: "W1N1",
      },
    ],
  }),
  { status: "duplicate-order", orderId: "old-order" },
);

const coordinator = createMarketOrderCoordinator();
assert.equal(coordinator.reserve(), true);
assert.equal(coordinator.reserve(), false);

const pending = {
  requestId: request.requestId,
  revision: request.revision,
  submittedAt: 100,
  type: request.type,
  resourceType: request.resourceType,
  roomName: request.roomName,
  price: request.price,
  totalAmount: request.totalAmount,
  orderIdsBefore: ["old-order"],
};

const oldMatchingOrder = {
  id: "old-order",
  type: "sell",
  resourceType: "U",
  roomName: "W1N1",
  price: 1,
  totalAmount: 10000,
  created: 90,
  active: true,
  amount: 5000,
  remainingAmount: 5000,
};

const exactNewOrder = {
  id: "new-order",
  type: "sell",
  resourceType: "U",
  roomName: "W1N1",
  price: 1,
  totalAmount: 10000,
  created: 100,
  active: false,
  amount: 0,
  remainingAmount: 10000,
};

assert.deepEqual(
  verifyCreatedOrder(pending, 100, [oldMatchingOrder]),
  { status: "waiting-for-next-tick" },
);

assert.deepEqual(
  verifyCreatedOrder(
    pending,
    101,
    [oldMatchingOrder, exactNewOrder],
  ),
  {
    status: "created-order-observed",
    orderId: "new-order",
    active: false,
    amount: 0,
    remainingAmount: 10000,
  },
);

assert.deepEqual(
  verifyCreatedOrder(pending, 101, [oldMatchingOrder]),
  { status: "accepted-order-not-observed" },
);

const laterLookalike = {
  ...exactNewOrder,
  id: "later-order",
  created: 101,
};

assert.deepEqual(
  verifyCreatedOrder(
    pending,
    101,
    [oldMatchingOrder, laterLookalike],
  ),
  { status: "accepted-order-not-observed" },
);

const secondExactNewOrder = {
  ...exactNewOrder,
  id: "new-order-2",
};

assert.deepEqual(
  verifyCreatedOrder(
    pending,
    101,
    [
      oldMatchingOrder,
      exactNewOrder,
      secondExactNewOrder,
    ],
  ),
  {
    status: "new-order-identity-ambiguous",
    candidateIds: ["new-order", "new-order-2"],
  },
);

assert.deepEqual(
  verifyCreatedOrder(
    pending,
    102,
    [oldMatchingOrder, exactNewOrder],
  ),
  { status: "verification-window-missed" },
);

for (const status of [
  "accepted-order-not-observed",
  "new-order-identity-ambiguous",
  "verification-window-missed",
]) {
  assert.equal(
    shouldAutoResubmitAfterVerification(status),
    false,
  );
}

console.log(
  "中文 createOrder 证据模拟通过：Terminal 所有权与创建状态分离、费用保留、单 tick 归因槽、旧 ID 差集、下一 tick 唯一/缺失/歧义订单身份和禁止自动重提均符合文章边界。",
);