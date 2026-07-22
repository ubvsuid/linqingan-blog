---
title: "StructureFactory.produce() 怎么生产商品"
description: "读取 COMMODITIES 商品配方，确认 Factory 等级、组件和 cooldown 后安全调用 produce()。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Factory"
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


Factory 的生产条件来自 `COMMODITIES[product]`。调用 `produce()` 前应逐项检查配方组件、商品容量、Factory 等级和 `cooldown`。

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

本文只验证一个商品配方并尝试一次 `produce()`；不负责组件物流、生产队列或商品销售。

## 站内学习路径

- [知识库查询与工具](https://www.linqingan.com/knowledge#reference-tools)
- [Memory 基础用法](/blog/screeps-memory-basics)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Resources：Commodities](https://docs.screeps.com/resources.html)
- [StructureFactory.produce API](https://docs.screeps.com/api/#StructureFactory.produce)
