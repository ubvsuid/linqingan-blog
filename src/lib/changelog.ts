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
  {
    id: "2026-07-22-primary-navigation-cleanup",
    date: "2026-07-22",
    type: "网站",
    title: "精简顶部主导航",
    summary:
      "从顶部主导航移除与主要学习入口重合的“资料”和“项目”，让首页、入门、文章、知识库、近况与关于成为更清晰的主路径。",
  },
  {
    id: "2026-07-22-changelog-page",
    date: "2026-07-22",
    type: "网站",
    title: "新增独立更新日志",
    summary:
      "在近况页加入最近更新预览，并建立独立更新日志页面。以后网站、内容、工具和验证流程的变化只需要在同一份数据中记录。",
    links: [
      { label: "查看更新日志", href: "/changelog" },
      { label: "查看近况", href: "/now" },
    ],
  },
  {
    id: "2026-07-22-about-page-redesign",
    date: "2026-07-22",
    type: "网站",
    title: "重新设计关于页面",
    summary:
      "减少重复的网站功能说明，增加建站原因、内容处理方法、可信度边界，并将公开项目压缩为摘要与相关入口。",
    links: [{ label: "查看关于页面", href: "/about" }],
  },
  {
    id: "2026-07-22-search-upgrade",
    date: "2026-07-22",
    type: "工具",
    title: "升级站内搜索",
    summary:
      "增加文章、术语、错误码、工具和项目筛选，支持知识模块信息、同义词匹配、关键词高亮、无结果推荐和键盘操作。",
    links: [{ label: "使用站内搜索", href: "/search" }],
  },
  {
    id: "2026-07-22-verification-guide",
    date: "2026-07-22",
    type: "验证",
    title: "新增文章验证方法",
    summary:
      "公开区分官方文档核对、JavaScript 语法检查、离线模拟、Screeps Console 和真实主循环验证。",
    links: [{ label: "查看验证方法", href: "/verification" }],
  },
  {
    id: "2026-07-22-production-smoke-test",
    date: "2026-07-22",
    type: "验证",
    title: "将生产冒烟测试接入构建",
    summary:
      "生产构建完成后会自动启动网站，检查关键页面、Canonical、noindex、标签重定向和全部 Sitemap URL。",
  },
  {
    id: "2026-07-22-search-indexing",
    date: "2026-07-22",
    type: "SEO",
    title: "调整站内搜索的索引策略",
    summary:
      "搜索页继续供站内访客使用，但设置为 noindex 并移出 Sitemap，避免搜索参数页面参与索引。",
    links: [{ label: "打开搜索页面", href: "/search" }],
  },
  {
    id: "2026-07-22-tag-center",
    date: "2026-07-22",
    type: "内容",
    title: "整理文章标签中心",
    summary:
      "核心标签和至少包含两篇文章的标签获得优先展示，单篇文章标签继续保留在文章页和对应标签 URL 中。",
    links: [{ label: "浏览文章标签", href: "/tags" }],
  },
  {
    id: "2026-07-21-knowledge-modules",
    date: "2026-07-21",
    type: "内容",
    title: "建立八个独立知识模块",
    summary:
      "为 52 篇专题文章补充模块归属、分阶段顺序、专题页面、面包屑、进度和前后文导航。",
    links: [{ label: "浏览知识模块", href: "/knowledge" }],
  },
  {
    id: "2026-07-21-dynamic-site-stats",
    date: "2026-07-21",
    type: "网站",
    title: "站点内容统计改为自动计算",
    summary:
      "首页、知识库和关于页的文章数、模块数与项目数改为读取真实数据，新增内容后不再手工修改数字。",
    links: [
      { label: "查看首页", href: "/" },
      { label: "查看知识库", href: "/knowledge" },
    ],
  },
];
