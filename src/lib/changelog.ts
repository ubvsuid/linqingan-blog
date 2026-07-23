export type ChangelogType = "网站" | "内容" | "工具" | "验证" | "SEO";

export interface ChangelogLink {
  label: string;
  href: string;
}

export interface ChangelogEntry {
  id: string;
  date: string;
  type: ChangelogType;
  title: string;
  summary: string;
  links?: ChangelogLink[];
}

export const CHANGELOG_ITEMS_PER_PAGE = 12;

export const changelogEntries: ChangelogEntry[] = [
  {
    id: "2026-07-23-audit-completion-navigation-security",
    date: "2026-07-23",
    type: "网站",
    title: "完成知识库导航、标签治理与安全观察升级",
    summary:
      "将已上线的房间诊断移入正式工具区，压缩知识库模块长列表，为文章归档增加内容类型入口，建立核心标签配置和增长门禁，并加入 CSP Report-Only 与房间诊断独立分享图。",
    links: [
      { label: "查看知识库", href: "/knowledge" },
      { label: "浏览文章标签", href: "/tags" },
      { label: "使用房间诊断工具", href: "/tools/room-diagnostics" },
    ],
  },
  {
    id: "2026-07-23-room-diagnostics-indexing",
    date: "2026-07-23",
    type: "SEO",
    title: "补齐房间诊断工具索引与发布检查",
    summary:
      "将房间运行诊断工具加入 Sitemap，并新增公开工具索引门禁。以后新增公开工具时，如果页面没有进入 Sitemap，生产构建会直接失败。",
    links: [
      { label: "使用房间诊断工具", href: "/tools/room-diagnostics" },
      { label: "打开工具中心", href: "/knowledge#reference-tools" },
    ],
  },
  {
    id: "2026-07-23-site-audit-checklist",
    date: "2026-07-23",
    type: "网站",
    title: "完成网站审计清单修复",
    summary:
      "统一 Node 24 发布门禁，修复 404 元数据与搜索全文索引，精简首页和文章首屏，重做分组目录与验证摘要，加入文章独立分享图、搜索容错、匿名反馈分析、无障碍基线和更严格的 Lighthouse 性能预算。",
    links: [
      { label: "查看首页", href: "/" },
      { label: "使用站内搜索", href: "/search" },
      { label: "查看验证方法", href: "/verification" },
    ],
  },
  {
    id: "2026-07-23-complete-experience-overhaul",
    date: "2026-07-23",
    type: "网站",
    title: "完成网站设计、阅读、搜索与维护体验升级",
    summary:
      "首页改为任务分流并展示最近阅读；移动端保留搜索；文章增加难度、适用阶段、前置知识、阅读进度、悬浮目录、标题链接与图片放大；搜索增加行为记录、键盘联想和延迟全文索引；工具统一分享、重置和反馈入口，并加入月度 Lighthouse 与季度内容维护检查。",
    links: [
      { label: "查看首页", href: "/" },
      { label: "使用站内搜索", href: "/search" },
      { label: "打开工具中心", href: "/knowledge#reference-tools" },
    ],
  },
  {
    id: "2026-07-22-creep-body-calculator",
    date: "2026-07-22",
    type: "工具",
    title: "上线 Creep 身体计算器",
    summary:
      "支持身体部件组合、Energy 预算、生成时间、生命值、携带容量、满载移动估算、身体数组复制和网址参数分享。",
    links: [{ label: "使用身体计算器", href: "/tools/creep-body-calculator" }],
  },
  {
    id: "2026-07-22-core-article-simulations",
    date: "2026-07-22",
    type: "验证",
    title: "为五篇核心文章补充离线模拟",
    summary:
      "覆盖动态身体、死亡 Memory 清理、工地进度、Tower 空闲维修和房间断代恢复。模拟结果与真实 Console、真实主循环继续分开标注。",
    links: [{ label: "查看验证方法", href: "/verification" }],
  },
  {
    id: "2026-07-22-maintenance-checks",
    date: "2026-07-22",
    type: "网站",
    title: "增加维护优先级与站内链接检查",
    summary:
      "发布前新增组件和数据内链检查、核心文章离线模拟，并增加文章维护优先级报告与更新日志录入命令。",
    links: [{ label: "查看更新日志", href: "/changelog" }],
  },
  {
    id: "2026-07-22-changelog-launch",
    date: "2026-07-22",
    type: "网站",
    title: "新增独立更新日志",
    summary:
      "集中记录网站结构、工具、验证、SEO 与内容修订，帮助读者判断页面最近发生了哪些实质变化。",
    links: [{ label: "查看更新日志", href: "/changelog" }],
  },
  {
    id: "2026-07-22-home-quick-lookup",
    date: "2026-07-22",
    type: "网站",
    title: "首页增加问题快速查询",
    summary:
      "将重复的项目介绍区改为搜索、错误码、术语表和 Creep 身体计算器入口，帮助访客更快进入实际问题。",
    links: [{ label: "查看首页", href: "/" }],
  },
  {
    id: "2026-07-22-merge-resources-projects",
    date: "2026-07-22",
    type: "网站",
    title: "合并资料中心与项目页面",
    summary:
      "把术语、错误码、标签、验证方法和工具规划并入知识库，把公开项目说明并入关于页面；旧地址保留永久重定向，减少重复页面。",
    links: [
      { label: "查看知识库", href: "/knowledge#reference-tools" },
      { label: "查看公开项目", href: "/about#public-projects" },
    ],
  },
];
