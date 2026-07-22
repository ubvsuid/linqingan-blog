---
title: "Creep 如何在取能和工作之间稳定切换状态"
description: "用Creep.store边界和memory.working建立两阶段状态，处理首次初始化、部分Energy、目标缺失、动作返回值和移动结果。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
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

稳定状态的关键不是每tick把布尔值取反，而是只在两个明确边界切换：

- Energy用完时回到取能；
- 可用容量装满时进入工作；
- Energy处于中间值时保持上一状态。

本文聚焦状态切换本身，并给出采集与升级的完整示例。

## 为什么每tick取反会抖动

错误写法：

```js
creep.memory.working = !creep.memory.working;
```

它会产生：

```text
tick 100：取能
tick 101：工作
tick 102：取能
tick 103：工作
```

Creep可能还没走到Source就改变任务，或者只采集一次就转向Controller。

状态应由Store边界驱动，而不是由tick数量驱动。

## `getUsedCapacity()` 和 `getFreeCapacity()`

当前Energy数量：

```js
const used = creep.store.getUsedCapacity(
  RESOURCE_ENERGY
);
```

剩余可装Energy容量：

```js
const free = creep.store.getFreeCapacity(
  RESOURCE_ENERGY
);
```

对于普通Creep，Store容量来自有效CARRY部件。没有有效CARRY部件时，容量可能为0，这种身体不适合本文的取能—工作循环。

## 用纯函数决定下一状态

```js
function getNextWorkingState(input) {
  const {
    usedEnergy,
    freeEnergyCapacity,
    previousWorking
  } = input;

  if (
    !Number.isFinite(usedEnergy)
    || !Number.isFinite(freeEnergyCapacity)
    || usedEnergy < 0
    || freeEnergyCapacity < 0
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

### 首次运行且只有部分Energy怎么办

当 `working` 还没有初始化，而Creep已有部分Energy时，纯函数会把：

```js
previousWorking === true
```

判断为假，因此默认继续取能。

这是本站选择的初始策略，不是官方规则。也可以根据角色决定部分Energy时立即工作，但必须明确写出初始化规则。

## 为什么先判断空，再判断满

正常Store不会同时满足：

```text
usedEnergy === 0
freeEnergyCapacity === 0
```

除非总容量为0。

对于没有CARRY容量的异常身体，本文先返回取能状态，但完整主循环还会单独检查：

```js
creep.store.getCapacity(RESOURCE_ENERGY)
```

避免让没有容量的Creep无限尝试采集。

## 完整示例：采集与升级

```js
function getNextWorkingState(input) {
  const {
    usedEnergy,
    freeEnergyCapacity,
    previousWorking
  } = input;

  if (
    !Number.isFinite(usedEnergy)
    || !Number.isFinite(freeEnergyCapacity)
    || usedEnergy < 0
    || freeEnergyCapacity < 0
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
  const capacity = creep.store.getCapacity(
    RESOURCE_ENERGY
  );

  if (!Number.isFinite(capacity) || capacity <= 0) {
    creep.memory.lastStateReason = 'no-energy-capacity';
    return false;
  }

  const decision = getNextWorkingState({
    usedEnergy: creep.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    freeEnergyCapacity: creep.store.getFreeCapacity(
      RESOURCE_ENERGY
    ),
    previousWorking: creep.memory.working
  });

  creep.memory.working = decision.working;
  creep.memory.lastStateReason = decision.reason;
  creep.memory.lastStateCheckedAt = Game.time;

  return decision.valid;
}

function runWorker(creep) {
  if (!updateWorkingState(creep)) {
    return {
      status: 'invalid-working-state'
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

把 `Worker1` 换成真实Creep名称。

## 为什么取能分支执行后立即 `return`

一只Creep在同一tick可能可以安排移动，也可能提交一个动作，但本文不让代码继续进入工作分支。

```js
if (!creep.memory.working) {
  // 取能逻辑
  return;
}
```

这样可以避免：

- 同一tick先采集再尝试升级；
- 两个分支都覆盖移动意图；
- 日志同时出现两种互相矛盾的状态。

## `harvest()` 的关键返回值

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 采集命令已提交 | 下一tick读取Store与Source |
| `ERR_NOT_OWNER` | Creep不是自己的 | 检查对象来源 |
| `ERR_BUSY` | Creep仍在生成 | 等待生成完成 |
| `ERR_NOT_FOUND` | Source当前没有Energy | 等恢复或更换目标 |
| `ERR_NOT_ENOUGH_RESOURCES` | Source没有可采资源 | 检查Source状态 |
| `ERR_INVALID_TARGET` | 目标不能采集 | 检查对象类型 |
| `ERR_FULL` | Creep没有剩余容量 | 状态应切到工作 |
| `ERR_NOT_IN_RANGE` | 不相邻 | 移动到范围1 |
| `ERR_NO_BODYPART` | 没有有效WORK部件 | 检查身体与受伤状态 |

不同服务器版本可能对无资源情况使用文档列出的对应错误常量，代码应以实际返回值和当前官方API为准。

## `upgradeController()` 的关键返回值

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 升级命令已提交 | 下一tick读取进度与Store |
| `ERR_NOT_OWNER` | Creep不是自己的 | 检查对象 |
| `ERR_BUSY` | Creep仍在生成 | 等生成结束 |
| `ERR_NOT_ENOUGH_RESOURCES` | Creep没有Energy | 状态应切回取能 |
| `ERR_INVALID_TARGET` | Controller不是有效目标 | 检查房间控制状态 |
| `ERR_NOT_IN_RANGE` | 超过3格 | 移动到范围3 |
| `ERR_NO_BODYPART` | 没有有效WORK部件 | 检查身体 |

返回 `OK` 只表示命令已接受，Store与Controller变化在后续tick观察。

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

若Creep正在工作并剩30 Energy，它应该继续消耗；若正在取能并有30 Energy，它应该继续装满。

这就是两边界状态比“有Energy就工作”更稳定的原因。

## 什么时候不适合使用两阶段状态

以下任务可能不需要 `working`：

- 固定站位升级者从Link持续取能；
- 专职运输者按任务订单搬运多种资源；
- 战斗Creep；
- 只执行一次的临时任务；
- 基于集中调度器的状态系统。

例如固定升级者可能在每tick先从相邻Link取能，再保持升级位置。强行套用“装满才工作”会降低效率。

## 常见错误

### 每tick取反

任务会在相邻tick反复切换。

### 只判断是否有Energy

```js
creep.memory.working =
  creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
```

Creep采集到少量Energy后就会立即离开Source。

### 不初始化状态

部分Energy的首次状态会依赖 `undefined` 的隐式真假。应明确规定默认策略。

### 没有CARRY容量仍运行取能逻辑

必须检查Store总容量，避免无意义动作循环。

### 忽略移动返回值

动作距离不足后调用 `moveTo()`，仍应保存移动结果以排查无路径、fatigue或身体问题。

### 同一tick执行两个业务分支

每个状态分支结束后返回，保持当前tick意图单一。

## 离线模拟结果

构建检查覆盖：

1. 首次空载进入取能；
2. 首次部分Energy默认继续取能；
3. 装满后进入工作；
4. 工作状态耗尽后回到取能；
5. 中间值保持上一状态；
6. 总容量为0；
7. 负数和非数字输入；
8. 状态原因字段。

离线测试不能模拟真实Store更新、动作结算、路径、Source恢复或Controller进度。

## 适用边界

本文只实现一只Creep的采集—升级两阶段状态，不覆盖：

- 多资源Store；
- Container或Storage取能；
- 多Source分配；
- Builder、Repairer任务选择；
- Link供能固定升级；
- 集中任务队列；
- 多房间角色调度。

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
