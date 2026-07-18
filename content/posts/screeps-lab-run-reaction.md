---
title: "StructureLab.runReaction() 怎么进行矿物反应"
description: "用两个输入 Lab 和一个输出 Lab 验证反应配方、距离、冷却、资源与容量后执行反应，给出前提检查、完整示例和失败边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Screeps Lab runReaction"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；房间、对象、资源、阈值和一次性请求需要按实际环境确认，运行行为待 Screeps 环境验证。

如果只复制一行 API 调用，很难知道失败发生在哪个前提。本文的范围是：用两个输入 Lab 和一个输出 Lab 验证反应配方、距离、冷却、资源与容量后执行反应。

## 先核对这些前提

Mineral 开采页只取得基础矿物；本文只处理三座 Lab 的一次反应，不包含自动物流。

- 一次反应需要两个输入 Lab 和一个输出 Lab。
- 输出 Lab 必须在两个输入 Lab 的有效范围内。
- runReaction 会受配方、资源、容量、RCL 和 cooldown 限制。

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
4. 保存动作返回值，并对照官方 API 的错误常量。
5. 一次性高影响动作必须保留显式请求开关。

## 边界和验证

本文不包含自动化大系统、收益或战斗效果承诺。JavaScript 语法检查通过，游戏行为待 Screeps 环境验证。

## 站内学习路径

- [Mineral 开采前置知识](/blog/screeps-first-creep-harvest)
- [Creep 运输 Energy](/blog/screeps-creep-deliver-energy)
- [Screeps 资料页](https://www.linqingan.com/resources)

## 官方资料

- [Resources：Mineral compounds](https://docs.screeps.com/resources.html)
- [StructureLab.runReaction API](https://docs.screeps.com/api/#StructureLab.runReaction)

