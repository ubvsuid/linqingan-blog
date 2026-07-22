---
title: "StructureLink.transferEnergy() 怎么安全传输 Energy"
description: "通过固定ID区分源Link和目标Link，检查同房间、Store、isActive与cooldown，保守计算amount并处理3%损耗和全部返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Link"
  - "Energy"
  - "物流"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（Link类型、同房间、结构状态、cooldown、源库存、目标容量和保守amount，不是Screeps官方服务器）"
  testResult: "对象缺失、同一对象、跨房间、结构不可用、cooldown、库存为空、目标已满、amount上限和合法传输场景通过。"
featured: false
---

`StructureLink.transferEnergy(target, amount)` 可以把Energy远程发送到同一房间的另一座Link，不需要Creep站在旁边。

安全传输需要同时满足：

- 源和目标都是自己的Link；
- 不是同一个对象；
- 位于同一房间；
- 两座结构当前可用；
- 源Link的 `cooldown` 为0；
- 源Store有Energy；
- 目标Store有空余容量；
- amount为正数并且没有超过保守上限。

## 不要长期依赖查找数组顺序

下面的代码不稳定：

```js
const links = room.find(FIND_MY_STRUCTURES, {
  filter: structure =>
    structure.structureType === STRUCTURE_LINK
});

const sourceLink = links[0];
const targetLink = links[1];
```

房间增加Link或重建结构后，数组位置不应被当成“Source Link”和“Controller Link”的身份。

更明确的方式是保存ID：

```js
Memory.linkNetwork ??= {};
Memory.linkNetwork.W1N1 = {
  sourceLinkId: '源Link的ID',
  controllerLinkId: '目标Link的ID',
  minimumSend: 200,
  targetReserve: 100
};
```

后续tick通过 `Game.getObjectById()` 恢复并验证类型。

## 官方传输规则

官方API说明：

- 只能向同房间另一座Link发送；
- Link容量为800；
- 传输损失为3%；
- `cooldown` 与到目标的线性距离有关；
- amount省略时会尝试使用全部可用Energy；
- 源Link的 `cooldown` 大于0时返回 `ERR_TIRED`。

本文不会自行替代服务器计算精确接收值，只用 `LINK_LOSS_RATIO` 估算显示。

## 为什么使用保守amount

目标空余容量：

```js
const targetFree = targetLink.store.getFreeCapacity(
  RESOURCE_ENERGY
);
```

源Link库存：

```js
const sourceEnergy = sourceLink.store.getUsedCapacity(
  RESOURCE_ENERGY
);
```

保守发送量：

```js
const amount = Math.min(
  sourceEnergy,
  targetFree
);
```

由于传输有损耗，目标实际增加量不会超过发送amount。这种写法可能无法一次把目标完全填满，但能避免为了反推损耗与取整而制造错误边界。

## 估算损耗用于日志，不用于伪造结算

```js
function estimateLinkTransfer(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    return {
      valid: false,
      sent: 0,
      estimatedLoss: 0,
      estimatedReceived: 0
    };
  }

  const estimatedLoss = Math.ceil(
    amount * LINK_LOSS_RATIO
  );

  return {
    valid: true,
    sent: amount,
    estimatedLoss,
    estimatedReceived: Math.max(
      0,
      amount - estimatedLoss
    )
  };
}
```

这只是根据公开常量生成的本地估算。真实结果应在下一tick读取两座Link的Store确认。

## 用纯函数判断传输条件

```js
function evaluateLinkTransfer(input) {
  const {
    sourceExists,
    targetExists,
    sameObject,
    sameRoom,
    sourceActive,
    targetActive,
    sourceCooldown,
    sourceEnergy,
    targetFree,
    minimumSend
  } = input;

  if (!sourceExists || !targetExists) {
    return {
      ready: false,
      reason: 'link-missing'
    };
  }

  if (sameObject) {
    return {
      ready: false,
      reason: 'same-link'
    };
  }

  if (!sameRoom) {
    return {
      ready: false,
      reason: 'different-room'
    };
  }

  if (!sourceActive || !targetActive) {
    return {
      ready: false,
      reason: 'link-inactive'
    };
  }

  if (!Number.isInteger(sourceCooldown) || sourceCooldown > 0) {
    return {
      ready: false,
      reason: 'source-not-ready'
    };
  }

  const amount = Math.min(sourceEnergy, targetFree);

  if (
    !Number.isFinite(amount)
    || amount <= 0
    || amount < minimumSend
  ) {
    return {
      ready: false,
      reason: 'amount-below-threshold',
      amount: Math.max(0, amount || 0)
    };
  }

  return {
    ready: true,
    reason: 'ready',
    amount
  };
}
```

`minimumSend`是项目策略，用来避免极小数量频繁占用Link，不是官方限制。

## 完整示例

```js
function getOwnedLink(id) {
  if (typeof id !== 'string') {
    return null;
  }

  const structure = Game.getObjectById(id);

  if (
    !structure
    || structure.structureType !== STRUCTURE_LINK
    || structure.my !== true
  ) {
    return null;
  }

  return structure;
}

function runLinkTransfer(roomName) {
  const config = Memory.linkNetwork?.[roomName];

  if (!config || config.enabled === false) {
    return {
      status: 'config-disabled'
    };
  }

  const sourceLink = getOwnedLink(
    config.sourceLinkId
  );
  const targetLink = getOwnedLink(
    config.controllerLinkId
  );

  if (!sourceLink || !targetLink) {
    return {
      status: 'link-missing'
    };
  }

  if (sourceLink.id === targetLink.id) {
    return {
      status: 'same-link'
    };
  }

  if (
    sourceLink.room.name !== targetLink.room.name
    || sourceLink.room.name !== roomName
  ) {
    return {
      status: 'different-room'
    };
  }

  if (!sourceLink.isActive() || !targetLink.isActive()) {
    return {
      status: 'link-inactive'
    };
  }

  if (sourceLink.cooldown > 0) {
    return {
      status: 'source-not-ready',
      cooldown: sourceLink.cooldown
    };
  }

  const sourceEnergy = sourceLink.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const targetFree = targetLink.store.getFreeCapacity(
    RESOURCE_ENERGY
  );
  const targetReserve = Number.isFinite(
    config.targetReserve
  )
    ? Math.max(0, config.targetReserve)
    : 0;
  const amount = Math.min(
    sourceEnergy,
    Math.max(0, targetFree - targetReserve)
  );
  const minimumSend = Number.isFinite(
    config.minimumSend
  )
    ? Math.max(1, config.minimumSend)
    : 1;

  if (amount < minimumSend) {
    return {
      status: 'amount-below-threshold',
      amount,
      minimumSend,
      sourceEnergy,
      targetFree
    };
  }

  const before = {
    sourceEnergy,
    targetEnergy: targetLink.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    targetFree,
    sourceCooldown: sourceLink.cooldown
  };
  const result = sourceLink.transferEnergy(
    targetLink,
    amount
  );

  return {
    status: result === OK
      ? 'link-transfer-submitted'
      : 'link-transfer-failed',
    result,
    amount,
    before
  };
}

module.exports.loop = function () {
  const outcome = runLinkTransfer('W1N1');

  if (outcome.status === 'link-transfer-failed') {
    console.log({
      type: 'link-transfer-failed',
      roomName: 'W1N1',
      ...outcome
    });
  }
};
```

需要先在Memory中增加：

```js
Memory.linkNetwork ??= {};
Memory.linkNetwork.W1N1 = {
  enabled: true,
  sourceLinkId: '源Link ID',
  controllerLinkId: '目标Link ID',
  minimumSend: 200,
  targetReserve: 0
};
```

## `targetReserve` 表示什么

示例允许在目标Link中预留空位：

```js
targetReserve: 100
```

它可以为其他Source Link或临时Creep转入留出空间。数值属于房间物流配置，不是Link官方属性。

## 为什么Link仍可能返回范围错误

Link可以远程发送，但目标必须在**同一房间**。

跨房间Link会返回 `ERR_NOT_IN_RANGE`。因此“远程”不等于跨房间。

## 返回值排查

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 传输命令已安排 | 下一tick读取Store与源 `cooldown` |
| `ERR_NOT_OWNER` | 源Link不属于自己 | 检查ID与所有权 |
| `ERR_NOT_ENOUGH_RESOURCES` | 源Link没有指定amount | 检查同tick其他动作 |
| `ERR_INVALID_TARGET` | 目标不是有效Link | 检查类型和对象失效 |
| `ERR_FULL` | 目标无法接收更多Energy | 检查容量和并发发送 |
| `ERR_NOT_IN_RANGE` | 目标不在同一房间 | 检查房间名 |
| `ERR_INVALID_ARGS` | amount无效 | 检查正整数和上限 |
| `ERR_TIRED` | 源Link的 `cooldown` 大于0 | 等待并重新读取 |
| `ERR_RCL_NOT_ENOUGH` | Link当前不可用 | 检查Controller等级和 `isActive()` |

`OK`不表示当前tickStore已变化，下一tick重新取得两座Link。

## 多个Source Link怎样避免覆盖

多个模块独立向同一个目标Link发送时，都会看到相似的空余容量。

建议：

- 由一个Link网络模块统一提交；
- 明确源Link优先级；
- 每tick最多安排一次目标传入；
- 保存来源、amount和结果；
- 下一tick根据真实Store继续分配。

仅靠每个源Link检查目标容量不能消除同tick竞争。

## 常见错误

### 用数组位置识别Link

房间结构变化后身份可能错位。保存并验证ID。

### 认为Link可以跨房间

官方只允许同房间目标。

### 不检查源 `cooldown`

会持续得到 `ERR_TIRED`。

### amount直接等于目标空余容量

这是保守且可能欠填的策略，不应声称目标一定装满。

### 使用已弃用的 `energy` 和 `energyCapacity`

优先使用Store API。

### 多个模块同时控制同一Link

建立统一网络调度器，避免动作互相覆盖。

## 离线模拟结果

构建检查覆盖：

1. 源或目标缺失；
2. 源和目标是同一对象；
3. 不同房间；
4. 结构不可用；
5. 源 `cooldown` 大于0；
6. 源Energy为0；
7. 目标已满；
8. amount低于阈值；
9. amount不超过源库存和目标空位；
10. 3%损耗的本地估算。

离线测试不能模拟官方损耗取整、真实 `cooldown`、同tick多源发送和Store结算。

## 适用边界

本文只处理一组源Link到目标Link，不覆盖：

- 多Source Link优先级；
- Storage Link双向模式；
- 战时Link切换；
- 多房间物流；
- Controller Link消耗预测；
- Creep与Link协同；
- 完整网络状态机。

JavaScript语法和离线传输条件已检查，真实损耗与Store变化仍待Screeps环境验证。

## 相关站内内容

- [Room.storage怎么使用](/blog/screeps-storage-energy-usage)
- [如何自动升级Controller](/blog/screeps-upgrade-controller)
- [如何向Spawn配送Energy](/blog/screeps-creep-deliver-energy)
- [Game.getObjectById()怎么恢复目标](/blog/screeps-game-get-object-by-id)
- [Controller快降级了怎么办](/blog/screeps-controller-downgrade)
- [进入资源采集与房间经济专题](/knowledge/room-economy)

## 官方资料

- [StructureLink API](https://docs.screeps.com/api/#StructureLink)
- [StructureLink.transferEnergy API](https://docs.screeps.com/api/#StructureLink.transferEnergy)
- [Store API](https://docs.screeps.com/api/#Store)
- [Constants：LINK_LOSS_RATIO](https://docs.screeps.com/api/#Constants)

资料核对日期：2026-07-22。离线传输条件已通过；真实Link网络仍待Screeps环境验证。
