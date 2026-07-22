---
title: "Game.getObjectById() 怎么配合 Memory 安全恢复目标"
description: "把对象ID和目标房间写入Memory，每个tick重新取得实时对象，并区分目标消失、ID损坏和远程房间暂时没有视野。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Memory"
  - "Game API"
  - "目标缓存"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（ID类型、房间视野、对象恢复、目标类型和失效策略，不是Screeps官方服务器）"
  testResult: "无ID、非法ID、无视野保留、可见房间目标消失、类型不符、合法对象和重新选择场景通过。"
featured: false
---

Screeps的实时游戏对象不能直接作为跨tick引用保存在Memory中。需要记住Source、Structure或ConstructionSite时，应保存对象的 `id`，并在每个tick用 `Game.getObjectById()` 取得当前对象。

本文聚焦一个容易误判的边界：返回 `null` 可能表示目标已经消失，也可能只是目标所在房间当前不可见。远程任务不能看到 `null` 就立即删除ID。

## 正确的数据关系

```text
Memory
保存稳定标识与任务信息

Game.getObjectById(id)
根据当前tick与当前视野恢复实时对象
```

建议同时保存：

```js
creep.memory.target = {
  id: source.id,
  roomName: source.pos.roomName,
  type: 'source',
  selectedAt: Game.time
};
```

`roomName`和 `type`不是 `Game.getObjectById()` 必需参数，而是本站增加的校验和诊断字段。

## 为什么完整对象不能放进Memory

错误写法：

```js
creep.memory.source = source;
```

Memory只保存JSON数据。经过序列化后，这份数据不是下一tick的实时Source，也不能可靠使用对象方法和最新属性。

正确写法：

```js
creep.memory.sourceId = source.id;
```

当前tick恢复：

```js
const source = Game.getObjectById(
  creep.memory.sourceId
);
```

## `Game.getObjectById()` 返回什么

调用：

```js
const target = Game.getObjectById(id);
```

返回：

- 当前可访问的游戏对象；
- 或 `null`。

它不返回 `OK`、`ERR_NOT_IN_RANGE` 等动作错误常量。

官方API说明，只有当前可见房间中的对象可以通过ID访问。因此 `null` 不能脱离视野条件解释。

## 先判断目标房间是否可见

```js
function hasRoomVision(roomName) {
  return typeof roomName === 'string'
    && Boolean(Game.rooms[roomName]);
}
```

判断流程：

```text
没有有效ID
→ 需要选择目标

有ID，但目标房间没有视野
→ 保留ID，等待视野

有ID，房间可见，仍恢复为null
→ 目标很可能已失效，可以重新选择
```

这个流程需要保存 `roomName`。只有ID而没有目标房间时，无法区分“暂时不可见”和“已经消失”。

## 用纯函数解释恢复状态

```js
function evaluateStoredTarget(input) {
  const {
    id,
    roomName,
    roomVisible,
    object,
    expectedType
  } = input;

  if (typeof id !== 'string' || id.length === 0) {
    return {
      usable: false,
      removeStoredTarget: true,
      reason: 'invalid-id'
    };
  }

  if (
    typeof roomName === 'string'
    && roomName.length > 0
    && roomVisible !== true
  ) {
    return {
      usable: false,
      removeStoredTarget: false,
      reason: 'room-not-visible'
    };
  }

  if (!object) {
    return {
      usable: false,
      removeStoredTarget: true,
      reason: 'object-not-found'
    };
  }

  if (
    expectedType
    && object.type !== expectedType
  ) {
    return {
      usable: false,
      removeStoredTarget: true,
      reason: 'type-mismatch'
    };
  }

  return {
    usable: true,
    removeStoredTarget: false,
    reason: 'ready'
  };
}
```

离线测试中的 `object.type` 是简化字段。真实Source没有统一的字符串 `type` 属性，因此正式代码要用对象特征或项目保存的类型分支判断。

## 怎样判断恢复到的是Source

可以检查Source特征：

```js
function isSourceObject(target) {
  return Boolean(
    target
    && typeof target.id === 'string'
    && target.pos
    && Number.isFinite(target.energy)
    && Number.isFinite(target.energyCapacity)
  );
}
```

这是一种运行时保护，不等于完整的类型系统。项目使用TypeScript时，可以在外部代码中增加更严格类型声明。

## 完整示例：保存并恢复Source

```js
function isSourceObject(target) {
  return Boolean(
    target
    && typeof target.id === 'string'
    && target.pos
    && Number.isFinite(target.energy)
    && Number.isFinite(target.energyCapacity)
  );
}

function clearStoredTarget(creep, reason) {
  delete creep.memory.target;
  creep.memory.lastTargetStatus = reason;
  creep.memory.lastTargetChangedAt = Game.time;
}

function storeSourceTarget(creep, source) {
  creep.memory.target = {
    id: source.id,
    roomName: source.pos.roomName,
    type: 'source',
    selectedAt: Game.time
  };
  creep.memory.lastTargetStatus = 'source-selected';
  creep.memory.lastTargetChangedAt = Game.time;
}

function selectVisibleSource(creep) {
  const source = creep.pos.findClosestByPath(
    FIND_SOURCES_ACTIVE
  );

  if (!source) {
    return null;
  }

  storeSourceTarget(creep, source);
  return source;
}

function getStoredSource(creep) {
  const stored = creep.memory.target;

  if (!stored || typeof stored !== 'object') {
    return selectVisibleSource(creep);
  }

  if (
    typeof stored.id !== 'string'
    || stored.id.length === 0
  ) {
    clearStoredTarget(creep, 'invalid-id');
    return selectVisibleSource(creep);
  }

  if (
    typeof stored.roomName === 'string'
    && stored.roomName.length > 0
    && !Game.rooms[stored.roomName]
  ) {
    creep.memory.lastTargetStatus = 'waiting-room-vision';
    return null;
  }

  const target = Game.getObjectById(stored.id);

  if (!isSourceObject(target)) {
    clearStoredTarget(creep, 'source-not-found');
    return selectVisibleSource(creep);
  }

  creep.memory.lastTargetStatus = 'source-restored';
  return target;
}

function runHarvester(creep) {
  const source = getStoredSource(creep);

  if (!source) {
    return {
      status: creep.memory.lastTargetStatus
        || 'source-unavailable'
    };
  }

  const result = creep.harvest(source);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(source, {
      range: 1,
      reusePath: 10
    });

    return {
      status: 'moving-to-source',
      result,
      moveResult
    };
  }

  if (result === ERR_NOT_ENOUGH_RESOURCES) {
    clearStoredTarget(creep, 'source-empty');
  }

  return {
    status: result === OK
      ? 'harvest-submitted'
      : 'harvest-failed',
    result
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;

  if (!creep || creep.spawning === true) {
    return;
  }

  const outcome = runHarvester(creep);

  if (outcome.status === 'harvest-failed') {
    console.log({
      type: 'stored-source-action-failed',
      creepName: creep.name,
      storedTarget: creep.memory.target ?? null,
      ...outcome
    });
  }
};
```

对于当前房间的Source，房间通常已经因为Creep存在而可见。示例仍保留视野分支，让同一模式可以扩展到远程目标。

## Source暂时没有Energy时要不要删ID

`FIND_SOURCES_ACTIVE`只选择当前有Energy的Source。已保存Source可能暂时变空，但之后会恢复。

是否删除ID取决于任务策略：

- 固定Source分配：保留ID，原地等待或执行备用任务；
- 动态采集：删除ID并选择其他活跃Source；
- 多Creep分配：由房间调度器决定，不能每只Creep独立抢目标。

完整示例在 `ERR_NOT_ENOUGH_RESOURCES` 时删除ID，是动态采集策略，不是官方要求。

## 为什么不能每tick都重新寻路选目标

下面的写法每tick执行目标搜索：

```js
const source = creep.pos.findClosestByPath(
  FIND_SOURCES_ACTIVE
);
```

保存有效ID后，可以减少不必要的重复选择，并保持任务稳定。

但ID缓存也需要失效条件：

- 对象恢复为 `null` 且房间可见；
- 目标类型与任务不符；
- 目标不再满足业务条件；
- 路线不可达；
- 任务版本改变；
- 调度器重新分配。

## 不同对象应该保存什么标识

| 对象 | 常用标识 |
|---|---|
| Source、Structure、ConstructionSite | `id` |
| Creep | 通常保存 `name`，也可使用 `id`处理当前对象 |
| Flag | `name` |
| Room | `roomName` |
| RoomPosition | `roomName`、`x`、`y` |

不要为了统一格式，强迫所有对象只使用ID。

## 常见错误

### 保存完整游戏对象

序列化后不再是实时对象。保存ID。

### `null`时立即删除远程目标

先检查目标房间是否可见。

### 恢复对象后不验证类型

Memory可能损坏、字段迁移错误或ID来自不同任务。

### 每tick重新选择目标

会增加无意义计算并让多个Creep频繁换目标。

### 永远不失效

对象消失、任务变化或路径失败后仍继续持有旧ID。

### 把返回 `null` 当作动作错误码

`Game.getObjectById()`返回对象或 `null`，不返回动作常量。

### 当前tick命令后手动修改对象状态

动作结算在后续阶段完成。下一tick重新取得对象并读取最新状态。

## 离线模拟结果

构建检查覆盖：

1. ID缺失；
2. ID类型错误；
3. 目标房间不可见时保留ID；
4. 房间可见且对象不存在时删除ID；
5. 对象类型不符；
6. 合法对象恢复；
7. 清理后重新选择；
8. 状态原因记录。

离线测试不能模拟官方视野、真实对象原型、Source恢复、路径搜索或动作结算。

## 适用边界

本文只展示Source目标恢复模式，不覆盖：

- 多Creep目标锁定；
- 远程房间自动获取视野；
- Observer调度；
- 路径缓存；
- ConstructionSite完成后的目标转换；
- 战斗目标优先级；
- TypeScript类型守卫；
- 全局对象缓存。

JavaScript语法和离线恢复决策已检查，真实视野与对象生命周期仍待Screeps环境验证。

## 相关站内内容

- [Screeps Memory是什么](/blog/screeps-memory-basics)
- [Game.rooms为什么没有某个房间](/blog/screeps-room-visibility)
- [如何清理死亡Creep的Memory](/blog/screeps-clean-dead-creep-memory)
- [全局缓存为什么会失效](/blog/screeps-global-cache)
- [Observer怎样获取远程视野](/blog/screeps-observer-observe-room)
- [进入Memory与代码工程专题](/knowledge/memory-engineering)

## 官方资料

- [Game.getObjectById API](https://docs.screeps.com/api/#Game.getObjectById)
- [Global Objects：Memory](https://docs.screeps.com/global-objects.html)
- [Game.rooms API](https://docs.screeps.com/api/#Game-rooms)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线对象恢复决策已通过；真实视野和目标状态仍待环境验证。
