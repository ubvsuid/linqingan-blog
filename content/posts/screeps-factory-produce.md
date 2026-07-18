---
title: "StructureFactory.produce() 怎么生产商品"
description: "从 COMMODITIES 读取配方，检查 Factory cooldown、等级与全部组件后调用 produce，给出前提检查、完整示例和失败边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Screeps Factory produce"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；示例中的房间、名称、Memory 配置、资源与策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

如果只复制一行 API 调用，很难知道失败发生在哪个前提。本文的范围是：从 COMMODITIES 读取配方，检查 Factory cooldown、等级与全部组件后调用 produce。

## 先核对这些前提

Lab 反应处理矿物化合物；本文只处理 Factory 商品配方和生产调用。

- COMMODITIES 提供商品配方与组件数量。
- Factory.produce 会检查材料、容量、cooldown 与工厂等级。
- 部分商品需要与 Factory 等级匹配，工厂等级由相关 Power 效果决定。

## 完整示例

代码放进 `main` 模块。房间、结构、资源和目标坐标必须改成自己的配置。

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const factory = room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_FACTORY
  })[0];
  const product = RESOURCE_BATTERY;
  const recipe = COMMODITIES[product];

  if (!factory || !recipe || factory.cooldown > 0) {
    return;
  }

  const hasComponents = Object.entries(recipe.components).every(
    ([resourceType, amount]) =>
      factory.store.getUsedCapacity(resourceType) >= amount
  );
  if (!hasComponents) {
    return;
  }

  if (recipe.level !== undefined && factory.level !== recipe.level) {
    return;
  }

  const result = factory.produce(product);
  console.log('factory produce result:', result);
};
```

## 排查顺序

1. Factory、配方和 cooldown 检查。
2. 遍历 recipe.components 检查全部材料。
3. 有 level 要求时与 factory.level 对照。
4. 保存动作返回值，并对照官方 API 的错误常量。
5. 一次性高影响动作必须保留显式请求开关。

## 边界和验证

本文不包含自动化大系统、收益或战斗效果承诺。JavaScript 语法检查通过，游戏行为待 Screeps 环境验证。

## 站内学习路径

- [Screeps 资料页](https://www.linqingan.com/resources)
- [Memory 基础用法](/blog/screeps-memory-basics)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Resources：Commodities](https://docs.screeps.com/resources.html)
- [StructureFactory.produce API](https://docs.screeps.com/api/#StructureFactory.produce)

