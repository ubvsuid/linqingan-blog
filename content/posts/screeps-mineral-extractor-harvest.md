---
title: "Screeps 如何用 Extractor 开采 Mineral"
description: "确认 Mineral、Extractor、mineralAmount、Extractor cooldown 和 Creep 容量后调用 harvest(mineral)，并处理移动与失败返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Mineral"
  - "Extractor"
  - "资源采集"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


Mineral 不能像 Source 一样在游戏前期直接开采。房间需要先达到相应等级并在 Mineral 位置建成 Extractor，采矿 Creep 也要有可用 `WORK` 部件和剩余容量。

## 先给检查顺序

检查顺序是 Mineral 储量、Extractor 是否建成及其 `cooldown`、Creep 容量，最后调用 `harvest(mineral)` 并按返回值决定是否移动。

## 官方规则

- 房间 Mineral 需要在其位置建成 Extractor 后才能开采。
- Extractor 有 cooldown。
- Creep 仍通过 harvest 方法开采 Mineral，并需要 WORK 与可用容量。

## 可放进 main 的最小示例

示例使用名为 `Miner1` 的 Creep，并查找它所在房间的 Mineral 与己方 Extractor。Creep 名称需要按实际代码修改。

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
5. `ERR_NOT_IN_RANGE` 时移动到 Mineral，其他错误输出返回值。

## 适用限制

本文只处理已建成 Extractor 后的基础采矿动作，不包含 Mineral 运输、Lab 反应链或销售策略。

## 相关站内内容

- [第一次采集 Energy](/blog/screeps-first-creep-harvest)
- [Creep 身体部件](/blog/screeps-creep-body-parts)
- [向 Spawn 运输 Energy](/blog/screeps-creep-deliver-energy)

## 官方资料

- [Resources](https://docs.screeps.com/resources.html)
- [StructureExtractor API](https://docs.screeps.com/api/#StructureExtractor)
- [Mineral API](https://docs.screeps.com/api/#Mineral)

