import type { CuratedInternalLinkCluster } from "./internal-link-clusters";

export const defenseInternalLinkClusters: Record<string, CuratedInternalLinkCluster> = {
  "/blog/screeps-tower-auto-attack-hostiles": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/blog/screeps-tower-heal-creeps", "label": "防守切换到己方伤员治疗", "role": "防守优先级" },
      { "href": "/blog/screeps-tower-repair-threshold", "label": "没有敌人时进入 Tower 维修策略", "role": "和平期策略" },
      { "href": "/blog/screeps-room-event-log", "label": "用 Event Log 核对上一 tick 的攻击事件", "role": "运行证据" },
      { "href": "/tools/tower-damage-heal-repair-calculator", "label": "计算距离衰减、多塔攻击量与 Energy 消耗", "role": "数值估算" },
      { "href": "/diagnostics", "label": "Diagnostics", "role": "继续诊断" }
    ]
  },
  "/blog/screeps-tower-heal-creeps": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/blog/screeps-tower-auto-attack-hostiles", "label": "敌人出现时切回 Tower 攻击", "role": "威胁优先" },
      { "href": "/blog/screeps-room-event-log", "label": "用 Event Log 核对治疗结果", "role": "运行证据" },
      { "href": "/tools/tower-damage-heal-repair-calculator", "label": "计算距离衰减与多塔治疗量", "role": "治疗量估算" },
      { "href": "/diagnostics", "label": "Diagnostics", "role": "继续诊断" }
    ]
  },
  "/blog/screeps-tower-repair-threshold": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/blog/screeps-wall-rampart-repair-limit", "label": "把普通维修与 fortification 阶段分开", "role": "维修边界" },
      { "href": "/blog/screeps-tower-auto-attack-hostiles", "label": "保留 Energy 给即时防御", "role": "资源优先级" },
      { "href": "/blog/screeps-storage-energy-usage", "label": "把 Tower reserve 接到 Storage 预算", "role": "资源预算" },
      { "href": "/tools/tower-damage-heal-repair-calculator", "label": "计算距离衰减、维修量与所需 tick", "role": "维修量估算" }
    ]
  },
  "/blog/screeps-wall-rampart-repair-limit": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/blog/screeps-tower-repair-threshold", "label": "区分 Tower 普通维修与长期 fortification", "role": "维修策略" },
      { "href": "/blog/screeps-rampart-set-public", "label": "需要改变 Rampart 通行状态时", "role": "访问控制" },
      { "href": "/blog/screeps-controller-activate-safe-mode", "label": "防线失效时理解 Safe Mode", "role": "紧急保护" }
    ]
  },
  "/blog/screeps-rampart-set-public": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/blog/screeps-wall-rampart-repair-limit", "label": "把 Rampart 状态接到长期维修目标", "role": "结构维护" },
      { "href": "/blog/screeps-controller-activate-safe-mode", "label": "紧急防御时检查 Safe Mode", "role": "紧急保护" },
      { "href": "/blog/screeps-tower-auto-attack-hostiles", "label": "把访问状态接回主动防御", "role": "防守执行" }
    ]
  },
  "/blog/screeps-nuker-launch-checklist": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/blog/screeps-controller-activate-safe-mode", "label": "区分核打击操作与本房 Safe Mode", "role": "防御边界" },
      { "href": "/blog/screeps-wall-rampart-repair-limit", "label": "把核威胁接到 fortification 规划", "role": "防御准备" },
      { "href": "/blog/screeps-room-visibility", "label": "目标房间不可见时先理解视野边界", "role": "目标验证" }
    ]
  },
  "/en/blog/screeps-tower-auto-attack-hostiles": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/en/blog/screeps-tower-heal-creeps", "label": "Switch defense priority to injured owned Creeps", "role": "Defense priority" },
      { "href": "/en/blog/screeps-tower-repair-threshold", "label": "Move into Tower repair policy when no hostile remains", "role": "Peace-time policy" },
      { "href": "/en/blog/screeps-room-event-log", "label": "Verify the previous tick's attack events", "role": "Runtime evidence" },
      { "href": "/en/tools/tower-damage-heal-repair-calculator", "label": "Calculate range falloff, multi-Tower attack output, and Energy cost", "role": "Output estimate" },
      { "href": "/en/diagnostics", "label": "Diagnostics", "role": "Continue diagnosis" }
    ]
  },
  "/en/blog/screeps-tower-heal-creeps": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/en/blog/screeps-tower-auto-attack-hostiles", "label": "Return to Tower attack when hostiles appear", "role": "Threat priority" },
      { "href": "/en/blog/screeps-room-event-log", "label": "Verify healing results with Event Log", "role": "Runtime evidence" },
      { "href": "/en/tools/tower-damage-heal-repair-calculator", "label": "Calculate range falloff and multi-Tower healing", "role": "Healing estimate" },
      { "href": "/en/diagnostics", "label": "Diagnostics", "role": "Continue diagnosis" }
    ]
  },
  "/en/blog/screeps-tower-repair-threshold": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/en/blog/screeps-wall-rampart-repair-limit", "label": "Separate ordinary repair from staged fortification", "role": "Repair boundary" },
      { "href": "/en/blog/screeps-tower-auto-attack-hostiles", "label": "Preserve Energy for immediate defense", "role": "Resource priority" },
      { "href": "/en/blog/screeps-storage-energy-usage", "label": "Connect the Tower reserve to Storage budgets", "role": "Resource budget" },
      { "href": "/en/tools/tower-damage-heal-repair-calculator", "label": "Calculate range falloff, repair output, and required ticks", "role": "Repair estimate" }
    ]
  },
  "/en/blog/screeps-wall-rampart-repair-limit": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/en/blog/screeps-tower-repair-threshold", "label": "Separate Tower repair from long-term fortification", "role": "Repair policy" },
      { "href": "/en/blog/screeps-rampart-set-public", "label": "Change Rampart access state when required", "role": "Access control" },
      { "href": "/en/blog/screeps-controller-activate-safe-mode", "label": "Understand Safe Mode when the defense line fails", "role": "Emergency protection" }
    ]
  },
  "/en/blog/screeps-rampart-set-public": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/en/blog/screeps-wall-rampart-repair-limit", "label": "Connect Rampart state to fortification targets", "role": "Structure upkeep" },
      { "href": "/en/blog/screeps-controller-activate-safe-mode", "label": "Check Safe Mode for emergency defense", "role": "Emergency protection" },
      { "href": "/en/blog/screeps-tower-auto-attack-hostiles", "label": "Connect access state back to active defense", "role": "Defense execution" }
    ]
  },
  "/en/blog/screeps-nuker-launch": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/en/blog/screeps-controller-activate-safe-mode", "label": "Separate offensive launch operations from local Safe Mode", "role": "Defense boundary" },
      { "href": "/en/blog/screeps-wall-rampart-repair-limit", "label": "Connect nuclear threats to fortification planning", "role": "Defense preparation" },
      { "href": "/en/blog/screeps-room-visibility", "label": "Check the visibility boundary for the target Room", "role": "Target verification" }
    ]
  },
  "/en/blog/screeps-creep-attack": {
    "cluster": "Defense / Combat",
    "links": [
      { "href": "/en/blog/screeps-err-not-in-range", "label": "Diagnose melee range failures", "role": "Range failure" },
      { "href": "/en/blog/screeps-creep-body-parts", "label": "Confirm active ATTACK and MOVE body parts", "role": "Prerequisite concept" },
      { "href": "/en/blog/screeps-room-event-log", "label": "Verify accepted combat on the next tick", "role": "Runtime evidence" },
      { "href": "/en/blog/screeps-tower-auto-attack-hostiles", "label": "Coordinate Creep combat with room Tower defense", "role": "Defense system" }
    ]
  }
};
