---
title: "Screeps 房间断代后如何自动恢复第一只采集者"
description: "当房间没有采集者时，检查 Spawn、现存角色和可用能量，再生成最小 WORK/CARRY/MOVE 采集者。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Spawn"
  - "补员"
  - "常见问题"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（简化 Spawn、角色数量与 Energy 状态）"
  testResult: "Spawn 缺失、忙碌、已有采集者和 Energy 不足时等待；零采集者且 200 Energy 时进入应急生成分支。"
featured: false
---

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

## 离线模拟结果

构建检查把应急判断拆成五种输入：

| 输入状态 | 决策 |
|---|---|
| Spawn 不存在 | 不执行生成 |
| Spawn 正在工作 | 等待 Spawn 空闲 |
| 已有 1 个 Harvester | 不需要应急生成 |
| Harvester 为 0，Energy 为 199 | 等待 Energy |
| Harvester 为 0，Energy 为 200 | 进入最小采集者生成分支 |

模拟确认判断顺序不会在已有采集者、Spawn 忙碌或 Energy 不足时错误调用生成分支。

这属于 **Node.js 离线决策模拟**。它没有调用真实 `spawn.spawnCreep()`，也没有覆盖实际名称冲突、多个 Spawn 并发、Extension 能量分布或后续 Creep 是否成功采集。Console 与真实主循环仍然待环境验证。

## 按返回值排查

- `ERR_NAME_EXISTS`：生成名称已被占用；检查命名规则。
- `ERR_BUSY`：Spawn 正在生成其他 Creep；确认应急分支的执行顺序。
- `ERR_NOT_ENOUGH_ENERGY`：实际可用能量不足；核对 body 成本与 `room.energyAvailable`。
- `ERR_INVALID_ARGS`：body、名称或 options 不合法。
- `ERR_NOT_OWNER` 或 `ERR_RCL_NOT_ENOUGH`：检查 Spawn 所有权与房间控制等级。

`spawnCreep()` 不会返回 `ERR_NOT_IN_RANGE`，因为它不是 Creep 对目标执行的相邻动作。

## 无法自动恢复的情况

如果采集者已经全部死亡，而 Spawn 与 Extension 中的可用能量低于最小 body 成本，代码本身不能凭空补充能量。此时需要根据房间真实状态决定人工干预、其他房间支援或重生方案，不能把“等待能量”写成必然恢复的承诺。

同时要注意：Screeps的新手初始Spawn可能获得特殊的缓慢补能机制，但不能把这一点泛化为所有房间、所有阶段都会自动恢复。应急代码必须以当前房间的真实能量和结构状态为准。

## 继续学习

- [Creep 身体计算器](https://www.linqingan.com/tools/creep-body-calculator)
- [按房间能量动态生成身体](/blog/screeps-dynamic-creep-body-energy)
- [spawnCreep 入门](/blog/screeps-spawn-create-creep)
- [Creep 角色分工](/blog/screeps-creep-roles)
- [第一份房间基础代码](/blog/screeps-first-room-code)

## 官方资料

- [StructureSpawn.spawnCreep API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [Creep body 与 BODYPART_COST](https://docs.screeps.com/creeps.html)
- [Respawning 与初始 Spawn](https://docs.screeps.com/respawn.html)

资料核对日期：2026-07-22。代码语法与离线决策模拟已通过；真实 `spawnCreep()` 返回值和多 tick 恢复过程仍待环境验证。
