export interface ScreepsApiReferenceEntry {
  group: string;
  object: string;
  method: string;
  signature: string;
  summary: string;
  guideHref?: string;
}

export const screepsApiReference: ScreepsApiReferenceEntry[] = [
  { group: "Game 与运行时", object: "Game", method: "getObjectById", signature: "Game.getObjectById(id)", summary: "通过对象 ID 在当前 tick 恢复可访问的游戏对象；返回值仍需判空。", guideHref: "/blog/screeps-game-get-object-by-id" },
  { group: "Game 与运行时", object: "Game.map", method: "findRoute", signature: "Game.map.findRoute(fromRoom, toRoom, opts?)", summary: "规划房间级跨房路线，返回出口与下一房间序列。", guideHref: "/blog/screeps-map-find-route" },
  { group: "Game 与运行时", object: "Game.cpu", method: "getUsed", signature: "Game.cpu.getUsed()", summary: "读取当前 tick 从脚本开始到调用位置已经使用的 CPU。", guideHref: "/blog/screeps-cpu-getused-bucket" },
  { group: "Game 与运行时", object: "Game", method: "notify", signature: "Game.notify(message, groupInterval?)", summary: "向账号通知队列提交重要事件提醒；业务代码应自行限频。", guideHref: "/blog/screeps-game-notify" },
  { group: "Game 与运行时", object: "RawMemory", method: "setActiveSegments", signature: "RawMemory.setActiveSegments(ids)", summary: "请求下一 tick 激活指定 Memory Segments。", guideHref: "/blog/screeps-rawmemory-segments" },

  { group: "Room 与位置", object: "Room", method: "find", signature: "room.find(type, opts?)", summary: "在当前可见房间中按 FIND_* 常量查找对象。" },
  { group: "Room 与位置", object: "Room", method: "createConstructionSite", signature: "room.createConstructionSite(x, y, structureType)", summary: "在明确坐标提交 Construction Site 创建请求。", guideHref: "/blog/screeps-room-create-construction-site" },
  { group: "Room 与位置", object: "Room", method: "getEventLog", signature: "room.getEventLog(raw?)", summary: "读取上一 tick 已发生的房间事件，用于跨 tick 结果验证。", guideHref: "/blog/screeps-room-event-log" },
  { group: "Room 与位置", object: "RoomPosition", method: "getRangeTo", signature: "pos.getRangeTo(target)", summary: "计算同房间位置之间的线性 range，不考虑地形和障碍。", guideHref: "/blog/screeps-roomposition-distance" },
  { group: "Room 与位置", object: "RoomPosition", method: "inRangeTo", signature: "pos.inRangeTo(target, range)", summary: "判断当前位置是否处于指定线性范围内。", guideHref: "/blog/screeps-roomposition-distance" },
  { group: "Room 与位置", object: "RoomPosition", method: "findClosestByPath", signature: "pos.findClosestByPath(typeOrObjects, opts?)", summary: "根据实际可达路径选择候选目标，而不是只比较直线距离。", guideHref: "/blog/screeps-select-source-by-path" },

  { group: "Creep 动作", object: "Creep", method: "moveTo", signature: "creep.moveTo(target, opts?)", summary: "提交移动命令；OK 只代表命令被接受，后续 tick 再观察位置。", guideHref: "/blog/screeps-moveto-not-moving" },
  { group: "Creep 动作", object: "Creep", method: "harvest", signature: "creep.harvest(target)", summary: "从 Source、Mineral 或 Deposit 等允许目标采集资源。", guideHref: "/blog/screeps-first-creep-harvest" },
  { group: "Creep 动作", object: "Creep", method: "withdraw", signature: "creep.withdraw(target, resourceType, amount?)", summary: "从可取资源的 Store、Tombstone 或 Ruin 中取出资源。", guideHref: "/blog/screeps-creep-withdraw-container-energy" },
  { group: "Creep 动作", object: "Creep", method: "transfer", signature: "creep.transfer(target, resourceType, amount?)", summary: "把 Creep Store 中的资源转移到可接收目标。", guideHref: "/blog/screeps-creep-deliver-energy" },
  { group: "Creep 动作", object: "Creep", method: "pickup", signature: "creep.pickup(resource)", summary: "拾取地面的 Resource 对象；不要与 withdraw 混用。", guideHref: "/blog/screeps-creep-pickup-dropped-energy" },
  { group: "Creep 动作", object: "Creep", method: "build", signature: "creep.build(constructionSite)", summary: "消耗携带的 Energy 推进己方 Construction Site。", guideHref: "/blog/screeps-first-extension" },
  { group: "Creep 动作", object: "Creep", method: "repair", signature: "creep.repair(structure)", summary: "消耗 Energy 维修可维修结构，目标和范围必须满足方法要求。", guideHref: "/blog/screeps-build-and-repair" },
  { group: "Creep 动作", object: "Creep", method: "upgradeController", signature: "creep.upgradeController(controller)", summary: "消耗 Energy 推进己方 Controller 升级进度。", guideHref: "/blog/screeps-upgrade-controller" },
  { group: "Creep 动作", object: "Creep", method: "reserveController", signature: "creep.reserveController(controller)", summary: "预订中立 Controller，适合远程房间持续使用。", guideHref: "/blog/screeps-reserve-vs-claim-controller" },
  { group: "Creep 动作", object: "Creep", method: "claimController", signature: "creep.claimController(controller)", summary: "尝试正式占领中立 Controller，并受 GCL 等边界限制。", guideHref: "/blog/screeps-reserve-vs-claim-controller" },

  { group: "Spawn 生命周期", object: "StructureSpawn", method: "spawnCreep", signature: "spawn.spawnCreep(body, name, options?)", summary: "提交 Creep 创建请求；可先用 dryRun 检查参数与当前条件。", guideHref: "/blog/screeps-spawncreep-return-codes" },
  { group: "Spawn 生命周期", object: "StructureSpawn", method: "renewCreep", signature: "spawn.renewCreep(creep)", summary: "在满足条件时增加普通 Creep 的剩余寿命，并占用 Spawn。", guideHref: "/blog/screeps-spawn-renew-creep" },
  { group: "Spawn 生命周期", object: "StructureSpawn", method: "recycleCreep", signature: "spawn.recycleCreep(creep)", summary: "回收相邻且不再需要的己方 Creep；属于不可逆生命周期操作。", guideHref: "/blog/screeps-spawn-recycle-creep" },

  { group: "房间建筑", object: "StructureLink", method: "transferEnergy", signature: "link.transferEnergy(target, amount?)", summary: "在同房间 Link 之间远程传输 Energy，并受到 cooldown 与损耗影响。", guideHref: "/blog/screeps-link-transfer-energy" },
  { group: "房间建筑", object: "StructureTerminal", method: "send", signature: "terminal.send(resourceType, amount, destination, description?)", summary: "跨房间发送资源，并由发送方承担交易 Energy 成本。", guideHref: "/blog/screeps-terminal-send-resources" },
  { group: "房间建筑", object: "StructureTower", method: "attack", signature: "tower.attack(target)", summary: "攻击同房间有效敌对目标；实际效果会受到距离等因素影响。", guideHref: "/blog/screeps-tower-auto-attack-hostiles" },
  { group: "房间建筑", object: "StructureTower", method: "heal", signature: "tower.heal(target)", summary: "治疗同房间有效己方单位。", guideHref: "/blog/screeps-tower-heal-creeps" },
  { group: "房间建筑", object: "StructureTower", method: "repair", signature: "tower.repair(target)", summary: "维修同房间结构，生产逻辑通常需要 Energy 保留线。", guideHref: "/blog/screeps-tower-repair-threshold" },
  { group: "房间建筑", object: "StructureLab", method: "runReaction", signature: "lab.runReaction(inputA, inputB)", summary: "由输出 Lab 使用两座输入 Lab 执行矿物反应。", guideHref: "/blog/screeps-lab-run-reaction" },
  { group: "房间建筑", object: "StructureLab", method: "boostCreep", signature: "lab.boostCreep(creep, bodyPartsCount?)", summary: "使用 Lab 中的化合物与 Energy 强化匹配身体部件。", guideHref: "/blog/screeps-lab-boost-creep" },
  { group: "房间建筑", object: "StructureFactory", method: "produce", signature: "factory.produce(resourceType)", summary: "根据 COMMODITIES 配方提交一次商品生产。", guideHref: "/blog/screeps-factory-produce" },
  { group: "房间建筑", object: "StructurePowerSpawn", method: "processPower", signature: "powerSpawn.processPower()", summary: "消耗 Power 与 Energy 推进账号 GPL。", guideHref: "/blog/screeps-power-spawn-process-power" },
  { group: "房间建筑", object: "StructureObserver", method: "observeRoom", signature: "observer.observeRoom(roomName)", summary: "请求远方房间视野，并在下一 tick 读取目标 Room。", guideHref: "/blog/screeps-observer-observe-room" },
  { group: "房间建筑", object: "StructureRampart", method: "setPublic", signature: "rampart.setPublic(isPublic)", summary: "切换 Rampart 的公开通行状态；公开并不等于盟友白名单。", guideHref: "/blog/screeps-rampart-set-public" },
  { group: "房间建筑", object: "StructureController", method: "activateSafeMode", signature: "controller.activateSafeMode()", summary: "在满足条件时消耗一次可用次数开启 Safe Mode。", guideHref: "/blog/screeps-controller-activate-safe-mode" },
  { group: "房间建筑", object: "StructureNuker", method: "launchNuke", signature: "nuker.launchNuke(pos)", summary: "提交不可逆核弹发射请求，必须显式核对目标与资源。", guideHref: "/blog/screeps-nuker-launch-checklist" },

  { group: "Market", object: "Game.market", method: "deal", signature: "Game.market.deal(orderId, amount, roomName?)", summary: "对现有市场订单提交真实成交请求。", guideHref: "/blog/screeps-market-deal" },
  { group: "Market", object: "Game.market", method: "createOrder", signature: "Game.market.createOrder(params)", summary: "创建自己的买单或卖单，并产生对应挂单费用。", guideHref: "/blog/screeps-market-create-order" },
  { group: "Market", object: "Game.market", method: "changeOrderPrice", signature: "Game.market.changeOrderPrice(orderId, newPrice)", summary: "修改自己已有订单的价格。", guideHref: "/blog/screeps-market-order-maintenance" },
  { group: "Market", object: "Game.market", method: "extendOrder", signature: "Game.market.extendOrder(orderId, addAmount)", summary: "增加自己已有订单的总可交易数量。", guideHref: "/blog/screeps-market-order-maintenance" },
  { group: "Market", object: "Game.market", method: "cancelOrder", signature: "Game.market.cancelOrder(orderId)", summary: "取消自己已有的市场订单。", guideHref: "/blog/screeps-market-order-maintenance" },
];

export const screepsApiReferenceGroups = [...new Set(screepsApiReference.map((entry) => entry.group))];
