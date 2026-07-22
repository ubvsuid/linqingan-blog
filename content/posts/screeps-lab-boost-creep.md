---
title: "StructureLab.boostCreep() 怎么安全强化指定身体部件"
description: "解释化合物与身体部件的对应关系、每个部件30矿物和20 Energy、bodyPartsCount计数顺序、相邻距离与全部返回码，并提供一次性强化请求示例。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Lab"
  - "Boost"
  - "高级资源"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（化合物匹配、可强化部件数量与资源预算，不是 Screeps 官方服务器）"
  testResult: "化合物无对应部件、已强化部件排除、指定数量、资源不足、相邻判断和可执行场景通过。"
featured: false
---

`StructureLab.boostCreep(creep, bodyPartsCount)` 会使用 Lab 中的化合物和 Energy，为目标 Creep中匹配的身体部件添加强化效果。

本文只解决一个问题：怎样对一只指定 Creep执行一次可核对的强化请求，并在调用前确认化合物、可强化部件、资源数量、距离和结构状态。

## 一个部件需要多少资源

官方常量是：

```js
LAB_BOOST_MINERAL
LAB_BOOST_ENERGY
```

当前每强化一个身体部件，需要：

- `30`单位对应化合物；
- `20`单位 Energy。

代码中应使用常量计算，而不是把数字分散写在多个模块里：

```js
const mineralRequired = partCount * LAB_BOOST_MINERAL;
const energyRequired = partCount * LAB_BOOST_ENERGY;
```

## 化合物必须能作用于目标部件

全局常量 `BOOSTS` 按身体部件类型组织化合物效果。例如某种化合物可能只作用于 `WORK`，另一种只作用于 `MOVE`。

可以反向查出 Lab当前矿物对应的身体部件：

```js
function getBoostBodyPart(mineralType) {
  for (const [bodyPart, compounds] of Object.entries(BOOSTS)) {
    if (compounds && compounds[mineralType]) {
      return bodyPart;
    }
  }

  return null;
}
```

如果返回 `null`，这类资源不能用于强化任何身体部件，调用会失败。

## 哪些部件仍然可以强化

目标部件需要同时满足：

1. `part.type`等于化合物对应部件类型；
2. `part.boost`当前为空；
3. 本次指定数量尚未达到上限。

示例统计：

```js
function countEligibleParts(creep, bodyPart) {
  return creep.body.filter(part =>
    part.type === bodyPart
    && !part.boost
  ).length;
}
```

已经应用其他化合物的部件不能再被新的化合物覆盖。

## `bodyPartsCount` 的计数顺序

第二个参数是可选的。未提供时，API尝试强化所有符合条件的部件。

提供数量时，官方规定：

- `TOUGH`从身体数组左侧向右计数；
- 其他部件从右侧向左计数。

这会影响受伤时强化部件先失效还是后失效。文章示例只负责数量，不替你设计身体数组顺序。

## 为什么使用一次性请求

强化会真实消耗稀有化合物与 Energy。目标Creep可能因为移动、配置错误或资源不足而返回失败，因此不应该在主循环中无条件重复调用。

示例请求结构：

```js
Memory.boostRequest = {
  enabled: true,
  labId: '替换为Lab ID',
  creepName: 'BoostTarget',
  bodyPartsCount: 5
};
```

`bodyPartsCount`可以省略，表示尝试强化全部符合条件的部件。

## 完整示例

代码放在 `main` 模块。

```js
function getBoostBodyPart(mineralType) {
  for (const [bodyPart, compounds] of Object.entries(BOOSTS)) {
    if (compounds && compounds[mineralType]) {
      return bodyPart;
    }
  }

  return null;
}

function countEligibleParts(creep, bodyPart) {
  return creep.body.filter(part =>
    part.type === bodyPart
    && !part.boost
  ).length;
}

function evaluateBoostRequest(lab, creep, requestedCount) {
  if (!lab || !creep) {
    return {
      ready: false,
      reason: 'target-missing'
    };
  }

  const mineralType = lab.mineralType;
  const bodyPart = mineralType
    ? getBoostBodyPart(mineralType)
    : null;

  if (!mineralType || !bodyPart) {
    return {
      ready: false,
      reason: 'invalid-mineral'
    };
  }

  const eligibleParts = countEligibleParts(creep, bodyPart);
  if (eligibleParts === 0) {
    return {
      ready: false,
      reason: 'no-eligible-parts',
      mineralType,
      bodyPart
    };
  }

  const requested = Number.isInteger(requestedCount)
    && requestedCount > 0
    ? Math.min(requestedCount, eligibleParts)
    : eligibleParts;

  const mineralRequired = requested * LAB_BOOST_MINERAL;
  const energyRequired = requested * LAB_BOOST_ENERGY;
  const mineralAvailable = lab.store.getUsedCapacity(mineralType);
  const energyAvailable = lab.store.getUsedCapacity(RESOURCE_ENERGY);

  if (
    mineralAvailable < mineralRequired
    || energyAvailable < energyRequired
  ) {
    return {
      ready: false,
      reason: 'resources-insufficient',
      mineralType,
      bodyPart,
      requested,
      mineralRequired,
      energyRequired
    };
  }

  if (!lab.pos.isNearTo(creep.pos)) {
    return {
      ready: false,
      reason: 'not-adjacent',
      mineralType,
      bodyPart,
      requested,
      mineralRequired,
      energyRequired
    };
  }

  return {
    ready: true,
    reason: 'ready',
    mineralType,
    bodyPart,
    requested,
    mineralRequired,
    energyRequired
  };
}

module.exports.loop = function () {
  const request = Memory.boostRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const lab = typeof request.labId === 'string'
    ? Game.getObjectById(request.labId)
    : null;
  const creep = typeof request.creepName === 'string'
    ? Game.creeps[request.creepName]
    : null;

  if (
    !lab
    || lab.structureType !== STRUCTURE_LAB
    || lab.my !== true
    || !creep
  ) {
    return;
  }

  if (!lab.isActive()) {
    return;
  }

  const plan = evaluateBoostRequest(
    lab,
    creep,
    request.bodyPartsCount
  );

  if (!plan.ready) {
    if (plan.reason === 'not-adjacent') {
      const moveResult = creep.moveTo(lab, {
        reusePath: 5,
        range: 1
      });

      if (moveResult !== OK && Game.time % 20 === 0) {
        console.log({
          type: 'boost-approach-failed',
          creep: creep.name,
          lab: lab.id,
          result: moveResult
        });
      }
    } else if (Game.time % 100 === 0) {
      console.log({
        type: 'boost-not-ready',
        creep: creep.name,
        lab: lab.id,
        reason: plan.reason
      });
    }
    return;
  }

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.plan = {
    mineralType: plan.mineralType,
    bodyPart: plan.bodyPart,
    bodyPartsCount: plan.requested,
    mineralRequired: plan.mineralRequired,
    energyRequired: plan.energyRequired
  };

  const result = lab.boostCreep(
    creep,
    plan.requested
  );

  request.result = result;
  request.resultAt = Game.time;

  if (result === OK) {
    request.status = 'accepted';
  } else {
    request.status = 'failed-review-required';
  }

  console.log({
    type: 'boost-result',
    creep: creep.name,
    lab: lab.id,
    mineralType: plan.mineralType,
    bodyPart: plan.bodyPart,
    bodyPartsCount: plan.requested,
    result
  });
};
```

## 为什么接近 Lab 时不关闭请求

距离不足时，示例先让 Creep移动到相邻格。此时还没有调用 `boostCreep()`，因此请求保持开启。

只有基础条件满足、即将调用API时，才先关闭：

```js
request.enabled = false;
```

这样既允许 Creep完成接近动作，也避免API返回失败后下一 tick 自动再次消耗资源。

失败后必须人工检查化合物、目标身体、资源、距离和返回码，再明确重新开启请求。

## 为什么调用前关闭开关

这是一项真实资源操作。若脚本在调用后其他位置抛出异常，或玩家没有及时看到日志，保持开关开启可能导致下一 tick 再次强化剩余部件。

先关闭开关不会撤销当前调用，只是阻止自动重复。调用结果和计划会写回 Memory，方便人工决定下一步。

## 全部主要返回值

| 返回值 | 含义 | 优先检查 |
|---|---|---|
| `OK` | 命令已安排 | 下一 tick 查看 `creep.body[].boost`与 Lab资源 |
| `ERR_NOT_OWNER` | Lab不是自己的 | Lab ID和所有权 |
| `ERR_NOT_FOUND` | 当前矿物不能强化目标任何部件 | `BOOSTS`、部件类型、已强化状态 |
| `ERR_NOT_ENOUGH_RESOURCES` | Lab矿物或 Energy 不足 | 部件数量乘以两个官方常量 |
| `ERR_INVALID_TARGET` | 目标不是有效Creep | Creep名称与对象是否仍存在 |
| `ERR_NOT_IN_RANGE` | Creep不在相邻格 | `lab.pos.isNearTo(creep.pos)` |
| `ERR_RCL_NOT_ENOUGH` | Lab当前不可用 | RCL与 `lab.isActive()` |

`OK`表示强化命令已安排，不应在同一 tick 直接把目标当成已经完成全部强化流程。

## 怎样核对下一 tick 的结果

可以统计目标身上的强化部件：

```js
function countBoostedParts(creep, mineralType) {
  return creep.body.filter(
    part => part.boost === mineralType
  ).length;
}
```

将数量与请求记录对照，但要考虑：

- Creep可能已经死亡；
- 其他系统可能也执行了强化；
- 请求数量可能小于全部符合条件的部件；
- 不应把一次成功当作完整强化队列长期稳定。

## `bodyPartsCount` 不能超过可强化数量

示例使用：

```js
Math.min(requestedCount, eligibleParts)
```

超过可强化数量时自动缩小到现有数量。这是本站示例的保护策略，不是API自动替你做出的业务选择。

若调用者必须严格获得固定数量，可以改为：

```js
if (eligibleParts < requestedCount) {
  return { ready: false, reason: 'eligible-parts-shortage' };
}
```

两种策略应根据任务需求明确选择。

## 离线模拟结果

构建检查把计划判断拆成普通对象和数组，覆盖：

1. Lab矿物在 `BOOSTS`中找不到对应部件；
2. Creep没有对应身体部件；
3. 对应部件已经被其他化合物强化；
4. 请求数量大于可强化数量时缩小；
5. 矿物数量不足；
6. Energy不足；
7. Creep不相邻；
8. 条件满足时返回可执行计划。

离线模拟没有调用真实 `boostCreep()`，不能证明目标部件在官方服务器上已经获得效果。

## 常见误区

### 只看 Lab 有矿物，不看化合物对应部件

有矿物不代表目标身体中存在可强化部件。

### 只检查一次30矿物和20 Energy

强化多个部件时要乘以部件数量。

### 不排除已经强化的部件

一个身体部件不能再应用第二种化合物。

### Creep距离不足时仍关闭请求

尚未调用API时关闭会让接近动作完成后不再继续。

### API失败后自动重试

可能在配置没有修正时持续尝试，或在状态变化后意外消耗资源。

### 忽略身体数组顺序

指定数量时，`TOUGH`与其他部件的计数方向不同。

### 把 Console中的 `OK`写成完整强化实测

仍应在下一 tick 检查身体部件和资源变化。

## 适用边界

本文没有实现：

- 多 Lab强化队列；
- 多种化合物的排序；
- Creep身体设计；
- 强化房间交通控制；
- 资源补充物流；
- 强化失败后的自动回滚；
- `unboostCreep()`；
- 跨房间强化；
- 战斗任务调度。

JavaScript语法和强化计划离线模拟已经通过。真实API返回值、身体部件变化和连续任务仍待Screeps环境验证。

## 相关站内内容

- [StructureLab.runReaction() 怎么执行矿物反应](/blog/screeps-lab-run-reaction)
- [Creep身体部件分别有什么作用](/blog/screeps-creep-body-parts)
- [Creep角色应该怎样分工](/blog/screeps-creep-roles)
- [Creep身体计算器](/tools/creep-body-calculator)
- [Game.getObjectById() 为什么返回 null](/blog/screeps-game-get-object-by-id)
- [进入市场与高级资源模块](/knowledge/market-advanced-resources)

## 官方资料

- [StructureLab.boostCreep API](https://docs.screeps.com/api/#StructureLab.boostCreep)
- [Resources：Creep boosts](https://docs.screeps.com/resources.html#Creep-boosts)
- [全局常量：Lab与Boost](https://docs.screeps.com/api/#Constants)

资料核对日期：2026-07-22。离线强化计划模拟已通过；真实强化结果仍待环境验证。
