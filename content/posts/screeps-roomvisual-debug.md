---
title: "RoomVisual 怎么画状态、目标和路径来辅助调试"
description: "用RoomVisual绘制Creep状态、目标连线和任务标记，控制可视化开关、对象数量与数据大小，并区分画面提示和真实行为结果。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "RoomVisual"
  - "运行诊断"
  - "可视化"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（调试配置、标签裁剪、目标关系与绘图预算判断，不是Screeps官方服务器）"
  testResult: "配置关闭、对象缺失、跨房间目标、标签长度、预算不足、合法绘图计划和稳定排序场景通过。"
featured: false
---

`RoomVisual` 可以把代码中的状态、目标和路径关系画到房间视图。它适合回答“代码当前选中了什么”，但不能单独证明动作已经执行成功。

本文建立一个可开关、可限制对象数量和数据大小的调试层，并明确RoomVisual、动作结果与长期历史之间的边界。

## RoomVisual的生命周期

RoomVisual图形只属于当前tick。需要持续显示时，必须在**每个 tick**重新绘制，或者在需要时重新导入已保存的Visual字符串。

```js
module.exports.loop = function () {
  const visual = new RoomVisual('W1N1');
  visual.text('running', 25, 25);
};
```

下一tick不再调用绘图代码，上一tick图形不会继续保留。

## 可以画不可见房间，但不会获得视野

```js
const visual = new RoomVisual('W10N10');
visual.circle(25, 25);
```

这可以在指定房间创建图形，但不会让：

```js
Game.rooms.W10N10
```

自动出现，也不能读取该房间的实时Creep、建筑或Controller。

已知坐标可以绘制，实时对象仍然受视野限制。

## 500KB限制与 `getSize()`

官方API规定，每个房间当前tick的RoomVisual序列化数据最多512000字节，也就是500KB。

```js
const bytes = visual.getSize();
```

`getSize()`衡量Visual数据大小，不是CPU消耗。CPU需要用：

```js
Game.cpu.getUsed()
```

单独测量。

本文使用480000字节作为保守停止线，为后续少量标记保留空间。该数值是本站策略，不是官方新增限制。

## 常用方法分别表达什么

| 方法 | 适合表达 |
|---|---|
| `text()` | 角色、任务、Energy、结果代码 |
| `circle()` | Creep、目标、危险坐标 |
| `line()` | Creep与目标的关系 |
| `rect()` | 区域、布局格、施工范围 |
| `poly()` | 路径、多点边界 |

示例：

```js
const visual = new RoomVisual('W1N1');

visual
  .circle(10, 10, {
    radius: 0.4,
    stroke: '#00ff88',
    fill: 'transparent'
  })
  .text('worker', 10, 9.3, {
    color: '#ffffff',
    font: 0.45
  })
  .line(10, 10, 20, 20, {
    color: '#ffaa00',
    lineStyle: 'dashed'
  });
```

链式调用只是写法选择，不改变Visual生命周期。

## 先建立房间级开关

```js
Memory.visualDebug ??= {};
Memory.visualDebug.W1N1 = {
  enabled: true,
  showLabels: true,
  showTargets: true,
  showEnergy: true,
  maximumItems: 30,
  maximumBytes: 480000
};
```

建议至少控制：

- 是否启用；
- 是否显示文字；
- 是否显示目标；
- 最多绘制多少对象；
- 何时停止增加Visual数据。

## 用纯函数生成绘图计划

```js
function buildCreepVisualPlan(input) {
  const {
    enabled,
    creep,
    target,
    showLabels,
    showTargets,
    showEnergy
  } = input;

  if (enabled !== true) {
    return {
      ready: false,
      reason: 'disabled',
      items: []
    };
  }

  if (!creep || !creep.pos) {
    return {
      ready: false,
      reason: 'creep-missing',
      items: []
    };
  }

  const items = [];

  if (showLabels === true) {
    const parts = [creep.name || 'creep'];

    if (
      showEnergy === true
      && Number.isFinite(creep.energy)
    ) {
      parts.push(`${creep.energy}E`);
    }

    items.push({
      type: 'text',
      text: parts.join(' '),
      x: creep.pos.x,
      y: creep.pos.y - 0.75
    });
  }

  items.push({
    type: 'circle',
    x: creep.pos.x,
    y: creep.pos.y
  });

  if (
    showTargets === true
    && target?.pos
    && target.pos.roomName === creep.pos.roomName
  ) {
    items.push({
      type: 'line',
      x1: creep.pos.x,
      y1: creep.pos.y,
      x2: target.pos.x,
      y2: target.pos.y
    });
  }

  return {
    ready: true,
    reason: 'ready',
    items
  };
}
```

跨房间目标不会生成房间内 `line`。可以改为显示目标房间名，但不能用一条RoomVisual线跨越两个房间。

## 完整房间调试层

```js
const VISUAL_BYTE_STOP = 480000;

function trimVisualLabel(value, maximumLength = 40) {
  const text = String(value);

  if (text.length <= maximumLength) {
    return text;
  }

  return `${text.slice(0, maximumLength - 3)}...`;
}

function getVisualConfig(roomName) {
  const raw = Memory.visualDebug?.[roomName];

  if (!raw || raw.enabled !== true) {
    return null;
  }

  return {
    showLabels: raw.showLabels !== false,
    showTargets: raw.showTargets !== false,
    showEnergy: raw.showEnergy !== false,
    maximumItems: Number.isInteger(raw.maximumItems)
      && raw.maximumItems > 0
      ? raw.maximumItems
      : 30,
    maximumBytes: Number.isInteger(raw.maximumBytes)
      && raw.maximumBytes > 0
      && raw.maximumBytes <= 512000
      ? raw.maximumBytes
      : VISUAL_BYTE_STOP
  };
}

function drawCreepDebug(visual, creep, config) {
  if (visual.getSize() >= config.maximumBytes) {
    return 'byte-limit';
  }

  const energy = creep.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  if (config.showLabels) {
    const task = creep.memory?.task || 'no-task';
    const label = trimVisualLabel(
      `${creep.name} ${task} ${energy}E`
    );

    visual.text(
      label,
      creep.pos.x,
      creep.pos.y - 0.75,
      {
        color: '#ffffff',
        font: 0.45,
        opacity: 0.9,
        backgroundColor: '#111111',
        backgroundPadding: 0.15
      }
    );
  }

  visual.circle(creep.pos, {
    radius: 0.43,
    stroke: '#00ff88',
    strokeWidth: 0.08,
    fill: 'transparent',
    opacity: 0.75
  });

  if (!config.showTargets) {
    return 'drawn';
  }

  const targetId = creep.memory?.targetId;
  const target = targetId
    ? Game.getObjectById(targetId)
    : null;

  if (!target?.pos) {
    return targetId
      ? 'target-unavailable'
      : 'drawn';
  }

  if (target.pos.roomName !== creep.pos.roomName) {
    visual.text(
      trimVisualLabel(`to ${target.pos.roomName}`),
      creep.pos.x,
      creep.pos.y + 0.8,
      {
        color: '#ffaa00',
        font: 0.4
      }
    );

    return 'cross-room-target';
  }

  visual.line(creep.pos, target.pos, {
    color: '#ffaa00',
    width: 0.08,
    opacity: 0.55,
    lineStyle: 'dashed'
  });

  visual.circle(target.pos, {
    radius: 0.32,
    stroke: '#ffaa00',
    fill: 'transparent',
    opacity: 0.7
  });

  return 'drawn-with-target';
}

function drawRoomDebug(room) {
  const config = getVisualConfig(room.name);

  if (!config) {
    return;
  }

  const visual = room.visual;
  const creeps = room.find(FIND_MY_CREEPS)
    .sort((left, right) =>
      left.name.localeCompare(right.name)
    )
    .slice(0, config.maximumItems);

  const summary = {
    drawn: 0,
    stoppedByBytes: false,
    statuses: {}
  };

  for (const creep of creeps) {
    if (visual.getSize() >= config.maximumBytes) {
      summary.stoppedByBytes = true;
      break;
    }

    const status = drawCreepDebug(
      visual,
      creep,
      config
    );

    summary.drawn += 1;
    summary.statuses[status] =
      (summary.statuses[status] || 0) + 1;
  }

  Memory.visualDebug[room.name].lastSummary = {
    ...summary,
    bytes: visual.getSize(),
    tick: Game.time
  };
}

module.exports.loop = function () {
  const room = Game.rooms.W1N1;

  if (!room) {
    return;
  }

  drawRoomDebug(room);
};
```

把 `W1N1` 换成真实房间名。

## 为什么按名称排序

`room.find(FIND_MY_CREEPS)`的返回顺序不应被当成业务优先级。绘图前按名称排序，再截取 `maximumItems`，可以让相同输入下的显示对象更稳定。

名称排序只服务于调试一致性，不代表角色调度顺序。

## 目标恢复失败怎样解释

`Game.getObjectById(targetId)` 返回 `null` 可能因为：

- 目标已经消失；
- ID错误；
- 当前没有目标房间视野；
- Memory保留旧值。

调试层只标记 `target-unavailable`，不直接删除业务任务。是否失效应由目标管理模块判断。

## `export()` 和 `import()`

导出当前Visual：

```js
const exported = room.visual.export();
```

导入已保存字符串：

```js
new RoomVisual(room.name).import(exported);
```

适合复用静态布局图，但要注意：

- 导入图形仍只显示当前tick；
- 大字符串写入Memory会增加体积；
- 旧图形不证明对象仍存在；
- 动态Creep位置不适合长期复用。

## Visual与真实结果要分开

画出一条Creep到Controller的线，只说明代码当前把它们建立了关系。

动作仍应独立读取返回值：

```js
const result = creep.upgradeController(
  creep.room.controller
);
```

RoomVisual不替代 `result`，也不替代下一tick的状态检查。

## 常见错误

### 把Visual当成动作成功证据

显示目标不等于移动、攻击、升级或维修已经完成。

### 对所有对象无限绘制

文字、路径和标记会越来越难读，也可能接近500KB限制。

### 把 `getSize()` 当成CPU

前者是序列化字节数，CPU需要单独测量。

### 在不可见房间读取 `room.visual`

没有Room对象时使用：

```js
new RoomVisual(roomName)
```

### 坐标与房间不匹配

每份RoomVisual只属于指定房间。跨房间目标应显示房间名或在目标房间创建另一份Visual。

### 调试层永久全量开启

应有开关、对象上限和字节停止线，问题解决后关闭详细显示。

## 离线模拟结果

构建检查覆盖：

1. 配置关闭；
2. Creep对象缺失；
3. 同房间目标生成 `line`；
4. 跨房间目标不生成房间内连线；
5. 标签裁剪；
6. 字节预算不足；
7. 名称排序稳定；
8. 合法绘图计划。

离线测试不能模拟浏览器显示、官方Visual序列化、真实CPU或多tick画面。

## 适用边界

本文不覆盖：

- 完整房间布局规划；
- 地图级 `Game.map.visual`；
- 自动截图；
- 历史轨迹数据库；
- 战斗热力图；
- 多Shard可视化；
- PathFinder算法；
- 外部监控平台。

JavaScript语法和离线绘图计划已检查，真实RoomVisual显示与CPU表现仍待Screeps环境验证。

## 相关站内内容

- [Flag怎么作为配置入口](/blog/screeps-flags-config)
- [moveTo()为什么不移动](/blog/screeps-moveto-not-moving)
- [ERR_NO_PATH怎么排查](/blog/screeps-err-no-path)
- [Game.cpu.getUsed()怎么监控CPU](/blog/screeps-cpu-getused-bucket)
- [Room.getEventLog()怎么读取事件](/blog/screeps-room-event-log)
- [进入移动、寻路与视野专题](/knowledge/movement-vision)

## 官方资料

- [RoomVisual API](https://docs.screeps.com/api/#RoomVisual)
- [Room.visual API](https://docs.screeps.com/api/#Room-visual)
- [Game.map.visual API](https://docs.screeps.com/api/#Game-map-visual)
- [Debugging](https://docs.screeps.com/debugging.html)

资料核对日期：2026-07-22。离线绘图计划模拟已通过；真实RoomVisual效果仍待环境验证。
