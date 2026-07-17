export interface ScreepsErrorCode {
  name: string;
  value: number;
  meaning: string;
  commonCause: string;
  fix: string;
  example?: string;
}

export const screepsErrorCodes: ScreepsErrorCode[] = [
  { name: "OK", value: 0, meaning: "调用成功。", commonCause: "动作已经被接受。", fix: "不需要修复，可以继续执行后续逻辑。" },
  { name: "ERR_NOT_OWNER", value: -1, meaning: "目标不属于你，或当前对象不能由你控制。", commonCause: "对其他玩家的 Creep、Spawn 或建筑执行受所有权限制的操作。", fix: "确认目标属于自己，并检查房间控制权。" },
  { name: "ERR_NO_PATH", value: -2, meaning: "没有找到可到达目标的路径。", commonCause: "目标被墙、建筑或不可通行地形完全隔开。", fix: "检查目标位置、房间出口和障碍物，必要时调整 PathFinder 选项。" },
  { name: "ERR_NAME_EXISTS", value: -3, meaning: "准备创建的名称已经存在。", commonCause: "spawnCreep() 使用了一个仍被占用的 Creep 名称。", fix: "生成唯一名称，或在创建前检查 Game.creeps[name]。", example: "const name = `Harvester${Game.time}`;\nGame.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE], name);" },
  { name: "ERR_BUSY", value: -4, meaning: "对象当前正忙，无法接受新的操作。", commonCause: "Spawn 正在创建另一个 Creep，或对象处于不能执行该动作的状态。", fix: "先检查 spawn.spawning，等当前任务完成后再调用。" },
  { name: "ERR_NOT_FOUND", value: -5, meaning: "没有找到要求的对象或目标。", commonCause: "名称、ID、资源类型或查找条件不正确。", fix: "打印变量并检查查找结果是否为 undefined 或空数组。" },
  { name: "ERR_NOT_ENOUGH_ENERGY", value: -6, meaning: "可用能量不足。", commonCause: "创建身体成本超过房间当前能量，或 Creep 没有携带足够能量。", fix: "等待能量补充、降低身体成本，或先采集和装载能量。" },
  { name: "ERR_INVALID_TARGET", value: -7, meaning: "目标不适用于当前动作。", commonCause: "把 Source 传给 transfer()，或把完整建筑当作 Construction Site 建造。", fix: "确认方法需要的目标类型，并在调用前检查对象结构。" },
  { name: "ERR_FULL", value: -8, meaning: "目标已经装满，或没有剩余容量。", commonCause: "向已满的 Spawn、Extension 或 Creep 继续 transfer()。", fix: "用 target.store.getFreeCapacity(RESOURCE_ENERGY) 检查剩余容量。" },
  { name: "ERR_NOT_IN_RANGE", value: -9, meaning: "Creep 离目标太远。", commonCause: "直接 harvest()、transfer()、build() 或 upgradeController()，但没有先靠近。", fix: "收到该返回值时调用 moveTo()。", example: "const result = creep.harvest(source);\nif (result === ERR_NOT_IN_RANGE) {\n  creep.moveTo(source);\n}" },
  { name: "ERR_INVALID_ARGS", value: -10, meaning: "传入参数的类型、数量或内容不正确。", commonCause: "身体数组、名称、方向、资源类型或选项对象写错。", fix: "对照 API 参数顺序，并打印每个参数检查实际值。" },
  { name: "ERR_TIRED", value: -11, meaning: "Creep 当前疲劳，暂时不能移动。", commonCause: "MOVE 部件不足、道路条件差，或拖动其他 Creep 产生疲劳。", fix: "等待疲劳恢复，或重新设计 MOVE 与其他部件的比例。" },
  { name: "ERR_NO_BODYPART", value: -12, meaning: "Creep 缺少执行动作所需的有效身体部件。", commonCause: "没有 WORK 却采集，或相关身体部件已经被摧毁。", fix: "检查 creep.getActiveBodyparts()，并在创建时加入需要的部件。" },
  { name: "ERR_RCL_NOT_ENOUGH", value: -14, meaning: "当前房间控制等级不足。", commonCause: "尝试建造当前 RCL 尚未解锁的建筑，或数量超过上限。", fix: "先升级 Controller，并检查 CONTROLLER_STRUCTURES 中的数量限制。" },
  { name: "ERR_GCL_NOT_ENOUGH", value: -15, meaning: "全局控制等级不足。", commonCause: "尝试控制超过 GCL 允许数量的房间。", fix: "提升 GCL，或放弃一个已有房间的控制权。" },
];
