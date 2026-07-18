---
title: "Screeps 如何用 Extractor 开采 Mineral"
description: "确认 Mineral、Extractor、冷却和 Creep 条件后调用 harvest(mineral)，用最小示例检查对象、资源、冷却与返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Screeps Extractor Mineral"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；房间、对象、资源、阈值和一次性请求需要按实际环境确认，运行行为待 Screeps 环境验证。

这类代码最容易出错的地方不是调用名称，而是前提没有满足。本文只解决：确认 Mineral、Extractor、冷却和 Creep 条件后调用 harvest(mineral)。

## 先给检查顺序

现有采集文章只从 Source 获取 Energy；本文只讲 RCL6 后的 Mineral 与 Extractor。先确认结构存在，再检查资源、容量、冷却和所有权，最后调用 API 并保存返回值。

## 官方规则

- 房间 Mineral 需要在其位置建成 Extractor 后才能开采。
- Extractor 有 cooldown。
- Creep 仍通过 harvest 方法开采 Mineral，并需要 WORK 与可用容量。

## 可放进 main 的最小示例

示例中的房间、资源、数量和价格只是演示参数，发布前必须按自己的环境修改。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Miner1;
  if (!creep || creep.store.getFreeCapacity() === 0) {
    return;
  }

  const mineral = creep.room.find(FIND_MINERALS)[0];
  const extractor = creep.room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_EXTRACTOR
  })[0];

  if (
    !mineral
    || mineral.mineralAmount === 0
    || !extractor
    || extractor.cooldown > 0
  ) {
    return;
  }

  const result = creep.harvest(mineral);
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(mineral);
  } else if (result !== OK) {
    console.log('mineral harvest result:', result);
  }
};
```

## 为什么这样写

1. Mineral 与 Extractor 分别检查。
2. mineralAmount 和 cooldown 检查。
3. Creep 容量不足时不采集。
4. 非 `OK` 返回值应回到对应 API 页面逐项对照。
5. 不在每个 tick 无条件执行一次性市场或发送操作。

## 适用限制

本文不预测价格，不承诺收益，不提供完整多房间物流。代码只经过语法和静态规则检查，待 Screeps 环境验证。

## 相关站内内容

- [第一次采集 Energy](/blog/screeps-first-creep-harvest)
- [Creep 身体部件](/blog/screeps-creep-body-parts)
- [向 Spawn 运输 Energy](/blog/screeps-creep-deliver-energy)

## 官方资料

- [Resources](https://docs.screeps.com/resources.html)
- [StructureExtractor API](https://docs.screeps.com/api/#StructureExtractor)
- [Mineral API](https://docs.screeps.com/api/#Mineral)

