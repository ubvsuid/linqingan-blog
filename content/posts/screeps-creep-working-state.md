---
title: "Creep 如何在取能和工作之间稳定切换状态"
description: "用Creep.store边界和memory.working建立两阶段状态，处理首次初始化、部分Energy、无容量、目标缺失、动作结果和移动结果。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-23"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Memory"
  - "Creep"
  - "自动化"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（Energy使用量、剩余容量、旧状态与边界切换，不是Screeps官方服务器）"
  testResult: "首次空载、首次部分Energy、装满切换、耗尽切换、中间值保持、无容量和非法输入场景通过。"
featured: false
---

`creep.memory.working` 是玩家自定义的两阶段状态：

```text
working = false
→ 获取Energy

working = true
→ 消耗Energy执行工作
```

稳定切换只依赖两个边界：Energy用完时回到取能，容量装满时进入工作。Energy处于中间值时保持上一状态。

本文以“采集Source—升级Controller”为例，重点解释状态初始化、Store边界和动作结果。

## 为什么不能每tick直接取反

错误写法：

```js
creep.memory.working = !creep.memory.working;
```

它会让Creep在相邻tick反复改变任务，可能还没有到达Source就转向Controller。

状态应该由资源边界驱动，而不是由tick数量驱动。

## 读取Energy与剩余容量

```js
const usedEnergy = creep.store.getUsedCapacity(
  RESOURCE_ENERGY
);

const freeEnergyCapacity = creep.store.getFreeCapacity(
  RESOURCE_ENERGY
);

const totalEnergyCapacity = creep.store.getCapacity(
  RESOURCE_ENERGY
);
```

没有有效CARRY容量时，总容量为0，这种身体不适合本文的取能—工作循环。

## 用纯函数计算下一状态

```js
function getNextWorkingState(input) {
  const {
    usedEnergy,
    freeEnergyCapacity,
    totalEnergyCapacity,
    previousWorking
  } = input;

  if (
    !Number.isFinite(usedEnergy)
    || !Number.isFinite(freeEnergyCapacity)
    || !Number.isFinite(totalEnergyCapacity)
    || usedEnergy < 0
    || freeEnergyCapacity < 0
    || totalEnergyCapacity <= 0
  ) {
    return {
      valid: false,
      working: false,
      reason: 'invalid-store-values'
    };
  }

  if (usedEnergy === 0) {
    return {
      valid: true,
      working: false,
      reason: 'energy-empty'
    };
  }

  if (freeEnergyCapacity === 0) {
    return {
      valid: true,
      working: true,
      reason: 'energy-full'
    };
  }

  return {
    valid: true,
    working: previousWorking === true,
    reason: 'keep-previous-state'
  };
}
```

### 首次运行只有部分Energy

当 `working` 尚未初始化，而Creep已有部分Energy时，示例把 `undefined` 视为假，因此默认继续取能。

这是本站选择的初始化策略，不是官方规则。其他角色也可以选择部分Energy时立即工作，但必须明确写出规则。

## 完整示例

```js
function getNextWorkingState(input) {
  const {
    usedEnergy,
    freeEnergyCapacity,
    totalEnergyCapacity,
    previousWorking
  } = input;

  if (
    !Number.isFinite(usedEnergy)
    || !Number.isFinite(freeEnergyCapacity)
    || !Number.isFinite(totalEnergyCapacity)
    || usedEnergy < 0
    || freeEnergyCapacity < 0
    || totalEnergyCapacity <= 0
  ) {
    return {
      valid: false,
      working: false,
      reason: 'invalid-store-values'
    };
  }

  if (usedEnergy === 0) {
    return {
      valid: true,
      working: false,
      reason: 'energy-empty'
    };
  }

  if (freeEnergyCapacity === 0) {
    return {
      valid: true,
      working: true,
      reason: 'energy-full'
    };
  }

  return {
    valid: true,
    working: previousWorking === true,
    reason: 'keep-previous-state'
  };
}

function updateWorkingState(creep) {
  const decision = getNextWorkingState({
    usedEnergy: creep.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    freeEnergyCapacity: creep.store.getFreeCapacity(
      RESOURCE_ENERGY
    ),
    totalEnergyCapacity: creep.store.getCapacity(
      RESOURCE_ENERGY
    ),
    previousWorking: creep.memory.working
  });

  creep.memory.working = decision.working;
  creep.memory.lastStateReason = decision.reason;
  creep.memory.lastStateCheckedAt = Game.time;

  return decision;
}

function runWorker(creep) {
  const state = updateWorkingState(creep);

  if (!state.valid) {
    return {
      status: 'invalid-working-state',
      reason: state.reason
    };
  }

  if (creep.memory.working !== true) {
    const source = creep.pos.findClosestByPath(
      FIND_SOURCES_ACTIVE
    );

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
        result,
        moveResult
      };
    }

    return {
      status: result === OK
        ? 'harvest-submitted'
        : 'harvest-failed',
      result
    };
  }

  const controller = creep.room.controller;

  if (!controller || controller.my !== true) {
    return {
      status: 'owned-controller-not-found'
    };
  }

  const result = creep.upgradeController(controller);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(controller, {
      range: 3,
      reusePath: 10
    });

    return {
      status: 'moving-to-controller',
      result,
      moveResult
    };
  }

  return {
    status: result === OK
      ? 'upgrade-submitted'
      : 'upgrade-failed',
    result
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Worker1;

  if (!creep || creep.spawning === true) {
    return;
  }

  const outcome = runWorker(creep);

  if (
    outcome.status.endsWith('-failed')
    || outcome.status === 'invalid-working-state'
  ) {
    console.log({
      type: 'worker-state-action-failed',
      creepName: creep.name,
      working: creep.memory.working,
      ...outcome
    });
  }
};
```

把 `Worker1` 换成真实名称。

## 为什么取能分支结束后不继续工作分支

取能逻辑处理完后直接返回，可以避免：

- 同一tick先采集再尝试升级；
- 两个分支同时安排移动；
- 日志出现互相矛盾的状态。

状态切换只决定当前分支，不代表动作已经完成。

## `harvest()` 的关键返回值

本文目标是Energy Source，因此重点处理：

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 采集命令已安排 | 下一tick读取Store与Source |
| `ERR_NOT_OWNER` | Creep不是自己的，或房间控制状态限制动作 | 检查对象和房间状态 |
| `ERR_BUSY` | Creep仍在生成 | 等待生成完成 |
| `ERR_NOT_ENOUGH_RESOURCES` | Source当前没有可采Energy | 等待恢复或选择其他活跃Source |
| `ERR_INVALID_TARGET` | 目标不是可采对象 | 检查目标类型 |
| `ERR_FULL` | Creep没有剩余容量 | 状态应切到工作 |
| `ERR_NOT_IN_RANGE` | 不相邻 | 移动到范围1 |
| `ERR_NO_BODYPART` | 没有有效WORK部件 | 检查身体与受伤状态 |

`ERR_NOT_FOUND` 在采集矿物时可表示缺少Extractor，不是Energy Source为空的返回值。

## `upgradeController()` 的关键返回值

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 升级命令已安排 | 下一tick读取进度与Store |
| `ERR_NOT_OWNER` | Creep或Controller所有权不符 | 检查对象 |
| `ERR_BUSY` | Creep仍在生成 | 等生成结束 |
| `ERR_NOT_ENOUGH_RESOURCES` | Creep没有Energy | 状态应切回取能 |
| `ERR_INVALID_TARGET` | Controller不是有效目标或升级受阻 | 检查控制状态 |
| `ERR_NOT_IN_RANGE` | 超过3格 | 移动到范围3 |
| `ERR_NO_BODYPART` | 没有有效WORK部件 | 检查身体 |

`OK`只表示命令已安排，Store和Controller变化在后续tick观察。

## 中间Energy为什么保持上一状态

假设容量50：

```text
0 Energy
→ working = false

50 Energy
→ working = true

30 Energy
→ 保持之前状态
```

正在工作且剩30 Energy时继续工作；正在取能且已有30 Energy时继续装满。

## 哪些角色不适合这种状态

可能不需要 `working` 的任务包括：

- 固定站位升级者从Link持续取能；
- 专职运输者按任务清单搬运多种资源；
- 战斗Creep；
- 一次性临时任务；
- 由集中调度器分配动作的系统。

固定升级者强行等待装满才工作，可能降低Controller升级效率。

## 常见错误

### 每tick取反

任务会持续抖动。

### 有Energy就立即工作

采集到少量Energy后就离开Source，往返次数增加。

### 部分Energy时没有初始化规则

明确默认继续取能还是立即工作。

### 没有CARRY容量仍运行

检查总容量，避免无意义动作循环。

### 忽略移动结果

距离不足后调用 `moveTo()`，仍需记录无路径、fatigue或身体问题。

### 同一tick进入两个分支

每个业务分支结束后返回，保持意图单一。

## 离线模拟结果

构建检查覆盖：

1. 首次空载；
2. 首次部分Energy；
3. 装满进入工作；
4. 工作耗尽回到取能；
5. 中间值保持原状态；
6. 总容量为0；
7. 负数与非数字输入；
8. 状态原因字段。

离线测试不能模拟真实Store更新、动作结算、路径、Source恢复或Controller进度。

## 状态转换图

![Creep 在取能状态与工作状态之间切换的流程图：空载转为取能，满载转为工作，部分装载保持当前状态](/diagrams/creep-working-state.svg)

图中只表达本文的两阶段状态边界，不代表完整任务调度系统。

## 适用边界

本文只实现单个Creep的采集—升级两阶段状态，不覆盖：

- 多资源Store；
- Container或Storage取能；
- 多Source分配；
- Builder与Repairer任务选择；
- Link供能固定升级；
- 集中任务队列；
- 多房间调度。

JavaScript语法和离线状态函数已检查，真实动作与多tick切换仍待Screeps环境验证。

## 相关站内内容

- [Screeps Memory是什么](/blog/screeps-memory-basics)
- [如何从Container取Energy](/blog/screeps-creep-withdraw-container-energy)
- [如何自动升级Controller](/blog/screeps-upgrade-controller)
- [moveTo()为什么不移动](/blog/screeps-moveto-not-moving)
- [Creep身体部件怎么看](/blog/screeps-creep-body-parts)
- [进入Memory与代码工程专题](/knowledge/memory-engineering)

## 官方资料

- [Store API](https://docs.screeps.com/api/#Store)
- [Creep.harvest API](https://docs.screeps.com/api/#Creep.harvest)
- [Creep.upgradeController API](https://docs.screeps.com/api/#Creep.upgradeController)
- [Global Objects：Memory](https://docs.screeps.com/global-objects.html)

资料核对日期：2026-07-22。离线状态切换模拟已通过；真实Creep行为仍待环境验证。
