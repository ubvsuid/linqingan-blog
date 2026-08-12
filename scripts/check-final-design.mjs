import fs from "node:fs";

const checks = [
  {
    path: "src/app/(zh)/page.tsx",
    required: ["HomeTaskHub", "HomeProblemHub", "slice(0, 3)", "screeps-room-grid", "构建，运行，迭代", "开始新手路线", "解决当前问题"],
    forbidden: ["<HomeLearningActions />"],
  },
  {
    path: "src/components/home-task-hub.tsx",
    required: ["你现在想完成什么", "linqingan:recent-articles", "最近阅读"],
    forbidden: [],
  },
  {
    path: "src/components/home-problem-hub.tsx",
    required: ["screepsDiagnosticSymptoms", "你现在遇到了什么问题", "/diagnostics#", "/screeps-errors", "/screeps-api"],
    forbidden: [],
  },
  {
    path: "src/components/home-maintenance-panel.tsx",
    required: ["home-timeline", "最近更新", "getRecentSiteActivity(3)"],
    forbidden: ["home-maintenance-grid", "home-change-strip"],
  },
  {
    path: "src/lib/site.ts",
    required: [
      '{ label: "学习", href: "/beginner" }',
      '{ label: "解决问题", href: "/diagnostics" }',
      '{ label: "工具", href: "/tools" }',
      '{ label: "验证", href: "/verification" }',
      '{ label: "关于", href: "/about" }',
    ],
    forbidden: ["入门路线", "全部文章", '{ label: "工具", href: "/knowledge#reference-tools" }'],
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
    path: "src/lib/beginner-series.ts",
    required: ["outcomes", "完成基础房间循环", "spawnCreep()", "upgradeController()"],
    forbidden: [],
  },
  {
    path: "src/components/beginner-archive.tsx",
    required: ["完成后你应该能够", "stage.outcomes", "BeginnerProgressSummary"],
    forbidden: [],
  },
  {
    path: "src/app/(zh)/knowledge/page.tsx",
    required: ["moduleFlow", "section.stages.map", "学习阶段"],
    forbidden: [],
  },
  {
    path: "src/app/(zh)/verified/page.tsx",
    required: ["VerifiedContentExplorer", "accepted Evidence", "evidenceCount"],
    forbidden: [],
  },
  {
    path: "src/components/verified-content-explorer.tsx",
    required: ["验证级别", "全部 API", "全部返回码", "post.evidence.some"],
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
    required: ["getSearchDocuments", "getSearchIndexSummary", "s-maxage=3600", "X-Search-Index-Articles"],
    forbidden: [],
  },
  {
    path: "src/app/blog/[slug]/opengraph-image.tsx",
    required: ["ImageResponse", "SCREEPS · 中文知识库", "1200"],
    forbidden: [],
  },
  {
    path: "src/app/(zh)/tools/page.tsx",
    required: ["CollectionPage", "ItemList", "toolCatalog", "getToolHref"],
    forbidden: [
      'const tools = [',
      'href: "/tools/market-terminal-cost-calculator"',
      'href: "/tools/controller-downgrade-planner"',
    ],
  },
  {
    path: "src/lib/tool-catalog.ts",
    required: ["toolCatalog", "toolCount", "getToolHref", "creep-body-calculator", "tower-damage-heal-repair-calculator"],
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
    path: "src/app/(zh)/tools/market-terminal-cost-calculator/page.tsx",
    required: ["ToolUtilityBar", "SoftwareApplication"],
    forbidden: [],
  },
  {
    path: "src/app/(zh)/tools/controller-downgrade-planner/page.tsx",
    required: ["ToolUtilityBar", "SoftwareApplication"],
    forbidden: [],
  },
  {
    path: "src/app/(zh)/tools/lab-reaction-boost-planner/page.tsx",
    required: ["ToolUtilityBar", "SoftwareApplication"],
    forbidden: [],
  },
  {
    path: "src/app/(zh)/tools/spawn-queue-replacement-planner/page.tsx",
    required: ["ToolUtilityBar", "SoftwareApplication"],
    forbidden: [],
  },
  {
    path: "src/app/(zh)/tools/hauling-throughput-planner/page.tsx",
    required: ["ToolUtilityBar", "SoftwareApplication"],
    forbidden: [],
  },
  {
    path: "src/app/(zh)/tools/tower-damage-heal-repair-calculator/page.tsx",
    required: ["ToolUtilityBar", "SoftwareApplication"],
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
