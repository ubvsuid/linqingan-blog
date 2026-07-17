export interface ScreepsGlossaryEntry {
  term: string;
  chinese: string;
  category: "对象" | "运行" | "建筑" | "约定";
  summary: string;
  detail: string;
  article?: { label: string; href: string };
}

export const screepsGlossary: ScreepsGlossaryEntry[] = [
  { term: "Creep", chinese: "单位", category: "对象", summary: "由代码控制并具有寿命的可移动单位。", detail: "Creep 的能力由身体部件决定，可以采集、运输、建造、维修和升级 Controller。", article: { label: "控制第一只 Creep", href: "/blog/screeps-first-creep-harvest" } },
  { term: "Spawn", chinese: "孵化建筑", category: "建筑", summary: "消耗房间能量创建新 Creep 的核心建筑。", detail: "使用 spawnCreep() 创建单位，需要身体部件数组、不会重复的名称和足够能量。", article: { label: "认识 spawnCreep()", href: "/blog/screeps-spawn-create-creep" } },
  { term: "Source", chinese: "能量源", category: "对象", summary: "房间中周期性恢复能量的自然资源点。", detail: "拥有 WORK 部件的 Creep 可以调用 harvest() 采集 Source。", article: { label: "采集第一份能量", href: "/blog/screeps-first-creep-harvest" } },
  { term: "Controller", chinese: "房间控制器", category: "对象", summary: "决定房间归属和控制等级的特殊对象。", detail: "对 Controller 调用 upgradeController() 可以提升控制进度和 RCL。", article: { label: "自动升级 Controller", href: "/blog/screeps-upgrade-controller" } },
  { term: "RCL", chinese: "房间控制等级", category: "对象", summary: "Room Controller Level 的缩写。", detail: "RCL 决定当前房间可以建造的建筑类型和数量。", article: { label: "建造第一个 Extension", href: "/blog/screeps-first-extension" } },
  { term: "Extension", chinese: "扩展建筑", category: "建筑", summary: "为 Spawn 提供额外可用能量容量的建筑。", detail: "Extension 中的能量会和 Spawn 的能量一起用于创建 Creep。", article: { label: "建造第一个 Extension", href: "/blog/screeps-first-extension" } },
  { term: "Construction Site", chinese: "建筑工地", category: "建筑", summary: "建筑完成前的施工目标。", detail: "携带能量并拥有 WORK 部件的 Creep 可以调用 build() 建造工地。", article: { label: "自动建造和维修", href: "/blog/screeps-build-and-repair" } },
  { term: "Store", chinese: "存储空间", category: "建筑", summary: "Creep 和建筑保存资源的统一接口。", detail: "常用 getFreeCapacity() 判断剩余空间，getUsedCapacity() 判断已使用空间。" },
  { term: "tick", chinese: "游戏刻", category: "运行", summary: "代码执行一次并推进一次游戏状态的单位。", detail: "main.loop 会在每个 tick 重新运行，所以代码需要持续读取状态并重新做决定。", article: { label: "认识 tick 和主循环", href: "/blog/screeps-tick-and-game-loop" } },
  { term: "Game", chinese: "当前状态入口", category: "运行", summary: "读取当前 tick 游戏对象的全局对象。", detail: "Game.creeps、Game.spawns 和 Game.rooms 都只代表当前 tick。" },
  { term: "Memory", chinese: "持久化内存", category: "运行", summary: "在不同 tick 之间保存简单数据的全局对象。", detail: "适合保存角色、状态和配置，不应该直接保存 Creep 等游戏对象。" },
  { term: "CPU", chinese: "计算额度", category: "运行", summary: "每个 tick 可供代码使用的计算资源。", detail: "代码规模扩大后需要关注 limit、bucket 和 Game.cpu.getUsed()。" },
  { term: "Room", chinese: "房间", category: "对象", summary: "Screeps 世界地图中的基本区域。", detail: "房间包含 Source、建筑、Controller、工地和活动单位。", article: { label: "认识第一个房间", href: "/blog/screeps-first-room" } },
  { term: "RoomPosition", chinese: "房间坐标", category: "对象", summary: "表示房间中 x、y 位置的对象。", detail: "移动、范围判断和目标选择通常都依赖 RoomPosition。" },
  { term: "Role", chinese: "角色", category: "约定", summary: "玩家为 Creep 工作职责起的名称。", detail: "Harvester、Upgrader 和 Builder 都是玩家约定，不是游戏内置职业。", article: { label: "认识角色分工", href: "/blog/screeps-creep-roles" } },
  { term: "Body Part", chinese: "身体部件", category: "对象", summary: "决定 Creep 能力和移动效率的组成部分。", detail: "新手最先接触 WORK、CARRY 和 MOVE，不同部件具有不同能量成本。", article: { label: "认识身体部件", href: "/blog/screeps-creep-body-parts" } },
];
