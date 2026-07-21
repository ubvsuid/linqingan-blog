---
title: "把前面学过的代码放到一起：第一份房间基础代码"
description: "用固定名称整理 Harvester1、Upgrader1 和 Builder1，把安全检查、创建、运输、升级、建造、维修和返回值处理放进一份新手可读代码。"
publishedAt: "2026-07-16"
updatedAt: "2026-07-21"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "建造"
  - "JavaScript"
  - "自动化"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-21"
featured: false
---

> **Screeps 新手入门 · 第 12 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这是新手系列的收尾**
> 这份代码把前面的内容放到一起，但仍然是学习代码，不是成熟的长期房间框架。

本篇会沿用前面已经学过的固定名称和简单状态，不突然加入动态角色表、复杂模块或多房间调度。

## 一、这份代码管理哪三只 Creep

| 名称 | 主要工作 |
| --- | --- |
| `Harvester1` | 采集 Energy，并填充 Spawn 和 Extension |
| `Upgrader1` | 采集 Energy，然后升级 Controller |
| `Builder1` | 建造、维修，空闲时升级 Controller |

Spawn 空闲时，会按这个顺序尝试创建缺失的 Creep。
这套分工来自[第 8 篇：为什么需要角色分工](/blog/screeps-creep-roles)。

## 二、运行前需要准备什么

- 把 `Spawn1` 换成自己的 Spawn 名称；
- 确保房间可以提供至少 200 Energy；
- 替换代码前先保存自己的旧版本；
- 同名 Creep 已经存在时，代码会直接使用它；
- 代码只适用于当前新手路线中的单房间、固定名称练习。

> **标题中的“基础代码”很重要**
> 它只是把新手阶段学过的动作整理到一起，不保证在所有异常情况下自动恢复。

## 三、这次增加哪些安全检查

与最初版本相比，完整代码会：

1. 检查 Spawn 是否存在；
2. 每个角色分别检查 Source；
3. Upgrader 和 Builder 在需要时检查 Controller；
4. Harvester 没有接收目标时明确等待；
5. 保存 `spawnCreep()` 和每个动作的返回结果；
6. 对 `ERR_NOT_IN_RANGE` 调用 `moveTo()`；
7. 把其他未预期结果输出到 Console。

这些检查不会让代码变成成熟框架，但可以避免固定名称写错或目标不存在时直接访问 `undefined`。

## 四、完整代码

```javascript
function runHarvester(creep) {
  const source = creep.room.find(FIND_SOURCES)[0];

  if (!source) {
    console.log(`[${creep.name}] 没有找到可见的 Source`);
    return;
  }

  if (creep.memory.delivering &&
      creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.delivering = false;
  }

  if (!creep.memory.delivering &&
      creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.delivering = true;
  }

  if (!creep.memory.delivering) {
    const harvestResult = creep.harvest(source);

    if (harvestResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    } else if (harvestResult !== OK &&
               harvestResult !== ERR_NOT_ENOUGH_RESOURCES) {
      console.log(`[${creep.name}] 采集返回：${harvestResult}`);
    }
    return;
  }

  const targets = creep.room.find(FIND_MY_STRUCTURES, {
    filter: function (structure) {
      const acceptsEnergy =
        structure.structureType === STRUCTURE_SPAWN ||
        structure.structureType === STRUCTURE_EXTENSION;

      return acceptsEnergy &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }
  });

  const target = targets[0];

  if (!target) {
    creep.say('等待接收点');
    return;
  }

  const transferResult = creep.transfer(target, RESOURCE_ENERGY);

  if (transferResult === ERR_NOT_IN_RANGE) {
    creep.moveTo(target);
  } else if (transferResult !== OK &&
             transferResult !== ERR_FULL) {
    console.log(`[${creep.name}] 交付返回：${transferResult}`);
  }
}

function runUpgrader(creep) {
  const source = creep.room.find(FIND_SOURCES)[0];
  const controller = creep.room.controller;

  if (!source) {
    console.log(`[${creep.name}] 没有找到可见的 Source`);
    return;
  }

  if (!controller) {
    console.log(`[${creep.name}] 没有找到 Controller`);
    return;
  }

  if (creep.memory.upgrading &&
      creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.upgrading = false;
  }

  if (!creep.memory.upgrading &&
      creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.upgrading = true;
  }

  if (creep.memory.upgrading) {
    const upgradeResult = creep.upgradeController(controller);

    if (upgradeResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
    } else if (upgradeResult !== OK) {
      console.log(`[${creep.name}] 升级返回：${upgradeResult}`);
    }
  } else {
    const harvestResult = creep.harvest(source);

    if (harvestResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    } else if (harvestResult !== OK &&
               harvestResult !== ERR_NOT_ENOUGH_RESOURCES) {
      console.log(`[${creep.name}] 采集返回：${harvestResult}`);
    }
  }
}

function runBuilder(creep) {
  const source = creep.room.find(FIND_SOURCES)[0];

  if (!source) {
    console.log(`[${creep.name}] 没有找到可见的 Source`);
    return;
  }

  if (creep.memory.working &&
      creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.working = false;
  }

  if (!creep.memory.working &&
      creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.working = true;
  }

  if (!creep.memory.working) {
    const harvestResult = creep.harvest(source);

    if (harvestResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    } else if (harvestResult !== OK &&
               harvestResult !== ERR_NOT_ENOUGH_RESOURCES) {
      console.log(`[${creep.name}] 采集返回：${harvestResult}`);
    }
    return;
  }

  const site = creep.room.find(FIND_MY_CONSTRUCTION_SITES)[0];

  if (site) {
    const buildResult = creep.build(site);

    if (buildResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(site);
    } else if (buildResult !== OK) {
      console.log(`[${creep.name}] 建造返回：${buildResult}`);
    }
    return;
  }

  const damaged = creep.room.find(FIND_STRUCTURES, {
    filter: function (structure) {
      const repairable =
        structure.my === true ||
        structure.structureType === STRUCTURE_ROAD ||
        structure.structureType === STRUCTURE_CONTAINER;

      const excluded =
        structure.structureType === STRUCTURE_WALL ||
        structure.structureType === STRUCTURE_RAMPART;

      return repairable &&
        !excluded &&
        structure.hits < structure.hitsMax;
    }
  })[0];

  if (damaged) {
    const repairResult = creep.repair(damaged);

    if (repairResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(damaged);
    } else if (repairResult !== OK) {
      console.log(`[${creep.name}] 维修返回：${repairResult}`);
    }
    return;
  }

  const controller = creep.room.controller;

  if (!controller) {
    console.log(`[${creep.name}] 没有找到 Controller`);
    return;
  }

  const upgradeResult = creep.upgradeController(controller);

  if (upgradeResult === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller);
  } else if (upgradeResult !== OK) {
    console.log(`[${creep.name}] 升级返回：${upgradeResult}`);
  }
}

function trySpawnCreep(spawn, name) {
  const result = spawn.spawnCreep(
    [WORK, CARRY, MOVE],
    name
  );

  if (result === OK) {
    console.log(`${name} 已经开始创建`);
  } else if (result !== ERR_NOT_ENOUGH_ENERGY &&
             result !== ERR_BUSY &&
             result !== ERR_NAME_EXISTS) {
    console.log(`创建 ${name} 返回：${result}`);
  }

  return result;
}

module.exports.loop = function () {
  const spawn = Game.spawns['Spawn1'];

  if (!spawn) {
    console.log('找不到 Spawn1，请检查名称和大小写');
  } else if (!spawn.spawning) {
    if (!Game.creeps['Harvester1']) {
      trySpawnCreep(spawn, 'Harvester1');
    } else if (!Game.creeps['Upgrader1']) {
      trySpawnCreep(spawn, 'Upgrader1');
    } else if (!Game.creeps['Builder1']) {
      trySpawnCreep(spawn, 'Builder1');
    }
  }

  const harvester = Game.creeps['Harvester1'];
  const upgrader = Game.creeps['Upgrader1'];
  const builder = Game.creeps['Builder1'];

  if (harvester) {
    runHarvester(harvester);
  }

  if (upgrader) {
    runUpgrader(upgrader);
  }

  if (builder) {
    runBuilder(builder);
  }
};
```

> **保存前修改 Spawn 名称**
> 代码使用 `Game.spawns['Spawn1']`。名称和大小写必须与游戏中一致。

> **这份代码尚未在你的真实房间验证**
> 当前只完成官方接口核对和 JavaScript 语法检查。实际 Source 位置、建筑状态、可用 Energy 与房间对象需要在你的 Screeps 环境中继续观察。

## 五、代码分成哪些部分

### `runHarvester()`

负责 Harvester1 的采集和交付。
目标只包括仍有空余 Energy 容量的 Spawn 与 Extension。
没有接收目标时不会继续调用 `transfer()`，而是显示“等待接收点”。

### `runUpgrader()`

负责 Upgrader1 在采集和升级之间切换，并在动作前检查 Source 和 Controller。

### `runBuilder()`

负责 Builder1 的采集、建造、维修和空闲升级。
它使用[第 11 篇](/blog/screeps-build-and-repair)中的建造 → 维修 → 升级优先级。

### `trySpawnCreep()`

统一调用 `spawnCreep()` 并检查返回结果。
`ERR_NOT_ENOUGH_ENERGY`、`ERR_BUSY` 和 `ERR_NAME_EXISTS` 是当前简单创建流程中可以理解的等待或名称情况，其他结果会输出到 Console。

### `module.exports.loop`

每个 tick 先检查 Spawn 和缺失的 Creep，再分别运行已经存在的三只 Creep。
Spawn 名称错误不会阻止现有 Creep 继续执行各自工作函数。

> **为什么还要使用 function？**
> 这里只使用四个名称明确的函数，把创建和三种工作分开。没有使用动态角色字段、动态 Memory 键或复杂模块结构。

## 六、运行后观察什么

1. Spawn 名称正确时，Console 是否没有持续出现“找不到 Spawn1”；
2. 缺少 Creep 时，Spawn 是否按顺序尝试创建；
3. Harvester1 是否填充 Spawn 和 Extension；
4. Upgrader1 是否持续增加 Controller 进度；
5. Builder1 是否先建造，再维修，最后升级；
6. 三只 Creep Energy 用完后是否分别返回 Source；
7. 某个角色停止时，Console 是否出现对应返回结果或目标提示。

不要只观察“Creep 有没有动”。还要结合：

- Creep 的 Store；
- `creep.memory` 中的状态；
- Controller 与工地进度；
- Spawn 和 Extension 的 Energy；
- Console 返回结果。

## 七、这份代码有哪些限制

- 三只 Creep 都选择搜索结果中的第一个 Source；
- 每种角色只有一个固定名称；
- 没有在 Creep 死亡前提前生产替代者；
- 如果所有 Creep 都死亡，并且房间可用于生成的 Energy 少于 200，代码无法自行恢复；
- Harvester 只填充 Spawn 和 Extension；
- 没有最近目标、任务缓存、CPU 优化或多房间管理；
- `moveTo()` 的返回结果尚未单独分类处理；
- Console 和真实主循环行为仍待你的游戏环境验证。

**为什么全灭且 Energy 不足时不能恢复？**

创建 `[WORK, CARRY, MOVE]` 需要 200 Energy。
如果没有活着的 Creep 补充 Energy，Spawn 就无法创建新的基础工作 Creep。
完成新手路线后，可以继续查看[Spawn 紧急恢复](/blog/screeps-spawn-emergency-recovery)。

**为什么 Harvester1 在 Spawn 和 Extension 都满后停下？**

当前只负责填充这两类建筑。
没有可接收 Energy 的目标时，它会保留 Energy 并等待。

**为什么三个角色都使用同一个 Source？**

本篇为了保持代码连续，继续选择 `[0]`。
多 Source 分配和按路径选择目标属于下一阶段，可继续阅读[按路径选择 Source](/blog/screeps-select-source-by-path)。

## 八、完成新手路线后先学什么

这份代码最明显的问题是固定名称和固定数量。
下一阶段不应立刻加入所有高级系统，而应先按顺序处理：

1. [Memory 基础](/blog/screeps-memory-basics)：把角色和状态保存在 Memory 中；
2. [根据房间 Energy 生成身体](/blog/screeps-dynamic-creep-body-energy)：减少固定 200 Energy 的限制；
3. [清理死亡 Creep Memory](/blog/screeps-clean-dead-creep-memory)：理解 Creep 生命周期后的数据整理；
4. [模块与 require()](/blog/screeps-modules-require)：把角色函数拆到不同文件。

这些内容已经超出12篇新手路线，但它们能自然接在当前代码之后。

## 新手系列总结

> 认识 tick 和界面 → 控制 Creep → 采集运输 → 创建 Creep → 分工 → 升级、建造和维修 → 合并安全检查

完成这一篇后，你已经拥有一份可以继续修改的学习代码。
它的价值不是“复制后永远不用改”，而是让你看清每个对象、状态、动作和返回结果在主循环中的位置。

## 官方参考资料

1. [Screeps API Reference](https://docs.screeps.com/api/)
2. [Screeps Documentation：Room Controller Level](https://docs.screeps.com/control.html)
3. [Screeps Documentation：Creeps](https://docs.screeps.com/creeps.html)

> 本文是新手路线的收尾代码。真实 Console 与主循环仍待环境验证，不能仅凭语法检查宣称已经在所有房间稳定运行。