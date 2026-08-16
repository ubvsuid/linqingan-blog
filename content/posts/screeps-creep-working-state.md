---
title: "Creep 如何在取能和工作之间稳定切换状态"
description: "用 Creep.store 边界和 memory.working 建立稳定两阶段状态：空载取能、满载工作、中间值保持，并正确区分 Store 状态与 harvest() 返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-08-16"
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
  checkedAt: "2026-08-16"
  testedAt: "2026-08-16"
  testEnvironment: "Node.js 22 离线模拟（Energy 使用量、剩余容量、旧状态、写入条件与 harvest 返回码边界，不是 Screeps 官方服务器）"
  testResult: "首次空载、首次部分 Energy、装满切换、耗尽切换、中间值保持、无容量、非法输入、仅状态变化时写入和 harvest 无 ERR_FULL 边界通过。"
featured: false
---

`creep.memory.working` 不是 Screeps 内置状态，而是玩家自己定义的一种两阶段任务标记：

```text
working = false
→ 获取 Energy

working = true
→ 消耗 Energy 执行工作
```

稳定切换只依赖两个 Store 边界：

```text
Energy 用完
→ 回到取能

Energy 装满
→ 进入工作

Energy 处于中间值
→ 保持上一状态
```

本文用“采集 Source → 升级 Controller”做例子，重点解释状态初始化、Store 边界、动作返回值和 Memory 写入边界。

## 一、为什么不能每 tick 直接取反

错误写法：

```javascript
creep.memory.working = !creep.memory.working;
```

它会让 Creep 在相邻 tick 反复改变任务：上一 tick 正准备去 Source，下一 tick 又可能转向 Controller。

状态应该由**资源边界**驱动，而不是由 tick 数量驱动。

## 二、先读取当前 Store 边界

```javascript
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

本文使用三项数据：

- `usedEnergy`：当前已经携带多少 Energy；
- `freeEnergyCapacity`：还能装多少 Energy；
- `totalEnergyCapacity`：这一只 Creep 对 Energy 的总容量。

如果没有有效的 `CARRY` 容量，总容量为 `0`，这种身体不适合本文的“取能 → 工作”循环。

## 三、用纯函数计算下一状态

```javascript
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

这个函数只做“状态决策”，不调用 `harvest()`、`moveTo()` 或 `upgradeController()`。

这样更容易单独测试：同一组 Store 输入应该始终得到同一状态结果。

### 首次运行只有部分 Energy 怎么办？

如果 `working` 尚未初始化，而 Creep 已经有部分 Energy：

```javascript
previousWorking === undefined
```

本文把它视为 `false`，所以默认继续取能直到装满。

这是本站示例选择的初始化策略，不是 Screeps 强制规则。某些角色也可以规定“首次发现有 Energy 就直接工作”，但应该把策略写清楚，而不是依赖 JavaScript 的隐式状态碰巧运行。

## 四、Store 满应该在状态层处理，不要等待 `harvest()` 返回 `ERR_FULL`

这篇旧版本最容易让人混淆的地方，是把“Store 已满”和 `harvest()` 返回码放到了一起。

当前 Source `Creep.harvest()` 的返回码边界里**没有 `ERR_FULL`**。

而本文的状态函数在真正进入采集分支以前已经处理：

```javascript
if (freeEnergyCapacity === 0) {
  return {
    valid: true,
    working: true,
    reason: 'energy-full'
  };
}
```

也就是说：

```text
Store 满
→ working 切到 true
→ 本 tick 进入工作分支
→ 根本不应该再靠 harvest() 告诉你“满了”
```

这比等待一个不存在的 `harvest() === ERR_FULL` 信号更稳定，也更符合状态机职责分工。

如果你只是在写第一次采集，可以先看[第一只 Creep 移动并采集](/blog/screeps-first-creep-harvest)；如果还不熟悉 Store 和身体部件，可以看[WORK、CARRY、MOVE](/blog/screeps-creep-body-parts)。

## 五、只在状态真的变化时写 `memory.working`

Memory 是持久状态。示例不需要每 tick 都把同一个布尔值重新写一遍。

可以把状态更新写成：

```javascript
function updateWorkingState(creep) {
  const previousWorking = creep.memory.working;

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
    previousWorking
  });

  if (!decision.valid) {
    return {
      ...decision,
      changed: false
    };
  }

  const changed =
    previousWorking !== decision.working;

  if (changed) {
    creep.memory.working = decision.working;
    creep.memory.workingChangedAt = Game.time;
    creep.memory.lastStateReason = decision.reason;
  }

  return {
    ...decision,
    changed
  };
}
```

这里有两个好处：

1. 状态保持不变时，不反复重写同一个 `working` 值；
2. `workingChangedAt` 和 `lastStateReason` 真正表示“最后一次状态变化”，而不是“最后一次检查”。

这不是说 Memory 写一次就有严重性能问题，而是让状态字段的语义更准确。

## 六、完整示例

```javascript
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
  const previousWorking = creep.memory.working;

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
    previousWorking
  });

  if (!decision.valid) {
    return {
      ...decision,
      changed: false
    };
  }

  const changed =
    previousWorking !== decision.working;

  if (changed) {
    creep.memory.working = decision.working;
    creep.memory.workingChangedAt = Game.time;
    creep.memory.lastStateReason = decision.reason;
  }

  return {
    ...decision,
    changed
  };
}

function runWorker(creep) {
  const state = updateWorkingState(creep);

  if (!state.valid) {
    return {
      status: 'invalid-working-state',
      reason: state.reason
    };
  }

  if (state.working !== true) {
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

## 七、为什么取能分支结束后不继续工作分支

一个 tick 内先进入取能分支，就让这个业务分支负责当前动作。

这样可以避免：

- 同一 tick 先采集又尝试升级；
- 两个分支同时安排移动；
- 日志出现“同时正在去 Source 和 Controller”的矛盾状态。

状态切换决定当前业务分支，不代表动作已经完成。真实 Store、Source 和 Controller 状态仍应在后续 tick 重新读取。

## 八、`harvest()` 的关键返回值

本文目标是 Energy Source，因此重点处理：

| 返回值 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `OK` | 采集命令已安排 | 下一 tick 重新读取 Store 与 Source |
| `ERR_NOT_OWNER` | Creep 不是自己的，或房间控制状态限制动作 | 检查对象和房间状态 |
| `ERR_BUSY` | Creep 仍在生成 | 等待生成完成 |
| `ERR_NOT_ENOUGH_RESOURCES` | Source 当前没有可采 Energy | 等恢复或选择其他活跃 Source |
| `ERR_INVALID_TARGET` | 目标不是可采对象 | 检查目标类型 |
| `ERR_NOT_IN_RANGE` | 不相邻 | 移动到范围 1 |
| `ERR_NO_BODYPART` | 没有有效 `WORK` | 检查身体与受伤状态 |

**这里没有 `ERR_FULL`。** Store 满属于本文状态层已经提前处理的边界，不是 Source `harvest()` 的容量返回码。

`ERR_NOT_FOUND` 在采集 Mineral 时可表示缺少 Extractor，不是 Energy Source 暂时为空的返回值。

## 九、`upgradeController()` 的关键返回值

| 返回值 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `OK` | 升级命令已安排 | 下一 tick 读取 Controller 与 Store |
| `ERR_NOT_OWNER` | Creep 或 Controller 所有权不符 | 检查对象 |
| `ERR_BUSY` | Creep 仍在生成 | 等生成结束 |
| `ERR_NOT_ENOUGH_RESOURCES` | Creep 没有 Energy | 状态应切回取能 |
| `ERR_INVALID_TARGET` | Controller 不是有效目标或升级受阻 | 检查控制状态 |
| `ERR_NOT_IN_RANGE` | 超过 3 格 | 移动到范围 3 |
| `ERR_NO_BODYPART` | 没有有效 `WORK` | 检查身体 |

`OK` 只表示命令已经被接受进入当前 tick 的处理边界，不等于你应该把后续状态变化写死在同一 tick。下一 tick 重新读取当前对象状态更稳妥。

## 十、中间 Energy 为什么保持上一状态

假设容量为 50：

```text
0 Energy
→ working = false

50 Energy
→ working = true

30 Energy
→ 保持之前状态
```

如果上一状态正在工作，30 Energy 时继续工作；如果上一状态正在取能，30 Energy 时继续装满。

这种“只在两个边界翻转”的方式也叫滞回式状态切换：中间值不会让角色不断来回改变任务。

## 十一、哪些角色不适合这种状态

并不是所有 Creep 都应该套 `memory.working`。

可能不需要这种两阶段状态的任务包括：

- 固定站位升级者从 Link 持续取能；
- 专职运输者按任务清单搬运多种资源；
- 战斗 Creep；
- 一次性临时任务；
- 由集中调度器统一分配动作的系统。

例如固定升级者如果强制“装满后才工作”，可能反而降低 Controller 升级效率。

## 十二、常见错误

### 每 tick 取反

会让任务持续抖动。

### 有一点 Energy 就立即工作

如果这是无意行为，Creep 会采到少量 Energy 就离开 Source，增加往返。

### 部分 Energy 时没有初始化规则

首次 `working === undefined` 时，要明确默认继续取能还是立即工作。

### 没有 CARRY 容量仍运行

检查总容量，避免让不适合的身体进入该状态机。

### 把 Store 满等同于 `harvest() === ERR_FULL`

Store 满应该在调用采集前就由 Store API 和状态函数处理。

### 每 tick 重写相同的状态字段

如果字段语义是“当前阶段”，只在阶段真的变化时写更容易调试；如果需要“每 tick 检查时间”，应另设专门字段，不要混用 `workingChangedAt`。

### 忽略移动结果

距离不足后调用 `moveTo()`，仍应记录无路径、fatigue 或身体问题。

### 同一 tick 进入两个业务分支

保持一个明确的当前动作分支，减少意图冲突和诊断噪声。

## 十三、离线模拟覆盖什么

构建中的专用模拟覆盖：

1. 首次空载；
2. 首次部分 Energy；
3. 装满进入工作；
4. 工作耗尽回到取能；
5. 中间值保持原状态；
6. 总容量为 0；
7. 负数与非数字输入；
8. 状态不变时不重复写 `working`；
9. 状态变化时写入新的布尔状态；
10. 文章不再把 `ERR_FULL` 列为 Source `harvest()` 返回码。

离线模拟不能证明真实 Store 结算、路径、Source 恢复、Controller 进度或多 tick 主循环行为。

## 状态转换图

![Creep 在取能状态与工作状态之间切换的流程图：空载转为取能，满载转为工作，部分装载保持当前状态](/diagrams/creep-working-state.svg)

图中只表达本文的两阶段状态边界，不代表完整任务调度系统。

## 适用边界

本文只实现单个 Creep 的“采集 → 升级”两阶段状态，不覆盖：

- 多资源 Store；
- Container 或 Storage 取能；
- 多 Source 分配；
- Builder 与 Repairer 任务选择；
- Link 供能固定升级；
- 集中任务队列；
- 多房间调度。

JavaScript 语法和离线状态函数会由仓库门禁检查；真实动作与多 tick 切换仍待 Screeps 环境验证。

## 相关站内内容

- [第一只 Creep 如何移动并采集](/blog/screeps-first-creep-harvest)
- [Creep 身体部件怎么看](/blog/screeps-creep-body-parts)
- [Screeps Memory 是什么](/blog/screeps-memory-basics)
- [如何从 Container 取 Energy](/blog/screeps-creep-withdraw-container-energy)
- [如何自动升级 Controller](/blog/screeps-upgrade-controller)
- [`moveTo()` 为什么不移动](/blog/screeps-moveto-not-moving)
- [进入 Memory 与代码工程专题](/knowledge/memory-engineering)

## 官方资料

- [Store API](https://docs.screeps.com/api/#Store)
- [Creep.harvest API](https://docs.screeps.com/api/#Creep.harvest)
- [Creep.upgradeController API](https://docs.screeps.com/api/#Creep.upgradeController)
- [Global Objects：Memory](https://docs.screeps.com/global-objects.html)

资料核对日期：2026-08-16。离线模拟只证明本文状态函数与静态边界；真实 Creep 行为仍待 Screeps 环境验证。