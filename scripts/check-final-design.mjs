import fs from "node:fs";

const checks = [
  {
    path: "src/app/(zh)/page.tsx",
    required: ["HomeTaskHub", "slice(0, 2)", "screeps-room-grid"],
    forbidden: ["<HomeLearningActions />"],
  },
  {
    path: "src/components/home-task-hub.tsx",
    required: ["\u4f60\u73b0\u5728\u60f3\u5b8c\u6210\u4ec0\u4e48", "linqingan:recent-articles", "\u6700\u8fd1\u9605\u8bfb"],
    forbidden: [],
  },
  {
    path: "src/components/home-maintenance-panel.tsx",
    required: ["home-timeline", "\u7ef4\u62a4\u65f6\u95f4\u6d41"],
    forbidden: ["home-maintenance-grid", "home-change-strip"],
  },
  {
    path: "src/lib/site.ts",
    required: ["\u5165\u95e8", "\u6587\u7ae0", "/knowledge#reference-tools"],
    forbidden: ["\u5165\u95e8\u8def\u7ebf", "\u5168\u90e8\u6587\u7ae0"],
  },
  {
    path: "src/components/site-header.tsx",
    required: [".profile-shortcut { display: none; }", ".header-icon-link { width: 40px; height: 40px; }"],
    forbidden: [".header-icon-link { display: none; }"],
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
    required: ["\u67e5\u770b\u9a8c\u8bc1\u8be6\u60c5", "Screeps Console", "\u771f\u5b9e\u4e3b\u5faa\u73af"],
    forbidden: [],
  },
  {
    path: "src/components/article-learning-context.tsx",
    required: ["\u96be\u5ea6", "\u9002\u7528\u9636\u6bb5", "\u524d\u7f6e\u77e5\u8bc6", "\u6a21\u5757\u4f4d\u7f6e"],
    forbidden: [],
  },
  {
    path: "src/components/article-feedback.tsx",
    required: ["\u5185\u5bb9\u53ef\u80fd\u8fc7\u65f6", "\u5efa\u8bae\u8865\u5145", "\u6ca1\u89e3\u51b3", "article_feedback"],
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
    required: ["ImageResponse", "SCREEPS \u00b7 \u4e2d\u6587\u77e5\u8bc6\u5e93", "1200"],
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
