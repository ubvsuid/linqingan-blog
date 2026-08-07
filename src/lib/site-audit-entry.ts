import type { ChangelogEntry } from "@/lib/changelog";

export const latestSiteAuditEntry: ChangelogEntry = {
  id: "2026-08-07-final-site-audit",
  date: "2026-08-07",
  type: "网站",
  title: "完成首页、知识库与站点治理优化",
  summary:
    "保留首页 H1“构建，运行，迭代”和现有副标题，精简首页导航与重复区块，增加两个主要操作入口；知识库首页改为每模块展示代表文章；Blog 元数据、About 状态信息、最近更新数据源和内联样式治理同步调整。此次更新建立在此前合并资料中心与项目页面的站点结构基础上。",
  links: [
    { label: "查看首页", href: "/" },
    { label: "查看知识库", href: "/knowledge" },
    { label: "查看关于页", href: "/about" },
  ],
};
