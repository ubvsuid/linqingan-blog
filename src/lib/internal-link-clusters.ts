export interface CuratedInternalLink {
  href: string;
  label: string;
  role: string;
}

export interface CuratedInternalLinkCluster {
  cluster: string;
  links: readonly CuratedInternalLink[];
}

export const curatedInternalLinkClusters: Record<string, CuratedInternalLinkCluster> = {
  "/blog/screeps-first-creep-harvest": {
    "cluster": "Beginner / Energy",
    "links": [
      { "href": "/blog/screeps-creep-deliver-energy", "label": "把 Energy 送回 Spawn", "role": "下一课" },
      { "href": "/blog/screeps-creep-body-parts", "label": "认识 WORK、CARRY 和 MOVE", "role": "前置概念" },
      { "href": "/blog/screeps-creep-working-state", "label": "用 working 状态切换采集与运输", "role": "进阶状态机" }
    ]
  },
  "/blog/screeps-creep-deliver-energy": {
    "cluster": "Beginner / Energy",
    "links": [
      { "href": "/blog/screeps-first-creep-harvest", "label": "让第一只 Creep 采集 Energy", "role": "前置步骤" },
      { "href": "/blog/screeps-spawn-create-creep", "label": "用 Spawn 创建 Creep", "role": "进入 Spawn 系统" },
      { "href": "/blog/screeps-creep-working-state", "label": "用 working 状态稳定往返逻辑", "role": "下一步" }
    ]
  },
  "/blog/screeps-spawn-create-creep": {
    "cluster": "Spawn",
    "links": [
      { "href": "/blog/screeps-creep-body-parts", "label": "Creep 身体部件与成本", "role": "前置概念" },
      { "href": "/blog/screeps-spawncreep-return-codes", "label": "spawnCreep 返回码怎么排查", "role": "Failure mode" },
      { "href": "/diagnostics", "label": "Diagnostics", "role": "房间级排错" },
      { "href": "/tick-lab", "label": "Tick Lab", "role": "验证行为" }
    ]
  },
  "/blog/screeps-dynamic-creep-body-energy": {
    "cluster": "Spawn",
    "links": [
      { "href": "/blog/screeps-spawn-create-creep", "label": "spawnCreep 基础调用", "role": "API 主路径" },
      { "href": "/blog/screeps-room-energyavailable-stuck", "label": "room.energyAvailable 为什么卡住", "role": "能量故障" },
      { "href": "/blog/screeps-creep-body-parts", "label": "身体部件成本与能力", "role": "设计依据" }
    ]
  },
  "/blog/screeps-spawncreep-return-codes": {
    "cluster": "Spawn",
    "links": [
      { "href": "/blog/screeps-spawn-create-creep", "label": "spawnCreep 基础调用", "role": "API 主页面" },
      { "href": "/blog/screeps-spawn-exit-blocked-directions", "label": "Spawn 出口被堵怎么定位", "role": "具体故障" },
      { "href": "/diagnostics", "label": "Diagnostics", "role": "继续排查" }
    ]
  },
  "/blog/screeps-tick-and-game-loop": {
    "cluster": "CPU / Runtime",
    "links": [
      { "href": "/blog/screeps-cpu-getused-bucket", "label": "理解 CPU.getUsed 与 bucket", "role": "运行时指标" },
      { "href": "/blog/screeps-memory-basics", "label": "Memory 基础", "role": "跨 tick 状态" },
      { "href": "/tick-lab", "label": "Tick Lab", "role": "实验 tick 行为" }
    ]
  },
  "/blog/screeps-cpu-getused-bucket": {
    "cluster": "CPU / Runtime",
    "links": [
      { "href": "/blog/screeps-cpu-bucket-degradation", "label": "CPU bucket 降级调度", "role": "进阶策略" },
      { "href": "/blog/screeps-memory-basics", "label": "Memory 基础", "role": "状态成本" },
      { "href": "/blog/screeps-global-cache", "label": "global cache", "role": "运行时优化" }
    ]
  },
  "/blog/screeps-cpu-bucket-degradation": {
    "cluster": "CPU / Runtime",
    "links": [
      { "href": "/blog/screeps-cpu-getused-bucket", "label": "CPU.getUsed 与 bucket 指标", "role": "前置指标" },
      { "href": "/blog/screeps-memory-basics", "label": "Memory 基础", "role": "状态管理" },
      { "href": "/diagnostics", "label": "Diagnostics", "role": "现场诊断" },
      { "href": "/tick-lab", "label": "Tick Lab", "role": "行为验证" }
    ]
  },
  "/blog/screeps-memory-basics": {
    "cluster": "CPU / Runtime",
    "links": [
      { "href": "/blog/screeps-rawmemory-segments", "label": "RawMemory segments", "role": "进阶 Memory" },
      { "href": "/blog/screeps-intershardmemory-sync", "label": "InterShardMemory 同步", "role": "跨 shard 状态" },
      { "href": "/blog/screeps-global-cache", "label": "global cache", "role": "运行时缓存" }
    ]
  },
  "/blog/screeps-creep-pickup-dropped-energy": {
    "cluster": "Room Economy / Recovery",
    "links": [
      { "href": "/blog/screeps-tombstone-ruin-recovery", "label": "资源不在地面时，继续回收 Tombstone 与 Ruin", "role": "资源恢复分支" }
    ]
  },
  "/blog/screeps-intershardmemory-sync": {
    "cluster": "Memory / Cross-boundary",
    "links": [
      { "href": "/blog/screeps-rawmemory-foreign-segment", "label": "如果要读取其他玩家公开数据，改用 Foreign Segment", "role": "跨玩家数据分支" }
    ]
  },
  "/en/blog/screeps-creep-harvest-energy": {
    "cluster": "Beginner / Energy",
    "links": [
      { "href": "/en/blog/screeps-transfer-energy-to-spawn", "label": "Transfer Energy to a Spawn", "role": "Next lesson" },
      { "href": "/en/blog/screeps-creep-body-parts", "label": "Creep body parts", "role": "Prerequisite concept" },
      { "href": "/en/blog/screeps-working-state", "label": "Working-state switching", "role": "State-machine upgrade" }
    ]
  },
  "/en/blog/screeps-transfer-energy-to-spawn": {
    "cluster": "Beginner / Energy",
    "links": [
      { "href": "/en/blog/screeps-creep-harvest-energy", "label": "Harvest Energy", "role": "Prerequisite step" },
      { "href": "/en/blog/screeps-spawn-creep", "label": "Spawn a Creep", "role": "Enter the Spawn system" },
      { "href": "/en/blog/screeps-working-state", "label": "Working-state switching", "role": "Next step" }
    ]
  },
  "/en/blog/screeps-spawn-creep": {
    "cluster": "Spawn",
    "links": [
      { "href": "/en/blog/screeps-creep-body-parts", "label": "Creep body parts and cost", "role": "Prerequisite concept" },
      { "href": "/en/blog/screeps-spawncreep-return-codes", "label": "spawnCreep return codes", "role": "Failure mode" },
      { "href": "/en/diagnostics", "label": "Diagnostics", "role": "Room-level debugging" },
      { "href": "/en/tick-lab", "label": "Tick Lab", "role": "Verify behavior" }
    ]
  },
  "/en/blog/screeps-dynamic-creep-body": {
    "cluster": "Spawn",
    "links": [
      { "href": "/en/blog/screeps-spawn-creep", "label": "spawnCreep basics", "role": "Primary API path" },
      { "href": "/en/blog/screeps-room-energyavailable-stuck", "label": "Why room.energyAvailable gets stuck", "role": "Energy failure" },
      { "href": "/en/blog/screeps-creep-body-parts", "label": "Body-part cost and capability", "role": "Design basis" }
    ]
  },
  "/en/blog/screeps-spawncreep-return-codes": {
    "cluster": "Spawn",
    "links": [
      { "href": "/en/blog/screeps-spawn-creep", "label": "spawnCreep basics", "role": "Primary API guide" },
      { "href": "/en/blog/screeps-spawn-exit-blocked-directions", "label": "Blocked Spawn exits", "role": "Concrete failure" },
      { "href": "/en/diagnostics", "label": "Diagnostics", "role": "Continue debugging" }
    ]
  },
  "/en/blog/screeps-tick-game-loop": {
    "cluster": "CPU / Runtime",
    "links": [
      { "href": "/en/blog/screeps-cpu-getused-bucket", "label": "CPU.getUsed and bucket", "role": "Runtime metrics" },
      { "href": "/en/blog/screeps-memory-basics", "label": "Memory basics", "role": "Cross-tick state" },
      { "href": "/en/tick-lab", "label": "Tick Lab", "role": "Experiment with tick behavior" }
    ]
  },
  "/en/blog/screeps-cpu-getused-bucket": {
    "cluster": "CPU / Runtime",
    "links": [
      { "href": "/en/blog/screeps-cpu-bucket-degradation", "label": "CPU bucket degradation scheduler", "role": "Advanced strategy" },
      { "href": "/en/blog/screeps-memory-basics", "label": "Memory basics", "role": "State cost" },
      { "href": "/en/blog/screeps-global-cache", "label": "Global cache", "role": "Runtime optimization" }
    ]
  },
  "/en/blog/screeps-cpu-bucket-degradation": {
    "cluster": "CPU / Runtime",
    "links": [
      { "href": "/en/blog/screeps-cpu-getused-bucket", "label": "CPU.getUsed and bucket metrics", "role": "Prerequisite metrics" },
      { "href": "/en/blog/screeps-memory-basics", "label": "Memory basics", "role": "State management" },
      { "href": "/en/diagnostics", "label": "Diagnostics", "role": "Live-room diagnosis" },
      { "href": "/en/tick-lab", "label": "Tick Lab", "role": "Behavior verification" }
    ]
  },
  "/en/blog/screeps-memory-basics": {
    "cluster": "CPU / Runtime",
    "links": [
      { "href": "/en/blog/screeps-rawmemory-segments", "label": "RawMemory segments", "role": "Advanced Memory" },
      { "href": "/en/blog/screeps-intershardmemory-sync", "label": "InterShardMemory sync", "role": "Cross-shard state" },
      { "href": "/en/blog/screeps-global-cache", "label": "Global cache", "role": "Runtime cache" }
    ]
  },
  "/en/blog/screeps-pickup-dropped-energy": {
    "cluster": "Room Economy / Recovery",
    "links": [
      { "href": "/en/blog/screeps-tombstone-ruin-recovery", "label": "Recover resources from Tombstones and Ruins", "role": "Recovery branch" }
    ]
  },
  "/en/blog/screeps-intershardmemory-sync": {
    "cluster": "Memory / Cross-boundary",
    "links": [
      { "href": "/en/blog/screeps-rawmemory-foreign-segment", "label": "Use Foreign Segment for another player's public data", "role": "Cross-player data branch" }
    ]
  }
};