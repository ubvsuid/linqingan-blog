import type { CuratedInternalLinkCluster } from "./internal-link-clusters";

export const controllerInternalLinkClusters: Record<string, CuratedInternalLinkCluster> = {
  "/blog/screeps-upgrade-controller": {
    "cluster": "Controller",
    "links": [
      { "href": "/blog/screeps-upgrader-controller-link-not-upgrading", "label": "固定 Upgrader 不升级时怎么排查", "role": "调试分支" },
      { "href": "/blog/screeps-controller-downgrade", "label": "Controller downgrade 风险与恢复", "role": "Failure mode" },
      { "href": "/blog/screeps-first-extension", "label": "升级到 RCL 2 后建第一座 Extension", "role": "下一课" },
      { "href": "/diagnostics", "label": "Diagnostics", "role": "继续诊断" }
    ]
  },
  "/blog/screeps-upgrader-controller-link-not-upgrading": {
    "cluster": "Controller",
    "links": [
      { "href": "/blog/screeps-upgrade-controller", "label": "upgradeController 基础循环", "role": "前置路径" },
      { "href": "/blog/screeps-link-transfer-energy", "label": "Controller Link 的 Energy 调度", "role": "Energy 来源" },
      { "href": "/blog/screeps-room-event-log", "label": "用 Event Log 核对升级结果", "role": "运行证据" },
      { "href": "/blog/screeps-controller-downgrade", "label": "升级停滞时检查 downgrade 风险", "role": "风险升级" }
    ]
  },
  "/blog/screeps-controller-downgrade": {
    "cluster": "Controller",
    "links": [
      { "href": "/blog/screeps-upgrade-controller", "label": "恢复 Controller 升级循环", "role": "恢复动作" },
      { "href": "/blog/screeps-upgrader-controller-link-not-upgrading", "label": "固定 Upgrader 不工作时排查", "role": "具体故障" },
      { "href": "/blog/screeps-game-notify", "label": "给 downgrade 风险加限频通知", "role": "告警" },
      { "href": "/diagnostics", "label": "Diagnostics", "role": "现场诊断" }
    ]
  },
  "/blog/screeps-reserve-vs-claim-controller": {
    "cluster": "Controller",
    "links": [
      { "href": "/blog/screeps-room-visibility", "label": "远程房间当前是否可见", "role": "前置可见性" },
      { "href": "/blog/screeps-observer-observe-room", "label": "用 Observer 获取远程视野", "role": "观察路径" },
      { "href": "/blog/screeps-map-find-route", "label": "为 Claimer 规划跨房路线", "role": "Movement 路径" },
      { "href": "/blog/screeps-room-event-log", "label": "核对 reserveController 事件", "role": "验证" }
    ]
  },
  "/blog/screeps-controller-activate-safe-mode": {
    "cluster": "Controller",
    "links": [
      { "href": "/blog/screeps-controller-downgrade", "label": "区分 Controller 风险与 Safe Mode", "role": "相关状态" },
      { "href": "/blog/screeps-game-notify", "label": "对防御事件做限频通知", "role": "告警" },
      { "href": "/blog/screeps-room-event-log", "label": "用 Event Log 补充事件上下文", "role": "运行证据" },
      { "href": "/diagnostics", "label": "Diagnostics", "role": "继续诊断" }
    ]
  },
  "/en/blog/screeps-upgrade-controller": {
    "cluster": "Controller",
    "links": [
      { "href": "/en/blog/screeps-upgrader-controller-link-not-upgrading", "label": "Debug a fixed Upgrader that is not upgrading", "role": "Debugging branch" },
      { "href": "/en/blog/screeps-controller-downgrade", "label": "Controller downgrade risk and recovery", "role": "Failure mode" },
      { "href": "/en/blog/screeps-first-extension", "label": "Build your first Extension after RCL 2", "role": "Next lesson" },
      { "href": "/en/diagnostics", "label": "Diagnostics", "role": "Continue diagnosis" }
    ]
  },
  "/en/blog/screeps-upgrader-controller-link-not-upgrading": {
    "cluster": "Controller",
    "links": [
      { "href": "/en/blog/screeps-upgrade-controller", "label": "upgradeController basics", "role": "Prerequisite path" },
      { "href": "/en/blog/screeps-link-transfer-energy", "label": "Controller Link Energy delivery", "role": "Energy source" },
      { "href": "/en/blog/screeps-room-event-log", "label": "Verify upgrade results with Event Log", "role": "Runtime evidence" },
      { "href": "/en/blog/screeps-controller-downgrade", "label": "Check downgrade risk when upgrading stalls", "role": "Risk escalation" }
    ]
  },
  "/en/blog/screeps-controller-downgrade": {
    "cluster": "Controller",
    "links": [
      { "href": "/en/blog/screeps-upgrade-controller", "label": "Restore the Controller upgrade loop", "role": "Recovery action" },
      { "href": "/en/blog/screeps-upgrader-controller-link-not-upgrading", "label": "Debug a fixed Upgrader that stopped working", "role": "Concrete failure" },
      { "href": "/en/blog/screeps-game-notify", "label": "Rate-limit downgrade-risk alerts", "role": "Alerting" },
      { "href": "/en/diagnostics", "label": "Diagnostics", "role": "Live diagnosis" }
    ]
  },
  "/en/blog/screeps-reserve-vs-claim-controller": {
    "cluster": "Controller",
    "links": [
      { "href": "/en/blog/screeps-room-visibility", "label": "Check current remote-room visibility", "role": "Visibility prerequisite" },
      { "href": "/en/blog/screeps-observer-observe-room", "label": "Acquire remote vision with an Observer", "role": "Observation path" },
      { "href": "/en/blog/screeps-map-find-route", "label": "Plan a cross-room Claimer route", "role": "Movement path" },
      { "href": "/en/blog/screeps-room-event-log", "label": "Verify reserveController events", "role": "Verification" }
    ]
  },
  "/en/blog/screeps-controller-activate-safe-mode": {
    "cluster": "Controller",
    "links": [
      { "href": "/en/blog/screeps-controller-downgrade", "label": "Separate Controller risk from Safe Mode state", "role": "Related state" },
      { "href": "/en/blog/screeps-game-notify", "label": "Rate-limit defense alerts", "role": "Alerting" },
      { "href": "/en/blog/screeps-room-event-log", "label": "Add Room-event context", "role": "Runtime evidence" },
      { "href": "/en/diagnostics", "label": "Diagnostics", "role": "Continue diagnosis" }
    ]
  }
};
