---
title: "Rampart 的 setPublic() 怎么用"
description: "读取己方 Rampart，并根据明确配置调用 setPublic() 控制其他玩家单位是否能通过，附完整检查顺序、最小代码和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Screeps Rampart setPublic"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；房间、对象、资源、阈值和一次性请求需要按实际环境确认，运行行为待 Screeps 环境验证。

本文处理的不是完整房间 AI，而是一个能明确验证的问题：读取己方 Rampart，并根据明确配置调用 setPublic() 控制其他玩家单位是否能通过。

## 先确认边界

Safe Mode 是房间防御状态；本文只改变单个 Rampart 的公共通行属性。第一步始终是确认目标属于正确房间、对象存在，并保存关键动作返回值。

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

示例只建立最小决策，不包含跨房间调度、战斗策略或性能数据。资料已核对，运行效果待 Screeps 环境验证。

## 相关站内内容

- [Safe Mode 排查](/blog/screeps-controller-activate-safe-mode)
- [自动建造和维修](/blog/screeps-build-and-repair)
- [认识第一个房间](/blog/screeps-first-room)

## 官方资料

- [StructureRampart.setPublic API](https://docs.screeps.com/api/#StructureRampart.setPublic)
- [Defense](https://docs.screeps.com/defense.html)

