
export interface ProjectDetail {
  label: string;
  value: string;
}

export interface ProjectLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface ProjectMetric {
  value: string;
  label: string;
  note: string;
}

export interface ProjectTimelineItem {
  date: string;
  title: string;
  description: string;
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
  metrics: ProjectMetric[];
  flow: string[];
  timeline: ProjectTimelineItem[];
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
    summary:
      "一个围绕 Screeps、JavaScript 与系统实践持续建设的中文知识库，现有 60 篇文章按 8 个主题组织，并保留 12 篇连续新手路线。",
    purpose:
      "把零散的学习笔记、代码实践和系统建设过程，整理成可以长期阅读、查询和继续扩展的公开网站。",
    challenge:
      "既要让第一次接触 Screeps 的读者看懂，又要为后续专业内容保留足够清晰的栏目、数据结构和发布流程。",
    approach: [
      "使用 Markdown 保存文章内容，让写作和页面代码分离。",
      "使用 Next.js 静态生成文章、分页、Sitemap、RSS 和结构化数据。",
      "把学习进度保存在浏览器本地，不引入账号系统和数据库。",
      "所有正式修改先经过独立分支、Vercel 预览和自动质量检查。",
    ],
    details: [
      { label: "类型", value: "个人技术网站" },
      { label: "技术栈", value: "Next.js · TypeScript · Markdown · Vercel" },
      { label: "当前内容", value: "教程、资料与项目档案" },
      { label: "建设原则", value: "简单、可读、可持续迭代" },
    ],
    metrics: [
      { value: "60", label: "公开文章", note: "每篇对应一个明确问题" },
      { value: "8", label: "知识主题", note: "覆盖学习、开发与运行诊断" },
      { value: "12", label: "入门文章", note: "按四个阶段连续组织" },
      { value: "4", label: "自动检查", note: "内容、路由、代码块与构建" },
    ],
    flow: ["Markdown 内容", "构建与检查", "Vercel 部署", "读者学习与查询"],
    timeline: [
      {
        date: "2026-07-15",
        title: "完成网站基础阅读体验",
        description: "上线文章目录、代码复制、系列进度和前后篇跳转。",
      },
      {
        date: "2026-07-16",
        title: "补全公开网站结构",
        description: "重做首页、文章归档、项目、近况、关于和 SEO 元数据。",
      },
      {
        date: "2026-07-17",
        title: "扩展为 Screeps 知识站",
        description: "上线资料中心、术语表、错误码、标签归档、项目详情和站内搜索。",
      },
      {
        date: "2026-07-18",
        title: "发布完整 Screeps 中文知识库",
        description: "整理 60 篇公开文章，并划分为 8 个知识主题组。",
      },
      {
        date: "2026-07-19",
        title: "补全发布前质量检查",
        description: "修复中文标签路由，并增加内容、路由和 JavaScript 代码块自动检查。",
      },
    ],
    highlights: [
      "按四个阶段组织新手学习路线",
      "在浏览器本地记录阅读进度",
      "支持目录、代码复制、前后篇与篇数跳转",
      "静态生成文章、Sitemap、RSS 与结构化数据",
      "统一搜索文章、术语、错误码和项目内容",
    ],
    nextSteps: [
      "逐篇完成技术文章审校。",
      "验证高风险 API。",
      "开发 Creep Body 计算器。",
      "根据真实搜索数据优化内容。",
    ],
    links: [
      { label: "查看项目详情", href: "/projects/linqingan-com" },
      { label: "进入学习路线", href: "/beginner" },
      { label: "搜索网站", href: "/search" },
      {
        label: "查看 GitHub",
        href: "https://github.com/ubvsuid/linqingan-blog",
        external: true,
      },
    ],
    updatedAt: "2026-07-19",
  },
  {
    id: "screeps-beginner-path",
    status: "第一阶段完成",
    title: "Screeps 中文新手学习路线",
    summary:
      "把零散的新手知识整理成一条连续路线：从认识游戏和第一只 Creep，到角色分工、Controller、Extension、建造维修与第一份房间基础代码。",
    purpose:
      "让第一次接触 Screeps 的玩家不需要自己判断学习顺序，每篇只解决一个当前会遇到的问题。",
    challenge:
      "Screeps 同时涉及游戏机制和 JavaScript。内容太浅无法解决问题，内容太深又会让新手在真正需要之前背负复杂概念。",
    approach: [
      "先解释现象和目标，再给出最小可运行代码。",
      "每三篇组成一个学习阶段，逐步增加对象和动作。",
      "复杂的 Memory、模块拆分和架构内容放到后续系列。",
      "用阅读进度、前后篇和篇数跳转保持连续学习。",
    ],
    details: [
      { label: "文章数量", value: "12 篇" },
      { label: "学习阶段", value: "4 个" },
      { label: "目标读者", value: "第一次接触 Screeps 的玩家" },
      { label: "内容深度", value: "解释与解惑为主" },
    ],
    metrics: [
      { value: "12", label: "连续文章", note: "每篇只解决一个问题" },
      { value: "4", label: "学习阶段", note: "每阶段三篇文章" },
      { value: "1", label: "基础房间代码", note: "第十二篇完成首次整合" },
      { value: "0", label: "账号门槛", note: "进度仅保存在本地浏览器" },
    ],
    flow: ["认识对象", "运行最小代码", "观察游戏结果", "进入下一问题"],
    timeline: [
      {
        date: "2026-07-15",
        title: "发布前五篇入门文章",
        description: "从 Screeps 基础概念推进到采集和运输能量。",
      },
      {
        date: "2026-07-16",
        title: "完成十二篇学习路线",
        description: "补充角色分工、升级、Extension、建造维修和基础房间代码。",
      },
      {
        date: "2026-07-17",
        title: "建立查询与反馈闭环",
        description: "文章标签可点击，并连接术语、错误码、搜索和文章反馈入口。",
      },
    ],
    highlights: [
      "每篇只解决一个新手当前会遇到的问题",
      "避免过早引入复杂架构与高级机制",
      "示例代码可直接对照游戏观察结果",
      "后续将承接到 Screeps 基础工程系列",
    ],
    nextSteps: [
      "建立基础工程路线：Memory、角色统计和自动补员。",
      "把常见术语与错误码连接到相关文章。",
      "为文章增加前置知识和继续深入推荐。",
      "根据读者反馈补充容易卡住的解释。",
    ],
    links: [
      { label: "查看项目详情", href: "/projects/screeps-beginner-path" },
      { label: "开始学习", href: "/beginner" },
      { label: "搜索相关内容", href: "/search?q=Screeps" },
    ],
    updatedAt: "2026-07-17",
  },
];

