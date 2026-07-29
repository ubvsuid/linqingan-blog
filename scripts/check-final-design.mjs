import fs from "node:fs";

const checks = [
  {
    path: "src/app/(zh)/page.tsx",
    required: ["HomeTaskHub", "slice(0, 2)", "screeps-room-grid"],
    forbidden: ["<HomeLearningActions />"],
  },
  {
    path: "src/components/home-task-hub.tsx",
    required: ["你现在想完成什么", "linqingan:recent-articles", "最近阅读"],
    forbidden: [],
  },
  {
    path: "src/components/home-maintenance-panel.tsx",
    required: ["home-timeline", "维护时间流"],
    forbidden: ["home-maintenance-grid", "home-change-strip"],
  },
  {
    path: "src/lib/site.ts",
    required: ["入门", "文章", "/knowledge#reference-tools"],
    forbidden: ["入门路线", "全部文章"],
  },
  {
    path: "src/components/site-header.tsx",
    required: ["profile-shortcut", "header-icon-link"],
    forbidden: ["<style>", ".header-icon-link { display: none; }"],
  },
  {
    path: "src/app/site-shell.css",
    required: [".profile-shortcut {", "display: none;", ".header-icon-link {", "width: 40px;", "height: 40px;"],
    forbidden: [],
  },
  {
    path: "src/app/(zh)/blog/[slug]/page.tsx",
    required: ["ArticleReadingExperience", "ArticleLearningContext", "ArticleToc", "ArticleVerificationSummary", "ArticleFeedback"],
    forbidden: [],
  },
  {
    path: "src/components/article-toc.tsx",
    required: ["article-page-toc", "toc-group-heading", "IntersectionObserver"],
    forbidden: [],
  },
  {
    path: "src/components/article-verification-summary.tsx",
    required: ["查看验证详情", "Screeps Console", "真实主循环"],
    forbidden: [],
  },
  {
    path: "src/components/article-learning-context.tsx",
    required: ["难度", "适用阶段", "前置知识", "模块位置"],
    forbidden: [],
  },
  {
    path: "src/components/article-feedback.tsx",
    required: ["内容可能过时", "建议补充", "没解决", "article_feedback"],
    forbidden: ["needs-work"],
  },
  {
    path: "src/components/site-search.tsx",
    required: ["site_search_no_results", "site_search_result_click", "handleSuggestionKeyDown", "fullIndexRequested", "/api/search-index", "editDistance"],
    forbidden: ["useEffect(() => {\n    setActiveSuggestionIndex(-1);"],
  },
  {
    path: "src/app/(zh)/api/search-index/route.ts",
    required: ["getSearchDocuments", "s-maxage=86400"],
    forbidden: [],
  },
  {
    path: "src/app/blog/[slug]/opengraph-image.tsx",
    required: ["ImageResponse", "SCREEPS · 中文知识库", "1200"],
    forbidden: [],
  },
  {
    path: "src/app/(zh)/tools/creep-body-calculator/page.tsx",
    required: ["ToolUtilityBar"],
    forbidden: [],
  },
  {
    path: "src/app/(zh)/tools/room-diagnostics/page.tsx",
    required: ["ToolUtilityBar"],
    forbidden: [],
  },
  {
    path: "src/app/globals.css",
    required: ["FINAL DESIGN OVERHAUL", "SITE AUDIT CHECKLIST FIXES", "prefers-reduced-motion", "article-floating-toc"],
    forbidden: [],
  },
  {
    path: ".github/workflows/site-quality-audit.yml",
    required: ["Lighthouse CI", "schedule"],
    forbidden: [],
  },
  {
    path: ".github/workflows/quarterly-content-review.yml",
    required: ["articles:priority", "upload-artifact"],
    forbidden: [],
  },
];

const failures = [];
for (const check of checks) {
  const source = fs.readFileSync(check.path, "utf8");
  for (const text of check.required) {
    if (!source.includes(text)) failures.push(`${check.path}: missing ${JSON.stringify(text)}`);
  }
  for (const text of check.forbidden) {
    if (source.includes(text)) failures.push(`${check.path}: forbidden ${JSON.stringify(text)}`);
  }
}

if (failures.length > 0) {
  console.error("Final design regression checks failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Final design regression checks passed: ${checks.length} files.`);
