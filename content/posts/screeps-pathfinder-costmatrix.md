---
title: "PathFinder CostMatrix 怎么设置不可走和高成本格子"
description: "在 PathFinder roomCallback 中标记道路、不可穿越建筑和高成本格子，控制单房间寻路偏好。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "PathFinder"
  - "寻路"
  - "CostMatrix"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


CostMatrix 不会主动移动 Creep；它向 PathFinder 描述哪些格子便宜、昂贵或不可走。下面在 `roomCallback` 中标记道路、建筑和一个自定义高成本位置。

## 第一项检查

先确认目标对象存在，再把相关方法的返回值写进变量。ERR_NO_PATH 页面用于排错；本文只讲如何构造和返回 CostMatrix。

## 官方规则中的关键点

- CostMatrix 中 0 表示使用地形默认成本。
- 大于等于 255 的成本视为不可走。
- roomCallback 返回 false 会阻止 PathFinder 搜索该房间。

## 最小完整示例

代码放在 `main` 模块；名称和目标需要按自己的房间修改。

```js
function buildCostMatrix(room) {
  const costs = new PathFinder.CostMatrix();
  const structures = room.find(FIND_STRUCTURES);

  for (const structure of structures) {
    if (structure.structureType === STRUCTURE_ROAD) {
      costs.set(structure.pos.x, structure.pos.y, 1);
    } else if (
      structure.structureType !== STRUCTURE_CONTAINER
      && !(structure.structureType === STRUCTURE_RAMPART && structure.my)
    ) {
      costs.set(structure.pos.x, structure.pos.y, 255);
    }
  }

  return costs;
}

module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  const target = Game.flags.PathTarget;
  if (!creep || !target) {
    return;
  }

  const search = PathFinder.search(
    creep.pos,
    { pos: target.pos, range: 0 },
    {
      plainCost: 2,
      swampCost: 10,
      roomCallback(roomName) {
        const room = Game.rooms[roomName];
        return room ? buildCostMatrix(room) : false;
      }
    }
  );

  if (!search.incomplete && search.path.length > 0) {
    const result = creep.moveByPath(search.path);
    console.log('moveByPath result:', result);
  }
};
```

## 排查顺序

1. CostMatrix 构造函数与 set 参数正确。
2. 道路和不可穿越结构分开处理。
3. 检查 PathFinder.search 的 incomplete。
4. 确认目标位置是否可站立，动作目标不可站立时使用正确的距离范围。
5. 临时输出返回值和关键状态，确认问题后再删减日志。

## 文章边界

本文只演示在 `roomCallback` 中构造单房间 CostMatrix；权重需要结合实际道路、建筑和交通策略调整。

## 相关站内内容

- [第一份房间基础代码](/blog/screeps-first-room-code)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [Screeps 资料页](https://www.linqingan.com/resources)

## 官方资料

- [PathFinder API](https://docs.screeps.com/api/#PathFinder)
- [PathFinder.CostMatrix API](https://docs.screeps.com/api/#PathFinder-CostMatrix)
