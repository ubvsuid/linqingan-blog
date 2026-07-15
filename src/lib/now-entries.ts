export interface NowEntry {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const nowEntries: NowEntry[] = [
  {
    id: "screeps-contract-kernel-v7-3",
    title: "开发 Screeps Contract Kernel V7.3",
    paragraphs: [
      "当前目标是通过市场购买能量，提高 Upgrader 的持续工作时间，并让房间更稳定地冲击 RCL8。",
    ],
    bullets: [
      "市场价格、采购数量和 Credits 保留预算",
      "Storage 与 Terminal 的能量分配",
      "Upgrader 动态扩容与 Spawn 调度",
      "Link 能量流转和异常恢复",
    ],
  },
  {
    id: "personal-technical-blog",
    title: "建设个人技术博客",
    paragraphs: [
      "持续完善 linqingan.com，把 Screeps 新手解惑、项目版本记录和进阶架构内容整理成清晰、可检索的文章体系。",
    ],
  },
  {
    id: "learning",
    title: "正在学习",
    paragraphs: [],
    bullets: [
      "Next.js App Router 与内容工程化",
      "长期运行系统的架构、监控和恢复设计",
      "AI 辅助编程与代码审查工作流",
    ],
  },
];