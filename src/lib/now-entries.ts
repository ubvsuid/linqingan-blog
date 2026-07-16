export interface NowEntry {
  id: string;
  date: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const nowEntries: NowEntry[] = [
  {
    id: "2026-07-site-completeness",
    date: "2026-07-16",
    title: "正在把网站从入门教程扩展为完整的技术站",
    paragraphs: [
      "这一阶段的重点不再只是增加文章，而是把首页、文章归档、项目、近况、关于、SEO 与移动端体验连接成一个完整的网站。",
    ],
    bullets: [
      "统一主域名与页面分享信息",
      "让文章页展示全部公开内容",
      "补全项目、近况和关于页面",
      "继续保持简洁、可读的视觉风格",
    ],
  },
  {
    id: "2026-07-beginner-path-complete",
    date: "2026-07-16",
    title: "Screeps 新手学习路线第一阶段完成",
    paragraphs: [
      "现有入门系列已经扩展为 12 篇、4 个阶段，从认识游戏、控制第一只 Creep，一直到角色分工、Controller、Extension、建造维修和第一份房间基础代码。",
      "接下来会开始准备承接新手路线的 Screeps 基础工程内容。",
    ],
  },
  {
    id: "2026-07-reading-experience",
    date: "2026-07-15",
    title: "完成文章阅读体验的基础建设",
    paragraphs: [
      "文章现在支持自动目录、代码复制、系列进度、上一篇和下一篇、篇数跳转，以及保存在当前浏览器中的学习记录。",
    ],
  },
];
