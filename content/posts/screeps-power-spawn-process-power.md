---
title: "StructurePowerSpawn.processPower() 怎么处理 Power"
description: "检查己方 Power Spawn、Power、Energy、RCL 与 processPower() 返回值后执行一次资源处理。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Power Spawn"
  - "Power"
  - "高级资源"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


本文检查 Power Spawn、Power、Energy、RCL 与返回值后执行一次 `processPower`。

## 先给结论

`processPower()` 需要己方 Power Spawn 同时存有 Power 和 Energy，并满足房间等级要求。示例只检查这些前提和返回值。

如果返回 `ERR_RCL_NOT_ENOUGH`，应检查房间 Controller 等级以及 Power Spawn 当前是否可用；这不是 Power 或 Energy 库存不足。

## 官方规则

- StructurePowerSpawn.processPower 消耗 Power 与 Energy 并增加 GPL 进度。
- Power Spawn 只在满足房间等级和资源条件时工作。
- processPower 返回 OK 或对应错误常量。

## 最小完整示例

### `main` 模块

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const powerSpawn = room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_POWER_SPAWN
  })[0];
  if (!powerSpawn) {
    return;
  }

  const power = powerSpawn.store.getUsedCapacity(RESOURCE_POWER);
  const energy = powerSpawn.store.getUsedCapacity(RESOURCE_ENERGY);
  if (power < 1 || energy < POWER_SPAWN_ENERGY_RATIO) {
    return;
  }

  const result = powerSpawn.processPower();
  if (result !== OK) {
    console.log('processPower result:', result);
  }
};
```

## 检查顺序

1. 只查找己方 Power Spawn。
2. 使用 RESOURCE_POWER 与 POWER_SPAWN_ENERGY_RATIO。
3. 保存 processPower 返回值。
4. 关键对象可能为 `undefined` 或 `null` 时提前返回。
5. 不把一次 Console 输出写成长期性能、通知送达或游戏行为结论。

## 适用范围

示例没有实现完整调度、长期统计或多 shard 架构。JavaScript 语法检查通过，待 Screeps 环境验证。

## 相关站内内容

- [知识库查询与工具](https://www.linqingan.com/knowledge#reference-tools)
- [认识第一个房间](/blog/screeps-first-room)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Power](https://docs.screeps.com/power.html)
- [StructurePowerSpawn.processPower API](https://docs.screeps.com/api/#StructurePowerSpawn.processPower)
