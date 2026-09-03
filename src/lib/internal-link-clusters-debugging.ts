import type { CuratedInternalLinkCluster } from "./internal-link-clusters";

export const debuggingInternalLinkClusters: Record<string, CuratedInternalLinkCluster> = {
  "/blog/screeps-room-error-isolation": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/blog/screeps-room-event-log", "label": "用 Room Event Log 补充上一 tick 事件", "role": "运行证据" },
      { "href": "/blog/screeps-roomvisual-debug", "label": "把故障对象和目标画出来", "role": "现场观察" },
      { "href": "/blog/screeps-game-notify", "label": "对重复故障做限频通知", "role": "告警" },
      { "href": "/diagnostics", "label": "Diagnostics", "role": "房间级诊断" }
    ]
  },
  "/blog/screeps-room-event-log": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/blog/screeps-room-error-isolation", "label": "把事件观察接入异常隔离", "role": "故障边界" },
      { "href": "/blog/screeps-game-get-object-by-id", "label": "用对象 ID 还原 actor 与 target", "role": "对象定位" },
      { "href": "/blog/screeps-roomvisual-debug", "label": "把事件对象映射回房间画面", "role": "可视化" },
      { "href": "/blog/screeps-game-notify", "label": "把关键事件升级为限频通知", "role": "告警" }
    ]
  },
  "/blog/screeps-roomvisual-debug": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/blog/screeps-room-event-log", "label": "用事件日志核对上一 tick 结果", "role": "时间证据" },
      { "href": "/blog/screeps-room-error-isolation", "label": "一个房间抛异常时继续隔离", "role": "异常处理" },
      { "href": "/blog/screeps-moveto-not-moving", "label": "专门排查 Creep 不移动", "role": "Movement 分支" },
      { "href": "/diagnostics", "label": "Diagnostics", "role": "继续诊断" }
    ]
  },
  "/blog/screeps-game-notify": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/blog/screeps-room-error-isolation", "label": "先把异常隔离再设计告警", "role": "前置治理" },
      { "href": "/blog/screeps-room-event-log", "label": "用 Event Log 保留事件上下文", "role": "事件来源" },
      { "href": "/blog/screeps-cpu-getused-bucket", "label": "通知频繁时同时检查 CPU 压力", "role": "运行指标" }
    ]
  },
  "/blog/screeps-game-get-object-by-id": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/blog/screeps-room-event-log", "label": "从 Event Log 的 ID 找回对象", "role": "实际应用" },
      { "href": "/blog/screeps-room-visibility", "label": "对象找不到时先检查当前可见性", "role": "可见性边界" },
      { "href": "/blog/screeps-memory-basics", "label": "只在 Memory 中保存稳定 ID", "role": "状态设计" }
    ]
  },
  "/blog/screeps-room-visibility": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/blog/screeps-observer-observe-room", "label": "需要远程视野时使用 Observer", "role": "获取视野" },
      { "href": "/blog/screeps-game-get-object-by-id", "label": "区分对象 ID 与当前可见对象", "role": "对象恢复" },
      { "href": "/blog/screeps-map-find-route", "label": "跨房移动时结合房间路线", "role": "Movement 分支" }
    ]
  },
  "/blog/screeps-observer-observe-room": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/blog/screeps-room-visibility", "label": "理解 Observer 带来的下一 tick 视野", "role": "前置概念" },
      { "href": "/blog/screeps-room-event-log", "label": "获得视野后检查房间事件", "role": "继续观察" },
      { "href": "/blog/screeps-map-find-route", "label": "把远程视野接到跨房路线规划", "role": "Movement 分支" }
    ]
  },
  "/blog/screeps-first-room-code": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/blog/screeps-room-error-isolation", "label": "给房间循环加异常隔离", "role": "可靠性升级" },
      { "href": "/blog/screeps-roomvisual-debug", "label": "把角色和目标画在房间里", "role": "调试可视化" },
      { "href": "/blog/screeps-room-event-log", "label": "核对上一 tick 的实际事件", "role": "结果验证" },
      { "href": "/diagnostics", "label": "Diagnostics", "role": "完整排查入口" }
    ]
  },
  "/en/blog/screeps-room-error-isolation": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/en/blog/screeps-room-event-log", "label": "Add previous-tick Room events", "role": "Runtime evidence" },
      { "href": "/en/blog/screeps-roomvisual-debug", "label": "Draw failing objects and targets", "role": "Live inspection" },
      { "href": "/en/blog/screeps-game-notify", "label": "Rate-limit alerts for recurring failures", "role": "Alerting" },
      { "href": "/en/diagnostics", "label": "Diagnostics", "role": "Room-level diagnosis" }
    ]
  },
  "/en/blog/screeps-room-event-log": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/en/blog/screeps-room-error-isolation", "label": "Connect event evidence to error isolation", "role": "Failure boundary" },
      { "href": "/en/blog/screeps-get-object-by-id", "label": "Resolve actor and target IDs", "role": "Object lookup" },
      { "href": "/en/blog/screeps-roomvisual-debug", "label": "Map event objects back onto the Room", "role": "Visualization" },
      { "href": "/en/blog/screeps-game-notify", "label": "Promote critical events to rate-limited alerts", "role": "Alerting" }
    ]
  },
  "/en/blog/screeps-roomvisual-debug": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/en/blog/screeps-room-event-log", "label": "Verify the previous tick with Event Log", "role": "Time evidence" },
      { "href": "/en/blog/screeps-room-error-isolation", "label": "Contain a Room that throws exceptions", "role": "Exception handling" },
      { "href": "/en/blog/screeps-moveto-not-moving", "label": "Debug a Creep that is not moving", "role": "Movement branch" },
      { "href": "/en/diagnostics", "label": "Diagnostics", "role": "Continue diagnosis" }
    ]
  },
  "/en/blog/screeps-game-notify": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/en/blog/screeps-room-error-isolation", "label": "Isolate failures before alerting on them", "role": "Prerequisite governance" },
      { "href": "/en/blog/screeps-room-event-log", "label": "Keep Room-event context with an incident", "role": "Event source" },
      { "href": "/en/blog/screeps-cpu-getused-bucket", "label": "Check CPU pressure behind noisy incidents", "role": "Runtime metric" }
    ]
  },
  "/en/blog/screeps-get-object-by-id": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/en/blog/screeps-room-event-log", "label": "Resolve IDs from Room Event Log", "role": "Practical use" },
      { "href": "/en/blog/screeps-room-visibility", "label": "Check visibility when an object is missing", "role": "Visibility boundary" },
      { "href": "/en/blog/screeps-memory-basics", "label": "Persist stable IDs instead of live objects", "role": "State design" }
    ]
  },
  "/en/blog/screeps-room-visibility": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/en/blog/screeps-observer-observe-room", "label": "Use an Observer for remote visibility", "role": "Acquire vision" },
      { "href": "/en/blog/screeps-get-object-by-id", "label": "Separate stored IDs from current live objects", "role": "Object recovery" },
      { "href": "/en/blog/screeps-map-find-route", "label": "Connect visibility to cross-room routing", "role": "Movement branch" }
    ]
  },
  "/en/blog/screeps-observer-observe-room": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/en/blog/screeps-room-visibility", "label": "Understand next-tick Observer visibility", "role": "Prerequisite concept" },
      { "href": "/en/blog/screeps-room-event-log", "label": "Inspect Room events after visibility arrives", "role": "Continue observation" },
      { "href": "/en/blog/screeps-map-find-route", "label": "Connect remote vision to route planning", "role": "Movement branch" }
    ]
  },
  "/en/blog/screeps-first-room-code": {
    "cluster": "Debugging / Observability",
    "links": [
      { "href": "/en/blog/screeps-room-error-isolation", "label": "Add room-level exception isolation", "role": "Reliability upgrade" },
      { "href": "/en/blog/screeps-roomvisual-debug", "label": "Draw roles and targets in the Room", "role": "Visual debugging" },
      { "href": "/en/blog/screeps-room-event-log", "label": "Verify what actually happened last tick", "role": "Result verification" },
      { "href": "/en/diagnostics", "label": "Diagnostics", "role": "Full troubleshooting entry" }
    ]
  }
};
