import { beginnerSeriesSlugs, beginnerStages } from "@/lib/beginner-series";
import {
  knowledgeBaseSections,
  knowledgeBaseSlugs,
} from "@/lib/knowledge-base";

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

const beginnerArticleCount = beginnerSeriesSlugs.length;
const beginnerStageCount = beginnerStages.length;
const knowledgeArticleCount = knowledgeBaseSlugs.length;
const knowledgeModuleCount = knowledgeBaseSections.length;
const totalArticleCount = beginnerArticleCount + knowledgeArticleCount;

export const projects: ProjectRecord[] = [
  {
    id: "linqingan-com",
    status: "持续建设中",
    title: "linqingan.com",
    summary:
      "一个围绕 Screeps、JavaScript 与系统实践持续建设的中文知识库，内容按主题组织，并保留连续的新手学习路线。",
    purpose:
      "把零散的学习笔记、代码实践和系统建设过程，整理成可以长期阅读、查询和继续扩展的公开网站。",
    challenge:
      "既要让第一次接触 Screeps 的读者看懂，又要为后续专业内容保留足够清晰的栏目、数据结构和发布流程。",
    approach: [
      "使用 Markdown 保存文章内容，让写作和页面代码分离。",
      "使用 Next.js 静态生成文章、分页、Sitemap、RSS 和结构化数据。",
      "把学习进度保存在浏览器本地，不引入账号系统和数据库。",
      "让文章数量、模块数量和项目数据从统一配置自动生成，减少重复维护。",
      "通过内容、路由、链接、代码、类型、Lint、离线模拟和页面冒烟测试阻止明显问题上线。",
    ],
    details: [
      { label: "类型", value: "个人技术网站" },
      { label: "技术栈", value: "Next.js · TypeScript · Markdown · Vercel" },
      {
        label: "当前内容",
        value: `${totalArticleCount} 篇文章 · ${knowledgeModuleCount} 个知识模块`,
      },
      { label: "建设原则", value: "简单、可读、可验证、可持续迭代" },
    ],
    metrics: [
      {
        value: String(totalArticleCount),
        label: "公开文章",
        note: `${beginnerArticleCount} 篇入门文章与 ${knowledgeArticleCount} 篇专题文章`,
      },
      {
        value: String(knowledgeModuleCount),
        label: "知识模块",
        note: "按问题组织专题学习顺序",
      },
      {
        value: String(beginnerStageCount),
        label: "入门阶段",
        note: "从认识游戏推进到基础房间代码",
      },
      {
        value: "0",
        label: "账号门槛",
        note: "阅读进度仅保存在当前浏览器",
      },
    ],
    flow: ["Markdown 内容", "自动构建与检查", "Vercel 部署", "读者学习与查询"],
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
        description: "上线术语表、错误码、标签归档、公开建设说明和站内搜索。",
      },
      {
        date: "2026-07-18",
        title: "发布完整 Screeps 中文知识库",
        description: "整理 60 篇公开文章，并划分为 8 个知识主题组。",
      },
      {
        date: "2026-07-19",
        title: "补全发布前质量检查",
        description:
          "修复中文标签路由，并增加内容、路由和 JavaScript 代码块自动检查。",
      },
      {
        date: "2026-07-22",
        title: "升级知识模块与维护机制",
        description:
          "建立 8 个独立专题页、52 篇专题文章的学习顺序，并让关键统计和发布检查自动运行。",
      },
      {
        date: "2026-08-07",
        title: "完成标签、搜索与参考入口治理",
        description:
          "收敛薄标签归档、限制搜索索引体积，上线 Screeps API 快速查询和动态 Recently Verified 入口，并继续把重复内联样式迁出页面。",
      },
    ],
    highlights: [
      `按 ${beginnerStageCount} 个阶段组织 ${beginnerArticleCount} 篇新手学习路线`,
      `把 ${knowledgeArticleCount} 篇专题文章组织为 ${knowledgeModuleCount} 个知识模块`,
      "上线 Creep 身体计算器与问题快速查询入口",
      "上线 Screeps API 快速查询与动态 Recently Verified 入口",
      "支持目录、代码复制、专题进度和前后篇跳转",
      "静态生成文章、Sitemap、RSS 与结构化数据",
      "统一搜索文章、术语、错误码、工具和项目内容",
      "明确区分文档核对、语法检查、离线模拟与真实运行验证",
    ],
    nextSteps: [
      "补齐文章较少的 Controller 与运行诊断模块。",
      "继续收集真实 Screeps Console 和多 tick 运行证据。",
      "根据真实使用数据继续扩展 API 快速查询、标签与搜索体验。",
      "根据 Google Search Console 的真实数据优化重要页面。",
    ],
    links: [
      { label: "查看项目摘要", href: "/about#project-linqingan-com" },
      { label: "进入学习路线", href: "/beginner" },
      { label: "浏览知识库", href: "/knowledge" },
      { label: "查询 Screeps API", href: "/screeps-api" },
      { label: "使用身体计算器", href: "/tools/creep-body-calculator" },
      { label: "查看最近验证", href: "/verified" },
      { label: "查看验证方法", href: "/verification" },
      {
        label: "查看 GitHub",
        href: "https://github.com/ubvsuid/linqingan-blog",
        external: true,
      },
    ],
    updatedAt: "2026-08-07",
  },
  {
    id: "screeps-beginner-path",
    status: "第一版完成，持续维护",
    title: "Screeps 中文新手学习路线",
    summary:
      "把零散的新手知识整理成一条连续路线：从认识游戏和第一只 Creep，到角色分工、Controller、Extension、建造维修与第一份房间基础代码。",
    purpose:
      "让第一次接触 Screeps 的玩家不需要自己判断学习顺序，每篇只解决一个当前会遇到的问题。",
    challenge:
      "Screeps 同时涉及游戏机制和 JavaScript。内容太浅无法解决问题，内容太深又会让新手在真正需要之前背负复杂概念。",
    approach: [
      "先解释现象和目标，再给出最小可观察代码。",
      `用 ${beginnerStageCount} 个阶段逐步增加对象、动作和角色分工。`,
      "复杂的 Memory、模块拆分和架构内容放到对应知识模块。",
      "用阅读进度、前后篇和篇数跳转保持连续学习。",
      "分别标记文档、语法、离线模拟和真实环境验证状态。",
    ],
    details: [
      { label: "文章数量", value: `${beginnerArticleCount} 篇` },
      { label: "学习阶段", value: `${beginnerStageCount} 个` },
      { label: "目标读者", value: "第一次接触 Screeps 的玩家" },
      { label: "内容深度", value: "解释、操作与观察为主" },
    ],
    metrics: [
      {
        value: String(beginnerArticleCount),
        label: "连续文章",
        note: "每篇只解决一个主要问题",
      },
      {
        value: String(beginnerStageCount),
        label: "学习阶段",
        note: "从基础概念推进到房间循环",
      },
      {
        value: "1",
        label: "基础房间代码",
        note: "第十二篇完成首次整合",
      },
      {
        value: "0",
        label: "账号门槛",
        note: "进度仅保存在本地浏览器",
      },
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
        description:
          "补充角色分工、升级、Extension、建造维修和基础房间代码。",
      },
      {
        date: "2026-07-17",
        title: "建立查询与反馈闭环",
        description: "文章标签可点击，并连接术语、错误码、搜索和文章反馈入口。",
      },
      {
        date: "2026-07-21",
        title: "完成重点代码深度审校",
        description:
          "补充对象保护、返回值处理、多 tick 状态说明与明确的验证边界。",
      },
    ],
    highlights: [
      "每篇只解决一个新手当前会遇到的问题",
      "避免过早引入复杂架构与高级机制",
      "示例代码提供明确的观察目标和常见返回值",
      "通过专题内链承接到后续知识模块",
    ],
    nextSteps: [
      "继续补充真实 Console 与主循环运行证据。",
      "为关键步骤增加精简的界面截图和流程图。",
      "根据读者反馈补充容易卡住的解释。",
      "保持与专题知识库之间的前置知识和继续阅读链接。",
    ],
    links: [
      {
        label: "查看项目摘要",
        href: "/about#project-screeps-beginner-path",
      },
      { label: "开始学习", href: "/beginner" },
      { label: "进入知识库", href: "/knowledge" },
      { label: "查看验证方法", href: "/verification" },
    ],
    updatedAt: "2026-07-22",
  },
];
