---
title: "Screeps Upgrader 站着不升级怎么排查：Controller Link、Energy、WORK 与固定站位"
description: "排查固定 Upgrader 到达 Controller 后不升级的问题：核对 Controller Link、站位距离、Energy、WORK/CARRY/MOVE、upgradeBlocked 和返回码，并用下一 tick 事件与 Store 变化验证动作。"
publishedAt: "2026-08-05"
updatedAt: "2026-08-05"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Controller"
  - "Energy"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-05"
  testedAt: "2026-08-05"
  testEnvironment: "Node.js 离线模拟（固定站位、Controller/Link 距离、身体部件、Link 库存、upgradeBlocked、动作决策和下一 tick 验证分类；不是 Screeps 官方服务器）"
  testResult: "21 个离线场景通过；完整示例通过 JavaScript 语法检查。真实房间交通、Link 网络竞争、Boost、Power Creep 效果和官方 shard 行为仍待验证。"
featured: false
---

Upgrader 已经走到 Controller 附近，却一直站着不升级，通常不是单一原因。

常见故障链包括：

- Creep 虽然在 Controller 附近，却超过 `upgradeController()` 的范围 3；
- 固定站位离 Controller Link 超过 1 格，无法 `withdraw()`；
- Controller Link 本身没有 Energy；
- Creep 有 `CARRY` 容量，但没有有效 `WORK`；
- Creep 仍在生成、受伤后失去关键部件，或者站位被障碍占用；
- Controller 处于 `upgradeBlocked`；
- 代码只调用了 `moveTo()`，却没有保存 `upgradeController()` 的返回值；
- Link 传能逻辑与 Upgrader 逻辑分散在多处，双方都以为“另一边会补能”；
- 同一 tick 只看到 `OK`，却没有在下一 tick 验证实际结果。

本文只解决一个明确问题：**让一只指定 Upgrader 固定站在 Controller 与 Controller Link 都能触达的位置，空仓时从 Link 取 Energy，有 Energy 时升级 Controller，并把每一步失败原因保存下来。**

这不是新手版“从 Source 往返 Controller”的改写。刚开始学习升级动作，请先看[怎样让 Creep 自动升级 Controller](/blog/screeps-upgrade-controller)。本文面向已经使用 Link、Storage 或专用运输者的房间。

## 先确认固定升级链路

```text
Source / Storage
      ↓
运输者或 Source Link
      ↓
Controller Link
      ↓ withdraw()，范围 1
固定 Upgrader
      ↓ upgradeController()，范围 3
Controller
```

| 环节 | 负责什么 | 失败时最直接的信号 |
|---|---|---|
| 上游采集或储存 | 提供 Energy | Storage、Container 或 Source Link 没有可用 Energy |
| Link 网络或运输者 | 给 Controller Link 补能 | Controller Link 长期为 0 |
| 固定站位 | 同时触达 Link 与 Controller | 到 Link 大于 1，或到 Controller 大于 3 |
| Upgrader 身体 | 携带并消耗 Energy | 没有容量、没有有效 WORK、仍在 spawning |
| Controller 状态 | 接受升级 | 非己方 Controller 或 `upgradeBlocked > 0` |
| 验证记录 | 区分命令接受与结果发生 | 只有同 tick 的 `OK`，没有下一 tick 证据 |

Controller Link 为空时，**不要让固定 Upgrader 临时跑回 Storage**。那会把固定升级角色重新变成普通运输角色，并隐藏真正的上游供能故障。

## 与已有文章的明确区别

站内已有内容分别解决：

- [基础 Upgrader 往返循环](/blog/screeps-upgrade-controller)：Energy 来自 Source；
- [Link 安全传能](/blog/screeps-link-transfer-energy)：两座 Link 的身份、容量、冷却与损耗；
- [Storage Energy 分配](/blog/screeps-storage-energy-usage)：资源保留线和配送目标；
- [Controller 降级应急](/blog/screeps-controller-downgrade)：`ticksToDowngrade` 风险状态。

本文的搜索意图是“**为什么固定 Upgrader 已经就位却不升级**”，因此必须把站位、身体、Controller Link、上游供能、返回码和跨 tick 验证串成一条诊断链。

## 官方距离边界

固定站位必须同时满足：

```js
anchor.getRangeTo(controller) <= 3;
anchor.getRangeTo(controllerLink) <= 1;
```

`upgradeController()` 的范围是 3，`withdraw()` 的范围是 1。站位还必须可通行，且不能长期被另一只 Creep 占用。

先在 Console 中只读检查：

```js
const room = Game.rooms.W1N1;
const controller = room?.controller;
const link = Game.getObjectById('CONTROLLER_LINK_ID');
const anchor = new RoomPosition(24, 25, 'W1N1');

({
  controllerRange: controller ? anchor.getRangeTo(controller) : null,
  linkRange: link ? anchor.getRangeTo(link) : null,
  terrain: room ? room.getTerrain().get(anchor.x, anchor.y) : null
});
```

## 一次性配置

```js
Memory.fixedUpgraders ??= {};
Memory.fixedUpgraders.W1N1 = {
  enabled: true,
  creepName: 'Upgrader1',
  controllerLinkId: 'CONTROLLER_LINK_ID',
  anchor: { x: 24, y: 25 },
  pending: null,
  history: []
};
```

不要依赖 `room.find(FIND_MY_STRUCTURES)[0]` 作为 Controller Link 身份。保存 ID 后，每个 tick 用 `Game.getObjectById()` 恢复并重新验证类型、所有权和房间。

## 不升级时按这个顺序排查

### 1. Creep 是否存在并已生成完成

`Game.creeps[config.creepName]` 不存在时记录 `owned-creep-missing`；`creep.spawning === true` 时记录 `creep-spawning`。

### 2. 是否有 Energy 容量和有效 WORK

```js
creep.store.getCapacity(RESOURCE_ENERGY);
creep.getActiveBodyparts(WORK);
```

容量为 0 时无法从 Link 取能；有效 WORK 为 0 时无法升级。受伤后应检查有效部件，而不是只看原始身体数组。

### 3. 是否在精确站位

使用 `creep.pos.isEqualTo(anchor)`。未到站位时只提交移动，不继续取能或升级。

### 4. Controller Link 是否有 Energy

```js
controllerLink.store.getUsedCapacity(RESOURCE_ENERGY);
```

为 0 时，应向上排查 Source Link、cooldown、Link 协调器、Storage 运输者和吞吐量。可以使用[运输吞吐量规划器](/tools/hauling-throughput-planner)估算运输者容量与往返路程。

### 5. Controller 是否被阻止升级

```js
controller.upgradeBlocked;
```

大于 0 时，即使距离和 Energy 都正确，也不应继续把失败归因于 Link。

## 为什么取能和升级分开执行

命令会在当前 tick 排队并在之后结算；同 tick 读取到的对象属性仍是开始时状态。本文采用容易验证的状态机：

```text
未到站位 → 只移动
已到站位且 Energy = 0 → 只 withdraw
已到站位且 Energy > 0 → 只 upgradeController
```

这不是唯一方案，但每个 tick 只有一个主要意图，更容易解释下一 tick 的位置、Store 和事件。

## 可离线测试的决策函数

```js
function evaluateFixedUpgraderState(input) {
  const {
    enabled, creepExists, creepOwned, spawning,
    activeWork, energyCapacity, energy, activeMove,
    atAnchor, anchorWalkable, anchorControllerRange,
    anchorLinkRange, controllerExists, controllerOwned,
    upgradeBlocked, linkExists, linkOwned, linkActive,
    linkEnergy
  } = input;

  if (enabled !== true) return { action: 'none', reason: 'config-disabled' };
  if (!creepExists || !creepOwned) return { action: 'none', reason: 'owned-creep-missing' };
  if (spawning) return { action: 'none', reason: 'creep-spawning' };
  if (!controllerExists || !controllerOwned) return { action: 'none', reason: 'owned-controller-missing' };
  if (!linkExists || !linkOwned) return { action: 'none', reason: 'owned-controller-link-missing' };
  if (!linkActive) return { action: 'none', reason: 'controller-link-inactive' };
  if (!anchorWalkable) return { action: 'none', reason: 'anchor-not-walkable' };
  if (anchorControllerRange > 3) return { action: 'none', reason: 'anchor-outside-controller-range' };
  if (anchorLinkRange > 1) return { action: 'none', reason: 'anchor-outside-link-range' };
  if (energyCapacity <= 0) return { action: 'none', reason: 'no-energy-capacity' };
  if (activeWork <= 0) return { action: 'none', reason: 'no-active-work' };
  if (!atAnchor) {
    return activeMove > 0
      ? { action: 'move', reason: 'move-to-anchor' }
      : { action: 'none', reason: 'no-active-move' };
  }
  if (energy <= 0) {
    return linkEnergy > 0
      ? { action: 'withdraw', reason: 'take-controller-link-energy' }
      : { action: 'none', reason: 'controller-link-empty' };
  }
  if (upgradeBlocked > 0) return { action: 'none', reason: 'controller-upgrade-blocked' };
  return { action: 'upgrade', reason: 'upgrade-ready' };
}
```

## 完整固定 Upgrader 示例

```js
const HISTORY_LIMIT = 20;

function evaluateFixedUpgraderState(input) {
  const {
    enabled, creepExists, creepOwned, spawning,
    activeWork, energyCapacity, energy, activeMove,
    atAnchor, anchorWalkable, anchorControllerRange,
    anchorLinkRange, controllerExists, controllerOwned,
    upgradeBlocked, linkExists, linkOwned, linkActive,
    linkEnergy
  } = input;

  if (enabled !== true) return { action: 'none', reason: 'config-disabled' };
  if (!creepExists || !creepOwned) return { action: 'none', reason: 'owned-creep-missing' };
  if (spawning) return { action: 'none', reason: 'creep-spawning' };
  if (!controllerExists || !controllerOwned) return { action: 'none', reason: 'owned-controller-missing' };
  if (!linkExists || !linkOwned) return { action: 'none', reason: 'owned-controller-link-missing' };
  if (!linkActive) return { action: 'none', reason: 'controller-link-inactive' };
  if (!anchorWalkable) return { action: 'none', reason: 'anchor-not-walkable' };
  if (anchorControllerRange > 3) return { action: 'none', reason: 'anchor-outside-controller-range' };
  if (anchorLinkRange > 1) return { action: 'none', reason: 'anchor-outside-link-range' };
  if (energyCapacity <= 0) return { action: 'none', reason: 'no-energy-capacity' };
  if (activeWork <= 0) return { action: 'none', reason: 'no-active-work' };
  if (!atAnchor) {
    return activeMove > 0
      ? { action: 'move', reason: 'move-to-anchor' }
      : { action: 'none', reason: 'no-active-move' };
  }
  if (energy <= 0) {
    return linkEnergy > 0
      ? { action: 'withdraw', reason: 'take-controller-link-energy' }
      : { action: 'none', reason: 'controller-link-empty' };
  }
  if (upgradeBlocked > 0) return { action: 'none', reason: 'controller-upgrade-blocked' };
  return { action: 'upgrade', reason: 'upgrade-ready' };
}

function getState(roomName) {
  Memory.fixedUpgraders ??= {};
  Memory.fixedUpgraders[roomName] ??= {
    enabled: false,
    creepName: null,
    controllerLinkId: null,
    anchor: null,
    pending: null,
    history: []
  };
  return Memory.fixedUpgraders[roomName];
}

function getOwnedLink(id, roomName) {
  if (typeof id !== 'string') return null;
  const link = Game.getObjectById(id);
  return link
    && link.structureType === STRUCTURE_LINK
    && link.my === true
    && link.room.name === roomName
    ? link
    : null;
}

function getAnchor(room, value) {
  if (
    !value
    || !Number.isInteger(value.x)
    || !Number.isInteger(value.y)
    || value.x < 0 || value.x > 49
    || value.y < 0 || value.y > 49
  ) return null;
  return new RoomPosition(value.x, value.y, room.name);
}

function isWalkable(room, position) {
  if (!position) return false;
  if (room.getTerrain().get(position.x, position.y) === TERRAIN_MASK_WALL) return false;

  const blockedStructure = room.lookForAt(
    LOOK_STRUCTURES,
    position.x,
    position.y
  ).some(item => OBSTACLE_OBJECT_TYPES.includes(item.structureType));

  const blockedSite = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    position.x,
    position.y
  ).some(item => OBSTACLE_OBJECT_TYPES.includes(item.structureType));

  return !blockedStructure && !blockedSite;
}

function snapshot(creep, controller, link, anchor) {
  return {
    creepEnergy: creep?.store.getUsedCapacity(RESOURCE_ENERGY) ?? null,
    linkEnergy: link?.store.getUsedCapacity(RESOURCE_ENERGY) ?? null,
    controllerProgress: Number.isFinite(controller?.progress)
      ? controller.progress
      : null,
    ticksToDowngrade: controller?.ticksToDowngrade ?? null,
    atAnchor: Boolean(creep && anchor && creep.pos.isEqualTo(anchor))
  };
}

function verifyPrevious(room, state, creep, controller, link, anchor) {
  const pending = state.pending;
  if (!pending || pending.tick >= Game.time) return null;

  const after = snapshot(creep, controller, link, anchor);
  const exactUpgradeEvent = pending.action === 'upgrade'
    && room.getEventLog().some(event =>
      event.event === EVENT_UPGRADE_CONTROLLER
      && event.objectId === pending.creepId
    );

  let status = 'not-observed';
  if (pending.action === 'move' && after.atAnchor) {
    status = 'anchor-arrival-observed';
  }
  if (pending.action === 'withdraw') {
    const gain = after.creepEnergy - pending.before.creepEnergy;
    const loss = pending.before.linkEnergy - after.linkEnergy;
    status = gain > 0 && loss > 0
      ? 'withdraw-deltas-observed'
      : gain > 0 || loss > 0
        ? 'withdraw-partial-observation'
        : 'withdraw-not-observed';
  }
  if (pending.action === 'upgrade') {
    const spent = pending.before.creepEnergy - after.creepEnergy;
    const progress = Number.isFinite(after.controllerProgress)
      && Number.isFinite(pending.before.controllerProgress)
      && after.controllerProgress > pending.before.controllerProgress;
    const downgrade = Number.isFinite(after.ticksToDowngrade)
      && Number.isFinite(pending.before.ticksToDowngrade)
      && after.ticksToDowngrade > pending.before.ticksToDowngrade;
    status = exactUpgradeEvent
      ? 'upgrade-event-observed'
      : spent > 0 && (progress || downgrade)
        ? 'upgrade-deltas-observed'
        : spent > 0 || progress || downgrade
          ? 'upgrade-partial-observation'
          : 'upgrade-not-observed';
  }

  const record = {
    ...pending,
    verifiedAt: Game.time,
    after: { ...after, exactUpgradeEvent },
    status
  };

  state.history ??= [];
  state.history.push(record);
  state.history = state.history.slice(-HISTORY_LIMIT);
  state.pending = null;
  state.lastVerification = record;
  return record;
}

function runFixedUpgrader(roomName) {
  const state = getState(roomName);
  const room = Game.rooms[roomName];
  if (!room) return { status: 'room-not-visible' };

  const controller = room.controller || null;
  const creep = typeof state.creepName === 'string'
    ? Game.creeps[state.creepName] || null
    : null;
  const link = getOwnedLink(state.controllerLinkId, roomName);
  const anchor = getAnchor(room, state.anchor);
  const verification = verifyPrevious(
    room, state, creep, controller, link, anchor
  );

  const decision = evaluateFixedUpgraderState({
    enabled: state.enabled,
    creepExists: Boolean(creep),
    creepOwned: creep?.my === true,
    spawning: creep?.spawning === true,
    activeWork: creep?.getActiveBodyparts(WORK) ?? 0,
    energyCapacity: creep?.store.getCapacity(RESOURCE_ENERGY) ?? 0,
    energy: creep?.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0,
    activeMove: creep?.getActiveBodyparts(MOVE) ?? 0,
    atAnchor: Boolean(creep && anchor && creep.pos.isEqualTo(anchor)),
    anchorWalkable: isWalkable(room, anchor),
    anchorControllerRange: controller && anchor
      ? anchor.getRangeTo(controller)
      : Infinity,
    anchorLinkRange: link && anchor
      ? anchor.getRangeTo(link)
      : Infinity,
    controllerExists: Boolean(controller),
    controllerOwned: controller?.my === true,
    upgradeBlocked: controller?.upgradeBlocked ?? 0,
    linkExists: Boolean(link),
    linkOwned: link?.my === true,
    linkActive: link?.isActive() === true,
    linkEnergy: link?.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0
  });

  state.lastReason = decision.reason;
  state.lastDecisionAt = Game.time;
  if (decision.action === 'none') {
    return { status: decision.reason, verification };
  }

  const before = snapshot(creep, controller, link, anchor);
  let result = ERR_INVALID_ARGS;
  if (decision.action === 'move') {
    result = creep.moveTo(anchor, { range: 0, reusePath: 10 });
  } else if (decision.action === 'withdraw') {
    result = creep.withdraw(link, RESOURCE_ENERGY);
  } else if (decision.action === 'upgrade') {
    result = creep.upgradeController(controller);
  }

  state.lastAction = decision.action;
  state.lastResult = result;
  state.lastResultAt = Game.time;

  if (result === OK) {
    state.pending = {
      tick: Game.time,
      action: decision.action,
      creepId: creep.id,
      creepName: creep.name,
      controllerId: controller.id,
      linkId: link.id,
      before
    };
  }

  return {
    status: result === OK ? 'command-accepted' : 'command-rejected',
    action: decision.action,
    reason: decision.reason,
    result,
    before,
    verification
  };
}

module.exports.loop = function () {
  const outcome = runFixedUpgrader('W1N1');
  if (outcome.status !== 'config-disabled' || outcome.verification) {
    console.log(JSON.stringify({
      type: 'fixed-upgrader',
      tick: Game.time,
      roomName: 'W1N1',
      ...outcome
    }));
  }
};
```

保存后，把房间名、Creep 名称、Link ID 和 anchor 坐标换成自己的数据。

## 三种动作的返回值

### `moveTo()`

| 返回值 | 处理方向 |
|---|---|
| `OK` | 下一 tick 检查是否到达 anchor |
| `ERR_BUSY` | 检查 `spawning` |
| `ERR_NO_BODYPART` | 检查有效 MOVE |
| `ERR_TIRED` | 检查 fatigue 与 MOVE 比例 |
| `ERR_NO_PATH` | 检查障碍、交通和 CostMatrix |
| `ERR_INVALID_TARGET` | 检查 anchor 与视野 |

如果移动返回 OK 但连续多个 tick 位置不变，使用[moveTo() 返回 OK 但不移动](/blog/screeps-moveto-not-moving)继续排查。

### `withdraw()`

| 返回值 | 处理方向 |
|---|---|
| `OK` | 下一 tick 检查 Creep 增加、Link 减少 |
| `ERR_NOT_ENOUGH_RESOURCES` | 检查上游补能链 |
| `ERR_FULL` | 检查 Store 与 CARRY |
| `ERR_NOT_IN_RANGE` | 修正 anchor 到 Link 范围 1 |
| `ERR_INVALID_TARGET` | 验证结构类型与所有权 |
| `ERR_INVALID_ARGS` | 检查资源类型和 amount |

### `upgradeController()`

| 返回值 | 处理方向 |
|---|---|
| `OK` | 下一 tick 查看事件与状态变化 |
| `ERR_NOT_OWNER` | 核对 Creep 身份 |
| `ERR_BUSY` | 检查 `spawning` |
| `ERR_NOT_ENOUGH_RESOURCES` | 检查 Link 与 withdraw 分支 |
| `ERR_INVALID_TARGET` | 检查 Controller 与 `upgradeBlocked` |
| `ERR_NOT_IN_RANGE` | 修正 anchor 到 Controller 范围 3 |
| `ERR_NO_BODYPART` | 检查有效 WORK |
| `ERR_ACCESS_DENIED` | 保存房间安全与访问上下文 |

返回 OK 只说明命令被接受，不等于当前代码段已经能读到最终状态。

## 下一 tick 怎样验证

- 移动：检查 `creep.pos.isEqualTo(anchor)`；
- 取能：比较 Creep Energy 增加与 Controller Link Energy 减少；
- 升级：优先检查 `EVENT_UPGRADE_CONTROLLER`，并要求 `event.objectId === pending.creepId`。

若事件不可用，再使用 Creep Energy、Controller progress 和 `ticksToDowngrade` 的有限变化作为辅助观察。并发 Upgrader 会使纯数值差值无法证明唯一因果。

## Controller Link 一直为空怎么处理

固定 Upgrader 只负责“Link 有能量就取，Creep 有能量就升级”。`controller-link-empty` 应交给独立协调器。

最小排查顺序：

1. Source Link 或 Storage 是否有 Energy；
2. 源 Link 是否 `cooldown === 0`；
3. Controller Link 是否有空余容量；
4. `transferEnergy()` 返回值是否保存；
5. 下一 tick 是否观察到源 Link 与目标 Link 变化；
6. 运输者往返距离和 CARRY 吞吐量是否足够；
7. 是否有其他消费者抢占 Controller Link。

不要在多个模块中同时调用同一源 Link 的 `transferEnergy()`；应由一个 Link 协调器决定最终目标。

## 固定 Upgrader 身体怎么理解

本文不提供万能最佳身体。身体取决于 RCL、补给频率、目标升级速度、Boost、RCL8、`PWR_OPERATE_CONTROLLER`、Spawn 时间和 anchor 是否需要移动。

至少保证有 Energy 容量、有有效 WORK，并在需要移动到 anchor 时有有效 MOVE。升级类 Boost 会提高升级效果而不增加 Energy 成本，但不能代替供能能力。

## 离线验证覆盖

21 个场景覆盖：配置、对象、所有权、spawning、站位、Controller/Link 距离、Energy 容量、WORK/MOVE、Link 空仓、upgradeBlocked、移动、取能、升级和下一 tick 分类。完整示例通过 `node --check`。

离线测试不能证明官方 shard 交通、多 Creep 抢位、多 Link 竞争、Boost 与 Power Creep 的所有组合、RCL8 实际吞吐、真实 ID/坐标或最高效率。相关结论保持待验证。

## 推荐内链

- [基础 Upgrader 循环](/blog/screeps-upgrade-controller)
- [工作状态切换](/blog/screeps-creep-working-state)
- [Game.getObjectById()](/blog/screeps-game-get-object-by-id)
- [Link 传能](/blog/screeps-link-transfer-energy)
- [Storage Energy 分配](/blog/screeps-storage-energy-usage)
- [运输吞吐量规划器](/tools/hauling-throughput-planner)
- [Controller 降级应急](/blog/screeps-controller-downgrade)
- [Controller 降级规划器](/tools/controller-downgrade-planner)
- [Room Event Log](/blog/screeps-room-event-log)

## 官方资料

- [Creep.upgradeController()、withdraw() 与返回值](https://docs.screeps.com/api/)
- [Controller 等级、Link 解锁与降级机制](https://docs.screeps.com/control.html)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)
- [Simultaneous execution of creep actions](https://docs.screeps.com/simultaneous-actions.html)
- [Boost 资源效果](https://docs.screeps.com/resources.html)

资料核对日期：2026-08-05。官方文档、完整示例语法和 21 个离线场景已核对；真实 Console 与官方 shard 行为仍待验证。
