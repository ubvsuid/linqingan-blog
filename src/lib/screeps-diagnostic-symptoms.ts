import type { ScreepsApiHubSlug } from "@/lib/screeps-api-hubs";

export type ScreepsDiagnosticLocale = "zh" | "en";

export interface ScreepsDiagnosticLink {
  zhLabel: string;
  enLabel: string;
  zhHref: string;
  enHref: string;
}

export interface ScreepsDiagnosticSymptom {
  id: string;
  zhTitle: string;
  enTitle: string;
  zhSummary: string;
  enSummary: string;
  zhTriage: readonly string[];
  enTriage: readonly string[];
  errorNames: readonly string[];
  directApiEntryIds?: readonly string[];
  directHubSlugs?: readonly ScreepsApiHubSlug[];
  guides?: readonly ScreepsDiagnosticLink[];
  tools?: readonly ScreepsDiagnosticLink[];
  zhSearchTerms: readonly string[];
  enSearchTerms: readonly string[];
}

export const screepsDiagnosticSymptoms = [
  {
    id: "creep-not-moving",
    zhTitle: "Creep 不移动",
    enTitle: "Creep not moving",
    zhSummary: "Creep 看起来停在原地时，先区分命令没有被接受、没有可用路径、fatigue 阻塞，还是目标与距离逻辑有问题。",
    enSummary: "When a Creep appears stuck, first separate command rejection, path failure, fatigue, and target/range logic instead of repeatedly calling moveTo().",
    zhTriage: [
      "保存 moveTo() 或原始动作的真实返回值，不要只观察坐标有没有变化。",
      "检查 creep.fatigue、目标对象与目标房间是否仍然有效。",
      "如果返回 ERR_NO_PATH，继续检查地形、出口、CostMatrix 与 callback 约束。",
      "下一 tick 再核对位置和返回值，确认这是持续故障还是单 tick 状态。",
    ],
    enTriage: [
      "Store the real result from moveTo() or the original action instead of judging only by position.",
      "Inspect creep.fatigue and confirm the target object and destination room are still valid.",
      "For ERR_NO_PATH, inspect terrain, exits, CostMatrix data, and callback constraints.",
      "Check position and the next result on a later tick to distinguish a persistent fault from a one-tick state.",
    ],
    errorNames: ["ERR_NO_PATH", "ERR_TIRED", "ERR_NOT_IN_RANGE", "ERR_INVALID_TARGET"],
    directApiEntryIds: ["creep-move-to", "game-map-find-route", "pathfinder-search"],
    directHubSlugs: ["creep", "path-finder", "room"],
    tools: [
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
    ],
    zhSearchTerms: ["creep不动", "creep卡住", "移动失败", "找不到路", "fatigue"],
    enSearchTerms: ["creep not moving", "creep stuck", "movement failed", "no path", "fatigue"],
  },
  {
    id: "creep-not-harvesting",
    zhTitle: "Creep 不采集资源",
    enTitle: "Creep not harvesting",
    zhSummary: "harvest() 没有效果时，优先确认返回码、目标类型、距离、WORK 部件与资源是否可采，而不是直接重写角色逻辑。",
    enSummary: "When harvest() has no visible effect, confirm the return code, target type, range, WORK parts, and available resource before rewriting role logic.",
    zhTriage: [
      "保存 creep.harvest(target) 返回值并确认 target 不是失效缓存。",
      "检查目标是否为该 API 支持的可采集对象，以及资源是否仍然存在。",
      "检查 Creep 是否有可用 WORK 部件并满足动作距离。",
      "动作返回 OK 后，在后续 tick 核对 Store、Source 或 Mineral 状态是否变化。",
    ],
    enTriage: [
      "Store creep.harvest(target) and confirm target is not a stale cached object.",
      "Verify that the target is harvestable by this API and still contains the relevant resource.",
      "Check for usable WORK parts and the action's range requirement.",
      "After OK, inspect Store, Source, or Mineral state on a later tick for the actual effect.",
    ],
    errorNames: ["ERR_NOT_IN_RANGE", "ERR_INVALID_TARGET", "ERR_NOT_ENOUGH_RESOURCES"],
    directApiEntryIds: ["creep-harvest"],
    directHubSlugs: ["creep"],
    tools: [
      { zhLabel: "Creep 身体计算器", enLabel: "Creep Body Calculator", zhHref: "/tools/creep-body-calculator", enHref: "/en/tools/creep-body-calculator" },
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
    ],
    zhSearchTerms: ["creep不采矿", "creep不采集", "harvest没反应", "source没能量"],
    enSearchTerms: ["creep not harvesting", "harvest not working", "harvest failed", "source empty"],
  },
  {
    id: "spawn-not-spawning",
    zhTitle: "Spawn 不生产 Creep",
    enTitle: "Spawn will not spawn",
    zhSummary: "Spawn 队列没有产出时，先判断是 busy、Energy、body/name 参数还是 RCL 能力边界，不要把所有失败都归因于队列。",
    enSummary: "When the Spawn queue produces nothing, separate busy state, Energy, body/name arguments, and RCL limits instead of blaming the queue generically.",
    zhTriage: [
      "保存 spawn.spawnCreep() 的 dryRun 与正式返回值。",
      "检查 spawn.spawning、房间可用 Energy、body 成本和 body 长度。",
      "确认 Creep 名称没有冲突，Memory 与 opts 参数结构有效。",
      "如果涉及结构或 body 能力，核对当前 Controller RCL 是否满足要求。",
    ],
    enTriage: [
      "Store both dryRun and real spawn.spawnCreep() results.",
      "Inspect spawn.spawning, room Energy availability, body cost, and body length.",
      "Confirm the Creep name is unique and Memory/opts arguments are valid.",
      "For structure or capability limits, confirm the current Controller RCL satisfies the requirement.",
    ],
    errorNames: ["ERR_BUSY", "ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_ARGS", "ERR_NAME_EXISTS", "ERR_RCL_NOT_ENOUGH"],
    directApiEntryIds: ["spawn-spawn-creep"],
    directHubSlugs: ["structure-spawn", "controller"],
    tools: [
      { zhLabel: "Spawn 队列与替换规划器", enLabel: "Spawn Queue and Replacement Planner", zhHref: "/tools/spawn-queue-replacement-planner", enHref: "/en/tools/spawn-queue-replacement-planner" },
      { zhLabel: "Creep 身体计算器", enLabel: "Creep Body Calculator", zhHref: "/tools/creep-body-calculator", enHref: "/en/tools/creep-body-calculator" },
    ],
    zhSearchTerms: ["spawn不生产", "spawn不出creep", "生产失败", "spawn队列卡住"],
    enSearchTerms: ["spawn not spawning", "spawn will not create creep", "spawn failed", "spawn queue stuck"],
  },
  {
    id: "controller-downgrade",
    zhTitle: "Controller 快降级或升级异常",
    enTitle: "Controller downgrade pressure",
    zhSummary: "Controller 风险通常不是单一 API 问题，需要把 ticksToDowngrade、Upgrader 能量、距离、运输与实际升级返回值放在同一条诊断链里。",
    enSummary: "Controller pressure is rarely one API problem; inspect ticksToDowngrade, Upgrader Energy, range, hauling, and the real upgrade return code as one chain.",
    zhTriage: [
      "先读取 controller.ticksToDowngrade，并确认风险是否真实存在。",
      "保存 creep.upgradeController(controller) 返回值，检查 Upgrader 是否有 Energy。",
      "检查 Upgrader 到 Controller 的距离以及上游 Container/Link/运输是否持续供能。",
      "跨多个 tick 核对 upgrade progress、能量流和 ticksToDowngrade 是否朝安全方向变化。",
    ],
    enTriage: [
      "Read controller.ticksToDowngrade first and confirm the pressure is real.",
      "Store creep.upgradeController(controller) and inspect the Upgrader's Energy.",
      "Inspect range plus the upstream Container/Link/hauling flow that keeps the Upgrader supplied.",
      "Across multiple ticks, verify upgrade progress, Energy flow, and ticksToDowngrade are moving in the safe direction.",
    ],
    errorNames: ["ERR_NOT_IN_RANGE", "ERR_INVALID_TARGET", "ERR_NOT_ENOUGH_RESOURCES"],
    directApiEntryIds: ["creep-upgrade-controller", "game-notify"],
    directHubSlugs: ["controller", "creep", "structure-link", "store", "room"],
    tools: [
      { zhLabel: "Controller 降级与 Upgrader 规划器", enLabel: "Controller Downgrade and Upgrader Planner", zhHref: "/tools/controller-downgrade-planner", enHref: "/en/tools/controller-downgrade-planner" },
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
    ],
    zhSearchTerms: ["controller快降级", "控制器降级", "upgrader没升级", "升级速度慢"],
    enSearchTerms: ["controller downgrade", "controller about to downgrade", "upgrader not upgrading", "upgrade too slow"],
  },
  {
    id: "link-not-transferring",
    zhTitle: "Link 不传能量",
    enTitle: "Link not transferring Energy",
    zhSummary: "Link 没有传能时，把 cooldown、发送方库存、接收方容量、目标对象和实际 transferEnergy() 返回值一起检查。",
    enSummary: "When a Link does not transfer Energy, inspect cooldown, sender stock, receiver capacity, target identity, and the real transferEnergy() result together.",
    zhTriage: [
      "保存 link.transferEnergy(target, amount) 的真实返回值。",
      "检查发送 Link 的 Energy、cooldown 与目标 Link 的 free capacity。",
      "确认 target 仍然是同房间内预期的 Link，而不是失效 ID 或错误对象。",
      "下一 tick 核对两端 Store 与 cooldown，确认动作是否真正产生状态变化。",
    ],
    enTriage: [
      "Store the real result from link.transferEnergy(target, amount).",
      "Inspect sender Energy, cooldown, and the destination Link's free capacity.",
      "Confirm target is still the intended Link in the same room rather than a stale ID or wrong object.",
      "On the next tick, inspect both Stores and cooldown to verify that state actually changed.",
    ],
    errorNames: ["ERR_TIRED", "ERR_NOT_ENOUGH_RESOURCES", "ERR_FULL", "ERR_INVALID_TARGET"],
    directApiEntryIds: ["link-transfer-energy"],
    directHubSlugs: ["structure-link", "store", "room"],
    tools: [
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
      { zhLabel: "运输吞吐规划器", enLabel: "Hauling Throughput Planner", zhHref: "/tools/hauling-throughput-planner", enHref: "/en/tools/hauling-throughput-planner" },
    ],
    zhSearchTerms: ["link不传能", "link没反应", "link cooldown", "link满了"],
    enSearchTerms: ["link not transferring", "link transfer failed", "link cooldown", "link full"],
  },
  {
    id: "market-action-failed",
    zhTitle: "Market 交易失败",
    enTitle: "Market action failed",
    zhSummary: "Market deal/createOrder 失败时，需要同时检查订单参数、Credits、资源、Terminal 与交易 Energy 成本，不能只看目标价格。",
    enSummary: "When Market deal/createOrder fails, inspect order arguments, Credits, resources, Terminal state, and transaction Energy cost rather than price alone.",
    zhTriage: [
      "保存 Game.market.deal() 或 createOrder() 的真实返回值与关键参数。",
      "检查订单是否仍有效、amount 是否合理、房间名和资源类型是否正确。",
      "同时计算 Credits、Terminal 库存和交易 Energy 成本是否都满足。",
      "失败条件变化后再重试，并确认新返回值是否进入不同分支。",
    ],
    enTriage: [
      "Store the real result and key arguments from Game.market.deal() or createOrder().",
      "Confirm the order is still valid and amount, room name, and resource type are correct.",
      "Check Credits, Terminal stock, and transaction Energy cost together.",
      "Retry only after the failing condition changes, then confirm whether the new result enters a different branch.",
    ],
    errorNames: ["ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_ARGS"],
    directApiEntryIds: ["market-deal", "market-create-order", "terminal-send"],
    directHubSlugs: ["market", "structure-terminal", "store", "room"],
    tools: [
      { zhLabel: "Market 与 Terminal 成本计算器", enLabel: "Market and Terminal Cost Calculator", zhHref: "/tools/market-terminal-cost-calculator", enHref: "/en/tools/market-terminal-cost-calculator" },
    ],
    zhSearchTerms: ["market交易失败", "deal失败", "createOrder失败", "terminal交易成本"],
    enSearchTerms: ["market action failed", "market deal failed", "createOrder failed", "terminal transaction cost"],
  },
  {
    id: "cpu-too-high",
    zhTitle: "CPU 使用过高",
    enTitle: "CPU usage too high",
    zhSummary: "CPU 过高通常没有单一错误码。先测量实际热点、bucket 与 tick 负载，再决定是减少扫描、缓存结果还是拆分跨 tick 工作。",
    enSummary: "High CPU usually has no single return code. Measure hotspots, bucket, and tick load first, then decide whether to reduce scans, cache work, or spread work across ticks.",
    zhTriage: [
      "用 Game.cpu.getUsed() 在关键代码段前后测量，而不是只看整 tick 总量。",
      "同时记录 bucket 与不同房间/角色/管理器的工作规模。",
      "优先排查每 tick 全量扫描、重复寻路、重复排序和可缓存计算。",
      "修改后跨多个 tick 比较 CPU 与 bucket 趋势，避免用单 tick 样本下结论。",
    ],
    enTriage: [
      "Measure important code sections with Game.cpu.getUsed() before and after them instead of relying only on total tick usage.",
      "Record bucket plus the workload size of rooms, roles, or managers at the same time.",
      "Prioritize full-tick scans, repeated pathfinding, repeated sorting, and cacheable calculations.",
      "After changes, compare CPU and bucket across multiple ticks rather than concluding from one sample.",
    ],
    errorNames: [],
    directApiEntryIds: ["game-cpu-get-used", "pathfinder-search", "room-get-event-log"],
    directHubSlugs: ["room", "path-finder", "creep"],
    tools: [
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
    ],
    zhSearchTerms: ["cpu太高", "cpu超限", "bucket下降", "性能问题", "tick太慢"],
    enSearchTerms: ["cpu too high", "cpu limit", "bucket dropping", "performance problem", "slow tick"],
  },
  {
    id: "resources-not-moving",
    zhTitle: "资源运不过去",
    enTitle: "Resources not moving",
    zhSummary: "资源物流停滞时，要区分取出、携带、移动、转移和目标容量中的哪一段断了，并逐段保存返回值。",
    enSummary: "When logistics stalls, identify whether withdraw, carrying, movement, transfer, or destination capacity is the broken stage and store each result separately.",
    zhTriage: [
      "分别保存 withdraw/pickup、moveTo 和 transfer 的返回值，不要用一个 role 状态概括整条链。",
      "检查来源 Store、Creep free/used capacity 与目标 free capacity。",
      "检查路径、fatigue、距离和目标对象是否仍有效。",
      "跨多个 tick 核对来源、Creep、目标三处 Store，确认资源实际流向。",
    ],
    enTriage: [
      "Store withdraw/pickup, moveTo, and transfer results separately instead of reducing the whole chain to one role state.",
      "Inspect source Store, Creep used/free capacity, and destination free capacity.",
      "Check pathing, fatigue, range, and whether the target object is still valid.",
      "Across multiple ticks, compare source, Creep, and destination Stores to verify the real resource flow.",
    ],
    errorNames: ["ERR_NOT_ENOUGH_RESOURCES", "ERR_FULL", "ERR_NOT_IN_RANGE", "ERR_INVALID_TARGET", "ERR_NO_PATH", "ERR_TIRED"],
    directApiEntryIds: ["creep-withdraw", "creep-pickup", "creep-transfer", "creep-move-to"],
    directHubSlugs: ["creep", "store", "path-finder", "room"],
    tools: [
      { zhLabel: "运输吞吐规划器", enLabel: "Hauling Throughput Planner", zhHref: "/tools/hauling-throughput-planner", enHref: "/en/tools/hauling-throughput-planner" },
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
    ],
    zhSearchTerms: ["资源运不过去", "运输卡住", "物流失败", "搬运没反应", "transfer失败"],
    enSearchTerms: ["resources not moving", "hauling stuck", "logistics failed", "transfer not working", "delivery failed"],
  },
] as const satisfies readonly ScreepsDiagnosticSymptom[];

export function getScreepsDiagnosticSymptom(id: string): ScreepsDiagnosticSymptom | null {
  return screepsDiagnosticSymptoms.find((symptom) => symptom.id === id) ?? null;
}

export function localizeDiagnosticLink(link: ScreepsDiagnosticLink, locale: ScreepsDiagnosticLocale) {
  return locale === "en"
    ? { label: link.enLabel, href: link.enHref }
    : { label: link.zhLabel, href: link.zhHref };
}
