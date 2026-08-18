import type { ChangelogEntry } from "@/lib/changelog";

export const latestSiteAuditEntry: ChangelogEntry = {
  id: "2026-08-18-home-workbench-refresh",
  date: "2026-08-18",
  type: "网站",
  title: "重排首页工作台，保留“构建，运行，迭代”首屏",
  summary:
    "完整保留首页首屏品牌表达与两个主按钮，只重排首屏以下的信息层级：精简任务分流和症状卡片，把核心工具前置，将新手路线与知识库合并为学习区，新增 Runtime Evidence 说明，并把最近文章、网站修订和快速查询压缩成更短的更新流。文章正文与文章验证数据未在本次首页治理中修改。",
  links: [
    { label: "查看首页", href: "/" },
    { label: "打开工具中心", href: "/tools" },
    { label: "查看验证方法", href: "/verification" },
    { label: "查看最近验证", href: "/verified" },
  ],
};
