export interface KnowledgeModuleStageConfig {
  id: string;
  title: string;
  description: string;
  legacyFrom?: number;
  legacyTo?: number;
}

export interface KnowledgeSystemMapStep {
  zhLabel: string;
  enLabel: string;
  zhDetail: string;
  enDetail: string;
}

export interface KnowledgeSystemMapConfig {
  zhTitle: string;
  enTitle: string;
  zhDescription: string;
  enDescription: string;
  steps: readonly KnowledgeSystemMapStep[];
}

export interface KnowledgeModuleConfig {
  id: string;
  number: number;
  title: string;
  description: string;
  audience: string;
  learningGoal: string;
  articleSource: "legacy" | "metadata";
  stages: readonly KnowledgeModuleStageConfig[];
  legacySlugs?: readonly string[];
  systemMap: KnowledgeSystemMapConfig;
}

function step(
  zhLabel: string,
  enLabel: string,
  zhDetail: string,
  enDetail: string,
): KnowledgeSystemMapStep {
  return { zhLabel, enLabel, zhDetail, enDetail };
}

export const knowledgeModuleRegistry: readonly KnowledgeModuleConfig[] = [
  {
    id: "memory-engineering",
    number: 1,
    title: "Memory 与代码工程",
    description: "保存跨 tick 状态、恢复对象引用、清理过期数据，并逐步理解模块拆分、segments、跨 Shard 状态、公开 Foreign Segment 与全局缓存。",
    audience: "已经完成新手路线，准备从固定名称代码进入可维护结构的玩家。",
    learningGoal: "理解哪些数据应该跨 tick 或跨 Shard 保存、怎样安全恢复对象，以及如何把不断增长的主循环拆成清楚的代码模块。",
    articleSource: "metadata",
    stages: [
      { id: "state-basics", title: "状态基础", description: "先理解 Memory、死亡数据清理和工作状态切换。" },
      { id: "objects-modules", title: "对象与模块", description: "学习通过 ID 恢复对象，并用 require 拆分代码。" },
      { id: "advanced-storage-cache", title: "高级存储与缓存", description: "继续了解 segments、InterShardMemory、Foreign Segment 与全局缓存的使用边界。" },
    ],
    systemMap: {
      zhTitle: "从 tick 到可维护代码的状态链",
      enTitle: "From ticks to maintainable state",
      zhDescription: "先区分每 tick 重建的运行对象和需要跨 tick 保存的数据，再进入角色状态、缓存和模块边界。",
      enDescription: "Separate per-tick runtime objects from persistent state first, then move into role state, caching, and module boundaries.",
      steps: [
        step("Tick", "Tick", "主循环重新执行", "The main loop runs again"),
        step("Game 对象", "Game objects", "读取当前世界状态", "Read current world state"),
        step("Memory", "Memory", "保存跨 tick 状态", "Persist cross-tick state"),
        step("角色与缓存", "Roles and cache", "减少重复判断与计算", "Reduce repeated decisions and work"),
        step("模块边界", "Module boundaries", "让系统可维护和隔离", "Keep systems maintainable and isolated"),
      ],
    },
  },
  {
    id: "spawn-lifecycle",
    number: 2,
    title: "Spawn 与 Creep 生命周期",
    description: "从创建、出口方向、身体配置、房间 Energy 供能和多 Spawn 队列调度，到提前替换、续命、回收与断代恢复，管理 Creep 的完整生命周期。",
    audience: "已经会创建基础 Creep，希望减少重名、出口阻塞、重复排队、优先级反转、Energy 争用、换代空窗和房间断代问题的玩家。",
    learningGoal: "把单次 spawnCreep() 调用扩展为包含出口诊断、供能检查、统一队列、提前交接和故障恢复的 Creep 生命周期管理流程。",
    articleSource: "metadata",
    stages: [
      { id: "create-queue", title: "创建、出口、身体、供能与队列", description: "先读懂创建返回码和出口方向，根据可用 Energy 生成身体，诊断供能，再统一多个 Spawn 的优先级、去重和共享预算。" },
      { id: "replacement-retirement", title: "提前替换、续命与回收", description: "在旧 Creep 死亡前安排替代者，再理解 renewCreep() 和 recycleCreep() 的适用边界。" },
      { id: "emergency-recovery", title: "断代恢复", description: "最后处理房间没有工作 Creep 时的紧急恢复。" },
    ],
    systemMap: {
      zhTitle: "Spawn 与 Creep 生命周期",
      enTitle: "Spawn and Creep lifecycle",
      zhDescription: "把“需要一只 Creep”拆成 Body、Energy、生成、工作、替换和回收，而不是只关注 spawnCreep() 一次调用。",
      enDescription: "Treat the need for a Creep as a lifecycle of body design, Energy, spawning, work, replacement, and retirement rather than one spawnCreep() call.",
      steps: [
        step("需求出现", "Demand", "角色缺口或替换条件", "A role gap or replacement condition"),
        step("Body + Energy", "Body + Energy", "计算身体与可用容量", "Size the body against available capacity"),
        step("spawnCreep()", "spawnCreep()", "保存 dryRun 与真实返回值", "Store dryRun and real results"),
        step("工作 + TTL", "Work + TTL", "观察任务与寿命", "Track work and lifetime"),
        step("替换 / 回收", "Replace / recycle", "避免断代和无效占用", "Avoid downtime and wasted capacity"),
      ],
    },
  },
  {
    id: "room-economy",
    number: 3,
    title: "资源采集与房间经济",
    description: "先掌握 Store 容量语义，再覆盖 Container、掉落资源、Tombstone、Ruin、Storage、Link、Terminal 与 Mineral，让资源读取、保全、储存和运输形成清楚链路。",
    audience: "基础采集循环已经运行，希望正确读取 Store、减少空跑、防止 Container 腐化损毁、抢救遗留资源并建立房间资源链路的玩家。",
    learningGoal: "理解通用、受限和只读 Store 的容量差异，再把资源从 Source、掉落物、Tombstone 或 Ruin 安全移动到 Creep、Container、Storage、Link 和 Terminal。",
    articleSource: "metadata",
    stages: [
      { id: "store-container", title: "Store 与 Container 基础", description: "先区分已用、剩余、总容量及 0/null，再学习 Container 取能与腐化维修。" },
      { id: "resource-recovery", title: "获取与回收资源", description: "继续处理掉落 Energy、Tombstone、Ruin 和多 Source 选择。" },
      { id: "room-storage-transfer", title: "房间内储运", description: "理解 Storage 和 Link 在房间经济中的位置。" },
      { id: "interroom-minerals", title: "跨房间与矿物", description: "最后学习 Terminal 发送和 Mineral 采集。" },
    ],
    systemMap: {
      zhTitle: "房间 Energy 与资源流",
      enTitle: "Room Energy and resource flow",
      zhDescription: "从资源源头一直看到消费端，任何一段 Store、移动或容量断开都会让整个房间经济看起来“没能量”。",
      enDescription: "Follow resources from source to consumer; a break in Store state, movement, or capacity anywhere can make the whole economy look starved.",
      steps: [
        step("Source", "Source", "产生可采集资源", "Provides harvestable resources"),
        step("Harvester", "Harvester", "harvest 并进入 Store", "Harvests into Store"),
        step("Container / Link", "Container / Link", "缓冲或传输", "Buffers or transfers resources"),
        step("Hauler / Storage", "Hauler / Storage", "搬运和集中库存", "Moves and centralizes stock"),
        step("Spawn / Controller / Build", "Spawn / Controller / Build", "最终消费与扩张", "Consumes resources for growth"),
      ],
    },
  },
  {
    id: "movement-vision",
    number: 4,
    title: "移动、寻路与视野",
    description: "逐一解决距离、疲劳、无路径、跨房间路线、CostMatrix、房间可见性与远程观察问题。",
    audience: "遇到 Creep 不移动、找不到路径、跨房间失败或目标房间没有视野的玩家。",
    learningGoal: "从动作距离错误开始，逐步掌握路径成本、跨房间路线、疲劳和远程视野诊断。",
    articleSource: "metadata",
    stages: [
      { id: "common-errors", title: "先解决常见错误", description: "先排查距离不足、moveTo 不移动和 ERR_NO_PATH。" },
      { id: "path-costs", title: "理解路径与移动成本", description: "继续学习 CostMatrix、跨房间路线、距离 API 和 fatigue。" },
      { id: "vision-visualization", title: "视野与可视化", description: "最后处理房间可见性、Observer 和 RoomVisual 调试。" },
    ],
    systemMap: {
      zhTitle: "移动、视野与寻路判断链",
      enTitle: "Movement, vision, and pathfinding chain",
      zhDescription: "先确认目标和视野，再区分房间级路线与格子级 PathFinder，最后用后续 tick 的位置变化验证结果。",
      enDescription: "Confirm target and visibility first, separate room-level routing from tile-level PathFinder work, then verify movement on later ticks.",
      steps: [
        step("目标", "Target", "对象和房间是否有效", "Is the object and room valid?"),
        step("视野", "Vision", "Game.rooms 是否可见", "Is Game.rooms visibility available?"),
        step("房间路线", "Room route", "findRoute 规划跨房间", "Use findRoute across rooms"),
        step("格子路径", "Tile path", "PathFinder / CostMatrix", "Use PathFinder / CostMatrix"),
        step("下一 tick", "Later tick", "位置、fatigue、返回值复核", "Recheck position, fatigue, and results"),
      ],
    },
  },
  {
    id: "controller-control",
    number: 5,
    title: "Controller 与房间控制",
    description: "从固定 Upgrader 与 Controller Link 供能诊断，继续处理 Safe Mode、Controller 降级、预订与占领边界。",
    audience: "开始使用固定升级站位、Controller Link，或管理 Controller 安全、降级风险和远程控制权的玩家。",
    learningGoal: "先建立可诊断的固定升级链路，再理解 Controller 安全、降级、所有权、预订和扩张边界。",
    articleSource: "metadata",
    stages: [
      { id: "fixed-upgrade", title: "固定升级链路", description: "先排查 anchor、Controller Link、Energy、身体部件和升级返回值。" },
      { id: "safety-lifecycle", title: "安全与生命周期", description: "继续理解 Safe Mode 和 Controller 降级。" },
      { id: "reservation-claim", title: "预订与占领", description: "最后区分 reserveController() 与 claimController()。" },
    ],
    systemMap: {
      zhTitle: "Controller 控制与升级链",
      enTitle: "Controller control and upgrade chain",
      zhDescription: "Controller 是否安全取决于 Energy 供给、Upgrader、距离、upgradeController() 返回值和多 tick 的进度变化。",
      enDescription: "Controller safety depends on Energy supply, the Upgrader, range, upgradeController() results, and progress across multiple ticks.",
      steps: [
        step("Energy 供给", "Energy supply", "Container / Link / Hauler", "Container / Link / Hauler"),
        step("Upgrader", "Upgrader", "持有 WORK 与 Energy", "Carries WORK and Energy"),
        step("upgradeController()", "upgradeController()", "检查距离和返回值", "Check range and result"),
        step("RCL / Downgrade", "RCL / downgrade", "观察进度和降级压力", "Watch progress and downgrade pressure"),
        step("结构 / 扩张", "Structures / expansion", "解锁能力或进入 reserve/claim", "Unlock capacity or move into reserve/claim"),
      ],
    },
  },
  {
    id: "construction-defense",
    number: 6,
    title: "建设与防御",
    description: "管理 Construction Site、建筑拆除、Tower 动作、Rampart 通行、墙体维修和高等级防御建筑。",
    audience: "已经能建造基础建筑，准备管理工地生命周期、Tower 和防御建筑的玩家。",
    learningGoal: "把放置工地、跟踪进度、清理错误建筑和防御动作整理成可检查的房间建设流程。",
    articleSource: "metadata",
    stages: [
      { id: "construction-management", title: "工地与建筑管理", description: "先学习创建、查看、删除工地和拆除完整建筑。" },
      { id: "tower-actions", title: "Tower 动作", description: "继续处理 Tower 的攻击、维修和治疗。" },
      { id: "defense-structures", title: "防御建筑", description: "最后管理 Rampart、Wall 和 Nuker。" },
    ],
    systemMap: {
      zhTitle: "建设到防御的结构生命周期",
      enTitle: "Structure lifecycle from construction to defense",
      zhDescription: "先创建 Construction Site，再通过 build 完成结构；投入运行后继续用 Tower、Rampart 和 repair 维持房间安全。",
      enDescription: "Create a Construction Site, finish it with build, then keep the resulting structure safe with Towers, Ramparts, and repair policies.",
      steps: [
        step("规划位置", "Plan position", "确认 RCL 与坐标", "Confirm RCL and coordinates"),
        step("Construction Site", "Construction Site", "创建并观察 progress", "Create and track progress"),
        step("build()", "build()", "Builder 推进施工", "Builder advances construction"),
        step("结构投入运行", "Active structure", "开始承担房间功能", "Begins serving the room"),
        step("Tower / repair / Rampart", "Tower / repair / Rampart", "持续维护与防御", "Maintain and defend over time"),
      ],
    },
  },
  {
    id: "market-advanced-resources",
    number: 7,
    title: "市场与高级资源",
    description: "从市场成交、创建和维护订单继续进入 Lab、Factory 与 Power Spawn，每篇聚焦一个清晰的高级资源任务。",
    audience: "房间经济已经稳定，开始使用市场、维护订单、Boost、Commodity 或 Power 的玩家。",
    learningGoal: "掌握市场与高级资源系统中的前置条件、费用、返回结果和执行顺序，避免重复创建订单或只复制一条 API 调用。",
    articleSource: "metadata",
    stages: [
      { id: "market-operations", title: "市场操作", description: "先学习即时成交、创建订单，再安全执行改价、扩量和取消。" },
      { id: "lab-boost", title: "Lab 与 Boost", description: "继续理解反应与强化 Creep 的基本流程。" },
      { id: "production-power", title: "生产与 Power", description: "最后进入 Factory 和 Power Spawn。" },
    ],
    systemMap: {
      zhTitle: "高级资源与市场流转链",
      enTitle: "Advanced resource and Market flow",
      zhDescription: "把库存、Terminal、Market、Lab 和生产系统看成一条资源决策链，避免只根据订单价格执行动作。",
      enDescription: "Treat stock, Terminal, Market, Labs, and production as one resource-decision chain instead of acting on order price alone.",
      steps: [
        step("库存", "Stock", "确认 Store 与资源类型", "Confirm Store and resource type"),
        step("Terminal", "Terminal", "检查 cooldown 与交易 Energy", "Check cooldown and transaction Energy"),
        step("Market", "Market", "订单、Credits 与手续费", "Orders, Credits, and fees"),
        step("Lab / Factory", "Lab / Factory", "反应、Boost 或生产", "React, Boost, or produce"),
        step("再平衡", "Rebalance", "重新评估库存和成本", "Re-evaluate stock and cost"),
      ],
    },
  },
  {
    id: "operations-debugging",
    number: 8,
    title: "工程配置与运行诊断",
    description: "使用 Flag、CPU 指标、自动降载、通知、事件日志和房间级异常隔离观察系统，把配置、性能保护和故障恢复从具体业务动作中分离出来。",
    audience: "代码已经开始变长，希望知道系统为什么变慢、报错或停止工作，并在 CPU 储备恶化或单个房间异常时保住关键任务的玩家。",
    learningGoal: "建立配置、CPU 测量、任务降载、通知、事件观察和异常隔离能力，把运行指标与错误记录转成可恢复的执行策略。",
    articleSource: "legacy",
    stages: [
      { id: "config-performance", title: "配置与性能保护", description: "先使用 Flag 配置，观察 CPU 和 bucket，再按任务等级自动降载与恢复。", legacyFrom: 0, legacyTo: 3 },
      { id: "notifications-events", title: "通知与事件", description: "继续使用 Game.notify() 和 Room Event Log。", legacyFrom: 3, legacyTo: 5 },
      { id: "isolation-recovery", title: "异常隔离与恢复", description: "最后为房间和独立模块建立错误边界、限频日志、冷却和自动重试。", legacyFrom: 5, legacyTo: 6 },
    ],
    legacySlugs: [
      "screeps-flags-config",
      "screeps-cpu-getused-bucket",
      "screeps-cpu-bucket-degradation",
      "screeps-game-notify",
      "screeps-room-event-log",
      "screeps-room-error-isolation",
    ],
    systemMap: {
      zhTitle: "运行诊断与恢复闭环",
      enTitle: "Operational debugging and recovery loop",
      zhDescription: "先测量和记录，再隔离故障；当 CPU 或房间状态恶化时降低非关键工作，恢复后再逐步放开。",
      enDescription: "Measure and record first, isolate failures next, shed noncritical work under pressure, then restore work gradually after recovery.",
      steps: [
        step("Measure", "Measure", "CPU、bucket、状态指标", "CPU, bucket, state metrics"),
        step("Observe", "Observe", "日志、notify、Event Log", "Logs, notify, Event Log"),
        step("Isolate", "Isolate", "房间或模块错误边界", "Room or module error boundaries"),
        step("Degrade", "Degrade", "降低非关键任务", "Reduce noncritical work"),
        step("Recover", "Recover", "冷却、重试并验证恢复", "Cooldown, retry, and verify recovery"),
      ],
    },
  },
];

export function getKnowledgeModuleConfig(
  id: string,
): KnowledgeModuleConfig | null {
  return knowledgeModuleRegistry.find((module) => module.id === id) ?? null;
}

export function getKnowledgeModuleConfigByNumber(
  number: number,
): KnowledgeModuleConfig | null {
  return knowledgeModuleRegistry.find((module) => module.number === number) ?? null;
}
