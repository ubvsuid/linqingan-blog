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
  purpose: string;
  challenge: string;
  approach: string[];
  details: ProjectDetail[];
  highlights: string[];
  nextSteps: string[];
  links: ProjectLink[];
  updatedAt: string;
}

export const projects: ProjectRecord[] = [
  {
    id: "linqingan-com",
    status: "持续建设中",
    title: "linqingan.com",
    summary: "一个围绕 Screeps、JavaScript 与系统实践持续建设的个人技术网站。当前重点是一套适合中文新手按顺序学习的 Screeps 入门路线。",
    purpose: "把零散的学习笔记、代码实践和系统建设过程，整理成可以长期阅读、查询和继续扩展的公开网站。",
    challenge: "既要让第一次接触 Screeps 的读者看懂，又要为后续专业内容保留足够清晰的栏目、数据结构和发布流程。",
    approach: ["使用 Markdown 保存文章内容，让写作和页面代码分离。", "使用 Next.js 静态生成文章、分页、Sitemap、RSS 和结构化数据。", "把学习进度保存在浏览器本地，不引入账号系统和数据库。", "所有正式修改先经过独立分支、Vercel 预览和自动质量检查。"],
    details: [
      { label: "类型", value: "个人技术网站" },
      { label: "技术栈", value: "Next.js · TypeScript · Markdown · Vercel" },
      { label: "当前内容", value: "12 篇 Screeps 新手文章" },
      { label: "建设原则", value: "简单、可读、可持续迭代" },
    ],
    highlights: ["按四个阶段组织新手学习路线", "在浏览器本地记录阅读进度", "支持目录、代码复制、前后篇与篇数跳转", "静态生成文章、Sitemap、RSS 与结构化数据"],
    nextSteps: ["继续建设资料中心、术语表和错误码查询。", "发布 Screeps 基础工程系列，承接入门路线。", "文章数量增加后加入静态全文搜索。", "补充自动化浏览器测试和更完整的内容检查。"],
    links: [
      { label: "查看项目详情", href: "/projects/linqingan-com" },
      { label: "进入学习路线", href: "/beginner" },
      { label: "查看 GitHub", href: "https://github.com/ubvsuid/linqingan-blog", external: true },
    ],
    updatedAt: "2026-07-17",
  },
  {
    id: "screeps-beginner-path",
    status: "第一阶段完成",
    title: "Screeps 中文新手学习路线",
    summary: "把零散的新手知识整理成一条连续路线：从认识游戏和第一只 Creep，到角色分工、Controller、Extension、建造维修与第一份房间基础代码。",
    purpose: "让第一次接触 Screeps 的玩家不需要自己判断学习顺序，每篇只解决一个当前会遇到的问题。",
    challenge: "Screeps 同时涉及游戏机制和 JavaScript。内容太浅无法解决问题，内容太深又会让新手在真正需要之前背负复杂概念。",
    approach: ["先解释现象和目标，再给出最小可运行代码。", "每三篇组成一个学习阶段，逐步增加对象和动作。", "复杂的 Memory、模块拆分和架构内容放到后续系列。", "用阅读进度、前后篇和篇数跳转保持连续学习。"],
    details: [
      { label: "文章数量", value: "12 篇" },
      { label: "学习阶段", value: "4 个" },
      { label: "目标读者", value: "第一次接触 Screeps 的玩家" },
      { label: "内容深度", value: "解释与解惑为主" },
    ],
    highlights: ["每篇只解决一个新手当前会遇到的问题", "避免过早引入复杂架构与高级机制", "示例代码可直接对照游戏观察结果", "后续将承接到 Screeps 基础工程系列"],
    nextSteps: ["建立基础工程路线：Memory、角色统计和自动补员。", "把常见术语与错误码连接到相关文章。", "为文章增加前置知识和继续深入推荐。", "根据读者反馈补充容易卡住的解释。"],
    links: [
      { label: "查看项目详情", href: "/projects/screeps-beginner-path" },
      { label: "开始学习", href: "/beginner" },
    ],
    updatedAt: "2026-07-17",
  },
];
