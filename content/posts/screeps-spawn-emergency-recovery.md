---
title: "Screeps 房间断代后如何自动恢复第一只采集者"
description: "当房间没有采集者时，用当前可用能量优先生成一个最小 WORK/CARRY/MOVE 单位，用最小示例检查对象、资源、冷却与返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps 断代恢复"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；房间、对象、资源、阈值和一次性请求需要按实际环境确认，运行行为待 Screeps 环境验证。

这类代码最容易出错的地方不是调用名称，而是前提没有满足。本文只解决：当房间没有采集者时，用当前可用能量优先生成一个最小 WORK/CARRY/MOVE 单位。

## 先给检查顺序

spawnCreep 入门教语法；本文只解决 Creep 全灭后的恢复触发条件和最小 body。先确认结构存在，再检查资源、容量、冷却和所有权，最后调用 API 并保存返回值。

## 官方规则

- Spawn 与 Extension 的当前可用能量可通过 room.energyAvailable 读取。
- [WORK, CARRY, MOVE] 的成本可由 BODYPART_COST 计算。
- 恢复代码必须避免 Spawn 忙碌和名称冲突。

## 可放进 main 的最小示例

示例中的房间、资源、数量和价格只是演示参数，发布前必须按自己的环境修改。

```js
module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;
  if (!spawn || spawn.spawning) {
    return;
  }

  const harvesters = Object.values(Game.creeps).filter(
    creep => creep.memory.role === 'harvester'
  );
  if (harvesters.length > 0) {
    return;
  }

  const body = [WORK, CARRY, MOVE];
  const cost = body.reduce(
    (sum, part) => sum + BODYPART_COST[part],
    0
  );
  if (spawn.room.energyAvailable < cost) {
    return;
  }

  const result = spawn.spawnCreep(body, `Emergency-${Game.time}`, {
    memory: { role: 'harvester' }
  });
  console.log('emergency spawn result:', result);
};
```

## 为什么这样写

1. 按 …1513 tokens truncated…= targetLink.store.getFreeCapacity(RESOURCE_ENERGY);
  const amount = Math.min(available, free);
  if (amount <= 0) {
    return;
  }

  const result = sourceLink.transferEnergy(targetLink, amount);
  console.log('link transfer result:', result);
};
```

## 为什么这样写

1. 两个 Link 都检查 undefined。
2. cooldown 为 0 才调用。
3. amount 不超过源储量和目标空闲容量。
4. 非 `OK` 返回值应回到对应 API 页面逐项对照。
5. 不在每个 tick 无条件执行一次性市场或发送操作。

## 适用限制

本文不预测价格，不承诺收益，不提供完整多房间物流。代码只经过语法和静态规则检查，待 Screeps 环境验证。

## 相关站内内容

- [向 Spawn 运输 Energy](/blog/screeps-creep-deliver-energy)
- [升级 Controller](/blog/screeps-upgrade-controller)
- [第一份房间代码](/blog/screeps-first-room-code)

## 官方资料

- [StructureLink API](https://docs.screeps.com/api/#StructureLink)
- [StructureLink.transferEnergy API](https://docs.screeps.com/api/#StructureLink.transferEnergy)

