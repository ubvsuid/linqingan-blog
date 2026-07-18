---
title: "Screeps Creep.pickup() 怎么捡地上的 Energy"
description: "查找掉落的 RESOURCE_ENERGY，并处理 pickup() 的距离、容量和目标变化，给出最小代码、返回值检查和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Screeps pickup Energy"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。本文示例只经过 JavaScript 语法与静态 API 检查；对象名称、房间、资源和策略参数需要按实际环境修改，运行行为待 Screeps 环境验证。

遇到这个问题时，先不要继续增加角色系统或调度框架。本文只检查一件事：查找掉落的 RESOURCE_ENERGY，并处理 pickup() 的距离、容量和目标变化。

## 先给判断

harvest 从 Source 采集 Energy，withdraw 从容器取资源；本文只处理地面上的 Resource 掉落物。先确认 Creep 仍有容量，再筛选最近可达的 `RESOURCE_ENERGY`。

## 需要知道的规则

- FIND_DROPPED_RESOURCES 返回 Resource 对象。
- Creep.pickup 的目标必须是 Resource 且距离为 1。
- 容量已满会返回 ERR_FULL，目标消失时需要下一 tick 重新查找。

## 可放进 main 的最小示例

运行前提：示例中的对象名称和房间条件需要按自己的环境修改。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Collector1;
  if (!creep || creep.store.getFreeCapacity() === 0) {
    return;
  }

  const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
    filter: resource => resource.resourceType === RESOURCE_ENERGY
  });
  if (!target) {
    return;
  }

  const result = creep.pickup(target);
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(target);
  } else if (result !== OK) {
    console.log('pickup result:', result);
  }
};
```

目标每个 tick 都重新查找，因为掉落物可能被捡完或衰减消失。`pickup` 的返回值只用于处理当前这个 Resource，不应套用其他 API 的排错条件。

## 按顺序排查

1. 只筛选 RESOURCE_ENERGY。
2. 容量满时不调用 pickup。
3. 保存并处理 pickup 返回值。
4. 返回 `ERR_NOT_IN_RANGE` 时移动到掉落物附近，下一 tick 再尝试拾取。
5. 返回 `ERR_FULL` 时检查容量；返回 `ERR_INVALID_TARGET` 时重新查找当前仍存在的 Resource。

## 适用范围

本文不处理多房间调度、全局任务队列、性能排名或自动布局。示例来自官方 API 规则整理，未在用户的 Screeps 账号中运行。

## 继续学习

- [第一次采集 Energy](/blog/screeps-first-creep-harvest)
- [从 Container 取 Energy](/blog/screeps-creep-withdraw-container-energy)
- [Creep 运输 Energy](/blog/screeps-creep-deliver-energy)

## 官方资料

- [Creep.pickup API](https://docs.screeps.com/api/#Creep.pickup)
- [Room.find API](https://docs.screeps.com/api/#Room.find)

