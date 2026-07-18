
---
title: "多个 Source 时怎样选择最近可达目标"
description: "用 findClosestByPath 选择当前有 Energy 且能找到路径的 Source，避免固定取数组第一项，附完整检查顺序、最小代码和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Source"
  - "寻路"
  - "目标选择"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


房间有多个 Source 时，固定选择搜索数组第一项可能让 Creep 绕远路。`findClosestByPath()` 会从候选目标中选择当前可达且路径最近的一个。

## 先确认边界

第一次采集文章固定取数组第一项；这里改用 `findClosestByPath()`，只从当前有 Energy 且能找到路径的 Source 中选择目标。

## 规则依据

- FIND_SOURCES_ACTIVE 只返回当前有可采能量的 Source。
- findClosestByPath 根据路径成本选择目标。
- findClosestByPath 找不到路径时可能返回 null。

## 可放进 main 的示例

运行前请替换房间名、Creep 名称和策略阈值。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;
  if (!creep || creep.store.getFreeCapacity() === 0) {
    return;
  }

  const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  if (!source) {
    console.log('没有找到当前可达的活跃 Source');
    return;
  }

  const result = creep.harvest(source);
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(source);
  } else if (result !== OK) {
    console.log('harvest result:', result);
  }
};
```

## 按这个顺序检查

1. 不使用 room.find(...)[0] 直接取目标。
2. 对 null 目标提前返回。
3. 动作返回值与移动分开处理。
4. 检查对象所有权、资源和距离。
5. 对照官方 API 处理非 `OK` 返回值，不用画面现象代替诊断。

## 限制

示例每 tick 重新选择 Source，适合解释路径选择。长期使用时可在 Memory 中保存目标 ID，并在目标失效后重新选择。

## 相关站内内容

- [第一次采集 Energy](/blog/screeps-first-creep-harvest)
- [第一份房间基础代码](/blog/screeps-first-room-code)
- [Creep 角色分工](/blog/screeps-creep-roles)

## 官方资料

- [RoomPosition.findClosestByPath API](https://docs.screeps.com/api/#RoomPosition.findClosestByPath)
- [Room.find 常量](https://docs.screeps.com/api/#Constants-Find-Constants)

