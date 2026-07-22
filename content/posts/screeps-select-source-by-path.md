---
title: "多个 Source 怎么按可达路径选择并稳定保存目标"
description: "比较findClosestByPath与findClosestByRange，从FIND_SOURCES_ACTIVE选择可达Source，保存目标ID，并处理无视野、能量恢复和多Creep竞争。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Source"
  - "寻路"
  - "目标选择"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（Source活跃状态、路径长度、预计分配数量、ID稳定排序和缓存失效，不是Screeps官方服务器）"
  testResult: "无候选、无Energy、无路径、路径更短、同路径负载更低、同分ID稳定和缓存保留场景通过。"
featured: false
---

房间有多个Source时，`room.find(FIND_SOURCES)[0]` 只取数组第一项，不代表它离Creep最近，也不代表当前有可行路径。

本文建立一个基础选择流程：

1. 优先恢复已经保存的Source ID；
2. 目标仍有效且有Energy时继续使用；
3. 目标失效或不符合任务时重新选择；
4. 新目标按路径长度、当前分配数量和ID稳定排序。

## 路径最近与范围最近不同

```js
creep.pos.findClosestByRange(FIND_SOURCES)
```

比较RoomPosition范围，不计算道路、自然墙体和障碍物。

```js
creep.pos.findClosestByPath(FIND_SOURCES)
```

运行寻路并选择路径代价更低的候选。没有可用路径时可能返回 `null`。

需要实际走到目标时，路径最近通常比直线范围更有意义，但计算成本也更高。

## `FIND_SOURCES` 与 `FIND_SOURCES_ACTIVE`

```js
FIND_SOURCES
```

返回房间内所有Source，包括当前Energy为0、等待恢复的Source。

```js
FIND_SOURCES_ACTIVE
```

只返回当前有Energy的Source。

使用Active候选能避免Creep立刻选择空Source，但也可能让固定矿点分配在Source暂时为空时改变。选择哪个常量取决于任务设计。

本文的动态采集策略使用 `FIND_SOURCES_ACTIVE`。

## 多只Creep需要考虑当前分配数量

所有Creep独立调用 `findClosestByPath()` 时，可能一起选择同一个Source。

可以统计当前Memory中的目标ID：

```js
function countAssignmentsBySource() {
  const counts = {};

  for (const creep of Object.values(Game.creeps)) {
    const sourceId = creep.memory?.sourceId;

    if (typeof sourceId !== 'string') {
      continue;
    }

    counts[sourceId] = (counts[sourceId] || 0) + 1;
  }

  return counts;
}
```

这个计数只反映Memory声明，不证明Creep已经到达或正在采集。

## 可离线测试的候选排序

```js
function selectSourceCandidate(candidates) {
  return [...candidates]
    .filter(candidate =>
      typeof candidate.id === 'string'
      && Number.isFinite(candidate.energy)
      && candidate.energy > 0
      && Number.isFinite(candidate.pathLength)
      && candidate.pathLength >= 0
      && candidate.reachable === true
      && Number.isInteger(candidate.assignmentCount)
      && candidate.assignmentCount >= 0
    )
    .sort((left, right) => {
      if (left.pathLength !== right.pathLength) {
        return left.pathLength - right.pathLength;
      }

      if (
        left.assignmentCount
        !== right.assignmentCount
      ) {
        return left.assignmentCount
          - right.assignmentCount;
      }

      return left.id.localeCompare(right.id);
    })[0] ?? null;
}
```

此排序先保证路径更短，再使用当前分配数量。它不是完整矿位调度器，也没有计算Source周围可站立格数量。

## 为每个Source计算路径候选

```js
function buildSourceCandidates(creep, sources) {
  const assignments = countAssignmentsBySource();
  const candidates = [];

  for (const source of sources) {
    const path = creep.pos.findPathTo(source, {
      range: 1,
      ignoreCreeps: true,
      maxOps: 4000
    });
    const alreadyNear = creep.pos.isNearTo(source);

    if (path.length === 0 && !alreadyNear) {
      continue;
    }

    candidates.push({
      source,
      id: source.id,
      energy: source.energy,
      reachable: true,
      pathLength: path.length,
      assignmentCount: assignments[source.id] || 0
    });
  }

  return candidates;
}
```

`ignoreCreeps: true`降低临时交通对长期分配的影响，但实际移动仍会受Creep阻挡。

## 先恢复已经保存的Source

```js
function getStoredActiveSource(creep) {
  const sourceId = creep.memory?.sourceId;

  if (typeof sourceId !== 'string') {
    return null;
  }

  const source = Game.getObjectById(sourceId);

  if (!source) {
    delete creep.memory.sourceId;
    return null;
  }

  if (
    !Number.isFinite(source.energy)
    || source.energy <= 0
  ) {
    return null;
  }

  return source;
}
```

当前房间里的Creep通常拥有该房间视野。远程Source ID还需要保存 `roomName`，避免把“没有视野”误判成目标已经消失。

## 完整示例

```js
function countAssignmentsBySource() {
  const counts = {};

  for (const creep of Object.values(Game.creeps)) {
    const sourceId = creep.memory?.sourceId;

    if (typeof sourceId !== 'string') {
      continue;
    }

    counts[sourceId] = (counts[sourceId] || 0) + 1;
  }

  return counts;
}

function chooseActiveSource(creep) {
  const storedId = creep.memory?.sourceId;

  if (typeof storedId === 'string') {
    const stored = Game.getObjectById(storedId);

    if (
      stored
      && Number.isFinite(stored.energy)
      && stored.energy > 0
    ) {
      return stored;
    }
  }

  const sources = creep.room.find(FIND_SOURCES_ACTIVE);
  const assignments = countAssignmentsBySource();
  const candidates = [];

  for (const source of sources) {
    const path = creep.pos.findPathTo(source, {
      range: 1,
      ignoreCreeps: true,
      maxOps: 4000
    });

    if (
      path.length === 0
      && !creep.pos.isNearTo(source)
    ) {
      continue;
    }

    candidates.push({
      source,
      pathLength: path.length,
      assignmentCount: assignments[source.id] || 0
    });
  }

  const selected = candidates.sort((left, right) => {
    if (left.pathLength !== right.pathLength) {
      return left.pathLength - right.pathLength;
    }

    if (
      left.assignmentCount
      !== right.assignmentCount
    ) {
      return left.assignmentCount
        - right.assignmentCount;
    }

    return left.source.id.localeCompare(
      right.source.id
    );
  })[0]?.source ?? null;

  if (selected) {
    creep.memory.sourceId = selected.id;
    creep.memory.sourceRoom = selected.pos.roomName;
    creep.memory.sourceSelectedAt = Game.time;
  }

  return selected;
}

function runHarvester(creep) {
  if (creep.spawning === true) {
    return {
      status: 'creep-spawning'
    };
  }

  if (
    creep.store.getFreeCapacity(
      RESOURCE_ENERGY
    ) <= 0
  ) {
    return {
      status: 'creep-full'
    };
  }

  const source = chooseActiveSource(creep);

  if (!source) {
    return {
      status: 'active-source-not-found'
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
      sourceId: source.id,
      result,
      moveResult
    };
  }

  if (result === ERR_NOT_ENOUGH_RESOURCES) {
    delete creep.memory.sourceId;
  }

  return {
    status: result === OK
      ? 'harvest-submitted'
      : 'harvest-failed',
    sourceId: source.id,
    result
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;

  if (!creep) {
    return;
  }

  const outcome = runHarvester(creep);

  if (outcome.status === 'harvest-failed') {
    console.log({
      type: 'source-harvest-failed',
      creepName: creep.name,
      ...outcome
    });
  }
};
```

## 空Source是否应该删除ID

Source会恢复Energy。固定矿点模式通常应该保留ID并等待；动态采集模式可以删除ID并寻找其他活跃Source。

本文示例属于动态模式，在 `ERR_NOT_ENOUGH_RESOURCES` 后清除ID。不要把这一选择复制到固定采集位系统。

## 每tick重新寻路的成本

保存有效Source ID可以减少重复目标搜索，但示例在目标为空时仍会重新计算多个候选路径。

房间规模扩大后可以：

- 在房间Memory保存Source到固定位置的路径；
- 使用全局可重建缓存；
- 由房间调度器一次分配多个Creep；
- 只在目标失效时重新计算；
- 用 `Game.cpu.getUsed()` 测量真实成本。

不能仅凭代码长度断言性能改善。

## 返回值与失败分支

`harvest()`重点处理：

- `OK`：动作已安排；
- `ERR_NOT_IN_RANGE`：移动到相邻；
- `ERR_NOT_ENOUGH_RESOURCES`：Source当前没有Energy；
- `ERR_INVALID_TARGET`：目标不是有效资源对象；
- `ERR_FULL`：Creep容量已满；
- `ERR_NO_BODYPART`：没有有效WORK；
- `ERR_BUSY`、`ERR_NOT_OWNER`：对象状态或所有权问题。

移动结果也可能失败，不能只保存 `harvest()` 结果。

## 常见错误

### 直接使用 `FIND_SOURCES[0]`

数组顺序不是距离、路径或负载优先级。

### 把范围最近当成路径最近

自然墙体和建筑可能让近距离目标无法到达。

### 每tick重新选择Source

Creep可能在两个目标之间来回改变方向。

### 永远保留失效ID

对象恢复失败、任务变化或路径长期不可达时需要重新分配。

### 所有Creep都独立选择

会集中到同一Source。房间调度器或目标预订更可靠。

### 把当前 `energy > 0` 当成到达时仍有Energy

行走期间Source可能被其他Creep采空。

## 离线模拟结果

构建检查覆盖：

1. 无候选；
2. Source没有Energy；
3. 路径不可达；
4. 路径更短者优先；
5. 同路径分配数量更少者优先；
6. 完全同分时ID稳定；
7. 保存目标有效时继续使用；
8. 失效后重新选择。

离线测试不能模拟真实PathFinder、动态交通、Source恢复与多Creep动作结算。

## 适用边界

本文不覆盖：

- Source周围站位分配；
- 固定矿工；
- Container与Link位置；
- 多房间远程采集；
- 敌对房间避险；
- 完整CPU优化；
- 多Creep集中调度器。

JavaScript语法和离线候选排序已检查，真实路径与采集结果仍待Screeps环境验证。

## 相关站内内容

- [Game.getObjectById()怎么恢复目标](/blog/screeps-game-get-object-by-id)
- [moveTo()为什么不移动](/blog/screeps-moveto-not-moving)
- [ERR_NO_PATH怎么排查](/blog/screeps-err-no-path)
- [如何从Container取Energy](/blog/screeps-creep-withdraw-container-energy)
- [Game.cpu.getUsed()怎么监控CPU](/blog/screeps-cpu-getused-bucket)
- [进入资源采集与房间经济专题](/knowledge/room-economy)

## 官方资料

- [RoomPosition.findClosestByPath API](https://docs.screeps.com/api/#RoomPosition.findClosestByPath)
- [RoomPosition.findPathTo API](https://docs.screeps.com/api/#RoomPosition.findPathTo)
- [Find Constants](https://docs.screeps.com/api/#Constants-Find-Constants)
- [Creep.harvest API](https://docs.screeps.com/api/#Creep.harvest)

资料核对日期：2026-07-22。离线Source候选排序已通过；真实寻路与采集仍待Screeps环境验证。
