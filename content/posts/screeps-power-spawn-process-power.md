---
title: "StructurePowerSpawn.processPower() 怎么处理 Power"
description: "检查 Power Spawn、Power、Energy、RCL 与返回值后执行一次 processPower，提供变量完整的最小示例、边界和验证清单。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Screeps processPower"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；示例中的房间、名称、Memory 配置、资源与策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

本文检查 Power Spawn、Power、Energy、RCL 与返回值后执行一次 `processPower`。

## 先给结论

本文只处理 Power 资源转化，不扩写 Power Bank、Power Creep 技能或 GPL 配置。先检查对象和配置是否存在，再执行最小调用；可丢失状态与必须持久化的数据要分开。

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

- [Screeps 资料页](https://www.linqingan.com/resources)
- [认识第一个房间](/blog/screeps-first-room)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Power](https://docs.screeps.com/power.html)
- [StructurePowerSpawn.processPower API](https://docs.screeps.com/api/#StructurePowerSpawn.processPower)

