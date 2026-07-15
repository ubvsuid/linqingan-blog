export interface ProjectDetail {
  label: string;
  value: string;
}

export interface ProjectRecord {
  id: string;
  status: string;
  title: string;
  summary: string;
  details: ProjectDetail[];
}

export const projects: ProjectRecord[] = [
  {
    id: "screeps-contract-kernel-v7-3",
    status: "持续开发中",
    title: "Screeps Contract Kernel V7.3",
    summary:
      "一个围绕合同任务、房间经济、Spawn 调度、市场能量采购、Link 调度和 Upgrader 扩容构建的 Screeps 自动化系统。",
    details: [
      {
        label: "当前版本",
        value: "V7.3 All-In Market Rush",
      },
      {
        label: "近期目标",
        value: "通过市场补能提高升级效率，稳定冲击 RCL8",
      },
      {
        label: "核心技术",
        value: "JavaScript / 状态机 / 任务调度 / 资源预算",
      },
      {
        label: "主要模块",
        value: "Spawn / Market / Link / Terminal / Upgrader",
      },
      {
        label: "记录内容",
        value: "架构说明 / 版本日志 / 性能分析 / 失败复盘",
      },
    ],
  },
];