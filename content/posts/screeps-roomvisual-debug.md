---
title: "RoomVisual 怎么画状态、目标和路径来辅助调试"
description: "用RoomVisual绘制Creep状态、目标连线和任务标记，控制可视化开关与数据大小，并区分当前tick画面、历史记录和真实行为结果。"
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

`RoomVisual` 可以把代码中的状态、目标和路径关系直接画到房间视图。它特别适合回答这些问题：

- Creep当前被分配了什么任务；
- 代码选中了哪个目标；
- Creep与目标之间的关系是否符合预期；
- 某个坐标、区域或路径是不是选错了；
- 房间中的多个任务是否互相冲突。

本文只解决一个问题：怎样建立一个可开关、可控制大小、不会被误认为真实行为结果的RoomVisual调试层。

## RoomVisual能证明什么，不能证明什么

RoomVisual能显示**当前tick代码准备展示的信息**，但不能单独证明：

- Creep已经执行成功；
- `moveTo()`已经找到可行路径；
- Tower已经攻击；
- 目标会在下一tick仍然存在；
- 当前选择长期稳定；
- 历史上发生过同样行为。

例如画出一条Creep到Controller的连线，只能说明代码把Controller当作当前目标。它不能替代：

```js
const result = creep.upgradeController(controller);
```

的返回值，也不能替代下一tick的状态检查。

## 官方规则中的三个关键点

### 图形只保留一个tick

RoomVisual不会作为长期记录保存在游戏数据库中。当前tick不重新绘制，图形就会消失。

因此持续调试必须把绘图代码放进主循环，或者每次需要时重新导入已经保存的可视化数据。

### 可以为不可见房间创建RoomVisual

```js
const visual = new RoomVisual('W10N10');
```

即使脚本当前没有该房间视野，也可以为这个房间创建Visual对象并绘图。

但这不会让：

```js
Game.rooms.W10N10
```

自动出现，也不会让脚本读取该房间里的Creep、建筑和Controller。

### 每个房间最多500KB序列化数据

官方限制是每个房间当前tick的RoomVisual序列化数据不能超过512000字节，也就是500KB。

可以读取：

```js
const size = visual.getSize();
```

本文使用480000字节作为保守停止线，给后续少量绘图留出空间。它是本站策略，不是官方额外限制。

## 常用图形分别回答什么问题

| 方法 | 适合显示 |
|---|---|
| `text()` | 名称、角色、状态、Energy、返回值 |
| `circle()` | 当前对象、危险位置、候选目标 |
| `line()` | Creep与目标、输入与输出、运输关系 |
| `rect()` | 施工区域、边界、房间布局格 |
| `poly()` | 路径、巡逻线、多点区域 |

这些方法都返回当前RoomVisual对象，因此可以链式调用：

```js
new RoomVisual('W1N1')
  .circle(20, 20)
  .text('target', 20, 19.4)
  .line(10, 10, 20, 20);
```

链式调用只是写法更紧凑，不改变绘图规则。

## 用配置控制调试范围

不要默认对所有房间、所有Creep永久开启详细绘图。可以使用房间级配置：

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

`maximumItems` 和 `maximumBytes` 都是本站策略，用来避免调试图无限增长。

## 先把对象关系变成纯数据计划

下面的函数不调用RoomVisual，只创建绘图计划，适合离线测试。

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
    return { ready: false, reason: 'disabled', items: [] };
  }

  if (!creep || !creep.pos) {
    return { ready: false, reason: 'creep-missing', items: [] };
  }

  const items = [];
  const labelParts = [creep.name || 'creep'];

  if (showEnergy === true && Number.isFinite(creep.energy)) {
    labelParts.push(`${creep.energy}E`);
  }

  if (showLabels === true) {
    items.push({
      type: 'text',
      x: creep.pos.x,
      y: creep.pos.y - 0.75,
      text: labelParts.join(' ')
    });
  }

  items.push({
    type: 'circle',
    x: creep.pos.x,
    y: creep.pos.y
  });

  if (
    showTargets === true
    && target
    && target.pos
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

本文只在Creep与目标位于同一房间时绘制房间内连线。跨房间关系可以显示目标房间名，但不能用一条RoomVisual线跨越两个房间。

## 完整示例：显示Creep状态和目标关系

下面示例假设Creep把目标ID保存在：

```js
creep.memory.targetId
```

完整代码：

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

  if (!target || !target.pos) {
    return targetId ? 'target-unavailable' : 'drawn';
  }

  if (target.pos.roomName !== creep.pos.roomName) {
    visual.text(
      trimVisualLabel(`→ ${target.pos.roomName}`),
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

## 为什么按Creep名称排序

`room.find(FIND_MY_CREEPS)`返回的顺序不应被当作业务优先级。示例先按名称排序，再截取 `maximumItems`，可以让相同输入下的绘图对象更稳定。

这不代表名称排序适合业务调度。它只用于调试显示的一致性。

## 目标ID恢复失败怎样理解

```js
Game.getObjectById(targetId)
```

返回 `null` 可能表示：

- 目标已经消失；
- ID写错；
- 当前没有目标所在房间视野；
- Memory保存了旧值；
- 目标属于临时对象。

因此示例只把状态记为 `target-unavailable`，不立即删除全部任务Memory。

对于远程房间目标，ID恢复失败不一定代表目标不存在。

## `getSize()`应该怎样使用

`visual.getSize()`返回当前tick已经加入的RoomVisual序列化字节数。

建议在两个位置检查：

1. 开始绘图前；
2. 批量循环中每绘制若干对象后。

不要把 `getSize()` 当成CPU耗时。它衡量的是Visual序列化数据大小，不是 `Game.cpu.getUsed()`。

## `export()` 和 `import()` 的边界

可以导出当前Visual：

```js
const exported = room.visual.export();
```

以后在某个tick导入：

```js
new RoomVisual(room.name).import(exported);
```

这适合重复显示静态布局，例如固定道路方案或房间规划。

但要注意：

- 导出结果只是Visual数据字符串；
- 导入后仍只属于当前tick；
- 保存大量导出字符串会增加Memory体积；
- 动态Creep位置不适合长期复用旧Visual；
- 导入图形不代表对应建筑或对象仍然存在。

## 不可见房间怎么画标记

```js
const visual = new RoomVisual('W10N10');

visual.text('observe next', 25, 25, {
  color: '#66ccff',
  font: 0.7
});
```

这可以在指定房间画出已知坐标信息，但脚本仍然不能读取该房间实时对象。

如果位置来自旧Memory，应在标签中标明数据时间，避免把历史坐标误认为当前状态。

## 常见错误

### 把Visual当成动作结果

画出目标连线不等于Creep已经成功移动或执行任务。动作仍要保存返回值。

### 只画图，不记录状态

Visual消失后无法回看。需要长期分析时，应保存少量聚合字段或日志，而不是依赖截图记忆。

### 对所有对象无限绘制

几十个Creep、路径和文字叠加后会难以阅读，也可能接近每房间500KB限制。

### 使用不可见对象的 `room.visual`

目标房间没有Room对象时，不能读取：

```js
Game.rooms.W10N10.visual
```

应使用：

```js
new RoomVisual('W10N10')
```

### 坐标和房间不匹配

RoomVisual的坐标只属于它创建时指定的房间。跨房间目标需要单独显示房间名或在目标房间建立另一份Visual。

### 把调试代码永久全量开启

调试层应有明确开关、对象上限和字节上限。问题解决后可以关闭详细标签，只保留少量关键状态。

## 离线模拟结果

构建检查覆盖：

1. 调试配置关闭；
2. Creep对象缺失；
3. 同房间目标生成连线；
4. 跨房间目标不生成房间内连线；
5. 标签超过限制后被裁剪；
6. Visual字节预算不足时停止；
7. Creep名称排序稳定；
8. 合法配置生成预期绘图计划。

离线测试不能模拟浏览器实际画面、官方序列化字节、RoomVisual显示效果或多tick观察。

## 适用边界

本文不覆盖：

- 完整房间布局规划器；
- PathFinder路径算法；
- 地图级 `Game.map.visual`；
- 外部可视化平台；
- 历史轨迹数据库；
- 自动截图；
- 战斗热力图；
- 多Shard可视化同步。

JavaScript语法和离线绘图计划已检查，真实RoomVisual显示、大小和浏览器效果仍待Screeps环境验证。

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
