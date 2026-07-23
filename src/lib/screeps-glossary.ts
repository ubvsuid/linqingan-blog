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
  { term: "Spawn", chinese: "孵化建筑", category: "建筑", summary: "消耗房间能量创建新 Creep 的核心建筑。", detail: "使用 spawnCreep() 创建单位，需要身体部件数组、不会重复的名称和足够能量。", article: { label: "排查 spawnCreep() 返回值", href: "/blog/screeps-spawncreep-return-codes" } },
  { term: "Source", chinese: "能量源", category: "对象", summary: "房间中周期性恢复能量的自然资源点。", detail: "拥有 WORK 部件的 Creep 可以调用 harvest() 采集 Source。", article: { label: "选择最近可达 Source", href: "/blog/screeps-select-source-by-path" } },
  { term: "Controller", chinese: "房间控制器", category: "对象", summary: "决定房间归属和控制等级的特殊对象。", detail: "对 Controller 调用 upgradeController() 可以提升控制进度和 RCL。", article: { label: "处理 Controller 降级风险", href: "/blog/screeps-controller-downgrade" } },
  { term: "RCL", chinese: "房间控制等级", category: "对象", summary: "Room Controller Level 的缩写。", detail: "RCL 决定当前房间可以建造的建筑类型和数量。", article: { label: "查看 ERR_RCL_NOT_ENOUGH", href: "/screeps-errors#err_rcl_not_enough" } },
  { term: "GCL", chinese: "全局控制等级", category: "运行", summary: "决定账号最多可同时控制多少房间的等级。", detail: "claimController() 受到 GCL 限制；reserveController() 不会把目标房间变成你的正式房间。", article: { label: "比较 reserve 与 claim", href: "/blog/screeps-reserve-vs-claim-controller" } },
  { term: "Extension", chinese: "扩展建筑", category: "建筑", summary: "为 Spawn 提供额外可用能量容量的建筑。", detail: "Extension 中的能量会和 Spawn 的能量一起用于创建 Creep。", article: { label: "安全拆除建错的 Extension", href: "/blog/screeps-structure-destroy" } },
  { term: "Construction Site", chinese: "建筑工地", category: "建筑", summary: "建筑完成前的施工目标。", detail: "携带能量并拥有 WORK 部件的 Creep 可以调用 build() 建造工地。", article: { label: "查看工地进度", href: "/blog/screeps-construction-site-progress" } },
  { term: "Store", chinese: "存储接口", category: "对象", summary: "Creep 和多数建筑保存资源的统一接口。", detail: "常用 getFreeCapacity() 判断剩余空间，getUsedCapacity() 判断已使用空间。", article: { label: "使用 Storage Energy", href: "/blog/screeps-storage-energy-usage" } },
  { term: "Storage", chinese: "房间仓库", category: "建筑", summary: "用于长期集中保存大量资源的房间建筑。", detail: "通过 room.storage 访问；对象可能不存在，读取 Store 前应先判空。", article: { label: "判断 Storage 并读写 Energy", href: "/blog/screeps-storage-energy-usage" } },
  { term: "Link", chinese: "能量链路建筑", category: "建筑", summary: "在同一房间内远程传输 Energy 的建筑。", detail: "Link 传输具有 cooldown 和损耗，网络中应使用固定 ID 区分 Source、Controller 与 Storage Link。", article: { label: "安全使用 transferEnergy()", href: "/blog/screeps-link-transfer-energy" } },
  { term: "Terminal", chinese: "跨房资源终端", category: "建筑", summary: "用于跨房间发送资源并参与市场交易的建筑。", detail: "send() 会消耗交易 Energy，并受 cooldown、目标房间和容量约束。", article: { label: "跨房发送资源", href: "/blog/screeps-terminal-send-resources" } },
  { term: "Lab", chinese: "实验室", category: "建筑", summary: "用于矿物反应和强化 Creep 身体部件的建筑。", detail: "runReaction() 需要正确配方、相邻输入 Lab、库存、输出容量和 cooldown。", article: { label: "安全执行矿物反应", href: "/blog/screeps-lab-run-reaction" } },
  { term: "Factory", chinese: "工厂", category: "建筑", summary: "根据 COMMODITIES 配方生产商品的建筑。", detail: "produce() 前要检查组件、输出容量、cooldown 和可能需要的 Factory 等级或 Power 效果。", article: { label: "使用 Factory.produce()", href: "/blog/screeps-factory-produce" } },
  { term: "Observer", chinese: "观察者", category: "建筑", summary: "请求远方房间视野的建筑。", detail: "observeRoom() 提交后，要在后续 tick 从 Game.rooms 读取目标房间，不能同 tick 立即判断结果。", article: { label: "理解 Observer 两 tick 时序", href: "/blog/screeps-observer-observe-room" } },
  { term: "Nuker", chinese: "核弹发射器", category: "建筑", summary: "向范围内目标房间发射核弹的高风险建筑。", detail: "发射不可逆，必须检查目标、范围、cooldown、Energy、Ghodium 和人工确认。", article: { label: "Nuker 发射检查清单", href: "/blog/screeps-nuker-launch-checklist" } },
  { term: "Rampart", chinese: "防御墙体", category: "建筑", summary: "可保护己方建筑并控制其他单位是否通行的防御结构。", detail: "己方 Creep 可以通过私有 Rampart；setPublic() 会改变其他玩家单位的通行权限。", article: { label: "使用 Rampart.setPublic()", href: "/blog/screeps-rampart-set-public" } },
  { term: "cooldown", chinese: "冷却时间", category: "运行", summary: "对象在再次执行某些动作前需要等待的 tick 数。", detail: "Link、Terminal、Lab、Factory、Nuker 等对象都有各自的 cooldown 规则，通常应等待并在后续 tick 重新读取。", article: { label: "查看 Link cooldown 示例", href: "/blog/screeps-link-transfer-energy" } },
  { term: "tick", chinese: "游戏刻", category: "运行", summary: "代码执行一次并推进一次游戏状态的单位。", detail: "main.loop 会在每个 tick 重新运行，所以代码需要持续读取状态并重新做决定。", article: { label: "认识 tick 和主循环", href: "/blog/screeps-tick-and-game-loop" } },
  { term: "Game", chinese: "当前状态入口", category: "运行", summary: "读取当前 tick 游戏对象的全局对象。", detail: "Game.creeps、Game.spawns 和 Game.rooms 都只代表当前 tick。", article: { label: "房间为什么不在 Game.rooms", href: "/blog/screeps-room-visibility" } },
  { term: "Memory", chinese: "持久化内存", category: "运行", summary: "在不同 tick 之间保存简单数据的全局对象。", detail: "适合保存角色、状态和配置，不应该直接保存 Creep 等游戏对象。", article: { label: "学习 Memory 基础", href: "/blog/screeps-memory-basics" } },
  { term: "RawMemory Segment", chinese: "分段内存", category: "运行", summary: "用于保存和按需激活较大字符串数据的 RawMemory 区域。", detail: "Segment 编号范围为 0 到 99，每 tick 最多请求激活 10 个；激活与读取存在跨 tick 时序。", article: { label: "安全读取和写回 Segment", href: "/blog/screeps-rawmemory-segments" } },
  { term: "CPU", chinese: "计算额度", category: "运行", summary: "每个 tick 可供代码使用的计算资源。", detail: "代码规模扩大后需要关注 limit、bucket 和 Game.cpu.getUsed()。", article: { label: "监控 CPU 与 bucket", href: "/blog/screeps-cpu-getused-bucket" } },
  { term: "Room", chinese: "房间", category: "对象", summary: "Screeps 世界地图中的基本区域。", detail: "房间包含 Source、建筑、Controller、工地和活动单位。", article: { label: "运行房间诊断", href: "/tools/room-diagnostics" } },
  { term: "RoomPosition", chinese: "房间坐标", category: "对象", summary: "表示房间中 x、y 位置的对象。", detail: "移动、范围判断和目标选择通常都依赖 RoomPosition。", article: { label: "比较距离判断方法", href: "/blog/screeps-roomposition-distance" } },
  { term: "CostMatrix", chinese: "路径成本矩阵", category: "运行", summary: "为 PathFinder 指定每个房间格子的移动成本。", detail: "0 表示使用默认地形成本，1 到 254 表示自定义成本，255 表示不可通行。", article: { label: "配置 PathFinder CostMatrix", href: "/blog/screeps-pathfinder-costmatrix" } },
  { term: "Role", chinese: "角色", category: "约定", summary: "玩家为 Creep 工作职责起的名称。", detail: "Harvester、Upgrader 和 Builder 都是玩家约定，不是游戏内置职业。", article: { label: "认识角色分工", href: "/blog/screeps-creep-roles" } },
  { term: "Body Part", chinese: "身体部件", category: "对象", summary: "决定 Creep 能力和移动效率的组成部分。", detail: "不同部件具有不同 Energy 成本；总数不能超过 50。", article: { label: "使用身体方案预设", href: "/tools/creep-body-calculator" } },
];
