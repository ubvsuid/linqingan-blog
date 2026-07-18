---
title: "Screeps Creep.withdraw 怎么用：从 Container 取出 Energy"
description: "用最小 JavaScript 示例让 Creep 从 Container 取出 Energy，并按 ERR_NOT_IN_RANGE、ERR_FULL 等返回值排查失败原因。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Creep"
  - "withdraw"
  - "Container"
  - "Energy"
draft: false
featured: false
---

运输 Creep 已经走到 Container 附近，却没有拿到 Energy，先保存 `creep.withdraw()` 的返回值。目标距离、Container 库存和 Creep 剩余容量都会直接影响结果。

本文只解决一个问题：让 `Hauler1` 找到当前房间内有 Energy 的 Container，靠近后取出 Energy。Container 的建造位置、采集者投放和取能后的配送策略不在本文范围内。

## `withdraw()` 和 `transfer()` 的方向正好相反

两种写法的资源流向不同：

- `creep.withdraw(container, RESOURCE_ENERGY)`：Creep 从目标取资源；
- `creep.transfer(spawn, RESOURCE_ENERGY)`：Creep 把自己的资源交给目标。

如果卡住的是后一个动作，先看[怎样让 Creep 把 Energy 送回 Spawn](/blog/screeps-creep-deliver-energy)。本文不重复采集和配送的完整循环。

## 先找到有 Energy 的 Container

`Room.find()` 返回数组。过滤时同时检查建筑类型和 Energy 库存：

```javascript
const creep = Game.creeps['Hauler1'];

if (creep) {
  const containers = creep.room.find(FIND_STRUCTURES, {
    filter: function (structure) {
      return structure.structureType === STRUCTURE_CONTAINER &&
        structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
    }
  });
  const container = containers[0];

  if (container) {
    console.log('找到 Container：' + container.id);
  }
}
```

`containers[0]` 可能是 `undefined`。房间内没有 Container，或所有 Container 都是空的，都会得到这个结果，所以不能立即把它传给 `withdraw()`。

## 最小调用：先取资源，再处理距离

```javascript
const creep = Game.creeps['Hauler1'];

if (creep) {
  const containers = creep.room.find(FIND_STRUCTURES, {
    filter: function (structure) {
      return structure.structureType === STRUCTURE_CONTAINER &&
        structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
    }
  });
  const container = containers[0];

  if (container) {
    const withdrawResult = creep.withdraw(container, RESOURCE_ENERGY);

    if (withdrawResult === ERR_NOT_IN_RANGE) {
      const moveResult = creep.moveTo(container);

      if (moveResult !== OK) {
        console.log(creep.name + ' moveTo 返回值：' + moveResult);
      }
    }
  }
}
```

`withdraw()` 的目标要与 Creep 相邻。距离不足时会返回 `ERR_NOT_IN_RANGE`，这时才调用 `moveTo()`。分别保存两个方法的返回值，才能分清问题发生在取资源还是移动。

## 可放进 `main` 的完整示例

运行前提：当前房间存在 `Hauler1`；它有可用的 `CARRY` 和 `MOVE`；房间内至少有一个装着 Energy 的 Container。

```javascript
module.exports.loop = function () {
  const creep = Game.creeps['Hauler1'];

  if (!creep) {
    console.log('没有找到 Hauler1');
    return;
  }

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    return;
  }

  const containers = creep.room.find(FIND_STRUCTURES, {
    filter: function (structure) {
      return structure.structureType === STRUCTURE_CONTAINER &&
        structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
    }
  });
  const container = containers[0];

  if (!container) {
    console.log('当前房间没有可取用 Energy 的 Container');
    return;
  }

  const withdrawResult = creep.withdraw(container, RESOURCE_ENERGY);

  if (withdrawResult === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(container);

    if (moveResult !== OK) {
      console.log('Hauler1 moveTo 返回值：' + moveResult);
    }
    return;
  }

  if (withdrawResult !== OK) {
    console.log('Hauler1 withdraw 返回值：' + withdrawResult);
  }
};
```

代码只负责取能。Creep 装满后会停止调用 `withdraw()`，你可以再接上配送逻辑。若还不清楚 `CARRY` 和 `MOVE` 为什么是前提，可先阅读[三种基础身体部件的作用](/blog/screeps-creep-body-parts)。

## 按返回值排查 `withdraw()` 失败

### `ERR_NOT_IN_RANGE`

目标距离太远。调用 `moveTo(container)`，同时检查它自己的返回值；只处理 `withdraw()` 的返回值，可能会漏掉没有路径或身体缺少可用 `MOVE` 等移动问题。

### `ERR_NOT_ENOUGH_RESOURCES`

目标没有足够的指定资源。过滤器能排除检查时为空的 Container，但同一 tick 内其他 Creep 也可能先取走资源，因此调用结果仍需检查。

### `ERR_FULL`

Creep 没有剩余携带空间。示例在调用前使用 `creep.store.getFreeCapacity(RESOURCE_ENERGY)` 拦截了这种情况。完整物流代码应在满载后切换到配送动作。

### `ERR_INVALID_TARGET`

传入对象不能作为 `withdraw()` 的目标。依次检查：目标是否存在、是否为可储存资源的有效对象、是否误把另一只 Creep 当成目标。Creep 之间传资源应由原持有者调用 `transfer()`。

### 其他返回值

`withdraw()` 还可能返回 `ERR_NOT_OWNER`、`ERR_BUSY` 或 `ERR_INVALID_ARGS`。完整示例会统一记录所有非 `OK` 结果，便于再对照官方 API。站内的 [Screeps 错误码页](/screeps-errors)也可以用于按常量名称检查。

### `OK`

`OK` 表示 API 已接受并安排本次动作。官方调试文档同时提醒，看似成功的命令仍可能没有最终执行；调试时还应观察后续 tick 中 Creep 与 Container 的 Store 变化。

## 为什么这里不使用 `working` 状态

`working` 是玩家保存在 Memory 里的自定义字段，并不是 `withdraw()` 的参数。本文先把“找目标—查容量—取资源—处理返回值”讲清楚。组合取能和配送时，再参考 [Screeps Memory 的基础用法](/blog/screeps-memory-basics)保存跨 tick 状态。

## 这个示例没有解决什么

- 多个 Container 的最近路径或优先级；
- 多只运输 Creep 的目标预订；
- 从 Tombstone、Ruin 或 Storage 取资源；
- Container 的建造位置和采集者逻辑；
- Spawn、Extension、Tower 的配送优先级。

当前示例选择过滤结果中的第一个 Container。先确认单次 `withdraw()` 能返回预期结果，再把目标选择和配送拆成后续模块。

## 官方参考资料

- [Screeps API Reference：Creep.withdraw](https://docs.screeps.com/api/#Creep.withdraw)
- [Screeps API Reference：Room.find](https://docs.screeps.com/api/#Room.find)
- [Screeps API Reference：StructureContainer](https://docs.screeps.com/api/#StructureContainer)
- [Screeps Documentation：Debugging](https://docs.screeps.com/debugging.html)

资料核对日期：2026-07-18。代码仍需在 Screeps 环境验证。
