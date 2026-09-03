import type { CuratedInternalLinkCluster } from "./internal-link-clusters";

export const constructionInternalLinkClusters: Record<string, CuratedInternalLinkCluster> = {
  "/blog/screeps-first-extension": {
    "cluster": "Construction",
    "links": [
      { "href": "/blog/screeps-build-and-repair", "label": "让 Builder 自动建造和维修", "role": "下一课" },
      { "href": "/blog/screeps-room-create-construction-site", "label": "安全创建 Construction Site", "role": "API 深入" },
      { "href": "/blog/screeps-construction-site-progress", "label": "跟踪建造进度与完成状态", "role": "结果验证" },
      { "href": "/blog/screeps-room-energyavailable-stuck", "label": "Extension 建好后排查房间 Energy", "role": "系统衔接" }
    ]
  },
  "/blog/screeps-build-and-repair": {
    "cluster": "Construction",
    "links": [
      { "href": "/blog/screeps-first-extension", "label": "从第一座 Extension 开始", "role": "前置教程" },
      { "href": "/blog/screeps-construction-site-progress", "label": "确认 Builder 的实际建造进度", "role": "结果验证" },
      { "href": "/blog/screeps-room-event-log", "label": "用 Event Log 核对 build / repair", "role": "运行证据" },
      { "href": "/blog/screeps-container-decay-repair-deadline", "label": "处理 Container decay 维修期限", "role": "进阶故障" }
    ]
  },
  "/blog/screeps-construction-site-remove": {
    "cluster": "Construction",
    "links": [
      { "href": "/blog/screeps-room-create-construction-site", "label": "正确创建 Construction Site", "role": "反向操作" },
      { "href": "/blog/screeps-construction-site-progress", "label": "区分完成、移除与仍在建造", "role": "状态判断" },
      { "href": "/blog/screeps-game-get-object-by-id", "label": "用稳定 ID 确认目标 Site", "role": "对象身份" }
    ]
  },
  "/blog/screeps-room-create-construction-site": {
    "cluster": "Construction",
    "links": [
      { "href": "/blog/screeps-first-extension", "label": "把 Site 创建用到第一座 Extension", "role": "实际应用" },
      { "href": "/blog/screeps-construction-site-progress", "label": "创建后跟踪建造进度", "role": "下一步" },
      { "href": "/blog/screeps-construction-site-remove", "label": "放错位置时安全移除 Site", "role": "纠错" },
      { "href": "/blog/screeps-structure-destroy", "label": "建成结构后的删除边界", "role": "生命周期" }
    ]
  },
  "/blog/screeps-construction-site-progress": {
    "cluster": "Construction",
    "links": [
      { "href": "/blog/screeps-build-and-repair", "label": "让 Builder 推进建造任务", "role": "执行路径" },
      { "href": "/blog/screeps-room-event-log", "label": "用 EVENT_BUILD 核对上一 tick", "role": "运行证据" },
      { "href": "/blog/screeps-game-get-object-by-id", "label": "用 Site ID 稳定追踪对象", "role": "对象身份" },
      { "href": "/blog/screeps-construction-site-remove", "label": "区分 Site 完成与主动移除", "role": "状态边界" }
    ]
  },
  "/blog/screeps-structure-destroy": {
    "cluster": "Construction",
    "links": [
      { "href": "/blog/screeps-construction-site-remove", "label": "先区分 Site.remove 与 Structure.destroy", "role": "API 边界" },
      { "href": "/blog/screeps-room-create-construction-site", "label": "需要重建时重新创建 Site", "role": "后续动作" },
      { "href": "/blog/screeps-game-get-object-by-id", "label": "用原结构 ID 验证是否消失", "role": "结果验证" }
    ]
  },
  "/en/blog/screeps-first-extension": {
    "cluster": "Construction",
    "links": [
      { "href": "/en/blog/screeps-build-repair", "label": "Automate building and repair with a Builder", "role": "Next lesson" },
      { "href": "/en/blog/screeps-room-create-construction-site", "label": "Create a Construction Site safely", "role": "API deep dive" },
      { "href": "/en/blog/screeps-construction-site-progress", "label": "Track build progress and completion", "role": "Result verification" },
      { "href": "/en/blog/screeps-room-energyavailable-stuck", "label": "Debug Room Energy after Extensions come online", "role": "System follow-up" }
    ]
  },
  "/en/blog/screeps-build-repair": {
    "cluster": "Construction",
    "links": [
      { "href": "/en/blog/screeps-first-extension", "label": "Start from the first Extension", "role": "Prerequisite tutorial" },
      { "href": "/en/blog/screeps-construction-site-progress", "label": "Verify the Builder's actual progress", "role": "Result verification" },
      { "href": "/en/blog/screeps-room-event-log", "label": "Check build and repair events", "role": "Runtime evidence" },
      { "href": "/en/blog/screeps-container-decay-repair-deadline", "label": "Handle Container decay repair deadlines", "role": "Advanced failure" }
    ]
  },
  "/en/blog/screeps-remove-construction-site": {
    "cluster": "Construction",
    "links": [
      { "href": "/en/blog/screeps-room-create-construction-site", "label": "Create the right Construction Site", "role": "Inverse operation" },
      { "href": "/en/blog/screeps-construction-site-progress", "label": "Separate completion, removal, and active progress", "role": "State diagnosis" },
      { "href": "/en/blog/screeps-get-object-by-id", "label": "Confirm the exact Site by stable ID", "role": "Object identity" }
    ]
  },
  "/en/blog/screeps-room-create-construction-site": {
    "cluster": "Construction",
    "links": [
      { "href": "/en/blog/screeps-first-extension", "label": "Apply Site creation to your first Extension", "role": "Practical application" },
      { "href": "/en/blog/screeps-construction-site-progress", "label": "Track progress after placement", "role": "Next step" },
      { "href": "/en/blog/screeps-remove-construction-site", "label": "Remove a misplaced Site safely", "role": "Correction" },
      { "href": "/en/blog/screeps-structure-destroy", "label": "Understand deletion after construction completes", "role": "Lifecycle" }
    ]
  },
  "/en/blog/screeps-construction-site-progress": {
    "cluster": "Construction",
    "links": [
      { "href": "/en/blog/screeps-build-repair", "label": "Have a Builder advance the Site", "role": "Execution path" },
      { "href": "/en/blog/screeps-room-event-log", "label": "Verify EVENT_BUILD on the next tick", "role": "Runtime evidence" },
      { "href": "/en/blog/screeps-get-object-by-id", "label": "Track the Site by stable ID", "role": "Object identity" },
      { "href": "/en/blog/screeps-remove-construction-site", "label": "Separate completion from explicit removal", "role": "State boundary" }
    ]
  },
  "/en/blog/screeps-structure-destroy": {
    "cluster": "Construction",
    "links": [
      { "href": "/en/blog/screeps-remove-construction-site", "label": "Separate Site.remove() from Structure.destroy()", "role": "API boundary" },
      { "href": "/en/blog/screeps-room-create-construction-site", "label": "Create a replacement Site when needed", "role": "Follow-up action" },
      { "href": "/en/blog/screeps-get-object-by-id", "label": "Verify that the original structure ID disappeared", "role": "Result verification" }
    ]
  }
};
