import fs from "node:fs";
import path from "node:path";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function replaceRequired(source, before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Unable to apply ${label}: expected source shape not found`);
  }
  return source.replace(before, after);
}

function patchNotFoundMetadata() {
  write(
    "src/app/not-found.tsx",
    `import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: { absolute: "页面不存在｜临清安" },
  description: "这个页面不存在，可能已经移动、删除或网址输入有误。",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <Container>
        <p className="eyebrow">ERROR 404</p>
        <h1>这个页面不存在</h1>
        <p>它可能已经移动、被删除，或者网址输入有误。可以返回首页，也可以直接搜索文章、术语和错误码。</p>
        <div className="button-row">
          <Link href="/" className="button button-primary">返回首页</Link>
          <Link href="/search" className="button button-secondary">搜索网站</Link>
        </div>
      </Container>
    </main>
  );
}
`,
  );
}

function patchHomepage() {
  const filePath = "src/app/page.tsx";
  let source = read(filePath);

  source = source.replace(
    "  title: { absolute: siteConfig.title },",
    '  title: { absolute: "Screeps 中文教程、知识库与实用工具｜临清安" },',
  );
  source = source.replace(
    '    "从 Screeps 中文新手学习路线开始，继续阅读自动化系统、JavaScript 工程实践与真实开发记录。",',
    '    "面向中文玩家的 Screeps 新手教程、错误排查、知识库与实用工具，覆盖 Creep、Spawn、Memory、寻路、经济与自动化系统。",',
  );
  source = source.replace(
    '<section className={styles.hero}>',
    '<section className={`${styles.hero} screeps-room-grid`}>',
  );

  source = source.replace(
    `  {
    href: "/search",
    eyebrow: "SEARCH",
    title: "搜索网站",
    description: "输入对象、方法、错误码或中文问题，搜索文章正文与知识模块。",
  },
`,
    "",
  );
  source = source.replace("<h2 id=\"home-quick-title\">已经遇到问题？</h2>", "<h2 id=\"home-quick-title\">常用查询工具</h2>");

  write(filePath, source);
}

function writeVerificationSummary() {
  write(
    "src/components/article-verification-summary.tsx",
    `import { formatDate } from "@/lib/date";

interface ArticleVerificationSummaryProps {
  docsChecked: boolean;
  syntaxChecked: boolean;
  consoleTested: boolean;
  liveTested: boolean;
  checkedAt: string;
  testEnvironment?: string;
  testedAt?: string;
  testResult?: string;
}

function status(value: boolean, done: string, pending: string) {
  return value ? done : pending;
}

export function ArticleVerificationSummary({
  docsChecked,
  syntaxChecked,
  consoleTested,
  liveTested,
  checkedAt,
  testEnvironment,
  testedAt,
  testResult,
}: ArticleVerificationSummaryProps) {
  return (
    <details className="article-verification-summary">
      <summary>
        <span className="eyebrow">VERIFICATION</span>
        <strong>
          文档{status(docsChecked, "已核对", "待核对")} · 语法{status(syntaxChecked, "已检查", "待检查")} · Console{status(consoleTested, "已测试", "待测试")} · 主循环{status(liveTested, "已验证", "待验证")}
        </strong>
        <span className="verification-toggle-label">查看验证详情</span>
      </summary>
      <dl>
        <div><dt>官方文档</dt><dd>{status(docsChecked, "已核对", "待核对")}</dd></div>
        <div><dt>JavaScript 语法</dt><dd>{status(syntaxChecked, "已检查", "待检查")}</dd></div>
        <div><dt>Screeps Console</dt><dd>{status(consoleTested, "已测试", "待测试")}</dd></div>
        <div><dt>真实主循环</dt><dd>{status(liveTested, "已验证", "待验证")}</dd></div>
        <div><dt>最后核对</dt><dd>{formatDate(checkedAt)}</dd></div>
        {testEnvironment ? <div><dt>测试环境</dt><dd>{testEnvironment}</dd></div> : null}
        {testedAt ? <div><dt>测试日期</dt><dd>{formatDate(testedAt)}</dd></div> : null}
        {testResult ? <div className="verification-wide"><dt>测试结果</dt><dd>{testResult}</dd></div> : null}
      </dl>
    </details>
  );
}
`,
  );
}

function writeArticleToc() {
  write(
    "src/components/article-toc.tsx",
    `"use client";

import { useEffect, useMemo, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocGroup {
  parent: TocItem;
  children: TocItem[];
}

export function ArticleToc({ items }: { items: TocItem[] }) {
  const groups = useMemo(() => {
    const next: TocGroup[] = [];
    for (const item of items) {
      if (item.level === 2) next.push({ parent: item, children: [] });
      else if (item.level === 3 && next.length > 0) next[next.length - 1].children.push(item);
    }
    return next;
  }, [items]);
  const [expandedGroup, setExpandedGroup] = useState(groups[0]?.parent.id ?? "");

  useEffect(() => {
    if (groups.length === 0) return;
    const headings = groups
      .flatMap((group) => [group.parent, ...group.children])
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => Boolean(heading));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
        const activeId = visible[0]?.target.id;
        if (!activeId) return;
        const group = groups.find((item) => item.parent.id === activeId || item.children.some((child) => child.id === activeId));
        if (group) setExpandedGroup(group.parent.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 1] },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [groups]);

  if (groups.length <= 1) return null;

  return (
    <details id="article-page-toc" className="article-toc" open={groups.length <= 8}>
      <summary>
        <strong>本文目录</strong>
        <span>{groups.length} 个主要章节</span>
      </summary>
      <ol>
        {groups.map((group) => {
          const expanded = expandedGroup === group.parent.id;
          return (
            <li className={expanded ? "toc-group-active" : undefined} key={group.parent.id}>
              <div className="toc-group-heading">
                <a href={`#${group.parent.id}`}>{group.parent.text}</a>
                {group.children.length > 0 ? (
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`toc-children-${group.parent.id}`}
                    onClick={() => setExpandedGroup(expanded ? "" : group.parent.id)}
                  >
                    {expanded ? "收起小节" : `${group.children.length} 个小节`}
                  </button>
                ) : null}
              </div>
              {expanded && group.children.length > 0 ? (
                <ol id={`toc-children-${group.parent.id}`}>
                  {group.children.map((child) => (
                    <li key={child.id}><a href={`#${child.id}`}>{child.text}</a></li>
                  ))}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ol>
    </details>
  );
}
`,
  );
}

function patchArticlePage() {
  const filePath = "src/app/blog/[slug]/page.tsx";
  let source = read(filePath);

  if (!source.includes('import { ArticleToc } from "@/components/article-toc";')) {
    source = source.replace(
      'import { ArticleFeedback } from "@/components/article-feedback";',
      'import { ArticleFeedback } from "@/components/article-feedback";\nimport { ArticleToc } from "@/components/article-toc";\nimport { ArticleVerificationSummary } from "@/components/article-verification-summary";',
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
  source = source.replace(
    "        description: post.description,\n        datePublished:",
    "        description: post.description,\n        image: socialImage,\n        datePublished:",
  );

  source = source.replace(
    /          <section className="verification-status" aria-labelledby="verification-status-title">[\s\S]*?          <\/section>\n/,
    `          <ArticleVerificationSummary
            docsChecked={post.verification.docsChecked}
            syntaxChecked={post.verification.syntaxChecked}
            consoleTested={post.verification.consoleTested}
            liveTested={post.verification.liveTested}
            checkedAt={post.verification.checkedAt}
            testEnvironment={post.verification.testEnvironment}
            testedAt={post.verification.testedAt}
            testResult={post.verification.testResult}
          />
`,
  );

  source = source.replace(
    /          \{post\.tableOfContents\.length > 1 \? \([\s\S]*?          \) : null\}\n\n          <div\n            id=\{articleId\}/,
    `          <ArticleToc items={post.tableOfContents} />

          <div
            id={articleId}`,
  );

  write(filePath, source);
}

function writeArticleFeedback() {
  write(
    "src/components/article-feedback.tsx",
    `"use client";

import { track } from "@vercel/analytics";
import { useCallback, useMemo, useSyncExternalStore } from "react";

interface ArticleFeedbackProps {
  slug: string;
  title: string;
  articleUrl: string;
  email: string;
  issueUrl: string;
}

type FeedbackValue = "helpful" | "not-solved" | "outdated" | "suggestion";

function parseFeedback(value: string | null): FeedbackValue | null {
  return value === "helpful" || value === "not-solved" || value === "outdated" || value === "suggestion" ? value : null;
}

const labels: Record<FeedbackValue, string> = {
  helpful: "有帮助",
  "not-solved": "没解决",
  outdated: "内容可能过时",
  suggestion: "建议补充",
};

export function ArticleFeedback({ slug, title, articleUrl, email, issueUrl }: ArticleFeedbackProps) {
  const storageKey = `article-feedback:${slug}`;
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => { if (event.key === storageKey) onStoreChange(); };
    const handleLocalFeedback = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "object" && event.detail !== null && "slug" in event.detail && event.detail.slug === slug) onStoreChange();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("site:article-feedback", handleLocalFeedback);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("site:article-feedback", handleLocalFeedback);
    };
  }, [slug, storageKey]);
  const getSnapshot = useCallback(() => parseFeedback(window.localStorage.getItem(storageKey)), [storageKey]);
  const feedback = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const githubHref = useMemo(() => {
    const body = [`文章：${title}`, `地址：${articleUrl}`, "", "问题位置：", "", "问题描述：", "", "建议修改："].join("\n");
    const params = new URLSearchParams({ title: `文章反馈：${title}`, body });
    return `${issueUrl}?${params.toString()}`;
  }, [articleUrl, issueUrl, title]);

  function saveFeedback(value: FeedbackValue) {
    window.localStorage.setItem(storageKey, value);
    window.dispatchEvent(new CustomEvent("site:article-feedback", { detail: { slug, value } }));
    track("article_feedback", { slug: slug.slice(0, 80), feedback: value });
  }

  const statusText = feedback === "helpful"
    ? "感谢反馈，我会继续保持这种写法。"
    : feedback === "not-solved"
      ? "已经集中记录为未解决，可以继续提交具体卡住的位置。"
      : feedback === "outdated"
        ? "已经集中标记为可能过时，建议同时提交对应 API 或版本信息。"
        : feedback === "suggestion"
          ? "已经集中记录补充建议，可以继续说明希望增加的示例。"
          : "选择一个选项即可完成反馈。";

  return (
    <section className="article-feedback" aria-labelledby="article-feedback-title">
      <div>
        <p className="eyebrow">FEEDBACK</p>
        <h2 id="article-feedback-title">这篇文章解决了你的问题吗？</h2>
        <p>反馈会匿名汇总到站点分析中，同时保存在当前浏览器。具体错误仍可通过 GitHub 或邮箱提交。</p>
      </div>
      <div className="article-feedback-actions">
        <div className="article-feedback-votes" role="group" aria-label="文章是否有帮助">
          {(Object.keys(labels) as FeedbackValue[]).map((value) => (
            <button key={value} type="button" className={feedback === value ? "feedback-active" : undefined} aria-pressed={feedback === value} onClick={() => saveFeedback(value)}>
              {labels[value]}
            </button>
          ))}
        </div>
        <p className="article-feedback-status" aria-live="polite">{statusText}</p>
        <div className="article-feedback-links">
          <a href={githubHref} target="_blank" rel="noreferrer" onClick={() => track("article_feedback_detail", { slug: slug.slice(0, 80), channel: "github" })}>在 GitHub 提交问题 ↗</a>
          <a href={`mailto:${email}?subject=${encodeURIComponent(`文章反馈：${title}`)}&body=${encodeURIComponent(`文章：${articleUrl}\n\n问题描述：`)}`} onClick={() => track("article_feedback_detail", { slug: slug.slice(0, 80), channel: "email" })}>通过邮箱反馈</a>
        </div>
      </div>
      <style>{`
        .article-feedback { display: grid; grid-template-columns: minmax(210px, .72fr) minmax(0, 1.28fr); gap: 46px; margin-top: 72px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 42px 0; }
        .article-feedback h2 { margin: 8px 0 0; font-size: clamp(26px, 4vw, 38px); letter-spacing: -.035em; }
        .article-feedback > div > p:last-child, .article-feedback-status { color: var(--muted); line-height: 1.7; }
        .article-feedback-actions { display: grid; align-content: start; gap: 15px; }
        .article-feedback-votes, .article-feedback-links { display: flex; flex-wrap: wrap; gap: 10px; }
        .article-feedback button, .article-feedback-links a { display: inline-flex; min-height: 44px; align-items: center; border: 1px solid var(--border); border-radius: 999px; padding: 0 17px; background: var(--surface); color: var(--foreground); font: inherit; font-weight: 650; cursor: pointer; }
        .article-feedback button:hover, .article-feedback-links a:hover { border-color: var(--muted); text-decoration: none; }
        .article-feedback button.feedback-active { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
        .article-feedback-status { min-height: 24px; margin: 0; font-size: 13px; }
        .article-feedback-links { margin-top: 3px; }
        @media (max-width: 720px) { .article-feedback { grid-template-columns: 1fr; gap: 26px; } }
      `}</style>
    </section>
  );
}
`,
  );
}

function writeArticleReadingExperience() {
  write(
    "src/components/article-reading-experience.tsx",
    `"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface TocItem { id: string; text: string; level: number; }
interface ArticleReadingExperienceProps { articleId: string; slug: string; title: string; toc: TocItem[]; }
interface LightboxState { src: string; alt: string; }
const RECENT_STORAGE_KEY = "linqingan:recent-articles";

export function ArticleReadingExperience({ articleId, slug, title, toc }: ArticleReadingExperienceProps) {
  const [activeId, setActiveId] = useState(toc[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const tocItems = useMemo(() => toc.filter((item) => item.id), [toc]);
  const primaryTocItems = useMemo(() => tocItems.filter((item) => item.level === 2), [tocItems]);

  useEffect(() => {
    try {
      const existing = JSON.parse(window.localStorage.getItem(RECENT_STORAGE_KEY) ?? "[]");
      const current = Array.isArray(existing) ? existing : [];
      const next = [{ slug, title, href: `/blog/${slug}`, visitedAt: new Date().toISOString() }, ...current.filter((item) => item && item.slug !== slug)].slice(0, 8);
      window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("site:recent-articles"));
    } catch {}
  }, [slug, title]);

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;
    let frame = 0;
    const updateProgress = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const rect = article.getBoundingClientRect();
        const articleTop = window.scrollY + rect.top;
        const readableDistance = Math.max(article.scrollHeight - window.innerHeight * 0.55, 1);
        const current = window.scrollY + 120 - articleTop;
        setProgress(Math.max(0, Math.min(100, (current / readableDistance) * 100)));
      });
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [articleId]);

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;
    const cleanups: Array<() => void> = [];
    article.querySelectorAll<HTMLElement>("h2[id], h3[id]").forEach((heading) => {
      if (heading.querySelector(".heading-link-button")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "heading-link-button";
      button.textContent = "#";
      button.setAttribute("aria-label", `复制“${heading.textContent ?? "本节"}”链接`);
      const handleClick = async () => {
        const nextUrl = `${window.location.origin}${window.location.pathname}#${heading.id}`;
        window.history.replaceState(null, "", `#${heading.id}`);
        try { await navigator.clipboard.writeText(nextUrl); button.textContent = "已复制"; }
        catch { button.textContent = "复制失败"; }
        window.setTimeout(() => { button.textContent = "#"; }, 1500);
      };
      button.addEventListener("click", handleClick);
      heading.classList.add("heading-with-anchor");
      heading.appendChild(button);
      cleanups.push(() => { button.removeEventListener("click", handleClick); button.remove(); heading.classList.remove("heading-with-anchor"); });
    });

    article.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      if (image.closest("a")) return;
      image.classList.add("article-zoomable-image");
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `${image.alt || "文章图片"}，点击放大`);
      const open = () => { previousFocusRef.current = document.activeElement as HTMLElement; setLightbox({ src: image.currentSrc || image.src, alt: image.alt }); };
      const handleKey = (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } };
      image.addEventListener("click", open);
      image.addEventListener("keydown", handleKey);
      cleanups.push(() => { image.removeEventListener("click", open); image.removeEventListener("keydown", handleKey); image.classList.remove("article-zoomable-image"); image.removeAttribute("tabindex"); image.removeAttribute("role"); image.removeAttribute("aria-label"); });
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [articleId]);

  useEffect(() => {
    if (tocItems.length === 0) return;
    const headings = tocItems.map((item) => document.getElementById(item.id)).filter((heading): heading is HTMLElement => Boolean(heading));
    if (headings.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
      if (visible[0]?.target.id) setActiveId(visible[0].target.id);
    }, { rootMargin: "-18% 0px -68% 0px", threshold: [0, 1] });
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [tocItems]);

  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>(".article-toc a");
    links.forEach((link) => {
      const isActive = link.hash === `#${activeId}`;
      link.classList.toggle("toc-link-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
    });
  }, [activeId]);

  useEffect(() => {
    if (!lightbox) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [lightbox]);

  const activePrimaryId = useMemo(() => {
    let current = primaryTocItems[0]?.id ?? "";
    for (const item of tocItems) {
      if (item.level === 2) current = item.id;
      if (item.id === activeId) return current;
    }
    return current;
  }, [activeId, primaryTocItems, tocItems]);

  return (
    <>
      <div className="article-reading-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      {primaryTocItems.length > 1 ? (
        <aside className="article-floating-toc" aria-label="悬浮文章目录">
          <span>当前章节</span>
          <ol>{primaryTocItems.map((item) => <li key={item.id}><a className={activePrimaryId === item.id ? "toc-link-active" : undefined} href={`#${item.id}`}>{item.text}</a></li>)}</ol>
        </aside>
      ) : null}
      {primaryTocItems.length > 1 ? <a className="article-back-to-toc" href="#article-page-toc">返回目录</a> : null}
      {lightbox ? (
        <div className="article-lightbox" role="dialog" aria-modal="true" aria-label={lightbox.alt || "放大文章图片"} onClick={() => setLightbox(null)}>
          <button ref={closeButtonRef} type="button" onClick={() => setLightbox(null)}>关闭</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.src} alt={lightbox.alt} onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </>
  );
}
`,
  );
}

function writeArticleOgImage() {
  write(
    "src/app/blog/[slug]/opengraph-image.tsx",
    `import { ImageResponse } from "next/og";

import { getAllPosts, getPostBySlug } from "@/lib/posts";

export const alt = "Screeps 中文技术文章｜临清安";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function ArticleOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const title = post?.title ?? "Screeps 中文知识库";
  const category = post?.category ?? "临清安";
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#10110f", color: "#f5f2e8", fontFamily: "Arial, sans-serif", padding: "72px 78px" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "linear-gradient(#d6a84f 1px, transparent 1px), linear-gradient(90deg, #d6a84f 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26, letterSpacing: 2, color: "#e5b95e" }}><span>SCREEPS · 中文知识库</span><span>临清安</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 980 }}>
          <div style={{ fontSize: 24, color: "#c8c4b8" }}>{category}</div>
          <div style={{ fontSize: title.length > 34 ? 58 : 68, lineHeight: 1.16, fontWeight: 760, letterSpacing: -2 }}>{title}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 25, color: "#c8c4b8" }}><span style={{ width: 16, height: 16, borderRadius: 999, background: "#e5b95e" }} />www.linqingan.com</div>
      </div>
    </div>,
    size,
  );
}
`,
  );
}

function patchSearchFuzzyMatching() {
  const filePath = "src/components/site-search.tsx";
  let source = read(filePath);
  if (source.includes("function editDistance")) return;

  source = source.replace(
    "function scoreDocument(document: SearchDocument, query: string): number {",
    `function editDistance(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);
  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let diagonal = rows[0];
    rows[0] = rightIndex;
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const previous = rows[leftIndex];
      rows[leftIndex] = Math.min(
        rows[leftIndex] + 1,
        rows[leftIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = previous;
    }
  }
  return rows[left.length];
}

function isNearMatch(token: string, candidate: string): boolean {
  if (token.length < 4 || candidate.length < 4) return false;
  const threshold = token.length >= 8 ? 2 : 1;
  return Math.abs(token.length - candidate.length) <= threshold && editDistance(token, candidate) <= threshold;
}

function scoreDocument(document: SearchDocument, query: string): number {`,
  );

  source = source.replace(
    "  return score;\n}",
    `  if (score === 0) {
    const candidates = [
      ...normalizedTitle.split(/[^a-z0-9_\u4e00-\u9fff]+/).filter(Boolean),
      ...normalizedKeywords.split(/[^a-z0-9_\u4e00-\u9fff]+/).filter(Boolean),
    ];
    for (const token of tokens) {
      if (candidates.some((candidate) => isNearMatch(token, candidate))) score += 2;
    }
  }

  return score;
}`,
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
.screeps-room-grid::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: .18;
  background-image: linear-gradient(color-mix(in srgb, var(--energy-accent) 28%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--energy-accent) 28%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, black, transparent 86%);
}

.article-verification-summary {
  margin: -24px 0 38px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}
.article-verification-summary > summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px 18px;
  align-items: center;
  min-height: 58px;
  padding: 14px 18px;
  cursor: pointer;
  list-style: none;
}
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

@media (max-width: 720px) {
  .article-verification-summary { margin-bottom: 30px; }
  .article-verification-summary > summary { grid-template-columns: 1fr; gap: 5px; }
  .article-verification-summary .verification-toggle-label { white-space: normal; }
  .article-verification-summary dl { grid-template-columns: 1fr; }
  .article-verification-summary .verification-wide { grid-column: auto; }
  .toc-group-heading { grid-template-columns: 1fr; }
  .toc-group-heading button { width: fit-content; }
}
`;
  write(filePath, source);
}

function writeQualityScripts() {
  write(
    "scripts/check-accessibility-basics.mjs",
    `import fs from "node:fs";
import path from "node:path";

const failures = [];
const root = process.cwd();
const layout = fs.readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
const globals = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");
if (!layout.includes('className="skip-link"')) failures.push("Root layout is missing a skip link.");
if (!globals.includes(":focus-visible")) failures.push("Global focus-visible styles are missing.");
if (!globals.includes("prefers-reduced-motion")) failures.push("Reduced-motion handling is missing.");

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (/\.(tsx|jsx)$/.test(entry.name)) {
      const source = fs.readFileSync(fullPath, "utf8");
      if (/tabIndex=\{?[1-9]/.test(source)) failures.push(`${path.relative(root, fullPath)} uses a positive tabIndex.`);
      const rawImages = [...source.matchAll(/<img\b[^>]*>/g)];
      for (const match of rawImages) if (!/\balt=/.test(match[0])) failures.push(`${path.relative(root, fullPath)} contains an img without alt.`);
    }
  }
}
walk(path.join(root, "src"));
if (failures.length > 0) {
  console.error("Accessibility baseline check failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log("Accessibility baseline check passed.");
`,
  );

  write(
    "scripts/verification-report.mjs",
    `import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const directory = path.join(process.cwd(), "content/posts");
const rows = fs.readdirSync(directory)
  .filter((name) => name.endsWith(".md"))
  .map((name) => {
    const parsed = matter(fs.readFileSync(path.join(directory, name), "utf8"));
    const verification = parsed.data.verification ?? {};
    return {
      slug: name.replace(/\.md$/, ""),
      console: Boolean(verification.consoleTested),
      live: Boolean(verification.liveTested),
      checkedAt: verification.checkedAt ?? "missing",
    };
  });
const pendingConsole = rows.filter((row) => !row.console);
const pendingLive = rows.filter((row) => !row.live);
console.log(`Articles: ${rows.length}`);
console.log(`Console pending: ${pendingConsole.length}`);
console.log(`Live-loop pending: ${pendingLive.length}`);
for (const row of pendingLive.slice(0, 30)) console.log(`- ${row.slug} | checked ${row.checkedAt}`);
`,
  );

  write(
    "docs/SEARCH-CONSOLE-RELEASE-CHECKLIST.md",
    `# Search Console release checklist

Use this after a successful production deployment.

1. Confirm the production deployment commit SHA matches the default branch HEAD.
2. Open /sitemap.xml and verify all URLs return 200.
3. Resubmit the sitemap in Google Search Console.
4. Inspect the homepage, /beginner, /knowledge, /search and five priority articles.
5. Request indexing only for materially changed priority URLs.
6. Record the crawl date and indexing result in the release notes.
7. Do not repeatedly submit the same URL; wait for Google to recrawl it.
`,
  );

  write(
    "docs/REAL-SCREEPS-SCREENSHOT-STANDARD.md",
    `# Real Screeps screenshot standard

Screenshots used as evidence must come from an actual Screeps room, console or official simulation environment.

- Keep the room name, tick or relevant console output visible when it supports the claim.
- Remove account tokens, private messages and unrelated player information.
- Do not label generated artwork as a real game screenshot.
- Add a short caption describing what the screenshot proves.
- Provide descriptive alt text without repeating the caption word for word.
- Prefer SVG mechanism diagrams when a real screenshot would not explain the process clearly.
`,
  );
}

function appendChangelog() {
  const filePath = "src/lib/changelog.ts";
  let source = read(filePath);
  if (source.includes("2026-07-23-site-audit-checklist")) return;
  const marker = "export const changelogEntries";
  const index = source.indexOf(marker);
  if (index < 0) return;
  source = source.replace(
    /export const changelogEntries[^=]*= \[/,
    (match) => `${match}\n  {\n    id: \"2026-07-23-site-audit-checklist\",\n    date: \"2026-07-23\",\n    title: \"完成网站审计清单修复\",\n    description: \"压缩文章验证与目录、上线独立文章分享图、集中记录反馈与搜索行为、修复404元数据，并强化无障碍、性能和发布检查。\",\n  },`,
  );
  write(filePath, source);
}

patchNotFoundMetadata();
patchHomepage();
writeVerificationSummary();
writeArticleToc();
patchArticlePage();
writeArticleFeedback();
writeArticleReadingExperience();
writeArticleOgImage();
patchSearchFuzzyMatching();
patchGlobalStyles();
writeQualityScripts();
appendChangelog();
console.log("Comprehensive site audit checklist fixes applied.");
