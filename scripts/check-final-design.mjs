import fs from "node:fs";

const checks = [
  {
    path: "src/app/page.tsx",
    required: ["HomeTaskHub", "slice(0, 2)"],
    forbidden: ["<HomeLearningActions />"],
  },
  {
    path: "src/lib/site.ts",
    required: ["入门路线", "全部文章", "/knowledge#reference-tools"],
    forbidden: [],
  },
  {
    path: "src/components/site-header.tsx",
    required: [".profile-shortcut { display: none; }", ".header-icon-link { width: 40px; height: 40px; }"],
    forbidden: [".header-icon-link { display: none; }"],
  },
  {
    path: "src/app/blog/[slug]/page.tsx",
    required: ["ArticleReadingExperience", "article-page-toc", "ArticleFeedback"],
    forbidden: [],
  },
  {
    path: "src/components/article-feedback.tsx",
    required: ["内容可能过时", "建议补充", "没解决"],
    forbidden: ["needs-work"],
  },
  {
    path: "src/components/site-search.tsx",
    required: ["site_search_no_results", "site_search_result_click", "handleSuggestionKeyDown"],
    forbidden: ["useEffect(() => {\n    setActiveSuggestionIndex(-1);"],
  },
  {
    path: "src/app/tools/creep-body-calculator/page.tsx",
    required: ["ToolUtilityBar"],
    forbidden: [],
  },
  {
    path: "src/app/tools/room-diagnostics/page.tsx",
    required: ["ToolUtilityBar"],
    forbidden: [],
  },
  {
    path: "src/app/globals.css",
    required: ["FINAL DESIGN OVERHAUL", "prefers-reduced-motion", "article-floating-toc"],
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
