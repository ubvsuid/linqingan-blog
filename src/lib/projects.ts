export interface ProjectDetail {
  label: string;
  value: string;
}

export interface ProjectLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface ProjectRecord {
  id: string;
  status: string;
  title: string;
  summary: string;
  details: ProjectDetail[];
  highlights: string[];
  links: ProjectLink[];
  updatedAt: string;
}

export const projects: ProjectRecord[] = [
  {
    id: "linqingan-com",
    status: "持续建设中",
    title: "linqingan.com",
    summary:
      "一个围绕 Screeps、JavaScript 与系统实践持续建设的个人技术网站。当前重点是一套适合中文新手按顺序学习的 Screeps 入门路线。",
    details: [
      { label: "类型", value: "个人技术网站" },
      { label: "技术栈", value: "Next.js · TypeScript · Markdown · Vercel" },
      { label: "当前内容", value: "12 篇 Screeps 新手文章" },
      { label: "建设原则", value: "简单、可读、可持续迭代" },
    ],
    highlights: [
      "按四个阶段组织新手学习路线",
      "在浏览器本地记录阅读进度",
      "支持目录、代码复制、前后篇与篇数跳转",
      "静态生成文章、Sitemap、RSS 与结构化数据",
    ],
    links: [
      { label: "进入学习路线", href: "/beginner" },
      {
        label: "查看 GitHub",
        href: "https://github.com/ubvsuid/linqingan-blog",
        external: true,
      },
    ],
    updatedAt: "2026-07-16",
  },
  {
    id: "screeps-beginner-path",
    status: "第一阶段完成",
    title: "Screeps 中文新手学习路线",
    summary:
      "把零散的新手知识整理成一条连续路线：从认识游戏和第一只 Creep，到角色分工、Controller、Extension、建造维修与第一份房间基础代码。",
    details: [
      { label: "文章数量", value: "12 篇" },
      { label: "学习阶段", value: "4 个" },
      { label: "目标读者", value: "第一次接触 Screeps 的玩家" },
      { label: "内容深度", value: "解释与解惑为主" },
    ],
    highlights: [
      "每篇只解决一个新手当前会遇到的问题",
      "避免过早引入复杂架构与高级机制",
      "示例代码可直接对照游戏观察结果",
      "后续将承接到 Screeps 基础工程系列",
    ],
    links: [{ label: "开始学习", href: "/beginner" }],
    updatedAt: "2026-07-16",
  },
];
