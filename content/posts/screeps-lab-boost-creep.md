---
title: "StructureLab.boostCreep() 怎么强化身体部件"
description: "确认 Lab 中的化合物、Energy、目标身体部件和距离后调用 boostCreep，给出前提检查、完整示例和失败边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Lab"
  - "Boost"
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


Lab 只能强化与其中化合物对应的身体部件。调用 `boostCreep()` 前，要核对矿物类型与数量、Energy、目标有效部件和 Creep 距离。

## 先核对这些前提

runReaction 页面制造化合物；本文只处理把已存在化合物应用到 Creep。

- boostCreep 需要 Lab 内有匹配化合物与 Energy。
- 目标 Creep 必须相邻。
- 一个身体部件只能应用一种化合物，实际可强化数量受资源和未强化部件限制。

## 完整示例

代码放进 `main` 模块。房间、结构、资源和目标坐标必须改成自己的配置。

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  const creep = Game.creeps.BoostTarget;
  if (!room || !creep) {
    return;
  }

  const lab = room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_LAB
      && structure.mineralType !== undefined
  })[0];
  if (!lab || !lab.mineralType) {
    return;
  }

  const mineralAmount = lab.store.getUsedCapacity(lab.mineralType);
  const energyAmount = lab.store.getUsedCapacity(RESOURCE_ENERGY);
  if (mineralAmount < 30 || energyAmount < 20) {
    return;
  }

  const result = lab.boostCreep(creep);
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(lab);
  } else if (result !== OK) {
    console.log('boostCreep result:', result);
  }
};
```

## 排查顺序

1. Lab 与 mineralType 检查。
2. 至少检查一次部件所需资源下限。
3. 保存 boostCreep 返回值并处理距离。
4. 保存动作返回值，并对照官方 API 的错误常量。
5. 一次性高影响动作必须保留显式请求开关。

## 边界和验证

本文只处理一座 Lab 对一只相邻 Creep 的单次强化，不负责选择化合物、补充资源或安排强化队列。

## 站内学习路径

- [Creep 身体部件](/blog/screeps-creep-body-parts)
- [Creep 角色分工](/blog/screeps-creep-roles)
- [Screeps 资料页](https://www.linqingan.com/resources)

## 官方资料

- [Resources：Creep boosts](https://docs.screeps.com/resources.html)
- [StructureLab.boostCreep API](https://docs.screeps.com/api/#StructureLab.boostCreep)

