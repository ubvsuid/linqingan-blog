import styles from "./knowledge-system-map.module.css";

type Locale = "zh" | "en";

interface SystemStep {
  zhLabel: string;
  enLabel: string;
  zhDetail: string;
  enDetail: string;
}

interface SystemMapConfig {
  zhTitle: string;
  enTitle: string;
  zhDescription: string;
  enDescription: string;
  steps: readonly SystemStep[];
}

const systemMaps: Record<number, SystemMapConfig> = {
  1: {
    zhTitle: "从 tick 到可维护代码的状态链",
    enTitle: "From ticks to maintainable state",
    zhDescription: "先区分每 tick 重建的运行对象和需要跨 tick 保存的数据，再进入角色状态、缓存和模块边界。",
    enDescription: "Separate per-tick runtime objects from persistent state first, then move into role state, caching, and module boundaries.",
    steps: [
      ["Tick", "Tick", "主循环重新执行", "The main loop runs again"],
      ["Game 对象", "Game objects", "读取当前世界状态", "Read current world state"],
      ["Memory", "Memory", "保存跨 tick 状态", "Persist cross-tick state"],
      ["角色与缓存", "Roles and cache", "减少重复判断与计算", "Reduce repeated decisions and work"],
      ["模块边界", "Module boundaries", "让系统可维护和隔离", "Keep systems maintainable and isolated"],
    ].map(([zhLabel, enLabel, zhDetail, enDetail]) => ({ zhLabel, enLabel, zhDetail, enDetail })),
  },
  2: {
    zhTitle: "Spawn 与 Creep 生命周期",
    enTitle: "Spawn and Creep lifecycle",
    zhDescription: "把“需要一只 Creep”拆成 Body、Energy、生成、工作、替换和回收，而不是只关注 spawnCreep() 一次调用。",
    enDescription: "Treat the need for a Creep as a lifecycle of body design, Energy, spawning, work, replacement, and retirement rather than one spawnCreep() call.",
    steps: [
      ["需求出现", "Demand", "角色缺口或替换条件", "A role gap or replacement condition"],
      ["Body + Energy", "Body + Energy", "计算身体与可用容量", "Size the body against available capacity"],
      ["spawnCreep()", "spawnCreep()", "保存 dryRun 与真实返回值", "Store dryRun and real results"],
      ["工作 + TTL", "Work + TTL", "观察任务与寿命", "Track work and lifetime"],
      ["替换 / 回收", "Replace / recycle", "避免断代和无效占用", "Avoid downtime and wasted capacity"],
    ].map(([zhLabel, enLabel, zhDetail, enDetail]) => ({ zhLabel, enLabel, zhDetail, enDetail })),
  },
  3: {
    zhTitle: "房间 Energy 与资源流",
    enTitle: "Room Energy and resource flow",
    zhDescription: "从资源源头一直看到消费端，任何一段 Store、移动或容量断开都会让整个房间经济看起来“没能量”。",
    enDescription: "Follow resources from source to consumer; a break in Store state, movement, or capacity anywhere can make the whole economy look starved.",
    steps: [
      ["Source", "Source", "产生可采集资源", "Provides harvestable resources"],
      ["Harvester", "Harvester", "harvest 并进入 Store", "Harvests into Store"],
      ["Container / Link", "Container / Link", "缓冲或传输", "Buffers or transfers resources"],
      ["Hauler / Storage", "Hauler / Storage", "搬运和集中库存", "Moves and centralizes stock"],
      ["Spawn / Controller / Build", "Spawn / Controller / Build", "最终消费与扩张", "Consumes resources for growth"],
    ].map(([zhLabel, enLabel, zhDetail, enDetail]) => ({ zhLabel, enLabel, zhDetail, enDetail })),
  },
  4: {
    zhTitle: "移动、视野与寻路判断链",
    enTitle: "Movement, vision, and pathfinding chain",
    zhDescription: "先确认目标和视野，再区分房间级路线与格子级 PathFinder，最后用后续 tick 的位置变化验证结果。",
    enDescription: "Confirm target and visibility first, separate room-level routing from tile-level PathFinder work, then verify movement on later ticks.",
    steps: [
      ["目标", "Target", "对象和房间是否有效", "Is the object and room valid?"],
      ["视野", "Vision", "Game.rooms 是否可见", "Is Game.rooms visibility available?"],
      ["房间路线", "Room route", "findRoute 规划跨房间", "Use findRoute across rooms"],
      ["格子路径", "Tile path", "PathFinder / CostMatrix", "Use PathFinder / CostMatrix"],
      ["下一 tick", "Later tick", "位置、fatigue、返回值复核", "Recheck position, fatigue, and results"],
    ].map(([zhLabel, enLabel, zhDetail, enDetail]) => ({ zhLabel, enLabel, zhDetail, enDetail })),
  },
  5: {
    zhTitle: "Controller 控制与升级链",
    enTitle: "Controller control and upgrade chain",
    zhDescription: "Controller 是否安全取决于 Energy 供给、Upgrader、距离、upgradeController() 返回值和多 tick 的进度变化。",
    enDescription: "Controller safety depends on Energy supply, the Upgrader, range, upgradeController() results, and progress across multiple ticks.",
    steps: [
      ["Energy 供给", "Energy supply", "Container / Link / Hauler", "Container / Link / Hauler"],
      ["Upgrader", "Upgrader", "持有 WORK 与 Energy", "Carries WORK and Energy"],
      ["upgradeController()", "upgradeController()", "检查距离和返回值", "Check range and result"],
      ["RCL / Downgrade", "RCL / downgrade", "观察进度和降级压力", "Watch progress and downgrade pressure"],
      ["结构 / 扩张", "Structures / expansion", "解锁能力或进入 reserve/claim", "Unlock capacity or move into reserve/claim"],
    ].map(([zhLabel, enLabel, zhDetail, enDetail]) => ({ zhLabel, enLabel, zhDetail, enDetail })),
  },
  6: {
    zhTitle: "建设到防御的结构生命周期",
    enTitle: "Structure lifecycle from construction to defense",
    zhDescription: "先创建 Construction Site，再通过 build 完成结构；投入运行后继续用 Tower、Rampart 和 repair 维持房间安全。",
    enDescription: "Create a Construction Site, finish it with build, then keep the resulting structure safe with Towers, Ramparts, and repair policies.",
    steps: [
      ["规划位置", "Plan position", "确认 RCL 与坐标", "Confirm RCL and coordinates"],
      ["Construction Site", "Construction Site", "创建并观察 progress", "Create and track progress"],
      ["build()", "build()", "Builder 推进施工", "Builder advances construction"],
      ["结构投入运行", "Active structure", "开始承担房间功能", "Begins serving the room"],
      ["Tower / repair / Rampart", "Tower / repair / Rampart", "持续维护与防御", "Maintain and defend over time"],
    ].map(([zhLabel, enLabel, zhDetail, enDetail]) => ({ zhLabel, enLabel, zhDetail, enDetail })),
  },
  7: {
    zhTitle: "高级资源与市场流转链",
    enTitle: "Advanced resource and Market flow",
    zhDescription: "把库存、Terminal、Market、Lab 和生产系统看成一条资源决策链，避免只根据订单价格执行动作。",
    enDescription: "Treat stock, Terminal, Market, Labs, and production as one resource-decision chain instead of acting on order price alone.",
    steps: [
      ["库存", "Stock", "确认 Store 与资源类型", "Confirm Store and resource type"],
      ["Terminal", "Terminal", "检查 cooldown 与交易 Energy", "Check cooldown and transaction Energy"],
      ["Market", "Market", "订单、Credits 与手续费", "Orders, Credits, and fees"],
      ["Lab / Factory", "Lab / Factory", "反应、Boost 或生产", "React, Boost, or produce"],
      ["再平衡", "Rebalance", "重新评估库存和成本", "Re-evaluate stock and cost"],
    ].map(([zhLabel, enLabel, zhDetail, enDetail]) => ({ zhLabel, enLabel, zhDetail, enDetail })),
  },
  8: {
    zhTitle: "运行诊断与恢复闭环",
    enTitle: "Operational debugging and recovery loop",
    zhDescription: "先测量和记录，再隔离故障；当 CPU 或房间状态恶化时降低非关键工作，恢复后再逐步放开。",
    enDescription: "Measure and record first, isolate failures next, shed noncritical work under pressure, then restore work gradually after recovery.",
    steps: [
      ["Measure", "Measure", "CPU、bucket、状态指标", "CPU, bucket, state metrics"],
      ["Observe", "Observe", "日志、notify、Event Log", "Logs, notify, Event Log"],
      ["Isolate", "Isolate", "房间或模块错误边界", "Room or module error boundaries"],
      ["Degrade", "Degrade", "降低非关键任务", "Reduce noncritical work"],
      ["Recover", "Recover", "冷却、重试并验证恢复", "Cooldown, retry, and verify recovery"],
    ].map(([zhLabel, enLabel, zhDetail, enDetail]) => ({ zhLabel, enLabel, zhDetail, enDetail })),
  },
};

export function KnowledgeSystemMap({ moduleNumber, locale }: { moduleNumber: number; locale: Locale }) {
  const config = systemMaps[moduleNumber];
  if (!config) return null;
  const isEnglish = locale === "en";

  return (
    <section className={styles.map} aria-labelledby={`system-map-${moduleNumber}-${locale}`}>
      <div className={styles.header}>
        <p className="eyebrow">SYSTEM MAP</p>
        <h2 id={`system-map-${moduleNumber}-${locale}`}>{isEnglish ? config.enTitle : config.zhTitle}</h2>
        <p>{isEnglish ? config.enDescription : config.zhDescription}</p>
      </div>
      <ol className={styles.flow}>
        {config.steps.map((step, index) => (
          <li className={styles.step} key={`${moduleNumber}-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{isEnglish ? step.enLabel : step.zhLabel}</strong>
            <p>{isEnglish ? step.enDetail : step.zhDetail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
