---
title: "Rampart 的 setPublic() 怎么用"
description: "读取己方 Rampart，并根据明确配置调用 setPublic() 控制其他玩家单位是否能通过，附完整检查顺序、最小代码和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Rampart"
  - "防御"
  - "通行"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


己方 Rampart 默认阻挡其他玩家单位。需要开放特定通道时，可以对明确目标调用 `setPublic(true)`，并保存返回值。

## 先确认边界

Safe Mode 是房间防御状态；`setPublic()` 只改变己方 Rampart 是否允许其他玩家单位通过。调用前要核对目标 ID 和当前 `isPublic`。

## 规则依据

- 新建 Rampart 默认不公开。
- setPublic 只能由所有者对己方 Rampart 调用。
- 公开状态影响通行，不等于转移所有权或开启 Safe Mode。

## 可放进 main 的示例

运行前请替换房间名、Creep 名称和策略阈值。

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const rampart = room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_RAMPART
  })[0];
  if (!rampart) {
    return;
  }

  const shouldBePublic = Memory.defense
    ? Memory.defense.publicRampart === true
    : false;

  if (rampart.isPublic !== shouldBePublic) {
    const result = rampart.setPublic(shouldBePublic);
    console.log('setPublic result:', result);
  }
};
```

## 按这个顺序检查

1. 只查找 FIND_MY_STRUCTURES 中的 Rampart。
2. 配置缺失时默认 false。
3. 仅状态变化时调用 setPublic。
4. 检查对象所有权、资源和距离。
5. 对照官方 API 处理非 `OK` 返回值，不用画面现象代替诊断。

## 限制

公开 Rampart 会影响其他玩家单位通行。示例只处理一个明确目标，不包含盟友名单、访客规则或自动切换策略。

## 相关站内内容

- [Safe Mode 排查](/blog/screeps-controller-activate-safe-mode)
- [自动建造和维修](/blog/screeps-build-and-repair)
- [认识第一个房间](/blog/screeps-first-room)

## 官方资料

- [StructureRampart.setPublic API](https://docs.screeps.com/api/#StructureRampart.setPublic)
- [Defense](https://docs.screeps.com/defense.html)

