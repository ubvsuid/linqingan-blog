import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, value) {
  fs.writeFileSync(path, value);
}

function replaceOnce(source, before, after, marker, label) {
  if (source.includes(marker)) return source;
  if (!source.includes(before)) {
    throw new Error(`Unable to apply ${label}: expected source shape not found`);
  }
  return source.replace(before, after);
}

function patchHomePage() {
  const path = "src/app/page.tsx";
  let source = read(path);
  source = source.replace(
    'import { HomeLearningActions } from "@/components/home-learning-actions";',
    'import { HomeTaskHub } from "@/components/home-task-hub";',
  );
  source = source.replace("<HomeLearningActions />", "<HomeTaskHub />");
  source = source.replace("const latestPosts = allPosts.slice(0, 3);", "const latestPosts = allPosts.slice(0, 2);");
  write(path, source);
}

function patchNavigation() {
  const sitePath = "src/lib/site.ts";
  let site = read(sitePath);
  site = site.replace('{ label: "入门", href: "/beginner" },', '{ label: "入门路线", href: "/beginner" },');
  site = site.replace('{ label: "文章", href: "/blog" },', '{ label: "全部文章", href: "/blog" },');
  site = replaceOnce(
    site,
    '    { label: "知识库", href: "/knowledge" },\n    { label: "近况", href: "/now" },',
    '    { label: "知识库", href: "/knowledge" },\n    { label: "工具", href: "/knowledge#reference-tools" },\n    { label: "近况", href: "/now" },',
    '{ label: "工具", href: "/knowledge#reference-tools" }',
    "tools navigation",
  );
  write(sitePath, site);

  const headerPath = "src/components/site-header.tsx";
  let header = read(headerPath);
  header = header.replace(
    '        @media (max-width: 430px) {\n          .header-icon-link { display: none; }\n          .header-controls { gap: 6px; }\n        }',
    '        @media (max-width: 430px) {\n          .profile-shortcut { display: none; }\n          .header-controls { gap: 6px; }\n          .header-icon-link { width: 40px; height: 40px; }\n        }',
  );
  write(headerPath, header);
}

function patchArticlePage() {
  const path = "src/app/blog/[slug]/page.tsx";
  let source = read(path);
  source = replaceOnce(
    source,
    'import { ArticleEnhancements } from "@/components/article-enhancements";',
    'import { ArticleEnhancements } from "@/components/article-enhancements";\nimport { ArticleReadingExperience } from "@/components/article-reading-experience";',
    "ArticleReadingExperience",
    "article reading import",
  );
  source = source.replace(
    '<nav className="article-toc" aria-label="本文目录">',
    '<nav id="article-page-toc" className="article-toc" aria-label="本文目录">',
  );
  source = replaceOnce(
    source,
    '          <ArticleEnhancements articleId={articleId} />',
    '          <ArticleEnhancements articleId={articleId} />\n          <ArticleReadingExperience\n            articleId={articleId}\n            slug={post.slug}\n            title={post.title}\n            toc={post.tableOfContents}\n          />',
    "<ArticleReadingExperience",
    "article reading component",
  );
  write(path, source);
}

function patchToolPages() {
  const pages = [
    {
      path: "src/app/tools/creep-body-calculator/page.tsx",
      importAnchor: 'import { CreepBodyCalculator } from "@/components/creep-body-calculator";',
      importLine: 'import { ToolUtilityBar } from "@/components/tool-utility-bar";',
      marker: '<ToolUtilityBar title="Creep 身体计算器"',
      componentAnchor: "        <CreepBodyCalculator />",
      component: '        <ToolUtilityBar title="Creep 身体计算器" issueUrl={siteConfig.links.issues} />\n\n        <CreepBodyCalculator />',
    },
    {
      path: "src/app/tools/room-diagnostics/page.tsx",
      importAnchor: 'import { RoomDiagnostics } from "@/components/room-diagnostics";',
      importLine: 'import { ToolUtilityBar } from "@/components/tool-utility-bar";',
      marker: '<ToolUtilityBar title="房间运行诊断"',
      componentAnchor: "        <RoomDiagnostics />",
      component: '        <ToolUtilityBar title="房间运行诊断" issueUrl={siteConfig.links.issues} />\n\n        <RoomDiagnostics />',
    },
  ];

  for (const page of pages) {
    let source = read(page.path);
    source = replaceOnce(
      source,
      page.importAnchor,
      `${page.importAnchor}\n${page.importLine}`,
      "ToolUtilityBar",
      `${page.path} tool utility import`,
    );
    source = replaceOnce(
      source,
      page.componentAnchor,
      page.component,
      page.marker,
      `${page.path} tool utility component`,
    );
    write(page.path, source);
  }
}

function patchArticleFeedback() {
  const path = "src/components/article-feedback.tsx";
  let source = read(path);
  source = source.replace(
    'type FeedbackValue = "helpful" | "needs-work";',
    'type FeedbackValue = "helpful" | "not-solved" | "outdated" | "suggestion";',
  );
  source = source.replace(
    '  return value === "helpful" || value === "needs-work" ? value : null;',
    '  return value === "helpful" || value === "not-solved" || value === "outdated" || value === "suggestion" ? value : null;',
  );
  source = source.replace(
    `          <button
            type="button"
            className={feedback === "needs-work" ? "feedback-active" : undefined}
            aria-pressed={feedback === "needs-work"}
            onClick={() => saveFeedback("needs-work")}
          >
            需要改进
          </button>`,
    `          <button
            type="button"
            className={feedback === "not-solved" ? "feedback-active" : undefined}
            aria-pressed={feedback === "not-solved"}
            onClick={() => saveFeedback("not-solved")}
          >
            没解决
          </button>
          <button
            type="button"
            className={feedback === "outdated" ? "feedback-active" : undefined}
            aria-pressed={feedback === "outdated"}
            onClick={() => saveFeedback("outdated")}
          >
            内容可能过时
          </button>
          <button
            type="button"
            className={feedback === "suggestion" ? "feedback-active" : undefined}
            aria-pressed={feedback === "suggestion"}
            onClick={() => saveFeedback("suggestion")}
          >
            建议补充
          </button>`,
  );
  source = source.replace(
    `          {feedback === "helpful"
            ? "感谢反馈，我会继续保持这种写法。"
            : feedback === "needs-work"
              ? "已经记录。可以继续告诉我具体卡住的位置。"
              : "选择一个选项即可完成反馈。"}`,
    `          {feedback === "helpful"
            ? "感谢反馈，我会继续保持这种写法。"
            : feedback === "not-solved"
              ? "已经记录。可以继续提交具体卡住的位置。"
              : feedback === "outdated"
                ? "已经标记为可能过时，建议同时提交对应 API 或版本信息。"
                : feedback === "suggestion"
                  ? "已经记录补充建议，可以继续说明希望增加的示例。"
                  : "选择一个选项即可完成反馈。"}`,
  );
  write(path, source);
}

function patchSearchAnalytics() {
  const path = "src/components/site-search.tsx";
  let source = read(path);
  source = replaceOnce(
    source,
    'import Link from "next/link";',
    'import { track } from "@vercel/analytics";\nimport Link from "next/link";',
    'from "@vercel/analytics"',
    "search analytics import",
  );
  source = replaceOnce(
    source,
    '  const [activeType, setActiveType] = useState<SearchFilter>("全部");',
    '  const [activeType, setActiveType] = useState<SearchFilter>("全部");\n  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);',
    "activeSuggestionIndex",
    "search active suggestion state",
  );
  source = replaceOnce(
    source,
    '  useEffect(() => {\n    function handleKeyDown(event: KeyboardEvent) {',
    `  useEffect(() => {
    if (!normalizedQuery) return;
    const timeout = window.setTimeout(() => {
      const payload = { query: query.trim().slice(0, 80), results: rankedResults.length, type: activeType };
      track(rankedResults.length > 0 ? "site_search" : "site_search_no_results", payload);
      try {
        const history = JSON.parse(window.localStorage.getItem("linqingan:search-history") ?? "[]");
        const next = [payload, ...(Array.isArray(history) ? history : [])].slice(0, 50);
        window.localStorage.setItem("linqingan:search-history", JSON.stringify(next));
      } catch {}
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [activeType, normalizedQuery, query, rankedResults.length]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [normalizedQuery]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {`,
    "site_search_no_results",
    "search analytics effect",
  );
  source = replaceOnce(
    source,
    '  function updateQuery(value: string) {',
    `  function handleSuggestionKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      updateQuery(suggestions[activeSuggestionIndex].title.replace(/｜.*$/, "").replace(/（.*$/, ""));
      setActiveSuggestionIndex(-1);
    }
  }

  function handleResultClick(result: SearchDocument) {
    track("site_search_result_click", {
      query: query.trim().slice(0, 80),
      result: result.id.slice(0, 80),
      type: result.type,
    });
  }

  function updateQuery(value: string) {`,
    "handleSuggestionKeyDown",
    "search keyboard and click handlers",
  );
  source = source.replace(
    '            onChange={(event) => updateQuery(event.target.value)}\n            placeholder=',
    '            onChange={(event) => updateQuery(event.target.value)}\n            onKeyDown={handleSuggestionKeyDown}\n            aria-activedescendant={activeSuggestionIndex >= 0 ? `search-suggestion-${activeSuggestionIndex}` : undefined}\n            placeholder=',
  );
  source = source.replace(
    '<Link href={result.href}>\n                  <HighlightedText',
    '<Link href={result.href} onClick={() => handleResultClick(result)}>\n                  <HighlightedText',
  );
  source = source.replace(
    '<button key={key} type="button" onClick={() => updateQuery(label)}>',
    '<button id={`search-suggestion-${typeof item === "string" ? 0 : suggestions.indexOf(item)}`} className={typeof item !== "string" && suggestions.indexOf(item) === activeSuggestionIndex ? "suggestion-active" : undefined} key={key} type="button" onMouseEnter={() => typeof item !== "string" && setActiveSuggestionIndex(suggestions.indexOf(item))} onClick={() => updateQuery(label)}>',
  );
  source = source.replace(
    '.site-search-suggestions button:hover { border-color: var(--foreground); }',
    '.site-search-suggestions button:hover, .site-search-suggestions button.suggestion-active { border-color: var(--foreground); background: var(--foreground); color: var(--background); }',
  );
  write(path, source);
}

function patchGlobalStyles() {
  const path = "src/app/globals.css";
  let source = read(path);
  if (source.includes("/* FINAL DESIGN OVERHAUL */")) return;
  source += `

/* FINAL DESIGN OVERHAUL */
:root {
  --energy-accent: #9b6a18;
  --energy-accent-soft: #f0dfb9;
}

html[data-theme="dark"] {
  --energy-accent: #e8b95f;
  --energy-accent-soft: #493716;
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex]:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--energy-accent) 72%, transparent);
  outline-offset: 3px;
}

.article-reading-progress {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 90;
  height: 3px;
  pointer-events: none;
  background: transparent;
}

.article-reading-progress span {
  display: block;
  height: 100%;
  background: var(--energy-accent);
  transition: width 80ms linear;
}

.article-content .heading-with-anchor {
  position: relative;
}

.heading-link-button {
  display: inline-flex;
  min-width: 34px;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  margin-left: 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 14px;
  vertical-align: middle;
  cursor: pointer;
  opacity: .25;
}

.heading-with-anchor:hover .heading-link-button,
.heading-link-button:focus-visible {
  border-color: var(--border);
  background: var(--surface);
  opacity: 1;
}

.article-toc a.toc-link-active,
.article-floating-toc a.toc-link-active {
  color: var(--foreground);
  font-weight: 720;
}

.article-zoomable-image {
  cursor: zoom-in;
}

.article-lightbox {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 62px 24px 24px;
  background: rgb(0 0 0 / 86%);
}

.article-lightbox img {
  max-width: min(96vw, 1500px);
  max-height: 86vh;
  border-radius: 12px;
  object-fit: contain;
}

.article-lightbox button {
  position: fixed;
  top: 18px;
  right: 18px;
  min-height: 42px;
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 999px;
  padding: 0 16px;
  background: rgb(20 20 20 / 80%);
  color: white;
  cursor: pointer;
}

.article-floating-toc {
  position: fixed;
  top: 116px;
  left: calc(50% + 430px);
  z-index: 20;
  display: none;
  width: min(230px, calc(50vw - 455px));
  max-height: calc(100vh - 150px);
  overflow: auto;
  border-left: 1px solid var(--border);
  padding-left: 18px;
  color: var(--muted);
  font-size: 12px;
}

.article-floating-toc > span {
  display: block;
  margin-bottom: 11px;
  color: var(--foreground);
  font-weight: 720;
}

.article-floating-toc ol {
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.article-floating-toc .toc-level-three {
  padding-left: 12px;
}

.article-back-to-toc {
  position: fixed;
  right: 14px;
  bottom: 14px;
  z-index: 45;
  display: none;
  min-height: 42px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0 14px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  box-shadow: var(--shadow);
  font-size: 12px;
  font-weight: 720;
  backdrop-filter: blur(12px);
}

@media (min-width: 1280px) {
  .article-floating-toc { display: block; }
}

@media (max-width: 720px) {
  .article-back-to-toc { display: inline-flex; }
  .article-content pre {
    position: relative;
    box-shadow: inset -16px 0 18px -18px var(--foreground);
  }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
`;
  write(path, source);
}

patchHomePage();
patchNavigation();
patchArticlePage();
patchToolPages();
patchArticleFeedback();
patchSearchAnalytics();
patchGlobalStyles();
console.log("Final homepage, navigation, reading, search, feedback, tool and accessibility overhaul applied.");
