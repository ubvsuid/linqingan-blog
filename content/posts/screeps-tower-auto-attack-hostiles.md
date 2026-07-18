
---
title: "Screeps Tower 怎么自动攻击敌人：FIND_HOSTILE_CREEPS 与 attack()"
description: "用最小 JavaScript 示例让 Screeps Tower 查找并攻击房间内的非己方 Creep，检查 Energy、建筑可用性和 attack() 返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Tower"
  - "防御"
  - "FIND_HOSTILE_CREEPS"
  - "JavaScript"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---

Tower 建好以后不会自动开火。代码需要在每个 tick 查找目标，再主动调用 `tower.attack()`。

先说明“敌人”的边界：下面的最小示例使用 `FIND_HOSTILE_CREEPS`，它按官方定义返回所有非己方 Creep，并不理解你的盟友或通行名单。如果房间有外交规则，发布代码前必须加入自己的过滤条件。

本文只完成一条最小链路：找到非己方 Creep，找到自己的 Tower，检查建筑是否可用，然后调用攻击并保存返回值。Tower 维修、治疗、补能和复杂目标评分留给独立策略。

## 开始前：房间需要一座可用的 Tower

官方 RCL 表显示，RCL 3 可以建造第一座 Tower。房间还没有达到这个等级时，可先看[怎样让 Creep 持续升级 Controller](/blog/screeps-upgrade-controller)。

下面假设 Tower 已经建成。示例通过 `Spawn1` 取得它所在的 Room，这只是定位一个可见房间的简便方式，并不是 Tower API 必须依赖 Spawn。

## 用 `FIND_HOSTILE_CREEPS` 找到目标

```javascript
const spawn = Game.spawns['Spawn1'];

if (spawn) {
  const room = spawn.room;
  const hostiles = room.find(FIND_HOSTILE_CREEPS);
  const target = hostiles[0];

  if (target) {
    console.log('发现非己方 Creep：' + target.name);
  }
}
```

`Room.find()` 返回数组。没有目标时，`hostiles[0]` 是 `undefined`，必须先检查再调用攻击。

这段代码会选数组首项，不会判断威胁程度。若要允许特定玩家通过，应按 `owner.username` 和自己维护的名单过滤；示例不预设任何真实玩家关系。

## 只查找自己的 Tower

```javascript
const spawn = Game.spawns['Spawn1'];

if (spawn) {
  const room = spawn.room;
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: function (structure) {
      return structure.structureType === STRUCTURE_TOWER;
    }
  });

  if (towers.length > 0) {
    console.log('找到 Tower：' + towers[0].id);
  }
}
```

`FIND_MY_STRUCTURES` 先限制为自己的建筑，过滤器再保留 Tower。Tower 尚未完成或当前房间没有 Tower 时，数组会为空。

## 调用 `attack()` 并检查返回值

```javascript
const spawn = Game.spawns['Spawn1'];

if (spawn) {
  const room = spawn.room;
  const hostiles = room.find(FIND_HOSTILE_CREEPS);
  const target = hostiles[0];
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: function (structure) {
      return structure.structureType === STRUCTURE_TOWER;
    }
  });

  if (target) {
    for (const tower of towers) {
      const attackResult = tower.attack(target);

      if (attackResult !== OK) {
        console.log(tower.id + ' attack 返回值：' + attackResult);
      }
    }
  }
}
```

Tower 可以攻击同一房间内的目标，不需要 `moveTo()`。官方资料说明它每次动作消耗 10 Energy，攻击效果随距离增加而减弱。这里不填写任何房间伤害、击杀速度或实测结果。

## 可放进 `main` 的完整示例

如果 Spawn 名称不是 `Spawn1`，请替换字符串。代码应合并进已有的 `module.exports.loop`，不要在同一个 `main` 模块重复导出第二个主循环。

```javascript
module.exports.loop = function () {
  const spawn = Game.spawns['Spawn1'];

  if (!spawn) {
    console.log('没有找到 Spawn1');
    return;
  }

  const room = spawn.room;
  const hostiles = room.find(FIND_HOSTILE_CREEPS);
  const target = hostiles[0];

  if (!target) {
    return;
  }

  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: function (structure) {
      return structure.structureType === STRUCTURE_TOWER;
    }
  });

  if (towers.length === 0) {
    console.log('当前房间没有自己的 Tower');
    return;
  }

  for (const tower of towers) {
    if (!tower.isActive()) {
      console.log(tower.id + ' 当前不可用');
      continue;
    }

    const attackResult = tower.attack(target);

    if (attackResult !== OK) {
      console.log(tower.id + ' attack 返回值：' + attackResult);
    }
  }
};
```

示例让房间内所有自己的 Tower 攻击第一个非己方 Creep。它直接调用 `attack()` 并保存结果，因此 Energy 不足会明确返回错误；更完整的物流系统也可以在调用前检查 Tower 的 Store。

## Tower 不攻击时按这个顺序检查

### 目标是否存在

`room.find(FIND_HOSTILE_CREEPS)` 返回空数组时，没有可供这条逻辑攻击的 Creep。不要把 `undefined` 传给 `attack()`。

### Tower 是否属于自己

使用 `FIND_MY_STRUCTURES` 查找。若改成 `FIND_STRUCTURES` 并选到其他玩家的建筑，调用会返回 `ERR_NOT_OWNER`。

### Tower 是否可用

`tower.isActive()` 能检查建筑当前是否可以使用。Controller 等级不足时，`attack()` 也可能返回 `ERR_RCL_NOT_ENOUGH`。

### Tower 是否有足够 Energy

Tower 每次动作消耗 10 Energy。Energy 不足时，`attack()` 返回 `ERR_NOT_ENOUGH_ENERGY`。本文用返回值暴露问题，补能优先级属于后续物流设计。

### 目标是否仍然有效

目标消失或不再是可攻击对象时，可能返回 `ERR_INVALID_TARGET`。游戏对象来自当前 tick；下一 tick 重新查找，不要把完整目标对象长期写进 Memory。

其他常量可以在站内的 [Screeps 错误码页](/screeps-errors)按名称查询。

## 为什么不顺便写 Tower 维修

Tower 还可以治疗 Creep 或维修建筑，但三类动作都会消耗它的 Energy。一开始就混合三种动作，会同时引入优先级和 Energy 预算问题。

这篇只保留攻击。Creep 的 `repair()` 和基础任务顺序已经在[自动建造和维修](/blog/screeps-build-and-repair)中解释；Tower 维修应另设阈值和优先级，不与本文混写。

## 接入现有主循环

如果正在使用[第一份房间基础代码](/blog/screeps-first-room-code)，把目标查找和 Tower 攻击加入现有 `module.exports.loop` 即可。更大的代码库可以拆成防御函数或模块，但不改变“每 tick 重新找当前对象并检查返回值”的基础顺序。

## 这个最小示例没有处理什么

- 盟友或通行白名单；
- 多目标威胁评分；
- Tower 集火与分火；
- Tower 治疗和维修；
- Tower 补能；
- Safe Mode、Rampart 和防御 Creep；
- 多房间遍历与通知节流。

先在自己的规则下确认 `FIND_HOSTILE_CREEPS` 选中的对象正确，再验证 Tower 的 Store、`isActive()` 和 `attack()` 返回值。

## 官方参考资料

- [Screeps API Reference：StructureTower](https://docs.screeps.com/api/#StructureTower)
- [Screeps API Reference：Room.find](https://docs.screeps.com/api/#Room.find)
- [Screeps Documentation：Defending your room](https://docs.screeps.com/defense.html)
- [Screeps Documentation：Control](https://docs.screeps.com/control.html)
- [Screeps Documentation：Debugging](https://docs.screeps.com/debugging.html)

资料核对日期：2026-07-18。代码仍需在 Screeps 环境验证。

