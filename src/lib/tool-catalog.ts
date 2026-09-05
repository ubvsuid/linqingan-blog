export interface ToolCatalogEntry {
  slug: string;
  eyebrow: string;
  zhTitle: string;
  zhDescription: string;
  zhSearchMeta: string;
  zhKeywords: readonly string[];
  zhSearchText: string;
  enTitle: string;
  enDescription: string;
  enKeywords: readonly string[];
}

export const toolCatalog = [
  {
    slug: "creep-body-calculator",
    eyebrow: "BODY CALCULATOR",
    zhTitle: "Creep 身体计算器",
    zhDescription: "组合身体部件，计算 Energy 成本、生成时间、生命值、携带容量和满载移动速度。",
    zhSearchMeta: "免费工具 · 支持链接分享",
    zhKeywords: ["Creep Body", "BODYPART_COST", "MOVE", "WORK", "CARRY", "身体计算器", "生成时间", "fatigue"],
    zhSearchText: "Screeps 身体部件 成本 Spawn 生成时间 50 个部件 MOVE 比例 Road Plain Swamp",
    enTitle: "Creep Body Calculator",
    enDescription: "Calculate Energy cost, spawn time, hits, carry capacity, and loaded movement speed.",
    enKeywords: ["body calculator", "creep cost", "move ratio", "spawn time", "carry capacity"],
  },
  {
    slug: "room-diagnostics",
    eyebrow: "ROOM DIAGNOSTICS",
    zhTitle: "房间运行诊断",
    zhDescription: "根据 Spawn、角色、Energy、Controller、工地、CPU 和 bucket 快照检查风险。",
    zhSearchMeta: "免费工具 · 支持配置分享",
    zhKeywords: ["房间诊断", "Spawn", "角色数量", "Controller", "CPU", "Energy"],
    zhSearchText: "Screeps 房间运行 检查 断代 Spawn Energy Controller 工地 CPU bucket",
    enTitle: "Room Snapshot Diagnostic",
    enDescription: "Check Spawn, workforce, Energy, Controller, construction, CPU, and bucket risks from a static snapshot.",
    enKeywords: ["room diagnostics", "spawn count", "harvester", "controller downgrade", "cpu bucket"],
  },
  {
    slug: "market-terminal-cost-calculator",
    eyebrow: "MARKET & TERMINAL",
    zhTitle: "Market 与 Terminal 成本计算器",
    zhDescription: "计算运输 Energy、Market 成交后的实际单价和创建订单的 5% 手续费。",
    zhSearchMeta: "免费工具 · URL 参数可分享",
    zhKeywords: ["Market 计算器", "Terminal 成本", "calcTransactionCost", "deal", "订单手续费", "Credits"],
    zhSearchText: "Screeps Market Terminal 运输 Energy 实际单价 买单 卖单 deal 订单 5% 手续费",
    enTitle: "Market and Terminal Cost Calculator",
    enDescription: "Calculate Terminal transaction Energy, effective Market deal prices, maximum Energy payload, and order creation fees.",
    enKeywords: ["market calculator", "terminal cost", "calcTransactionCost", "deal price", "order fee", "credits"],
  },
  {
    slug: "controller-downgrade-planner",
    eyebrow: "CONTROLLER",
    zhTitle: "Controller 降级与 Upgrader 规划器",
    zhDescription: "根据 ticksToDowngrade、WORK、Boost、有效升级比例和 RCL8 上限估算安全余量。",
    zhSearchMeta: "免费工具 · 只读 Console 探针",
    zhKeywords: ["Controller 降级", "ticksToDowngrade", "Upgrader", "WORK", "XGH2O", "OPERATE_CONTROLLER"],
    zhSearchText: "Screeps Controller 降级 安全线 Upgrader WORK Boost RCL8 升级 上限 进度",
    enTitle: "Controller Downgrade and Upgrader Planner",
    enDescription: "Estimate Controller downgrade margin, Upgrader Energy use, Boosted progress, RCL8 caps, and time to a target.",
    enKeywords: ["controller downgrade", "ticksToDowngrade", "upgrader", "work parts", "xgh2o", "operate controller"],
  },
  {
    slug: "lab-reaction-boost-planner",
    eyebrow: "LAB & BOOST",
    zhTitle: "Lab 反应与 Boost 规划器",
    zhDescription: "展开化合物反应链，计算基础矿物、Lab 轮数、生产 Tick 和整批 Boost 需求。",
    zhSearchMeta: "免费工具 · 支持计划 JSON",
    zhKeywords: ["Lab 规划", "反应链", "Boost 计算", "XGH2O", "OPERATE_LAB", "矿物"],
    zhSearchText: "Screeps Lab reaction Boost compound mineral cooldown output lab XGH2O 化合物 反应",
    enTitle: "Lab Reaction and Boost Planner",
    enDescription: "Plan compound reaction chains, base minerals, Lab runs, production ticks, and Boost batches.",
    enKeywords: ["lab planner", "reaction chain", "boost calculator", "xgh2o", "operate lab", "mineral"],
  },
  {
    slug: "spawn-queue-replacement-planner",
    eyebrow: "SPAWN CAPACITY",
    zhTitle: "Spawn 队列与替换规划器",
    zhDescription: "计算多个角色的 Spawn 平均利用率、替换时间、prespawn TTL 与 OPERATE_SPAWN 容量。",
    zhSearchMeta: "免费工具 · 多角色队列规划",
    zhKeywords: ["Spawn 队列", "替换", "prespawn", "ticksToLive", "OPERATE_SPAWN", "Spawn 利用率"],
    zhSearchText: "Screeps Spawn queue replacement prespawn TTL 角色 生成时间 CLAIM 寿命 OPERATE_SPAWN",
    enTitle: "Spawn Queue and Replacement Planner",
    enDescription: "Estimate Spawn utilization, role replacement timing, prespawn TTL thresholds, and OPERATE_SPAWN capacity.",
    enKeywords: ["spawn queue", "replacement", "prespawn", "ticksToLive", "operate spawn", "spawn utilization"],
  },
  {
    slug: "hauling-throughput-planner",
    eyebrow: "LOGISTICS",
    zhTitle: "运输吞吐量规划器",
    zhDescription: "根据 CARRY、MOVE、地形和路线计算往返周期、所需 Creep 数量与寿命运输量。",
    zhSearchMeta: "免费工具 · 物流与远程采矿",
    zhKeywords: ["运输吞吐量", "Hauler", "CARRY", "MOVE", "fatigue", "remote mining", "物流"],
    zhSearchText: "Screeps hauling throughput CARRY MOVE fatigue Road Plain Swamp 往返 周期 运输",
    enTitle: "Hauling Throughput Planner",
    enDescription: "Calculate CARRY payload, MOVE fatigue, route cycle time, Creeps required, lifetime delivery, and replacement timing.",
    enKeywords: ["hauling", "throughput", "carry", "move", "fatigue", "logistics", "remote mining"],
  },
  {
    slug: "tower-damage-heal-repair-calculator",
    eyebrow: "TOWER POWER",
    zhTitle: "Tower 伤害、治疗与维修计算器",
    zhDescription: "计算 Tower 距离衰减、多塔攻击治疗维修效果、Energy 消耗和 OPERATE_TOWER 增益。",
    zhSearchMeta: "免费工具 · 防御能力规划",
    zhKeywords: ["Tower 伤害", "Tower 治疗", "Tower 维修", "range falloff", "OPERATE_TOWER", "防御"],
    zhSearchText: "Screeps Tower attack heal repair range falloff Energy OPERATE_TOWER 防御 伤害 治疗 维修",
    enTitle: "Tower Damage, Heal, and Repair Calculator",
    enDescription: "Calculate Tower range falloff, combined attack, heal or repair power, Energy use, and OPERATE_TOWER output.",
    enKeywords: ["tower damage", "tower heal", "tower repair", "range falloff", "operate tower", "defense"],
  },
] as const satisfies readonly ToolCatalogEntry[];

export type ToolSlug = (typeof toolCatalog)[number]["slug"];

export const toolCount = toolCatalog.length;

export function getToolHref(slug: ToolSlug, locale: "zh" | "en" = "zh"): string {
  return locale === "en" ? `/en/tools/${slug}` : `/tools/${slug}`;
}
