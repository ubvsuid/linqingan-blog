import type { ChangelogEntry } from "@/lib/changelog";

export const latestSiteAuditEntry: ChangelogEntry = {
  id: "2026-08-07-final-site-audit",
  date: "2026-08-07",
  type: "网站",
  title: "完成站点结构、标签与搜索治理优化",
  summary:
    "保留首页 H1“构建，运行，迭代”和现有副标题，在此前首页与知识库瘦身基础上继续治理标签归档、站内搜索体积、Sitemap 与阅读后路径；上线 Screeps API 快速查询和动态 Recently Verified 入口，同时继续迁移页面内联样式并保留严格 CSP 的 canary 验证边界。文章正文与文章验证数据未在本次治理中修改。",
  links: [
    { label: "查看知识库", href: "/knowledge" },
    { label: "浏览文章标签", href: "/tags" },
    { label: "查询 Screeps API", href: "/screeps-api" },
    { label: "查看最近验证", href: "/verified" },
  ],
};
