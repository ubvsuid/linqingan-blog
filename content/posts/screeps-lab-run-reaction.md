---
title: "StructureLab.runReaction() 怎么进行矿物反应"
description: "验证两座输入 Lab 的矿物配方、距离和库存，再由输出 Lab 执行 runReaction()。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Lab"
  - "矿物反应"
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


`runReaction()` 由输出 Lab 调用，并接收两座输入 Lab。三座 Lab 的位置、输入矿物组合、输出容量与 `cooldown` 都会影响结果。

## 先核对这些前提

Mineral 开采页只取得基础矿物；本文只处理三座 Lab 的一次反应，不包含自动物流。

- 一次反应需要两个输入 Lab 和一个输出 Lab。
- 输出 Lab 必须在两个输入 Lab 的有效范围内。
- runReaction 会受配方、资源、容量、RCL 和 cooldown 限制。
- `ERR_RCL_NOT_ENOUGH` 表示当前房间等级不足，输出 Lab 不能执行反应。

## 完整示例

代码放进 `main` 模块。房间、结构、资源和目标坐标必须改成自己的配置。

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const labs = room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_LAB
  });
  const inputA = labs[0];
  const inputB = labs[1];
  const output = labs[2];

  if (!inputA || !inputB || !output || output.cooldown > 0) {
    return;
  }

  const mineralA = inputA.mineralType;
  const mineralB = inputB.mineralType;
  const product = mineralA && mineralB
    ? REACTIONS[mineralA] && REACTIONS[mineralA][mineralB]
    : undefined;

  if (
    !product
    || inputA.store.getUsedCapacity(mineralA) === 0
    || inputB.store.getUsedCapacity(mineralB) === 0
    || output.store.getFreeCapacity(product) === 0
  ) {
    return;
  }

  const result = output.runReaction(inputA, inputB);
  console.log('runReaction result:', result);
};
```

## 排查顺序

1. 三座 Lab 均检查。
2. 使用 REACTIONS 验证输入矿物组合。
3. 检查输出 cooldown 和产品容量。
4. 返回 `ERR_NOT_IN_RANGE` 时检查输出 Lab 与两座输入 Lab 的位置关系。
5. 返回 `ERR_RCL_NOT_ENOUGH` 时检查房间等级；配方或资源问题则分别核对 `REACTIONS` 与输入库存。

## 边界和验证

本文只验证两个输入 Lab 和一个输出 Lab 的单次反应，不实现化合物生产链、运输或批次调度。

## 站内学习路径

- [Mineral 开采前置知识](/blog/screeps-first-creep-harvest)
- [Creep 运输 Energy](/blog/screeps-creep-deliver-energy)
- [知识库查询与工具](https://www.linqingan.com/knowledge#reference-tools)

## 官方资料

- [Resources：Mineral compounds](https://docs.screeps.com/resources.html)
- [StructureLab.runReaction API](https://docs.screeps.com/api/#StructureLab.runReaction)
