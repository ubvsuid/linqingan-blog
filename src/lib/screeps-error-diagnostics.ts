import type { ScreepsApiHubSlug } from "@/lib/screeps-api-hubs";

export type ScreepsErrorDiagnosticLocale = "zh" | "en";

export interface ScreepsErrorDiagnosticLink {
  zhLabel: string;
  enLabel: string;
  zhHref: string;
  enHref: string;
}

export interface ScreepsErrorDiagnostic {
  name: string;
  zhSummary: string;
  enSummary: string;
  zhChecks: readonly string[];
  enChecks: readonly string[];
  apiEntryIds: readonly string[];
  hubSlugs: readonly ScreepsApiHubSlug[];
  guides: readonly ScreepsErrorDiagnosticLink[];
  tools: readonly ScreepsErrorDiagnosticLink[];
  zhSearchTerms: readonly string[];
  enSearchTerms: readonly string[];
}

export const screepsErrorDiagnostics = [
  {
    name: "ERR_NOT_IN_RANGE",
    zhSummary: "动作目标存在，但当前对象没有满足这次调用的距离规则。先确认真实返回值，再决定是否移动。",
    enSummary: "The target exists, but the acting object does not satisfy the method's range rule. Confirm the real return code before deciding to move.",
    zhChecks: [
      "确认目标变量真实存在，而且目标类型适用于当前方法。",
      "保存动作返回值；只有实际得到 -9 时才进入距离分支。",
      "如果是 Creep 动作，检查当前位置与目标距离，再决定是否调用 moveTo()。",
      "在下一 tick 重新执行原动作，并核对位置、Store 或目标状态是否变化。",
    ],
    enChecks: [
      "Confirm that the target exists and is valid for the current method.",
      "Store the action result and enter the range branch only when the real result is -9.",
      "For Creep actions, inspect the current range before deciding whether to call moveTo().",
      "Retry the original action on a later tick and verify position, Store, or target state.",
    ],
    apiEntryIds: ["creep-harvest", "creep-transfer", "creep-withdraw", "creep-upgrade-controller", "spawn-recycle-creep", "link-transfer-energy"],
    hubSlugs: ["creep", "controller", "structure-spawn"],
    guides: [
      { zhLabel: "ERR_NOT_IN_RANGE 完整排查", enLabel: "ERR_NOT_IN_RANGE troubleshooting", zhHref: "/blog/screeps-err-not-in-range", enHref: "/en/blog/screeps-err-not-in-range" },
      { zhLabel: "moveTo() 不移动排查", enLabel: "moveTo() not moving", zhHref: "/blog/screeps-moveto-not-moving", enHref: "/en/blog/screeps-moveto-not-moving" },
      { zhLabel: "Link 传能与范围", enLabel: "Link transfer range", zhHref: "/blog/screeps-link-transfer-energy", enHref: "/en/blog/screeps-link-transfer-energy" },
    ],
    tools: [
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
      { zhLabel: "Controller 降级与 Upgrader 规划器", enLabel: "Controller Downgrade and Upgrader Planner", zhHref: "/tools/controller-downgrade-planner", enHref: "/en/tools/controller-downgrade-planner" },
    ],
    zhSearchTerms: ["距离不足", "目标太远", "不在范围", "移动后重试"],
    enSearchTerms: ["out of range", "target too far", "move closer", "retry next tick"],
  },
  {
    name: "ERR_NO_PATH",
    zhSummary: "移动或寻路系统没有找到当前约束下可用的路径。不要只继续重复 moveTo()，先判断是哪一层路径约束失败。",
    enSummary: "Movement or pathfinding could not find a usable path under the current constraints. Do not blindly repeat moveTo(); identify which path constraint failed.",
    zhChecks: [
      "确认目标位置与目标房间当前可解析，跨房任务同时检查视野和出口。",
      "检查墙体、不可通行地形、Rampart 与其他会改变可通行性的对象。",
      "检查 range、routeCallback、roomCallback 或 CostMatrix 是否把可行路线排除了。",
      "如果直接使用 PathFinder，检查 incomplete、path、cost 和 ops，而不是只看 path 数组。",
    ],
    enChecks: [
      "Confirm that the target position and destination room can be resolved; cross-room work also needs valid vision and exits.",
      "Inspect walls, impassable terrain, Ramparts, and other objects that change walkability.",
      "Check range, routeCallback, roomCallback, or CostMatrix rules that may exclude every usable route.",
      "When using PathFinder directly, inspect incomplete, path, cost, and ops rather than the path array alone.",
    ],
    apiEntryIds: ["creep-move-to", "game-map-find-route", "pathfinder-search"],
    hubSlugs: ["creep", "room"],
    guides: [
      { zhLabel: "ERR_NO_PATH 排查流程", enLabel: "ERR_NO_PATH troubleshooting", zhHref: "/blog/screeps-err-no-path", enHref: "/en/blog/screeps-err-no-path" },
      { zhLabel: "PathFinder 与 CostMatrix", enLabel: "PathFinder and CostMatrix", zhHref: "/blog/screeps-pathfinder-costmatrix", enHref: "/en/blog/screeps-pathfinder-costmatrix" },
    ],
    tools: [
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
    ],
    zhSearchTerms: ["找不到路", "无法移动", "路径失败", "寻路失败"],
    enSearchTerms: ["no path", "cannot move", "pathfinding failed", "route failed"],
  },
  {
    name: "ERR_NOT_ENOUGH_RESOURCES",
    zhSummary: "当前方法需要的资源不足。-6 不等于永远缺 Energy，必须回到具体 API 判断缺的是哪一种库存、Credits 或成本。",
    enSummary: "The current method lacks a required resource. -6 does not always mean Energy; return to the specific API and identify the missing stock, Credits, or cost.",
    zhChecks: [
      "先确认是哪个 API 返回 -6，并查清该方法实际消耗的资源类型。",
      "检查 Creep、Structure、房间或账号当前库存，不要只看计划值。",
      "把计划执行量与真实可用量、交易成本或配方消耗放在一起计算。",
      "资源补齐后再重试，并保存新的返回值确认失败原因已经改变。",
    ],
    enChecks: [
      "Identify which API returned -6 and which resource that method actually consumes.",
      "Inspect the current Creep, Structure, room, or account stock instead of relying on planned values.",
      "Compare the requested amount with real availability, transaction cost, or recipe consumption.",
      "Retry only after the resource state changes, then store the new result to confirm the failure branch changed.",
    ],
    apiEntryIds: ["spawn-spawn-creep", "terminal-send", "market-deal", "lab-run-reaction", "lab-boost-creep", "factory-produce"],
    hubSlugs: ["structure-spawn", "market"],
    guides: [
      { zhLabel: "动态 Creep Body 与 Energy", enLabel: "Dynamic Creep body and Energy", zhHref: "/blog/screeps-dynamic-creep-body-energy", enHref: "/en/blog/screeps-dynamic-creep-body-energy" },
      { zhLabel: "Terminal 发送资源", enLabel: "Terminal resource sending", zhHref: "/blog/screeps-terminal-send-resources", enHref: "/en/blog/screeps-terminal-send-resources" },
      { zhLabel: "Power Spawn 资源检查", enLabel: "Power Spawn resource checks", zhHref: "/blog/screeps-power-spawn-process-power", enHref: "/en/blog/screeps-power-spawn-process-power" },
    ],
    tools: [
      { zhLabel: "Creep 身体计算器", enLabel: "Creep Body Calculator", zhHref: "/tools/creep-body-calculator", enHref: "/en/tools/creep-body-calculator" },
      { zhLabel: "Market 与 Terminal 成本计算器", enLabel: "Market and Terminal Cost Calculator", zhHref: "/tools/market-terminal-cost-calculator", enHref: "/en/tools/market-terminal-cost-calculator" },
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
    ],
    zhSearchTerms: ["资源不足", "能量不足", "库存不足", "credits不足", "无法生产"],
    enSearchTerms: ["not enough resources", "not enough energy", "insufficient stock", "insufficient credits", "cannot produce"],
  },
  {
    name: "ERR_BUSY",
    zhSummary: "对象正处于与当前请求冲突的忙碌状态。对 Spawn 来说，先判断占用状态，再决定排队、等待还是切换 Spawn。",
    enSummary: "The object is busy with an incompatible action. For Spawn workflows, inspect occupancy before deciding to queue, wait, or use another Spawn.",
    zhChecks: [
      "确认当前 API 的文档确实可能返回 ERR_BUSY，不要把别的方法规则机械套过来。",
      "对 Spawn 检查 spawn.spawning，以及当前队列是否已经为它分配任务。",
      "确认同一 tick 没有重复向同一个对象提交互斥动作。",
      "等待或改派后保存下一次返回值，避免把持续失败误判成正常排队。",
    ],
    enChecks: [
      "Confirm that the current API actually documents ERR_BUSY instead of borrowing rules from another method.",
      "For a Spawn, inspect spawn.spawning and whether the queue already assigned work to it.",
      "Confirm that the same tick is not submitting mutually exclusive actions to the same object.",
      "After waiting or reassigning, store the next result so a persistent failure is not mistaken for normal queueing.",
    ],
    apiEntryIds: ["spawn-spawn-creep", "spawn-renew-creep", "spawn-recycle-creep"],
    hubSlugs: ["structure-spawn"],
    guides: [
      { zhLabel: "spawnCreep() 返回码", enLabel: "spawnCreep() return codes", zhHref: "/blog/screeps-spawncreep-return-codes", enHref: "/en/blog/screeps-spawncreep-return-codes" },
      { zhLabel: "renewCreep() 与 Spawn 状态", enLabel: "renewCreep() and Spawn state", zhHref: "/blog/screeps-spawn-renew-creep", enHref: "/en/blog/screeps-spawn-renew-creep" },
      { zhLabel: "recycleCreep() 返回值边界", enLabel: "recycleCreep() return-value boundaries", zhHref: "/blog/screeps-spawn-recycle-creep", enHref: "/en/blog/screeps-spawn-recycle-creep" },
    ],
    tools: [
      { zhLabel: "Spawn 队列与替换规划器", enLabel: "Spawn Queue and Replacement Planner", zhHref: "/tools/spawn-queue-replacement-planner", enHref: "/en/tools/spawn-queue-replacement-planner" },
    ],
    zhSearchTerms: ["spawn忙", "正在生产", "队列阻塞", "对象忙碌"],
    enSearchTerms: ["spawn busy", "already spawning", "queue blocked", "object busy"],
  },
  {
    name: "ERR_INVALID_TARGET",
    zhSummary: "目标对象存在，但它不符合当前方法的目标契约。先判断目标类型和状态，再检查距离或资源。",
    enSummary: "The target exists, but it does not satisfy the method's target contract. Validate target type and state before checking range or resources.",
    zhChecks: [
      "打印目标对象并确认它不是 undefined、null 或已经失效的缓存。",
      "确认对象类型、所有权和当前状态满足这一个 API 的目标要求。",
      "把目标类型错误与距离不足、容量不足分开处理，不要用 moveTo() 掩盖无效目标。",
      "修正目标后保存新的返回值，并在下一 tick 核对动作结果。",
    ],
    enChecks: [
      "Log the target and confirm it is not undefined, null, or a stale cached object.",
      "Confirm that object type, ownership, and current state satisfy this API's target contract.",
      "Separate invalid-target failures from range and capacity failures; do not hide a bad target behind moveTo().",
      "After correcting the target, store the new result and verify the action state on a later tick.",
    ],
    apiEntryIds: ["creep-transfer", "creep-withdraw", "creep-upgrade-controller", "room-create-construction-site"],
    hubSlugs: ["creep", "room", "controller"],
    guides: [
      { zhLabel: "安全使用 withdraw()", enLabel: "Safe withdraw() usage", zhHref: "/blog/screeps-creep-withdraw-container-energy", enHref: "/en/blog/screeps-creep-withdraw-container-energy" },
      { zhLabel: "创建 Construction Site", enLabel: "Create Construction Sites", zhHref: "/blog/screeps-room-create-construction-site", enHref: "/en/blog/screeps-room-create-construction-site" },
    ],
    tools: [
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
    ],
    zhSearchTerms: ["目标无效", "选错目标", "invalid target", "对象类型错误"],
    enSearchTerms: ["invalid target", "wrong target", "wrong object type", "stale target"],
  },
  {
    name: "ERR_FULL",
    zhSummary: "目标没有足够剩余容量。检查目标的真实 free capacity，并考虑同一 tick 其他动作已经预占或改变容量。",
    enSummary: "The target does not have enough remaining capacity. Inspect real free capacity and account for other same-tick actions that may reserve or change it.",
    zhChecks: [
      "确认是哪个目标返回容量不足，并读取对应 Store 或结构容量。",
      "使用 getFreeCapacity(resourceType) 检查具体资源通道，而不是只看总容量。",
      "检查同一 tick 其他 Creep 或 Structure 是否也在向同一目标写入资源。",
      "重新计算安全 amount 后再调用，并保存新的返回值。",
    ],
    enChecks: [
      "Identify which target rejected the action and read the relevant Store or structure capacity.",
      "Use getFreeCapacity(resourceType) for the specific resource channel instead of relying on total capacity alone.",
      "Check whether other Creeps or Structures are also writing to the same target in the current tick.",
      "Recalculate a safe amount before retrying and store the new return code.",
    ],
    apiEntryIds: ["creep-transfer", "link-transfer-energy", "lab-run-reaction"],
    hubSlugs: ["creep"],
    guides: [
      { zhLabel: "Link 目标容量", enLabel: "Link target capacity", zhHref: "/blog/screeps-link-transfer-energy", enHref: "/en/blog/screeps-link-transfer-energy" },
      { zhLabel: "Lab 反应与输出容量", enLabel: "Lab reaction output capacity", zhHref: "/blog/screeps-lab-run-reaction", enHref: "/en/blog/screeps-lab-run-reaction" },
    ],
    tools: [
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
      { zhLabel: "Lab 反应与 Boost 规划器", enLabel: "Lab Reaction and Boost Planner", zhHref: "/tools/lab-reaction-boost-planner", enHref: "/en/tools/lab-reaction-boost-planner" },
    ],
    zhSearchTerms: ["目标已满", "容量不足", "没有空位", "free capacity"],
    enSearchTerms: ["target full", "no free capacity", "store full", "free capacity"],
  },
  {
    name: "ERR_TIRED",
    zhSummary: "当前对象暂时不能再次行动：Creep 可能有 fatigue，Structure 可能还在 cooldown。先读状态，不要无条件重复调用。",
    enSummary: "The object cannot act again yet: a Creep may have fatigue and a Structure may still be on cooldown. Read state instead of blindly retrying.",
    zhChecks: [
      "如果是 Creep 移动，读取 creep.fatigue 并检查 MOVE 与身体重量的配比。",
      "如果是 Structure 动作，读取对应 cooldown 并确认它是否已经归零。",
      "确认代码没有在 cooldown/fatigue 明显存在时反复提交同一动作并刷日志。",
      "状态恢复后重新调用并保存返回值，确认失败分支已经退出。",
    ],
    enChecks: [
      "For Creep movement, inspect creep.fatigue and the MOVE-to-body-weight ratio.",
      "For Structure actions, read the relevant cooldown and confirm it reached zero.",
      "Avoid repeatedly submitting the same action and flooding logs while fatigue or cooldown is clearly active.",
      "Retry after the state recovers and store the result to confirm the failure branch is gone.",
    ],
    apiEntryIds: ["creep-move-to", "link-transfer-energy"],
    hubSlugs: ["creep"],
    guides: [
      { zhLabel: "MOVE、fatigue 与身体配比", enLabel: "MOVE, fatigue, and body ratio", zhHref: "/blog/screeps-move-fatigue-body-ratio", enHref: "/en/blog/screeps-move-fatigue-body-ratio" },
      { zhLabel: "Link cooldown", enLabel: "Link cooldown", zhHref: "/blog/screeps-link-transfer-energy", enHref: "/en/blog/screeps-link-transfer-energy" },
    ],
    tools: [
      { zhLabel: "Creep 身体计算器", enLabel: "Creep Body Calculator", zhHref: "/tools/creep-body-calculator", enHref: "/en/tools/creep-body-calculator" },
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
    ],
    zhSearchTerms: ["fatigue", "冷却", "cooldown", "不能移动", "等待一tick"],
    enSearchTerms: ["fatigue", "cooldown", "cannot move", "wait a tick", "tired"],
  },
  {
    name: "ERR_INVALID_ARGS",
    zhSummary: "参数没有满足方法契约。把每个参数的真实值打印出来，逐项核对类型、顺序、范围和选项对象。",
    enSummary: "One or more arguments do not satisfy the method contract. Log real values and check type, order, range, and option-object shape one field at a time.",
    zhChecks: [
      "确认调用的是哪个重载或参数形式，并对照当前 API 的参数顺序。",
      "逐个打印 body、name、roomName、resourceType、amount 或 opts 的真实值。",
      "检查数字范围、字符串格式、数组内容和选项字段是否存在非法值。",
      "修正后只调用一次并保存返回值，避免重复调用掩盖最初的参数错误。",
    ],
    enChecks: [
      "Identify the exact call shape or overload and compare it with the current API parameter order.",
      "Log the real body, name, roomName, resourceType, amount, or opts values one by one.",
      "Check numeric ranges, string formats, array contents, and option fields for invalid values.",
      "After correcting the inputs, call once and store the result so repeated calls do not hide the original argument failure.",
    ],
    apiEntryIds: ["spawn-spawn-creep", "room-create-construction-site", "terminal-send", "market-create-order"],
    hubSlugs: ["structure-spawn", "room", "market"],
    guides: [
      { zhLabel: "Market createOrder() 参数", enLabel: "Market createOrder() arguments", zhHref: "/blog/screeps-market-create-order", enHref: "/en/blog/screeps-market-create-order" },
      { zhLabel: "Construction Site 参数", enLabel: "Construction Site arguments", zhHref: "/blog/screeps-room-create-construction-site", enHref: "/en/blog/screeps-room-create-construction-site" },
    ],
    tools: [
      { zhLabel: "Market 与 Terminal 成本计算器", enLabel: "Market and Terminal Cost Calculator", zhHref: "/tools/market-terminal-cost-calculator", enHref: "/en/tools/market-terminal-cost-calculator" },
      { zhLabel: "Creep 身体计算器", enLabel: "Creep Body Calculator", zhHref: "/tools/creep-body-calculator", enHref: "/en/tools/creep-body-calculator" },
    ],
    zhSearchTerms: ["参数错误", "invalid args", "body错误", "roomName错误", "数量错误"],
    enSearchTerms: ["invalid args", "bad arguments", "wrong body", "wrong room name", "invalid amount"],
  },
  {
    name: "ERR_NAME_EXISTS",
    zhSummary: "准备创建的 Creep 名称仍被占用。名称生成属于 Spawn 生命周期的一部分，应在入队或生成前保证唯一。",
    enSummary: "The requested Creep name is already in use. Name generation is part of the Spawn lifecycle and should be made unique before queueing or spawning.",
    zhChecks: [
      "打印准备使用的名称，并检查 Game.creeps[name] 是否已经存在。",
      "确认 Spawn 队列没有为多个任务提前分配相同名称。",
      "使用可预测但唯一的命名策略，例如角色、序号与 Game.time 的组合。",
      "重新生成名称后再次 dryRun 或正式调用，并保存返回值。",
    ],
    enChecks: [
      "Log the requested name and check whether Game.creeps[name] already exists.",
      "Confirm that the Spawn queue did not preassign the same name to multiple pending tasks.",
      "Use a predictable but unique naming strategy, such as role, sequence, and Game.time.",
      "After generating a new name, run dryRun or the real call again and store the result.",
    ],
    apiEntryIds: ["spawn-spawn-creep"],
    hubSlugs: ["structure-spawn"],
    guides: [
      { zhLabel: "spawnCreep() 返回码", enLabel: "spawnCreep() return codes", zhHref: "/blog/screeps-spawncreep-return-codes", enHref: "/en/blog/screeps-spawncreep-return-codes" },
    ],
    tools: [
      { zhLabel: "Spawn 队列与替换规划器", enLabel: "Spawn Queue and Replacement Planner", zhHref: "/tools/spawn-queue-replacement-planner", enHref: "/en/tools/spawn-queue-replacement-planner" },
    ],
    zhSearchTerms: ["名字重复", "creep重名", "spawn name exists", "名称已存在"],
    enSearchTerms: ["name exists", "duplicate creep name", "spawn name collision", "creep already exists"],
  },
  {
    name: "ERR_RCL_NOT_ENOUGH",
    zhSummary: "当前房间 Controller 等级或结构激活状态不允许这次操作。先确认 RCL、结构数量和 isActive()，再改任务计划。",
    enSummary: "The current room Controller level or structure activation state does not permit the action. Check RCL, structure limits, and isActive() before changing the plan.",
    zhChecks: [
      "读取 room.controller?.level，并确认房间确实由当前代码预期的 Controller 控制。",
      "对建设任务检查当前 RCL 的结构解锁等级和数量上限。",
      "对现有 Structure 检查 structure.isActive()，不要只因为对象存在就认为它可用。",
      "RCL 不满足时应调整队列或等待升级，而不是每 tick 重复提交必然失败的动作。",
    ],
    enChecks: [
      "Read room.controller?.level and confirm that the room is controlled by the Controller your code expects.",
      "For construction work, check the current RCL unlock level and structure-count limit.",
      "For existing Structures, check structure.isActive(); existence alone does not guarantee the structure can act.",
      "When RCL is insufficient, change the queue or wait for an upgrade instead of submitting a guaranteed failure every tick.",
    ],
    apiEntryIds: ["room-create-construction-site"],
    hubSlugs: ["room", "controller", "structure-spawn"],
    guides: [
      { zhLabel: "Controller 降级与恢复", enLabel: "Controller downgrade and recovery", zhHref: "/blog/screeps-controller-downgrade", enHref: "/en/blog/screeps-controller-downgrade" },
      { zhLabel: "Controller Safe Mode", enLabel: "Controller Safe Mode", zhHref: "/blog/screeps-controller-activate-safe-mode", enHref: "/en/blog/screeps-controller-activate-safe-mode" },
    ],
    tools: [
      { zhLabel: "Controller 降级与 Upgrader 规划器", enLabel: "Controller Downgrade and Upgrader Planner", zhHref: "/tools/controller-downgrade-planner", enHref: "/en/tools/controller-downgrade-planner" },
      { zhLabel: "房间运行诊断", enLabel: "Room Snapshot Diagnostic", zhHref: "/tools/room-diagnostics", enHref: "/en/tools/room-diagnostics" },
    ],
    zhSearchTerms: ["rcl不足", "控制器等级不足", "建筑未解锁", "structure inactive"],
    enSearchTerms: ["rcl not enough", "controller level too low", "structure locked", "structure inactive"],
  },
] as const satisfies readonly ScreepsErrorDiagnostic[];

export function getScreepsErrorDiagnostic(name: string): ScreepsErrorDiagnostic | null {
  return screepsErrorDiagnostics.find((diagnostic) => diagnostic.name === name) ?? null;
}

export function getLocalizedErrorDiagnosticLink(
  link: ScreepsErrorDiagnosticLink,
  locale: ScreepsErrorDiagnosticLocale,
): { label: string; href: string } {
  return locale === "en"
    ? { label: link.enLabel, href: link.enHref }
    : { label: link.zhLabel, href: link.zhHref };
}
