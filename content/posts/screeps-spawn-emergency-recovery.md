---
title: "Screeps 房间断代后如何自动恢复第一只采集者"
description: "当房间没有采集者时，检查 Spawn、现存角色和可用能量，再生成最小 WORK/CARRY/MOVE 采集者。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps 断代恢复"
draft: false
featured: false
---

> 资料核对日期：2026-07-19。JavaScript 语法检查通过；Spawn 名称、角色字段和补员策略需要按实际环境确认，运行行为待 Screeps 环境验证。

房间里最后一只采集者死亡后，普通的“按目标数量补员”逻辑可能因为顺序或能量预算不当而卡住。应急恢复代码只做一件事：当采集者数量为零时，优先尝试生成最小的 `[WORK, CARRY, MOVE]` 单位。

## 自动恢复成立的前提

- 房间中仍有属于自己的 Spawn。
- Spawn 当前没有在生成其他 Creep。
- `room.energyAvailable` 至少能支付最小 body 的成本。
- 角色统计使用的 `creep.memory.role` 与现有代码一致。
- 新名称在 `Game.creeps` 中不存在。

`[WORK, CARRY, MOVE]` 的成本是三个部件成本之和。示例通过 `BODYPART_COST` 计算，不把数值散落在判断中。

## 可放进 main 的最小示例

```js
function countCreepsByRole(role) {
  return Object.values(Game.creeps).filter(
    creep => creep.memory.role === role
  ).length;
}

module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;
  if (!spawn || spawn.spawning) {
    return;
  }

  if (countCreepsByRole('harvester') > 0) {
    return;
  }

  const body = [WORK, CARRY, MOVE];
  const cost = body.reduce(
    (total, part) => total + BODYPART_COST[part],
    0
  );

  if (spawn.room.energyAvailable < cost) {
    console.log(
      'emergency spawn waiting for energy:',
      spawn.room.energyAvailable,
      '/',
      cost
    );
    return;
  }

  const name = `EmergencyHarvester-${Game.time}`;
  const result = spawn.spawnCreep(body, name, {
    memory: { role: 'harvester' }
  });

  if (result !== OK) {
    console.log('emergency spawn result:', result);
  }
};
```

## 为什么这段逻辑要放在普通补员之前

普通补员可能优先生成更昂贵的 Builder、Upgrader 或大型 Harvester。断代时，应急分支应先判断“采集者是否为零”，并在满足条件时占用当前 Spawn 尝试最小 body；之后再执行常规角色配额。

如果一个房间有多个 Spawn，应该先确定由哪个 Spawn 负责应急恢复，避免多个 Spawn 同时根据同一份统计创建重复单位。

## 按返回值排查

- `ERR_NAME_EXISTS`：生成名称已被占用；检查命名规则。
- `ERR_BUSY`：Spawn 正在生成其他 Creep；确认应急分支的执行顺序。
- `ERR_NOT_ENOUGH_ENERGY`：实际可用能量不足；核对 body 成本与 `room.energyAvailable`。
- `ERR_INVALID_ARGS`：body、名称或 options 不合法。
- `ERR_NOT_OWNER` 或 `ERR_RCL_NOT_ENOUGH`：检查 Spawn 所有权与房间控制等级。

`spawnCreep()` 不会返回 `ERR_NOT_IN_RANGE`，因为它不是 Creep 对目标执行的相邻动作。

## 无法自动恢复的情况

如果采集者已经全部死亡，而 Spawn 与 Extension 中的可用能量低于最小 body 成本，代码本身不能凭空补充能量。此时需要根据房间真实状态决定人工干预、其他房间支援或重生方案，不能把“等待能量”写成必然恢复的承诺。

## 继续学习

- [spawnCreep 入门](/blog/screeps-spawn-create-creep)
- [Creep 角色分工](/blog/screeps-creep-roles)
- [第一份房间基础代码](/blog/screeps-first-room-code)

## 官方资料

- [StructureSpawn.spawnCreep API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [Creep body 与 BODYPART_COST](https://docs.screeps.com/creeps.html)

