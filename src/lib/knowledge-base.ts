export interface KnowledgeBaseStage {
  title: string;
  description: string;
  from: number;
  to: number;
}

export interface KnowledgeBaseSection {
  id: string;
  number: number;
  title: string;
  description: string;
  audience: string;
  learningGoal: string;
  stages: readonly KnowledgeBaseStage[];
  slugs: readonly string[];
}

export const knowledgeBaseSections: readonly KnowledgeBaseSection[] = [
  {
    id: "memory-engineering",
    number: 1,
    title: "Memory 与代码工程",
    description: "保存跨 tick 状态、恢复对象引用、清理过期数据，并逐步理解模块拆分、segments、跨 Shard 状态与全局缓存。",
    audience: "已经完成新手路线，准备从固定名称代码进入可维护结构的玩家。",
    learningGoal: "理解哪些数据应该跨 tick 或跨 Shard 保存、怎样安全恢复对象，以及如何把不断增长的主循环拆成清楚的代码模块。",
    stages: [
      { title: "状态基础", description: "先理解 Memory、死亡数据清理和工作状态切换。", from: 0, to: 3 },
      { title: "对象与模块", description: "学习通过 ID 恢复对象，并用 require 拆分代码。", from: 3, to: 5 },
      { title: "高级存储与缓存", description: "继续了解 segments、InterShardMemory 与全局缓存的使用边界。", from: 5, to: 8 },
    ],
    slugs: [
      "screeps-memory-basics",
      "screeps-clean-dead-creep-memory",
      "screeps-creep-working-state",
      "screeps-game-get-object-by-id",
      "screeps-modules-require",
      "screeps-rawmemory-segments",
      "screeps-intershardmemory-sync",
      "screeps-global-cache",
    ],
  },
  {
    id: "spawn-lifecycle",
    number: 2,
    title: "Spawn 与 Creep 生命周期",
    description: "从创建、出口方向、身体配置、房间 Energy 供能和多 Spawn 队列调度，到提前替换、续命、回收与断代恢复，管理 Creep 的完整生命周期。",
    audience: "已经会创建基础 Creep，希望减少重名、出口阻塞、重复排队、优先级反转、Energy 争用、换代空窗和房间断代问题的玩家。",
    learningGoal: "把单次 spawnCreep() 调用扩展为包含出口诊断、供能检查、统一队列、提前交接和故障恢复的 Creep 生命周期管理流程。",
    stages: [
      { title: "创建、出口、身体、供能与队列", description: "先读懂创建返回码和出口方向，根据可用 Energy 生成身体，诊断供能，再统一多个 Spawn 的优先级、去重和共享预算。", from: 0, to: 5 },
      { title: "提前替换、续命与回收", description: "在旧 Creep 死亡前安排替代者，再理解 renewCreep() 和 recycleCreep() 的适用边界。", from: 5, to: 8 },
      { title: "断代恢复", description: "最后处理房间没有工作 Creep 时的紧急恢复。", from: 8, to: 9 },
    ],
    slugs: [
      "screeps-spawncreep-return-codes",
      "screeps-spawn-exit-blocked-directions",
      "screeps-dynamic-creep-body-energy",
      "screeps-room-energyavailable-stuck",
      "screeps-multi-spawn-queue",
      "screeps-creep-prespawn-replacement",
      "screeps-spawn-renew-creep",
      "screeps-spawn-recycle-creep",
      "screeps-spawn-emergency-recovery",
    ],
  },
  {
    id: "room-economy",
    number: 3,
    title: "资源采集与房间经济",
    description: "先掌握 Store 容量语义，再覆盖 Container、掉落资源、Tombstone、Ruin、Storage、Link、Terminal 与 Mineral，让资源读取、保全、储存和运输形成清楚链路。",
    audience: "基础采集循环已经运行，希望正确读取 Store、减少空跑、防止 Container 腐化损毁、抢救遗留资源并建立房间资源链路的玩家。",
    learningGoal: "理解通用、受限和只读 Store 的容量差异，再把资源从 Source、掉落物、Tombstone 或 Ruin 安全移动到 Creep、Container、Storage、Link 和 Terminal。",
    stages: [
      { title: "Store 与 Container 基础", description: "先区分已用、剩余、总容量及 0/null，再学习 Container 取能与腐化维修。", from: 0, to: 3 },
      { title: "获取与回收资源", description: "继续处理掉落 Energy、Tombstone、Ruin 和多 Source 选择。", from: 3, to: 6 },
      { title: "房间内储运", description: "理解 Storage 和 Link 在房间经济中的位置。", from: 6, to: 8 },
      { title: "跨房间与矿物", description: "最后学习 Terminal 发送和 Mineral 采集。", from: 8, to: 10 },
    ],
    slugs: [
      "screeps-store-capacity-api",
      "screeps-creep-withdraw-container-energy",
      "screeps-container-decay-repair-deadline",
      "screeps-creep-pickup-dropped-energy",
      "screeps-tombstone-ruin-recovery",
      "screeps-select-source-by-path",
      "screeps-storage-energy-usage",
      "screeps-link-transfer-energy",
      "screeps-terminal-send-resources",
      "screeps-mineral-extractor-harvest",
    ],
  },
  {
    id: "movement-vision",
    number: 4,
    title: "移动、寻路与视野",
    description: "逐一解决距离、疲劳、无路径、跨房间路线、CostMatrix、房间可见性与远程观察问题。",
    audience: "遇到 Creep 不移动、找不到路径、跨房间失败或目标房间没有视野的玩家。",
    learningGoal: "从动作距离错误开始，逐步掌握路径成本、跨房间路线、疲劳和远程视野诊断。",
    stages: [
      { title: "先解决常见错误", description: "先排查距离不足、moveTo 不移动和 ERR_NO_PATH。", from: 0, to: 3 },
      { title: "理解路径与移动成本", description: "继续学习 CostMatrix、跨房间路线、距离 API 和 fatigue。", from: 3, to: 7 },
      { title: "视野与可视化", description: "最后处理房间可见性、Observer 和 RoomVisual 调试。", from: 7, to: 10 },
    ],
    slugs: [
      "screeps-err-not-in-range",
      "screeps-moveto-not-moving",
      "screeps-err-no-path",
      "screeps-pathfinder-costmatrix",
      "screeps-map-find-route",
      "screeps-roomposition-distance",
      "screeps-move-fatigue-body-ratio",
      "screeps-room-visibility",
      "screeps-observer-observe-room",
      "screeps-roomvisual-debug",
    ],
  },
  {
    id: "controller-control",
    number: 5,
    title: "Controller 与房间控制",
    description: "从固定 Upgrader 与 Controller Link 供能诊断，继续处理 Safe Mode、Controller 降级、预订与占领边界。",
    audience: "开始使用固定升级站位、Controller Link，或管理 Controller 安全、降级风险和远程控制权的玩家。",
    learningGoal: "先建立可诊断的固定升级链路，再理解 Controller 安全、降级、所有权、预订和扩张边界。",
    stages: [
      { title: "固定升级链路", description: "先排查 anchor、Controller Link、Energy、身体部件和升级返回值。", from: 0, to: 1 },
      { title: "安全与生命周期", description: "继续理解 Safe Mode 和 Controller 降级。", from: 1, to: 3 },
      { title: "预订与占领", description: "最后区分 reserveController() 与 claimController()。", from: 3, to: 4 },
    ],
    slugs: [
      "screeps-upgrader-controller-link-not-upgrading",
      "screeps-controller-activate-safe-mode",
      "screeps-controller-downgrade",
      "screeps-reserve-vs-claim-controller",
    ],
  },
  {
    id: "construction-defense",
    number: 6,
    title: "建设与防御",
    description: "管理 Construction Site、建筑拆除、Tower 动作、Rampart 通行、墙体维修和高等级防御建筑。",
    audience: "已经能建造基础建筑，准备管理工地生命周期、Tower 和防御建筑的玩家。",
    learningGoal: "把放置工地、跟踪进度、清理错误建筑和防御动作整理成可检查的房间建设流程。",
    stages: [
      { title: "工地与建筑管理", description: "先学习创建、查看、删除工地和拆除完整建筑。", from: 0, to: 4 },
      { title: "Tower 动作", description: "继续处理 Tower 的攻击、维修和治疗。", from: 4, to: 7 },
      { title: "防御建筑", description: "最后管理 Rampart、Wall 和 Nuker。", from: 7, to: 10 },
    ],
    slugs: [
      "screeps-room-create-construction-site",
      "screeps-construction-site-progress",
      "screeps-construction-site-remove",
      "screeps-structure-destroy",
      "screeps-tower-auto-attack-hostiles",
      "screeps-tower-repair-threshold",
      "screeps-tower-heal-creeps",
      "screeps-rampart-set-public",
      "screeps-wall-rampart-repair-limit",
      "screeps-nuker-launch-checklist",
    ],
  },
  {
    id: "market-advanced-resources",
    number: 7,
    title: "市场与高级资源",
    description: "从市场成交、创建和维护订单继续进入 Lab、Factory 与 Power Spawn，每篇聚焦一个清晰的高级资源任务。",
    audience: "房间经济已经稳定，开始使用市场、维护订单、Boost、Commodity 或 Power 的玩家。",
    learningGoal: "掌握市场与高级资源系统中的前置条件、费用、返回结果和执行顺序，避免重复创建订单或只复制一条 API 调用。",
    stages: [
      { title: "市场操作", description: "先学习即时成交、创建订单，再安全执行改价、扩量和取消。", from: 0, to: 3 },
      { title: "Lab 与 Boost", description: "继续理解反应与强化 Creep 的基本流程。", from: 3, to: 5 },
      { title: "生产与 Power", description: "最后进入 Factory 和 Power Spawn。", from: 5, to: 7 },
    ],
    slugs: [
      "screeps-market-deal",
      "screeps-market-create-order",
      "screeps-market-order-maintenance",
      "screeps-lab-run-reaction",
      "screeps-lab-boost-creep",
      "screeps-factory-produce",
      "screeps-power-spawn-process-power",
    ],
  },
  {
    id: "operations-debugging",
    number: 8,
    title: "工程配置与运行诊断",
    description: "使用 Flag、CPU 指标、自动降载、通知、事件日志和房间级异常隔离观察系统，把配置、性能保护和故障恢复从具体业务动作中分离出来。",
    audience: "代码已经开始变长，希望知道系统为什么变慢、报错或停止工作，并在 CPU 储备恶化或单个房间异常时保住关键任务的玩家。",
    learningGoal: "建立配置、CPU 测量、任务降载、通知、事件观察和异常隔离能力，把运行指标与错误记录转成可恢复的执行策略。",
    stages: [
      { title: "配置与性能保护", description: "先使用 Flag 配置，观察 CPU 和 bucket，再按任务等级自动降载与恢复。", from: 0, to: 3 },
      { title: "通知与事件", description: "继续使用 Game.notify() 和 Room Event Log。", from: 3, to: 5 },
      { title: "异常隔离与恢复", description: "最后为房间和独立模块建立错误边界、限频日志、冷却和自动重试。", from: 5, to: 6 },
    ],
    slugs: [
      "screeps-flags-config",
      "screeps-cpu-getused-bucket",
      "screeps-cpu-bucket-degradation",
      "screeps-game-notify",
      "screeps-room-event-log",
      "screeps-room-error-isolation",
    ],
  },
];

export const knowledgeBaseSlugs = knowledgeBaseSections.flatMap((section) => [
  ...section.slugs,
]);

export function getKnowledgeBaseSection(id: string): KnowledgeBaseSection | null {
  return knowledgeBaseSections.find((section) => section.id === id) ?? null;
}

export function getKnowledgeBaseSectionBySlug(slug: string): KnowledgeBaseSection | null {
  return knowledgeBaseSections.find((section) => section.slugs.includes(slug)) ?? null;
}

export function getKnowledgeBaseSectionId(slug: string): string | null {
  return getKnowledgeBaseSectionBySlug(slug)?.id ?? null;
}

export function getKnowledgeBasePostPosition(slug: string): {
  section: KnowledgeBaseSection;
  index: number;
  previousSlug: string | null;
  nextSlug: string | null;
} | null {
  const section = getKnowledgeBaseSectionBySlug(slug);
  if (!section) return null;

  const index = section.slugs.indexOf(slug);
  return {
    section,
    index,
    previousSlug: index > 0 ? section.slugs[index - 1] : null,
    nextSlug: index < section.slugs.length - 1 ? section.slugs[index + 1] : null,
  };
}
