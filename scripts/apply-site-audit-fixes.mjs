import fs from "node:fs";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, value) {
  fs.writeFileSync(filePath, value);
}

function patchArticlePage() {
  const filePath = "src/app/blog/[slug]/page.tsx";
  let source = read(filePath);

  if (!source.includes('import { ArticleToc } from "@/components/article-toc";')) {
    source = source.replace(
      'import { ArticleFeedback } from "@/components/article-feedback";',
      [
        'import { ArticleFeedback } from "@/components/article-feedback";',
        'import { ArticleToc } from "@/components/article-toc";',
        'import { ArticleVerificationSummary } from "@/components/article-verification-summary";',
      ].join("\n"),
    );
  }

  source = source.replace(
    '  const socialImage = post.cover ?? `${siteConfig.url}/opengraph-image`;',
    '  const socialImage = post.cover ?? `${siteConfig.url}/blog/${post.slug}/opengraph-image`;',
  );
  source = source.replace(
    "      images: [{ url: socialImage }],",
    '      images: [{ url: socialImage, width: 1200, height: 630, alt: `${post.title}｜临清安` }],',
  );
  if (!source.includes("        image: socialImage,")) {
    source = source.replace(
      "        description: post.description,\n        datePublished:",
      "        description: post.description,\n        image: socialImage,\n        datePublished:",
    );
  }

  source = source.replace(
    /          <section className="verification-status" aria-labelledby="verification-status-title">[\s\S]*?          <\/section>\n/,
    [
      "          <ArticleVerificationSummary",
      "            docsChecked={post.verification.docsChecked}",
      "            syntaxChecked={post.verification.syntaxChecked}",
      "            consoleTested={post.verification.consoleTested}",
      "            liveTested={post.verification.liveTested}",
      "            checkedAt={post.verification.checkedAt}",
      "            testEnvironment={post.verification.testEnvironment}",
      "            testedAt={post.verification.testedAt}",
      "            testResult={post.verification.testResult}",
      "          />",
      "",
    ].join("\n"),
  );

  source = source.replace(
    /          \{post\.tableOfContents\.length > 1 \? \([\s\S]*?          \) : null\}\n\n          <div\n            id=\{articleId\}/,
    [
      "          <ArticleToc items={post.tableOfContents} />",
      "",
      "          <div",
      "            id={articleId}",
    ].join("\n"),
  );

  write(filePath, source);
}

function patchFeedbackAnalytics() {
  const filePath = "src/components/article-feedback.tsx";
  let source = read(filePath);
  if (!source.includes('from "@vercel/analytics"')) {
    source = source.replace(
      'import { useCallback, useMemo, useSyncExternalStore } from "react";',
      'import { track } from "@vercel/analytics";\nimport { useCallback, useMemo, useSyncExternalStore } from "react";',
    );
  }
  if (!source.includes('track("article_feedback"')) {
    source = source.replace(
      "    );\n  }\n\n  return (",
      '    );\n    track("article_feedback", { slug: slug.slice(0, 80), feedback: value });\n  }\n\n  return (',
    );
  }
  source = source.replace(
    "反馈保存在当前浏览器中。发现代码或表述有错误时，也可以直接提交具体问题。",
    "反馈会匿名汇总到站点分析中，同时保存在当前浏览器。具体错误仍可通过 GitHub 或邮箱提交。",
  );
  write(filePath, source);
}

function patchReadingToc() {
  const filePath = "src/components/article-reading-experience.tsx";
  let source = read(filePath);
  if (!source.includes("primaryTocItems")) {
    source = source.replace(
      "  const tocItems = useMemo(() => toc.filter((item) => item.id), [toc]);",
      "  const tocItems = useMemo(() => toc.filter((item) => item.id), [toc]);\n  const primaryTocItems = useMemo(() => tocItems.filter((item) => item.level === 2), [tocItems]);",
    );
    source = source.replace(
      "      {tocItems.length > 1 ? (",
      "      {primaryTocItems.length > 1 ? (",
    );
    source = source.replace(
      "            {tocItems.map((item) => (",
      "            {primaryTocItems.map((item) => (",
    );
    source = source.replace(
      '              <li className={item.level === 3 ? "toc-level-three" : undefined} key={item.id}>',
      "              <li key={item.id}>",
    );
    source = source.replace(
      "      {tocItems.length > 1 ? (\n        <a className=\"article-back-to-toc\"",
      "      {primaryTocItems.length > 1 ? (\n        <a className=\"article-back-to-toc\"",
    );
  }
  write(filePath, source);
}

function patchSearchFuzzyMatching() {
  const filePath = "src/components/site-search.tsx";
  let source = read(filePath);
  if (source.includes("function editDistance")) return;
  const helper = [
    "function editDistance(left: string, right: string): number {",
    "  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);",
    "  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {",
    "    let diagonal = rows[0];",
    "    rows[0] = rightIndex;",
    "    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {",
    "      const previous = rows[leftIndex];",
    "      rows[leftIndex] = Math.min(rows[leftIndex] + 1, rows[leftIndex - 1] + 1, diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1));",
    "      diagonal = previous;",
    "    }",
    "  }",
    "  return rows[left.length];",
    "}",
    "",
    "function isNearMatch(token: string, candidate: string): boolean {",
    "  if (token.length < 4 || candidate.length < 4) return false;",
    "  const threshold = token.length >= 8 ? 2 : 1;",
    "  return Math.abs(token.length - candidate.length) <= threshold && editDistance(token, candidate) <= threshold;",
    "}",
    "",
  ].join("\n");
  source = source.replace(
    "function scoreDocument(document: SearchDocument, query: string): number {",
    helper + "function scoreDocument(document: SearchDocument, query: string): number {",
  );
  source = source.replace(
    "  return score;\n}",
    [
      "  if (score === 0) {",
      "    const candidates = [",
      "      ...normalizedTitle.split(/[^a-z0-9_\\u4e00-\\u9fff]+/).filter(Boolean),",
      "      ...normalizedKeywords.split(/[^a-z0-9_\\u4e00-\\u9fff]+/).filter(Boolean),",
      "    ];",
      "    for (const token of tokens) {",
      "      if (candidates.some((candidate) => isNearMatch(token, candidate))) score += 2;",
      "    }",
      "  }",
      "",
      "  return score;",
      "}",
    ].join("\n"),
  );
  write(filePath, source);
}

function patchGlobalStyles() {
  const filePath = "src/app/globals.css";
  let source = read(filePath);
  if (source.includes("/* SITE AUDIT CHECKLIST FIXES */")) return;
  source += `

/* SITE AUDIT CHECKLIST FIXES */
.screeps-room-grid { position: relative; isolation: isolate; overflow: hidden; }
.screeps-room-grid::before { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: .18; background-image: linear-gradient(color-mix(in srgb, var(--energy-accent) 28%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--energy-accent) 28%, transparent) 1px, transparent 1px); background-size: 48px 48px; mask-image: linear-gradient(to bottom, black, transparent 86%); }
.article-verification-summary { margin: -24px 0 38px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); }
.article-verification-summary > summary { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px 18px; align-items: center; min-height: 58px; padding: 14px 18px; cursor: pointer; list-style: none; }
.article-verification-summary > summary::-webkit-details-marker { display: none; }
.article-verification-summary > summary strong { min-width: 0; font-size: 13px; line-height: 1.55; }
.article-verification-summary .verification-toggle-label { color: var(--muted); font-size: 12px; white-space: nowrap; }
.article-verification-summary[open] .verification-toggle-label::before { content: "收起 · "; }
.article-verification-summary dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin: 0; border-top: 1px solid var(--border); padding: 18px; }
.article-verification-summary dl > div { display: flex; justify-content: space-between; gap: 14px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
.article-verification-summary dt { color: var(--muted); }
.article-verification-summary dd { margin: 0; font-weight: 650; text-align: right; }
.article-verification-summary .verification-wide { grid-column: 1 / -1; }
.article-toc { margin: 0 0 46px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 0; }
.article-toc > summary { display: flex; min-height: 58px; align-items: center; justify-content: space-between; gap: 18px; padding: 0 4px; cursor: pointer; list-style: none; }
.article-toc > summary::-webkit-details-marker { display: none; }
.article-toc > summary span { color: var(--muted); font-size: 12px; }
.article-toc > ol { display: grid; gap: 6px; margin: 0; padding: 0 0 24px; list-style: none; }
.article-toc > ol > li { border-top: 1px solid color-mix(in srgb, var(--border) 72%, transparent); padding-top: 10px; }
.toc-group-heading { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; }
.toc-group-heading > a { font-weight: 680; }
.toc-group-heading button { min-height: 36px; border: 1px solid var(--border); border-radius: 999px; padding: 0 11px; background: var(--surface); color: var(--muted); font: inherit; font-size: 11px; cursor: pointer; }
.toc-group-active > .toc-group-heading > a { color: var(--foreground); }
.article-toc li > ol { display: grid; gap: 7px; margin: 10px 0 0; padding: 0 0 0 18px; list-style: none; color: var(--muted); font-size: .94em; }
.article-floating-toc { scrollbar-width: thin; }
.article-floating-toc:focus-within { z-index: 60; background: var(--background); }
@media (max-width: 720px) { .article-verification-summary { margin-bottom: 30px; } .article-verification-summary > summary { grid-template-columns: 1fr; gap: 5px; } .article-verification-summary .verification-toggle-label { white-space: normal; } .article-verification-summary dl { grid-template-columns: 1fr; } .article-verification-summary .verification-wide { grid-column: auto; } .toc-group-heading { grid-template-columns: 1fr; } .toc-group-heading button { width: fit-content; } }
`;
  write(filePath, source);
}

patchArticlePage();
patchFeedbackAnalytics();
patchReadingToc();
patchSearchFuzzyMatching();
patchGlobalStyles();
console.log("Site audit source patches applied.");
