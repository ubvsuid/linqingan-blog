export interface ScreepsErrorLink {
  label: string;
  href: string;
}

export interface ScreepsErrorCode {
  name: string;
  value: number;
  meaning: string;
  commonCause: string;
  fix: string;
  operations?: string[];
  checks?: string[];
  wrongExample?: string;
  example?: string;
  related?: ScreepsErrorLink[];
}

export const screepsErrorCodes: ScreepsErrorCode[] = [
  { name: "OK", value: 0, meaning: "调用成功。", commonCause: "动作已经被接受。", fix: "不需要修复，但仍应在后续 tick 核对状态是否按预期变化。", related: [{ label: "了解动作返回值调试", href: "/verification" }] },
  { name: "ERR_NOT_OWNER", value: -1, meaning: "目标不属于你，或当前对象不能由你控制。", commonCause: "对其他玩家的 Creep、Spawn 或建筑执行受所有权限制的操作。", fix: "确认目标属于自己，并检查房间控制权。", related: [{ label: "安全拆除己方结构", href: "/blog/screeps-structure-destroy" }] },
  { name: "ERR_NO_PATH", value: -2, meaning: "没有找到可到达目标的路径。", commonCause: "目标被墙、建筑或不可通行地形隔开，或 PathFinder 回调拒绝了房间。", fix: "检查目标位置、有效 range、房间出口、障碍物和 roomCallback。", related: [{ label: "ERR_NO_PATH 排查流程", href: "/blog/screeps-err-no-path" }, { label: "配置 CostMatrix", href: "/blog/screeps-pathfinder-costmatrix" }] },
  { name: "ERR_NAME_EXISTS", value: -3, meaning: "准备创建的名称已经存在。", commonCause: "spawnCreep() 使用了一个仍被占用的 Creep 名称。", fix: "生成唯一名称，或在创建前检查 Game.creeps[name]。", example: "const name = `Harvester${Game.time}`;\nGame.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE], name);", related: [{ label: "按返回值排查 spawnCreep()", href: "/blog/screeps-spawncreep-return-codes" }] },
  { name: "ERR_BUSY", value: -4, meaning: "对象当前正忙，无法接受新的操作。", commonCause: "例如 Spawn 正在创建另一个 Creep，或对象处于当前方法规定的忙碌状态。", fix: "只在对应 API 文档列出 ERR_BUSY 时检查其忙碌属性，不要把一个方法的限制机械套到另一个方法。", related: [{ label: "renewCreep() 的 Spawn 状态", href: "/blog/screeps-spawn-renew-creep" }, { label: "recycleCreep() 的返回值边界", href: "/blog/screeps-spawn-recycle-creep" }] },
  { name: "ERR_NOT_FOUND", value: -5, meaning: "没有找到要求的对象或目标。", commonCause: "名称、ID、资源类型或查找条件不正确。", fix: "打印变量并检查查找结果是否为 undefined、null 或空数组。", related: [{ label: "用 getObjectById() 恢复目标", href: "/blog/screeps-game-get-object-by-id" }] },
  { name: "ERR_NOT_ENOUGH_RESOURCES", value: -6, meaning: "执行动作所需的资源不足。", commonCause: "Creep、建筑、账号资源或 CPU bucket 没有达到当前方法要求。", fix: "按当前 API 检查具体资源，不要只假设缺少 Energy。", operations: ["transfer()", "build()", "repair()", "processPower()", "Game.cpu.generatePixel()"], related: [{ label: "检查 Power Spawn 资源", href: "/blog/screeps-power-spawn-process-power" }, { label: "检查 Terminal 发送预算", href: "/blog/screeps-terminal-send-resources" }] },
  { name: "ERR_NOT_ENOUGH_ENERGY", value: -6, meaning: "旧代码中常见的 Energy 不足名称，与 -6 返回值有关。", commonCause: "创建身体成本超过房间当前 Energy，或动作对象没有足够 Energy。", fix: "新文章优先按具体 API 使用 ERR_NOT_ENOUGH_RESOURCES，并同时检查 room.energyAvailable、Store 和任务计划量。", related: [{ label: "动态生成 Creep 身体", href: "/blog/screeps-dynamic-creep-body-energy" }, { label: "房间 Energy 诊断", href: "/tools/room-diagnostics" }] },
  { name: "ERR_INVALID_TARGET", value: -7, meaning: "目标不适用于当前动作。", commonCause: "把 Source 传给 transfer()，把完整建筑当作 Construction Site，或使用了失效对象。", fix: "确认方法需要的目标类型，并在调用前检查对象类型、所有权和当前状态。", related: [{ label: "安全使用 withdraw()", href: "/blog/screeps-creep-withdraw-container-energy" }] },
  { name: "ERR_FULL", value: -8, meaning: "目标已经装满，或没有剩余容量。", commonCause: "向已满的 Spawn、Extension、Creep、Lab、Link 或 Terminal 继续传输或生产。", fix: "使用 store.getFreeCapacity(resourceType) 检查目标资源的剩余容量，并考虑同 tick 的并发动作。", related: [{ label: "检查 Link 目标容量", href: "/blog/screeps-link-transfer-energy" }, { label: "检查 Lab 输出容量", href: "/blog/screeps-lab-run-reaction" }] },
  {
    name: "ERR_NOT_IN_RANGE",
    value: -9,
    meaning: "目标距离当前对象太远，这一次动作没有被安排。",
    commonCause: "调用 harvest()、transfer()、upgradeController()、build()、repair()、recycleCreep()、transferEnergy() 或 launchNuke() 时不满足该 API 的范围规则。",
    fix: "先保存动作返回值。Creep 动作只有返回 ERR_NOT_IN_RANGE 时才调用 moveTo()；建筑 API 则检查其同房间或最大范围规则。",
    operations: ["harvest()", "transfer()", "upgradeController()", "build()", "repair()", "recycleCreep()", "transferEnergy()", "launchNuke()"],
    checks: [
      "确认目标变量真实存在，不是 undefined、null 或空数组中的缺失项。",
      "确认目标类型适用于当前方法。",
      "把动作返回值保存并输出，确认实际得到的确实是 ERR_NOT_IN_RANGE（-9）。",
      "Creep 动作收到 -9 后调用 moveTo(target)，并在下一个 tick 重新执行原动作。",
      "Link 和 Nuker 等建筑方法不依赖 moveTo()，应检查同房间、目标房间或官方范围常量。",
    ],
    wrongExample: "// 只调用动作，没有处理距离不足\nconst result = creep.harvest(source);\nconsole.log(result); // 可能得到 -9",
    example: "const result = creep.harvest(source);\n\nif (result === ERR_NOT_IN_RANGE) {\n  const moveResult = creep.moveTo(source);\n\n  if (moveResult !== OK) {\n    console.log(creep.name + ' 移动失败：' + moveResult);\n  }\n}",
    related: [
      { label: "完整 ERR_NOT_IN_RANGE 排查", href: "/blog/screeps-err-not-in-range" },
      { label: "Link 同房间范围", href: "/blog/screeps-link-transfer-energy" },
      { label: "Nuker 发射范围", href: "/blog/screeps-nuker-launch-checklist" },
      { label: "查询 RoomPosition 术语", href: "/glossary#roomposition" },
    ],
  },
  { name: "ERR_INVALID_ARGS", value: -10, meaning: "传入参数的类型、数量或内容不正确。", commonCause: "身体数组、名称、方向、资源类型、房间名、数量或选项对象写错。", fix: "对照当前 API 参数顺序，打印每个参数的真实值，并检查数值范围。", related: [{ label: "创建市场订单的参数检查", href: "/blog/screeps-market-create-order" }, { label: "创建 Road 工地", href: "/blog/screeps-room-create-construction-site" }] },
  { name: "ERR_TIRED", value: -11, meaning: "对象仍在冷却或 Creep 当前疲劳。", commonCause: "Creep fatigue 尚未恢复，或 Link 等结构的 cooldown 大于 0。", fix: "读取对应对象的 fatigue 或 cooldown，等待后在下一 tick 重新判断。", related: [{ label: "理解 fatigue 与 MOVE 配比", href: "/blog/screeps-move-fatigue-body-ratio" }, { label: "检查 Link cooldown", href: "/blog/screeps-link-transfer-energy" }] },
  { name: "ERR_NO_BODYPART", value: -12, meaning: "Creep 缺少执行动作所需的有效身体部件。", commonCause: "没有 WORK 却采集，缺少 CLAIM，或相关身体部件已经被摧毁。", fix: "检查 creep.getActiveBodyparts()，并在创建时加入需要的部件。", related: [{ label: "使用 Creep 身体计算器", href: "/tools/creep-body-calculator" }] },
  { name: "ERR_RCL_NOT_ENOUGH", value: -14, meaning: "当前房间控制等级不足，或结构在当前 RCL 不可用。", commonCause: "尝试建造尚未解锁的建筑、数量超过上限，或调用未激活结构。", fix: "检查 Controller 等级、CONTROLLER_STRUCTURES、结构数量和 structure.isActive()。", related: [{ label: "动态身体与房间 Energy", href: "/blog/screeps-dynamic-creep-body-energy" }, { label: "Safe Mode 返回值", href: "/blog/screeps-controller-activate-safe-mode" }] },
  { name: "ERR_GCL_NOT_ENOUGH", value: -15, meaning: "全局控制等级不足。", commonCause: "尝试 claim 超过 GCL 允许数量的房间。", fix: "提升 GCL、放弃一个已有房间，或将当前任务改为 reserve。", related: [{ label: "reserveController 与 claimController", href: "/blog/screeps-reserve-vs-claim-controller" }] },
];
