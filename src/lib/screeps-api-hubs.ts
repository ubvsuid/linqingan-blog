export const screepsApiHubSlugs = [
  "creep",
  "room",
  "structure-spawn",
  "controller",
  "market",
  "structure-link",
  "structure-tower",
  "structure-terminal",
  "structure-lab",
  "path-finder",
  "store",
] as const;

export type ScreepsApiHubSlug = (typeof screepsApiHubSlugs)[number];
export type ScreepsApiHubLocale = "zh" | "en";

export interface ScreepsApiHubLink {
  zhLabel: string;
  enLabel: string;
  zhHref: string;
  enHref: string;
}

export interface ScreepsApiHubConfig {
  slug: ScreepsApiHubSlug;
  objectName: string;
  zhTitle: string;
  enTitle: string;
  zhDescription: string;
  enDescription: string;
  zhScope: string;
  enScope: string;
  entryIds: readonly string[];
  errorNames: readonly string[];
  tools: readonly ScreepsApiHubLink[];
  modules: readonly ScreepsApiHubLink[];
  extraGuides?: readonly ScreepsApiHubLink[];
  keywords: readonly string[];
}

export const screepsApiHubs: readonly ScreepsApiHubConfig[] = [
  {
    slug: "creep",
    objectName: "Creep",
    zhTitle: "Creep API Hub",
    enTitle: "Creep API Hub",
    zhDescription:
      "把移动、采集、搬运与 Controller 升级相关的 Creep API、返回码、教程和工具集中到一个入口。",
    enDescription:
      "A focused hub for Creep movement, harvesting, hauling, Controller upgrading, return codes, guides, and tools.",
    zhScope:
      "这里不重复写一套 Creep 教程，而是把现有动作 API 与故障排查路径连接起来。状态改变类调用仍应保存返回值，并在后续 tick 核对位置、Store 或目标状态。",
    enScope:
      "This hub does not duplicate the existing Creep tutorials. It connects action APIs to debugging paths. Save return codes for state-changing calls and verify position, Store, or target state on later ticks.",
    entryIds: [
      "creep-move-to",
      "creep-harvest",
      "creep-transfer",
      "creep-withdraw",
      "creep-pickup",
      "creep-upgrade-controller",
    ],
    errorNames: [
      "ERR_NOT_IN_RANGE",
      "ERR_NO_PATH",
      "ERR_INVALID_TARGET",
      "ERR_FULL",
      "ERR_TIRED",
      "ERR_NO_BODYPART",
      "ERR_NOT_ENOUGH_RESOURCES",
    ],
    tools: [
      {
        zhLabel: "Creep 身体计算器",
        enLabel: "Creep Body Calculator",
        zhHref: "/tools/creep-body-calculator",
        enHref: "/en/tools/creep-body-calculator",
      },
      {
        zhLabel: "运输吞吐量规划器",
        enLabel: "Hauling Throughput Planner",
        zhHref: "/tools/hauling-throughput-planner",
        enHref: "/en/tools/hauling-throughput-planner",
      },
      {
        zhLabel: "Controller 降级与 Upgrader 规划器",
        enLabel: "Controller Downgrade and Upgrader Planner",
        zhHref: "/tools/controller-downgrade-planner",
        enHref: "/en/tools/controller-downgrade-planner",
      },
    ],
    modules: [
      {
        zhLabel: "Spawn 与 Creep 生命周期",
        enLabel: "Spawn and Creep Lifecycle",
        zhHref: "/knowledge/spawn-lifecycle",
        enHref: "/en/knowledge/spawn-creep-lifecycle",
      },
      {
        zhLabel: "移动、寻路与视野",
        enLabel: "Movement and Vision",
        zhHref: "/knowledge/movement-vision",
        enHref: "/en/knowledge/movement-vision",
      },
      {
        zhLabel: "资源采集与房间经济",
        enLabel: "Room Economy",
        zhHref: "/knowledge/room-economy",
        enHref: "/en/knowledge/room-economy",
      },
    ],
    keywords: ["Creep", "moveTo", "harvest", "transfer", "withdraw", "pickup", "upgradeController"],
  },
  {
    slug: "room",
    objectName: "Room",
    zhTitle: "Room API Hub",
    enTitle: "Room API Hub",
    zhDescription:
      "集中查看房间视野、Construction Site、Event Log 与房间级诊断相关入口。",
    enDescription:
      "A focused hub for room visibility, Construction Sites, Event Log, and room-level diagnostics.",
    zhScope:
      "Room 本身既是可见性边界，也是大量对象查询和房间级状态的容器。这个 Hub 只聚合当前站内已经覆盖的 Room 入口，不把尚未写入 Reference 的方法伪装成完整 API 文档。",
    enScope:
      "Room is both a visibility boundary and a container for room-level state. This hub only aggregates Room surfaces already covered by the site and does not pretend to be a complete API reference.",
    entryIds: ["game-rooms", "room-create-construction-site", "room-get-event-log"],
    errorNames: ["ERR_INVALID_ARGS", "ERR_INVALID_TARGET", "ERR_RCL_NOT_ENOUGH", "ERR_NOT_OWNER"],
    tools: [
      {
        zhLabel: "房间运行诊断",
        enLabel: "Room Snapshot Diagnostic",
        zhHref: "/tools/room-diagnostics",
        enHref: "/en/tools/room-diagnostics",
      },
    ],
    modules: [
      {
        zhLabel: "资源采集与房间经济",
        enLabel: "Room Economy",
        zhHref: "/knowledge/room-economy",
        enHref: "/en/knowledge/room-economy",
      },
      {
        zhLabel: "建设与防御",
        enLabel: "Construction and Defense",
        zhHref: "/knowledge/construction-defense",
        enHref: "/en/knowledge/construction-defense",
      },
      {
        zhLabel: "工程配置与运行诊断",
        enLabel: "Operations and Debugging",
        zhHref: "/knowledge/operations-debugging",
        enHref: "/en/knowledge/operations-debugging",
      },
    ],
    keywords: ["Room", "Game.rooms", "visibility", "createConstructionSite", "getEventLog"],
  },
  {
    slug: "structure-spawn",
    objectName: "StructureSpawn",
    zhTitle: "StructureSpawn API Hub",
    enTitle: "StructureSpawn API Hub",
    zhDescription:
      "把 spawnCreep()、renewCreep()、recycleCreep()、Spawn 返回码和容量规划集中在一起。",
    enDescription:
      "A focused hub for spawnCreep(), renewCreep(), recycleCreep(), Spawn return codes, and capacity planning.",
    zhScope:
      "Spawn 的重点不是记住一条创建语句，而是把名称、Body、Energy、忙碌状态、替换时机与返回值放在同一条生命周期链路里检查。",
    enScope:
      "Spawn work is more than memorizing one creation call. Name, body, Energy, busy state, replacement timing, and return codes belong to one lifecycle workflow.",
    entryIds: ["spawn-spawn-creep", "spawn-renew-creep", "spawn-recycle-creep"],
    errorNames: [
      "ERR_NAME_EXISTS",
      "ERR_BUSY",
      "ERR_NOT_ENOUGH_RESOURCES",
      "ERR_INVALID_ARGS",
      "ERR_NOT_IN_RANGE",
      "ERR_RCL_NOT_ENOUGH",
    ],
    tools: [
      {
        zhLabel: "Creep 身体计算器",
        enLabel: "Creep Body Calculator",
        zhHref: "/tools/creep-body-calculator",
        enHref: "/en/tools/creep-body-calculator",
      },
      {
        zhLabel: "Spawn 队列与替换规划器",
        enLabel: "Spawn Queue and Replacement Planner",
        zhHref: "/tools/spawn-queue-replacement-planner",
        enHref: "/en/tools/spawn-queue-replacement-planner",
      },
      {
        zhLabel: "房间运行诊断",
        enLabel: "Room Snapshot Diagnostic",
        zhHref: "/tools/room-diagnostics",
        enHref: "/en/tools/room-diagnostics",
      },
    ],
    modules: [
      {
        zhLabel: "Spawn 与 Creep 生命周期",
        enLabel: "Spawn and Creep Lifecycle",
        zhHref: "/knowledge/spawn-lifecycle",
        enHref: "/en/knowledge/spawn-creep-lifecycle",
      },
    ],
    keywords: ["StructureSpawn", "spawnCreep", "renewCreep", "recycleCreep", "Spawn", "body", "Energy"],
  },
  {
    slug: "controller",
    objectName: "StructureController",
    zhTitle: "Controller API Hub",
    enTitle: "Controller API Hub",
    zhDescription:
      "连接 Controller 升级、降级风险、Safe Mode、预订与占领相关教程、工具和返回码。",
    enDescription:
      "A focused hub for Controller upgrading, downgrade risk, Safe Mode, reservation, claiming, tools, and return codes.",
    zhScope:
      "当前快速 Reference 里与 Controller 直接关联的动作入口以 creep.upgradeController() 为主；Safe Mode、降级、reserve 与 claim 继续由已有专题教程承载。",
    enScope:
      "The current quick reference is anchored by creep.upgradeController() for Controller actions. Safe Mode, downgrade, reserve, and claim remain covered by the existing focused guides.",
    entryIds: ["creep-upgrade-controller"],
    errorNames: ["ERR_NOT_IN_RANGE", "ERR_NOT_OWNER", "ERR_RCL_NOT_ENOUGH", "ERR_GCL_NOT_ENOUGH", "ERR_INVALID_TARGET"],
    tools: [
      {
        zhLabel: "Controller 降级与 Upgrader 规划器",
        enLabel: "Controller Downgrade and Upgrader Planner",
        zhHref: "/tools/controller-downgrade-planner",
        enHref: "/en/tools/controller-downgrade-planner",
      },
      {
        zhLabel: "房间运行诊断",
        enLabel: "Room Snapshot Diagnostic",
        zhHref: "/tools/room-diagnostics",
        enHref: "/en/tools/room-diagnostics",
      },
    ],
    modules: [
      {
        zhLabel: "Controller 与房间控制",
        enLabel: "Controllers and Expansion",
        zhHref: "/knowledge/controller-control",
        enHref: "/en/knowledge/controllers-expansion",
      },
    ],
    extraGuides: [
      {
        zhLabel: "Controller Safe Mode",
        enLabel: "Controller Safe Mode",
        zhHref: "/blog/screeps-controller-activate-safe-mode",
        enHref: "/en/blog/screeps-controller-activate-safe-mode",
      },
      {
        zhLabel: "Controller 降级与恢复",
        enLabel: "Controller Downgrade and Recovery",
        zhHref: "/blog/screeps-controller-downgrade",
        enHref: "/en/blog/screeps-controller-downgrade",
      },
      {
        zhLabel: "reserveController 与 claimController",
        enLabel: "reserveController vs claimController",
        zhHref: "/blog/screeps-reserve-vs-claim-controller",
        enHref: "/en/blog/screeps-reserve-vs-claim-controller",
      },
    ],
    keywords: ["Controller", "StructureController", "upgradeController", "downgrade", "Safe Mode", "reserveController", "claimController"],
  },
  {
    slug: "market",
    objectName: "Game.market",
    zhTitle: "Market API Hub",
    enTitle: "Market API Hub",
    zhDescription:
      "集中查看 Game.market 成交、创建订单、Terminal 运输预算与市场相关工具。",
    enDescription:
      "A focused hub for Game.market deals, order creation, Terminal transport budgeting, and Market tools.",
    zhScope:
      "市场操作要同时看订单、Credits、资源库存和 Terminal 交易成本。Hub 只连接站内已覆盖的 deal、createOrder 与 Terminal 发送链路，不替代官方 Market API。",
    enScope:
      "Market operations combine orders, Credits, resource stock, and Terminal transaction cost. This hub connects the site's deal, createOrder, and Terminal-send coverage without replacing the official Market API.",
    entryIds: ["market-deal", "market-create-order", "terminal-send"],
    errorNames: ["ERR_INVALID_ARGS", "ERR_NOT_ENOUGH_RESOURCES", "ERR_NOT_FOUND"],
    tools: [
      {
        zhLabel: "Market 与 Terminal 成本计算器",
        enLabel: "Market and Terminal Cost Calculator",
        zhHref: "/tools/market-terminal-cost-calculator",
        enHref: "/en/tools/market-terminal-cost-calculator",
      },
    ],
    modules: [
      {
        zhLabel: "市场与高级资源",
        enLabel: "Market and Advanced Resources",
        zhHref: "/knowledge/market-advanced-resources",
        enHref: "/en/knowledge/market-advanced-resources",
      },
      {
        zhLabel: "资源采集与房间经济",
        enLabel: "Room Economy",
        zhHref: "/knowledge/room-economy",
        enHref: "/en/knowledge/room-economy",
      },
    ],
    keywords: ["Game.market", "Market", "deal", "createOrder", "Terminal", "Credits", "transaction cost"],
  },
  {
    slug: "structure-link",
    objectName: "StructureLink",
    zhTitle: "StructureLink API Hub",
    enTitle: "StructureLink API Hub",
    zhDescription:
      "把 Link 传能、cooldown、容量、房间内物流和 Controller 供能排查放进同一条入口。",
    enDescription:
      "A focused hub for Link Energy transfer, cooldown, capacity, room logistics, and Controller supply debugging.",
    zhScope:
      "Link 的问题通常不是单看 transferEnergy()。发送端库存、接收端剩余容量、cooldown、目标 Link 与下一 tick 的 Store 变化应该一起核对。",
    enScope:
      "Link debugging should not stop at transferEnergy(). Check sender stock, receiver free capacity, cooldown, target identity, and next-tick Store changes together.",
    entryIds: ["link-transfer-energy"],
    errorNames: ["ERR_TIRED", "ERR_NOT_ENOUGH_RESOURCES", "ERR_FULL", "ERR_INVALID_TARGET", "ERR_RCL_NOT_ENOUGH"],
    tools: [
      {
        zhLabel: "运输吞吐量规划器",
        enLabel: "Hauling Throughput Planner",
        zhHref: "/tools/hauling-throughput-planner",
        enHref: "/en/tools/hauling-throughput-planner",
      },
      {
        zhLabel: "房间运行诊断",
        enLabel: "Room Snapshot Diagnostic",
        zhHref: "/tools/room-diagnostics",
        enHref: "/en/tools/room-diagnostics",
      },
    ],
    modules: [
      {
        zhLabel: "资源采集与房间经济",
        enLabel: "Room Economy",
        zhHref: "/knowledge/room-economy",
        enHref: "/en/knowledge/room-economy",
      },
      {
        zhLabel: "Controller 与房间控制",
        enLabel: "Controllers and Expansion",
        zhHref: "/knowledge/controller-control",
        enHref: "/en/knowledge/controllers-expansion",
      },
    ],
    extraGuides: [
      {
        zhLabel: "Upgrader 与 Controller Link 不升级排查",
        enLabel: "Upgrader and Controller Link debugging",
        zhHref: "/blog/screeps-upgrader-controller-link-not-upgrading",
        enHref: "/en/blog/screeps-upgrader-controller-link-not-upgrading",
      },
    ],
    keywords: ["StructureLink", "Link", "transferEnergy", "cooldown", "Controller Link", "Energy"],
  },
  {
    slug: "structure-tower",
    objectName: "StructureTower",
    zhTitle: "StructureTower API Hub",
    enTitle: "StructureTower API Hub",
    zhDescription:
      "集中查看 Tower 攻击、治疗、维修、距离衰减、Energy 预算与防御规划。",
    enDescription:
      "A focused hub for Tower attack, heal, repair, range falloff, Energy budgeting, and defense planning.",
    zhScope:
      "Tower 每 tick 只有一次主要行动机会。目标选择、距离衰减、Energy 与多塔叠加效果应放在同一个防御决策里检查。",
    enScope:
      "A Tower has one primary action opportunity per tick. Target selection, range falloff, Energy, and multi-Tower output belong to the same defense decision.",
    entryIds: ["tower-attack-heal-repair"],
    errorNames: ["ERR_NOT_OWNER", "ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_TARGET", "ERR_RCL_NOT_ENOUGH"],
    tools: [
      {
        zhLabel: "Tower 伤害、治疗与维修计算器",
        enLabel: "Tower Damage, Heal, and Repair Calculator",
        zhHref: "/tools/tower-damage-heal-repair-calculator",
        enHref: "/en/tools/tower-damage-heal-repair-calculator",
      },
      {
        zhLabel: "房间运行诊断",
        enLabel: "Room Snapshot Diagnostic",
        zhHref: "/tools/room-diagnostics",
        enHref: "/en/tools/room-diagnostics",
      },
    ],
    modules: [
      {
        zhLabel: "建设与防御",
        enLabel: "Construction and Defense",
        zhHref: "/knowledge/construction-defense",
        enHref: "/en/knowledge/construction-defense",
      },
    ],
    extraGuides: [
      {
        zhLabel: "Tower 自动攻击敌人",
        enLabel: "Tower automatic hostile targeting",
        zhHref: "/blog/screeps-tower-auto-attack-hostiles",
        enHref: "/en/blog/screeps-tower-auto-attack-hostiles",
      },
      {
        zhLabel: "Tower 维修阈值",
        enLabel: "Tower repair threshold",
        zhHref: "/blog/screeps-tower-repair-threshold",
        enHref: "/en/blog/screeps-tower-repair-threshold",
      },
      {
        zhLabel: "Tower 治疗 Creep",
        enLabel: "Tower healing Creeps",
        zhHref: "/blog/screeps-tower-heal-creeps",
        enHref: "/en/blog/screeps-tower-heal-creeps",
      },
    ],
    keywords: ["StructureTower", "Tower", "attack", "heal", "repair", "range falloff", "defense"],
  },
  {
    slug: "structure-terminal",
    objectName: "StructureTerminal",
    zhTitle: "StructureTerminal API Hub",
    enTitle: "StructureTerminal API Hub",
    zhDescription:
      "把 Terminal 跨房间发送、交易 Energy、库存、cooldown 与 Market 成本计算连接起来。",
    enDescription:
      "A focused hub for Terminal sends, transaction Energy, stock, cooldown, and Market cost planning.",
    zhScope:
      "Terminal 发送前要同时检查资源库存、Energy 交易成本、cooldown、目标房间与发送数量。涉及 Market 时，再把订单和 Credits 一起纳入判断。",
    enScope:
      "Before a Terminal send, check stock, transaction Energy, cooldown, destination, and amount together. For Market flows, include orders and Credits in the same decision.",
    entryIds: ["terminal-send"],
    errorNames: ["ERR_TIRED", "ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_ARGS", "ERR_RCL_NOT_ENOUGH"],
    tools: [
      {
        zhLabel: "Market 与 Terminal 成本计算器",
        enLabel: "Market and Terminal Cost Calculator",
        zhHref: "/tools/market-terminal-cost-calculator",
        enHref: "/en/tools/market-terminal-cost-calculator",
      },
    ],
    modules: [
      {
        zhLabel: "资源采集与房间经济",
        enLabel: "Room Economy",
        zhHref: "/knowledge/room-economy",
        enHref: "/en/knowledge/room-economy",
      },
      {
        zhLabel: "市场与高级资源",
        enLabel: "Market and Advanced Resources",
        zhHref: "/knowledge/market-advanced-resources",
        enHref: "/en/knowledge/market-advanced-resources",
      },
    ],
    keywords: ["StructureTerminal", "Terminal", "send", "transaction cost", "cooldown", "Market"],
  },
  {
    slug: "structure-lab",
    objectName: "StructureLab",
    zhTitle: "StructureLab API Hub",
    enTitle: "StructureLab API Hub",
    zhDescription:
      "集中查看 Lab 反应、Boost、矿物与 Energy 前置条件、cooldown 和生产规划。",
    enDescription:
      "A focused hub for Lab reactions, Boosts, mineral and Energy prerequisites, cooldown, and production planning.",
    zhScope:
      "Lab 工作流要区分输入 Lab、输出 Lab、化合物配方与 Boost 目标。先确认资源和位置，再执行动作并根据返回值继续排查。",
    enScope:
      "Lab workflows distinguish input Labs, output Labs, compound recipes, and Boost targets. Confirm resources and range first, then use the action result to continue debugging.",
    entryIds: ["lab-run-reaction", "lab-boost-creep"],
    errorNames: ["ERR_TIRED", "ERR_NOT_IN_RANGE", "ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_ARGS", "ERR_INVALID_TARGET", "ERR_FULL", "ERR_RCL_NOT_ENOUGH"],
    tools: [
      {
        zhLabel: "Lab 反应与 Boost 规划器",
        enLabel: "Lab Reaction and Boost Planner",
        zhHref: "/tools/lab-reaction-boost-planner",
        enHref: "/en/tools/lab-reaction-boost-planner",
      },
    ],
    modules: [
      {
        zhLabel: "市场与高级资源",
        enLabel: "Market and Advanced Resources",
        zhHref: "/knowledge/market-advanced-resources",
        enHref: "/en/knowledge/market-advanced-resources",
      },
    ],
    keywords: ["StructureLab", "Lab", "runReaction", "boostCreep", "Boost", "compound", "mineral"],
  },
  {
    slug: "path-finder",
    objectName: "PathFinder",
    zhTitle: "PathFinder API Hub",
    enTitle: "PathFinder API Hub",
    zhDescription:
      "把格子级 PathFinder、房间级路线、ERR_NO_PATH、CostMatrix 与移动排错放在同一入口。",
    enDescription:
      "A focused hub for tile-level PathFinder, room-level routes, ERR_NO_PATH, CostMatrix, and movement debugging.",
    zhScope:
      "寻路要先区分房间级路线和房间内格子级搜索。除了 path 本身，还要观察 incomplete、cost、ops，以及 callback 是否意外封死路径。",
    enScope:
      "Pathfinding starts by separating room-level routing from tile-level search. Inspect incomplete, cost, ops, and callbacks in addition to the returned path.",
    entryIds: ["pathfinder-search", "game-map-find-route"],
    errorNames: ["ERR_NO_PATH", "ERR_INVALID_ARGS"],
    tools: [
      {
        zhLabel: "房间运行诊断",
        enLabel: "Room Snapshot Diagnostic",
        zhHref: "/tools/room-diagnostics",
        enHref: "/en/tools/room-diagnostics",
      },
    ],
    modules: [
      {
        zhLabel: "移动、寻路与视野",
        enLabel: "Movement and Vision",
        zhHref: "/knowledge/movement-vision",
        enHref: "/en/knowledge/movement-vision",
      },
    ],
    extraGuides: [
      {
        zhLabel: "ERR_NO_PATH 排查",
        enLabel: "ERR_NO_PATH debugging",
        zhHref: "/blog/screeps-err-no-path",
        enHref: "/en/blog/screeps-err-no-path",
      },
      {
        zhLabel: "moveTo 不移动排查",
        enLabel: "moveTo not moving",
        zhHref: "/blog/screeps-moveto-not-moving",
        enHref: "/en/blog/screeps-moveto-not-moving",
      },
    ],
    keywords: ["PathFinder", "PathFinder.search", "CostMatrix", "findRoute", "ERR_NO_PATH", "movement", "route"],
  },
  {
    slug: "store",
    objectName: "Store",
    zhTitle: "Store 实践 Hub",
    enTitle: "Store Practice Hub",
    zhDescription:
      "集中理解 Store 的已用、剩余和总容量语义，并连接 Creep 搬运、Storage、Container 与房间经济。",
    enDescription:
      "A practical hub for Store used, free, and total capacity semantics across Creep hauling, Storage, Containers, and room economy.",
    zhScope:
      "当前快速 Reference 还没有把 Store 容量方法拆成独立条目，因此这里明确作为实践入口，不伪装成完整 API Reference。容量语义由专题教程承载，再连接搬运工具与房间经济模块。",
    enScope:
      "The quick reference does not yet expose Store capacity methods as standalone entries, so this page is intentionally a practice hub rather than a fake complete API reference. Focused guides carry the capacity semantics and connect them to hauling tools and room economy.",
    entryIds: [],
    errorNames: ["ERR_FULL", "ERR_NOT_ENOUGH_RESOURCES"],
    tools: [
      {
        zhLabel: "运输吞吐量规划器",
        enLabel: "Hauling Throughput Planner",
        zhHref: "/tools/hauling-throughput-planner",
        enHref: "/en/tools/hauling-throughput-planner",
      },
      {
        zhLabel: "房间运行诊断",
        enLabel: "Room Snapshot Diagnostic",
        zhHref: "/tools/room-diagnostics",
        enHref: "/en/tools/room-diagnostics",
      },
    ],
    modules: [
      {
        zhLabel: "资源采集与房间经济",
        enLabel: "Room Economy",
        zhHref: "/knowledge/room-economy",
        enHref: "/en/knowledge/room-economy",
      },
    ],
    extraGuides: [
      {
        zhLabel: "Store 容量 API：getUsedCapacity / getFreeCapacity / getCapacity",
        enLabel: "Store capacity API: getUsedCapacity / getFreeCapacity / getCapacity",
        zhHref: "/blog/screeps-store-capacity-api",
        enHref: "/en/blog/screeps-store-capacity-api",
      },
      {
        zhLabel: "从 Container withdraw Energy",
        enLabel: "Withdraw Energy from a Container",
        zhHref: "/blog/screeps-creep-withdraw-container-energy",
        enHref: "/en/blog/screeps-creep-withdraw-container-energy",
      },
      {
        zhLabel: "Storage Energy 的使用方式",
        enLabel: "Using Storage Energy",
        zhHref: "/blog/screeps-storage-energy-usage",
        enHref: "/en/blog/screeps-storage-energy-usage",
      },
    ],
    keywords: ["Store", "getUsedCapacity", "getFreeCapacity", "getCapacity", "Storage", "Container", "capacity", "资源容量"],
  },
] as const;

export function getScreepsApiHub(slug: string): ScreepsApiHubConfig | null {
  return screepsApiHubs.find((hub) => hub.slug === slug) ?? null;
}

export function getScreepsApiHubHref(
  slug: ScreepsApiHubSlug,
  locale: ScreepsApiHubLocale = "zh",
): string {
  return locale === "en" ? `/en/screeps-api/${slug}` : `/screeps-api/${slug}`;
}

export function getLocalizedHubLink(
  link: ScreepsApiHubLink,
  locale: ScreepsApiHubLocale,
): { label: string; href: string } {
  return locale === "en"
    ? { label: link.enLabel, href: link.enHref }
    : { label: link.zhLabel, href: link.zhHref };
}
