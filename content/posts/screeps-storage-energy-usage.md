
---
title: "Room.storage 怎么判断存在并读写 Energy"
description: "介绍如何安全读取 room.storage，并让运输者在 Storage 与缺少 Energy 的 Spawn 或 Extension 之间搬运资源，包含对象检查、容量判断和返回值处理。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Storage"
  - "Energy"
  - "物流"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---

房间建成 Storage 后，可以通过 `room.storage` 直接访问它。但这个属性不是始终存在：房间还没有 Storage，或者当前没有房间视野时，都不能假定它一定能取到对象。

下面用一只名为 `Hauler1` 的运输者完成一条基础链路：背包为空时从 Storage 取 Energy，携带 Energy 时把它送到缺能的 Spawn 或 Extension。

## room.storage 为什么可能是 undefined

`Room.storage` 返回房间内唯一的 Storage；没有 Storage 时返回 `undefined`。访问它的 `store` 之前先判空，能避免主循环因为读取不存在对象而中断。

如果代码从 `Game.rooms.W0N0` 开始查找，还要先确认 `Game.rooms.W0N0` 存在。`Game.rooms` 只包含当前可见房间。

## Storage 与 Container 的区别

Storage 是每个房间最多一个的高级储存建筑，可以从 `room.storage` 直接取得。Container 可以有多个，需要通过房间搜索、位置或保存的 ID 选择具体目标。

两者都使用 `Store` 保存资源，Creep 也都通过 `withdraw()` 取出资源；差别主要在于建筑规则和目标选择方式。本文只使用 Storage。

## 从 Storage 取出 Energy

取能前检查运输者还有空余容量，并确认 Storage 中确实有 Energy：

```javascript
const result = creep.withdraw(storage, RESOURCE_ENERGY);

if (result === ERR_NOT_IN_RANGE) {
  creep.moveTo(storage);
} else if (result !== OK) {
  console.log('withdraw result:', result);
}
```

`withdraw()` 需要 Creep 与 Storage 相邻。未到达时先移动；其他返回值保留下来，便于判断是资源为空、容量不足还是目标无效。

## 寻找缺能的 Spawn 或 Extension

运输者携带 Energy 后，只选择仍有剩余容量的己方 Spawn 或 Extension：

```javascript
const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
  filter: structure =>
    (structure.structureType === STRUCTURE_SPAWN
      || structure.structureType === STRUCTURE_EXTENSION)
    && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
});
```

`findClosestByPath()` 可能返回 `null`，例如所有目标都已装满。调用 `transfer()` 前必须检查结果。

## 向目标运输 Energy

下面的主循环把取能和送能两种状态组合起来：

```javascript
module.exports.loop = function () {
  const creep = Game.creeps.Hauler1;
  if (!creep) {
    return;
  }

  const storage = creep.room.storage;
  if (!storage) {
    return;
  }

  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    if (storage.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      return;
    }

    const withdrawResult = creep.withdraw(storage, RESOURCE_ENERGY);
    if (withdrawResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(storage);
    } else if (withdrawResult !== OK) {
      console.log('withdraw result:', withdrawResult);
    }
    return;
  }

  const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: structure =>
      (structure.structureType === STRUCTURE_SPAWN
        || structure.structureType === STRUCTURE_EXTENSION)
      && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });

  if (!target) {
    return;
  }

  const transferResult = creep.transfer(target, RESOURCE_ENERGY);
  if (transferResult === ERR_NOT_IN_RANGE) {
    creep.moveTo(target);
  } else if (transferResult !== OK) {
    console.log('transfer result:', transferResult);
  }
};
```

示例假设游戏中已有一只名为 `Hauler1` 的 Creep。名称区分大小写，需要按实际名称修改。

## 没有 Storage 或目标时怎么办

- 没有 `Hauler1`：本 tick 直接结束，不读取它的房间。
- 没有 Storage：运输逻辑暂停；不要继续读取 `storage.store`。
- Storage 没有 Energy：不调用 `withdraw()`，等待资源进入。
- Spawn 和 Extension 都已装满：不调用 `transfer()`，运输者保留现有 Energy。

实际房间通常会为“没有送能目标”增加后备任务，例如升级或向 Tower 补能。那属于运输任务分配，不在这段最小逻辑中展开。

## withdraw 和 transfer 的常见返回值

| 返回值 | 在本文场景中的含义 | 处理方式 |
| --- | --- | --- |
| `OK` | 动作已接受 | 下一 tick 重新读取状态 |
| `ERR_NOT_IN_RANGE` | Creep 没有与目标相邻 | 调用 `moveTo()` 接近目标 |
| `ERR_NOT_ENOUGH_RESOURCES` | Storage 已无可取 Energy | 重新检查 Storage 储量 |
| `ERR_FULL` | Creep 或目标没有剩余容量 | 重新选择动作或目标 |
| `ERR_INVALID_TARGET` | 传入对象不能执行当前动作 | 检查查找条件和对象类型 |

## 适用边界

本文只处理单房间内的基础 Energy 运输，不涉及多房间物流、Terminal 调度、运输任务队列或完整角色系统。

## 继续阅读

- [从 Container 取出 Energy](/blog/screeps-creep-withdraw-container-energy)
- [把 Energy 送进 Spawn 和 Extension](/blog/screeps-creep-deliver-energy)
- [用 working 状态切换 Creep 行为](/blog/screeps-creep-working-state)

## 官方资料

- [Room.storage API](https://docs.screeps.com/api/#Room.storage)
- [StructureStorage API](https://docs.screeps.com/api/#StructureStorage)
- [Creep.withdraw API](https://docs.screeps.com/api/#Creep.withdraw)
- [Creep.transfer API](https://docs.screeps.com/api/#Creep.transfer)

