---
title: "Screeps Tower 如何自动治疗己方 Creep：目标排序与返回值"
description: "让可用Tower从FIND_MY_CREEPS中选择受伤比例更高、距离更近的己方Creep，检查Energy、结构状态、距离衰减与heal()全部返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Tower"
  - "治疗"
  - "防御"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（受伤比例、缺失hits、距离排序与Tower可用性，不是 Screeps 官方服务器）"
  testResult: "无受伤目标、受伤比例优先、同一比例缺失hits优先、同分距离优先、Energy不足和结构不可用场景通过。"
featured: false
---

己方 Creep 受伤后，Tower 不会自动治疗。代码需要在每个 tick 重新读取当前对象、选择目标并调用 `tower.heal(target)`。

本文只解决一个问题：怎样让一座或多座可用 Tower 选择当前最需要治疗的己方普通 Creep，并正确处理距离衰减、Energy 和返回值。

## Tower治疗覆盖整个房间

Tower可以治疗同一房间里的有效 Creep 或 Power Creep。距离不会让 `heal()` 返回 `ERR_NOT_IN_RANGE`，但会影响实际治疗量。

官方数值是：

- 距离不超过5格时，基础治疗量为400 hits；
- 距离达到20格及以上时，基础治疗量为100 hits；
- 中间距离线性变化。

本文使用 `FIND_MY_CREEPS`，所以只处理己方普通 Creep，不自动包含 Power Creep。

## 为什么不只选择“最近的受伤者”

最近目标不一定最危险。例如：

- 距离2格的 Creep 只缺10 hits；
- 距离8格的 Creep 已经只剩20%生命。

只按距离可能把治疗浪费在轻伤目标上。

本文按三层排序：

1. `hits / hitsMax` 更低者优先；
2. 比例相同，缺失 hits 更多者优先；
3. 仍然相同，距离最近 Tower 更近者优先。

这是一种可解释的基础策略，不是所有战斗场景的唯一正确顺序。

## 可离线测试的目标选择

```js
function selectHealTarget(towers, creeps) {
  const injured = creeps.filter(creep =>
    creep.hits > 0
    && creep.hits < creep.hitsMax
  );

  if (towers.length === 0 || injured.length === 0) {
    return null;
  }

  return [...injured].sort((left, right) => {
    const leftRatio = left.hits / left.hitsMax;
    const rightRatio = right.hits / right.hitsMax;

    if (leftRatio !== rightRatio) {
      return leftRatio - rightRatio;
    }

    const leftMissing = left.hitsMax - left.hits;
    const rightMissing = right.hitsMax - right.hits;

    if (leftMissing !== rightMissing) {
      return rightMissing - leftMissing;
    }

    const leftRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(left))
    );
    const rightRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(right))
    );

    if (leftRange !== rightRange) {
      return leftRange - rightRange;
    }

    return left.name.localeCompare(right.name);
  })[0];
}
```

名称只用于完全同分时保持结果稳定。

## 完整示例

把房间名替换为自己的房间，并合并进现有主循环。

```js
function selectHealTarget(towers, creeps) {
  const injured = creeps.filter(creep =>
    creep.hits > 0
    && creep.hits < creep.hitsMax
  );

  if (towers.length === 0 || injured.length === 0) {
    return null;
  }

  return [...injured].sort((left, right) => {
    const leftRatio = left.hits / left.hitsMax;
    const rightRatio = right.hits / right.hitsMax;

    if (leftRatio !== rightRatio) {
      return leftRatio - rightRatio;
    }

    const leftMissing = left.hitsMax - left.hits;
    const rightMissing = right.hitsMax - right.hits;

    if (leftMissing !== rightMissing) {
      return rightMissing - leftMissing;
    }

    const leftRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(left))
    );
    const rightRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(right))
    );

    if (leftRange !== rightRange) {
      return leftRange - rightRange;
    }

    return left.name.localeCompare(right.name);
  })[0];
}

function runTowerHealing(room) {
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_TOWER
      && structure.isActive()
      && structure.store.getUsedCapacity(RESOURCE_ENERGY)
        >= TOWER_ENERGY_COST
  });

  if (towers.length === 0) {
    return;
  }

  const injured = room.find(FIND_MY_CREEPS, {
    filter: creep =>
      creep.hits > 0
      && creep.hits < creep.hitsMax
  });
  const target = selectHealTarget(towers, injured);

  if (!target) {
    return;
  }

  for (const tower of towers) {
    const result = tower.heal(target);

    if (result !== OK) {
      console.log({
        type: 'tower-heal-failed',
        roomName: room.name,
        towerId: tower.id,
        targetId: target.id,
        targetName: target.name,
        targetHits: target.hits,
        targetHitsMax: target.hitsMax,
        result
      });
    }
  }
}

module.exports.loop = function () {
  const room = Game.rooms.W1N1;

  if (!room) {
    return;
  }

  runTowerHealing(room);
};
```

## 为什么检查 `TOWER_ENERGY_COST`

Tower每次动作需要一次固定的Energy成本。本文使用官方常量：

```js
TOWER_ENERGY_COST
```

提前排除资源不足的Tower，可以减少无意义调用，但不能省略 `heal()` 返回值，因为同一 tick 的其他Tower逻辑仍可能竞争动作或改变策略。

## 多座Tower会不会过量治疗

示例让所有可用Tower治疗同一个目标。这样简单、可预测，但可能出现：

- 一座Tower已经足够补满；
- 多座Tower仍然全部提交治疗；
- 其他受伤Creep本 tick 没有获得治疗。

更完整的系统需要估算：

- 每座Tower到每个目标的实际治疗量；
- 目标缺失 hits；
- 其他Tower已经分配的治疗；
- 本 tick 的攻击优先级；
- 目标可能继续受到的伤害。

本文不声称多Tower集火治疗是最省Energy的策略，只把它作为安全的基础版本。

## 为什么不用角色名硬编码优先级

可以把治疗者、运输者或防御单位设置为高优先级，但角色名称来自项目自己的Memory结构，不是官方字段。

直接写：

```js
creep.memory.role === 'healer'
```

会把文章绑定到某一套命名。本文先使用通用生命比例。实际项目可以在排序第一层加入自己的任务权重，但应同时处理：

- `creep.memory`不存在；
- 角色名称迁移；
- 临时任务覆盖；
- 强化单位价值；
- Power Creep。

## `heal()` 返回值

| 返回值 | 官方含义 | 优先检查 |
|---|---|---|
| `OK` | 治疗已安排 | 下一 tick 查看目标hits |
| `ERR_NOT_OWNER` | Tower不是自己的 | `FIND_MY_STRUCTURES`与所有权 |
| `ERR_NOT_ENOUGH_ENERGY` | Tower Energy不足 | Store和其他Tower动作 |
| `ERR_INVALID_TARGET` | 目标不是有效Creep或已经失效 | 当前tick重新查找目标 |
| `ERR_RCL_NOT_ENOUGH` | Tower当前不可用 | Controller等级与 `isActive()` |

距离不在错误表中。看到治疗量偏低时，应检查距离；看到错误码时，按所有权、资源、目标和RCL排查。

## 为什么每tick重新查找目标

目标可能在上一tick：

- 被治疗到满生命；
- 死亡；
- 离开房间；
- 受到新的伤害；
- 改变位置；
- 失去或获得强化；
- 变成不同任务优先级。

不要把完整 Creep 对象长期写入Memory。需要保存时只保存名称或ID，并在当前tick重新取得对象。

## Tower攻击、治疗和维修如何排列

同一座Tower每tick只能提交一个主要动作。常见基础顺序是：

```text
敌对目标
→ 攻击

没有需要攻击的目标，但己方有人受伤
→ 治疗

没有战斗与治疗需求，且Energy充足
→ 维修
```

这是策略顺序，不是Tower API自动完成的行为。若项目把三篇文章合并成统一调度器，应确保同一Tower不会在同tick依次提交多个互相覆盖的动作。

## 离线模拟结果

构建检查覆盖：

1. 没有受伤Creep时返回 `null`；
2. 生命比例更低者优先；
3. 比例相同时缺失hits更多者优先；
4. 前两项相同时选择距离更近者；
5. 完全同分时使用名称稳定排序；
6. Tower Energy不足时不进入可用列表；
7. 结构不可用时不进入可用列表。

离线模拟没有调用真实 `tower.heal()`，也没有模拟距离衰减后的服务器治疗数值。

## 常见误区

### 认为远距离会返回 `ERR_NOT_IN_RANGE`

Tower治疗覆盖整个房间，距离影响数值，不影响API是否能调用。

### 只按最近距离选择

可能优先治疗轻伤单位，忽略濒危目标。

### 使用 `FIND_CREEPS`

会把其他玩家Creep加入候选。本文只使用 `FIND_MY_CREEPS`。

### 不检查Energy和结构状态

会持续得到资源或RCL错误。

### 多Tower同时治疗却声称最省资源

没有伤害与治疗量模型时，不能做这种结论。

### 返回 `OK` 后同tick读取新hits

应在下一tick重新取得目标。

## 适用边界

本文没有实现：

- Power Creep治疗；
- 角色价值权重；
- 精确距离治疗量计算；
- 多Tower分配；
- 预计下一tick伤害；
- 强化效果；
- 防御Creep调度；
- 跨房间治疗。

JavaScript语法和目标排序离线模拟已经通过。真实Tower治疗、Energy消耗和多tick结果仍待Screeps环境验证。

## 相关站内内容

- [Tower怎么自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)
- [Tower如何按阈值维修建筑](/blog/screeps-tower-repair-threshold)
- [Safe Mode怎么安全开启](/blog/screeps-controller-activate-safe-mode)
- [Creep角色应该怎样分工](/blog/screeps-creep-roles)
- [Game.notify()怎么发送提醒](/blog/screeps-game-notify)
- [进入建设与防御模块](/knowledge/construction-defense)

## 官方资料

- [StructureTower.heal API](https://docs.screeps.com/api/#StructureTower.heal)
- [StructureTower API](https://docs.screeps.com/api/#StructureTower)
- [Defending your room](https://docs.screeps.com/defense.html)

资料核对日期：2026-07-22。离线目标排序已通过；真实治疗结果仍待Screeps环境验证。
