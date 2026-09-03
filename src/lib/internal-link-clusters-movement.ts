import type { CuratedInternalLinkCluster } from "./internal-link-clusters";

export const movementInternalLinkClusters: Record<string, CuratedInternalLinkCluster> = {
  "/blog/screeps-err-not-in-range": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/blog/screeps-roomposition-distance",
        "label": "先确认动作需要的真实距离",
        "role": "距离判断"
      },
      {
        "href": "/blog/screeps-moveto-not-moving",
        "label": "moveTo 返回 OK 但 Creep 仍不动",
        "role": "下一层排错"
      },
      {
        "href": "/blog/screeps-err-no-path",
        "label": "如果路径搜索直接失败",
        "role": "Failure branch"
      }
    ]
  },
  "/blog/screeps-moveto-not-moving": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/blog/screeps-err-not-in-range",
        "label": "区分动作距离错误与移动失败",
        "role": "返回码边界"
      },
      {
        "href": "/blog/screeps-move-fatigue-body-ratio",
        "label": "检查 fatigue 与 MOVE 比例",
        "role": "常见原因"
      },
      {
        "href": "/blog/screeps-err-no-path",
        "label": "继续排查路径搜索失败",
        "role": "Pathfinding"
      },
      {
        "href": "/blog/screeps-roomvisual-debug",
        "label": "把目标和路径画出来检查",
        "role": "可视化排错"
      }
    ]
  },
  "/blog/screeps-err-no-path": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/blog/screeps-pathfinder-costmatrix",
        "label": "检查 CostMatrix 与不可走格",
        "role": "核心排错"
      },
      {
        "href": "/blog/screeps-roomposition-distance",
        "label": "确认 goal range 是否合理",
        "role": "目标范围"
      },
      {
        "href": "/blog/screeps-map-find-route",
        "label": "跨房时先检查房间级路线",
        "role": "跨房路径"
      },
      {
        "href": "/blog/screeps-roomvisual-debug",
        "label": "把路径搜索结果可视化",
        "role": "观察工具"
      }
    ]
  },
  "/blog/screeps-move-fatigue-body-ratio": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/blog/screeps-creep-body-parts",
        "label": "回到 MOVE 与身体部件基础",
        "role": "前置概念"
      },
      {
        "href": "/blog/screeps-moveto-not-moving",
        "label": "Creep 不移动的完整排查路径",
        "role": "症状排错"
      }
    ]
  },
  "/blog/screeps-roomposition-distance": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/blog/screeps-err-not-in-range",
        "label": "把距离判断用于 ERR_NOT_IN_RANGE",
        "role": "实际应用"
      },
      {
        "href": "/blog/screeps-select-source-by-path",
        "label": "按可达路径选择 Source",
        "role": "目标选择"
      },
      {
        "href": "/blog/screeps-pathfinder-costmatrix",
        "label": "进入 PathFinder 与 CostMatrix",
        "role": "进阶路径"
      }
    ]
  },
  "/blog/screeps-map-find-route": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/blog/screeps-room-visibility",
        "label": "先确认目标房间的可见性边界",
        "role": "视野前置"
      },
      {
        "href": "/blog/screeps-err-no-path",
        "label": "路线存在但寻路失败时怎么查",
        "role": "Failure mode"
      },
      {
        "href": "/blog/screeps-pathfinder-costmatrix",
        "label": "控制房间内的路径成本",
        "role": "下一层路径"
      }
    ]
  },
  "/blog/screeps-pathfinder-costmatrix": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/blog/screeps-err-no-path",
        "label": "用 CostMatrix 定位 ERR_NO_PATH",
        "role": "Failure mode"
      },
      {
        "href": "/blog/screeps-select-source-by-path",
        "label": "把路径成本用于 Source 选择",
        "role": "实际应用"
      },
      {
        "href": "/blog/screeps-map-find-route",
        "label": "跨房路线与房内路径分层",
        "role": "跨房规划"
      },
      {
        "href": "/blog/screeps-roomvisual-debug",
        "label": "可视化检查路径与目标",
        "role": "调试工具"
      }
    ]
  },
  "/blog/screeps-select-source-by-path": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/blog/screeps-roomposition-distance",
        "label": "区分直线距离与可达路径",
        "role": "前置概念"
      },
      {
        "href": "/blog/screeps-pathfinder-costmatrix",
        "label": "进一步控制路径成本",
        "role": "进阶路径"
      },
      {
        "href": "/blog/screeps-first-creep-harvest",
        "label": "回到采集 Energy 的主流程",
        "role": "业务上下文"
      }
    ]
  },
  "/en/blog/screeps-err-not-in-range": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/en/blog/screeps-roomposition-distance",
        "label": "Confirm the action's real range",
        "role": "Range check"
      },
      {
        "href": "/en/blog/screeps-moveto-not-moving",
        "label": "moveTo returns OK but the Creep stays put",
        "role": "Next debugging step"
      },
      {
        "href": "/en/blog/screeps-err-no-path",
        "label": "When path search fails instead",
        "role": "Failure branch"
      }
    ]
  },
  "/en/blog/screeps-moveto-not-moving": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/en/blog/screeps-err-not-in-range",
        "label": "Separate action range from movement failure",
        "role": "Return-code boundary"
      },
      {
        "href": "/en/blog/screeps-move-fatigue-body-ratio",
        "label": "Check fatigue and MOVE ratio",
        "role": "Common cause"
      },
      {
        "href": "/en/blog/screeps-err-no-path",
        "label": "Continue into path-search failures",
        "role": "Pathfinding"
      },
      {
        "href": "/en/blog/screeps-roomvisual-debug",
        "label": "Draw the target and path while debugging",
        "role": "Visual debugging"
      }
    ]
  },
  "/en/blog/screeps-err-no-path": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/en/blog/screeps-pathfinder-search",
        "label": "Interpret PathFinder.search() and incomplete",
        "role": "Search semantics"
      },
      {
        "href": "/en/blog/screeps-pathfinder-costmatrix",
        "label": "Inspect CostMatrix walkability and costs",
        "role": "Core debugging"
      },
      {
        "href": "/en/blog/screeps-roomposition-distance",
        "label": "Confirm the goal range",
        "role": "Goal boundary"
      },
      {
        "href": "/en/blog/screeps-map-find-route",
        "label": "Check room-level routing for cross-room travel",
        "role": "Cross-room path"
      }
    ]
  },
  "/en/blog/screeps-move-fatigue-body-ratio": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/en/blog/screeps-creep-body-parts",
        "label": "Return to MOVE and body-part basics",
        "role": "Prerequisite concept"
      },
      {
        "href": "/en/blog/screeps-moveto-not-moving",
        "label": "Full no-progress movement diagnosis",
        "role": "Symptom debugging"
      },
      {
        "href": "/en/blog/screeps-creep-pull",
        "label": "Coordinate two Creeps with pull()",
        "role": "Advanced movement"
      }
    ]
  },
  "/en/blog/screeps-roomposition-distance": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/en/blog/screeps-err-not-in-range",
        "label": "Apply range checks to ERR_NOT_IN_RANGE",
        "role": "Practical use"
      },
      {
        "href": "/en/blog/screeps-select-source-by-path",
        "label": "Select a Source by reachable path",
        "role": "Target selection"
      },
      {
        "href": "/en/blog/screeps-pathfinder-search",
        "label": "Move from range math to PathFinder.search()",
        "role": "Advanced pathfinding"
      }
    ]
  },
  "/en/blog/screeps-map-find-route": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/en/blog/screeps-room-visibility",
        "label": "Check the room visibility boundary",
        "role": "Vision prerequisite"
      },
      {
        "href": "/en/blog/screeps-err-no-path",
        "label": "Diagnose a route that still cannot be searched",
        "role": "Failure mode"
      },
      {
        "href": "/en/blog/screeps-pathfinder-costmatrix",
        "label": "Control path costs inside each Room",
        "role": "Next path layer"
      }
    ]
  },
  "/en/blog/screeps-pathfinder-costmatrix": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/en/blog/screeps-pathfinder-search",
        "label": "Use the matrix inside PathFinder.search()",
        "role": "Primary API path"
      },
      {
        "href": "/en/blog/screeps-err-no-path",
        "label": "Use CostMatrix to diagnose ERR_NO_PATH",
        "role": "Failure mode"
      },
      {
        "href": "/en/blog/screeps-select-source-by-path",
        "label": "Apply path costs to Source selection",
        "role": "Practical use"
      },
      {
        "href": "/en/blog/screeps-roomvisual-debug",
        "label": "Visualize paths and targets",
        "role": "Debugging tool"
      }
    ]
  },
  "/en/blog/screeps-select-source-by-path": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/en/blog/screeps-roomposition-distance",
        "label": "Separate linear range from reachable path",
        "role": "Prerequisite concept"
      },
      {
        "href": "/en/blog/screeps-pathfinder-search",
        "label": "Inspect the path search directly",
        "role": "Pathfinding API"
      },
      {
        "href": "/en/blog/screeps-creep-harvest-energy",
        "label": "Return to the Energy harvesting loop",
        "role": "Task context"
      }
    ]
  },
  "/en/blog/screeps-creep-pull": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/en/blog/screeps-move-fatigue-body-ratio",
        "label": "Understand fatigue and MOVE load first",
        "role": "Prerequisite concept"
      },
      {
        "href": "/en/blog/screeps-moveto-not-moving",
        "label": "Debug a pull pair that makes no progress",
        "role": "Failure mode"
      },
      {
        "href": "/en/blog/screeps-roomposition-distance",
        "label": "Confirm adjacency and distance rules",
        "role": "Range check"
      }
    ]
  },
  "/en/blog/screeps-pathfinder-search": {
    "cluster": "Movement",
    "links": [
      {
        "href": "/en/blog/screeps-pathfinder-costmatrix",
        "label": "Customize terrain and structure costs",
        "role": "Advanced search"
      },
      {
        "href": "/en/blog/screeps-err-no-path",
        "label": "Diagnose failed or incomplete searches",
        "role": "Failure mode"
      },
      {
        "href": "/en/blog/screeps-roomposition-distance",
        "label": "Choose the correct goal range",
        "role": "Goal definition"
      }
    ]
  }
};
