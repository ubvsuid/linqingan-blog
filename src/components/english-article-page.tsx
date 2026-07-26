import Link from "next/link";

import { Container } from "@/components/container";
import {
  getEnglishDiscoveryArticle,
  getRelatedEnglishArticles,
} from "@/lib/english-discovery";

interface ArticleNavigationItem {
  href: string;
  label: string;
  title: string;
}

interface VerificationItem {
  term: string;
  value: string;
}

interface EnglishArticlePageProps {
  articleHref: string;
  chinesePath: string;
  headline: string;
  description: string;
  breadcrumbLabel: string;
  category: string;
  publishedAt: string;
  publishedLabel: string;
  readingTime: string;
  tags: string[];
  verification: VerificationItem[];
  toc: Array<[string, string]>;
  articleHtml: string;
  jsonLd: unknown;
  previous?: ArticleNavigationItem;
  next?: ArticleNavigationItem;
}

const headingIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeTocItem([first, second]: [string, string]) {
  if (headingIdPattern.test(first) && !headingIdPattern.test(second)) {
    return { id: first, label: second };
  }
  return { id: second, label: first };
}

export function EnglishArticlePage({
  articleHref,
  chinesePath,
  headline,
  description,
  breadcrumbLabel,
  category,
  publishedAt,
  publishedLabel,
  readingTime,
  tags,
  verification,
  toc,
  articleHtml,
  jsonLd,
  previous,
  next,
}: EnglishArticlePageProps) {
  const discovery = getEnglishDiscoveryArticle(articleHref);
  const related = getRelatedEnglishArticles(articleHref, 4);
  const verificationSummary = verification.slice(0, 3).map((item) => `${item.term}: ${item.value}`).join(" · ");
  const toolRecommendation = discovery?.tagSlugs.some((tag) => tag === "creeps" || tag === "energy")
    ? { href: "/en/tools/creep-body-calculator", title: "Creep Body Calculator", description: "Check body cost, spawn time, capacity, hits, and loaded movement before changing a worker design." }
    : discovery?.tagSlugs.some((tag) => tag === "cpu" || tag === "debugging" || tag === "controllers")
      ? { href: "/en/tools/room-diagnostics", title: "Room Snapshot Diagnostic", description: "Review room, Controller, workforce, Energy, CPU, and bucket risks from a read-only snapshot." }
      : null;

  return (
    <main className="article-shell" lang="en">
      <Container className="article-container">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <article>
          <header className="article-header">
            <nav className="article-breadcrumb" aria-label="Breadcrumb">
              <Link href="/en">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/en/blog">Articles</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{breadcrumbLabel}</span>
            </nav>
            <p className="eyebrow">{category}</p>
            <h1>{headline}</h1>
            <p className="article-description">{description}</p>
            <div className="post-meta">
              <time dateTime={publishedAt}>Published {publishedLabel}</time>
              <span aria-hidden="true">/</span>
              <span>{readingTime}</span>
            </div>

            {discovery ? (
              <div className="english-discovery-strip" aria-label="Article classification">
                <Link href={`/en/blog?module=${encodeURIComponent(discovery.moduleTitle)}`}>{discovery.moduleTitle}</Link>
                <Link href={`/en/blog?difficulty=${discovery.difficulty}`}>{discovery.difficulty}</Link>
                <Link href={`/en/blog?type=${discovery.contentType}`}>{discovery.contentType}</Link>
              </div>
            ) : null}

            <div className="tag-list" aria-label="Article topics">
              {discovery
                ? discovery.tags.map((tag, index) => <Link className="tag" href={`/en/tags/${discovery.tagSlugs[index]}`} key={tag}>{tag}</Link>)
                : tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
          </header>

          <details className="english-verification">
            <summary>
              <span><strong>Verification status</strong><small>{verificationSummary || "Open the full verification record"}</small></span>
              <span aria-hidden="true">View details</span>
            </summary>
            <div className="english-verification-details">
              <div><p className="eyebrow">VERIFICATION</p><h2>Evidence and test status</h2></div>
              <dl>{verification.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.value}</dd></div>)}</dl>
            </div>
          </details>

          <nav className="article-toc english-toc" aria-label="Table of contents">
            <p className="article-toc-title">Table of contents</p>
            <ol>
              {toc.map((item) => {
                const { id, label } = normalizeTocItem(item);
                return <li key={id}><a href={`#${id}`}>{label}</a></li>;
              })}
            </ol>
          </nav>

          <div className="article-content" dangerouslySetInnerHTML={{ __html: articleHtml }} />

          <section className="english-source-panel" aria-labelledby="english-source-title">
            <div>
              <p className="eyebrow">SOURCE AND SCOPE</p>
              <h2 id="english-source-title">Review the Chinese source or continue by topic</h2>
              <p>This English guide is rewritten for a focused search intent while preserving the technical scope and verification boundaries of its Chinese source.</p>
            </div>
            <div>
              <Link href={chinesePath} hrefLang="zh-CN">Open the Chinese source →</Link>
              {discovery ? <Link href={`/en/knowledge#module-${discovery.moduleNumber}`}>Continue in {discovery.moduleTitle} →</Link> : null}
            </div>
          </section>

          {toolRecommendation ? (
            <aside className="english-tool-recommendation" aria-label="Relevant tool">
              <span>RELEVANT TOOL</span>
              <div><strong>{toolRecommendation.title}</strong><p>{toolRecommendation.description}</p></div>
              <Link href={toolRecommendation.href}>Open tool →</Link>
            </aside>
          ) : null}

          {related.length > 0 ? (
            <section className="english-related" aria-labelledby="english-related-title">
              <div><p className="eyebrow">RELATED GUIDES</p><h2 id="english-related-title">Continue with a related problem</h2></div>
              <div>{related.map((article) => <Link href={article.href} key={article.href}><span>{article.moduleTitle}</span><strong>{article.title}</strong><small>{article.readingTime} · {article.difficulty}</small></Link>)}</div>
            </section>
          ) : null}

          <nav className="article-pagination" aria-label="Article navigation">
            {previous ? (
              <Link className="article-pagination-link article-pagination-previous" href={previous.href}><span>{previous.label}</span><strong>{previous.title}</strong></Link>
            ) : <span className="article-pagination-placeholder" />}
            {next ? (
              <Link className="article-pagination-link article-pagination-next" href={next.href}><span>{next.label}</span><strong>{next.title}</strong></Link>
            ) : (
              <Link className="article-pagination-link article-pagination-next" href="/en/blog"><span>Continue reading</span><strong>Return to English articles</strong></Link>
            )}
          </nav>
        </article>
      </Container>

      <style>{`
        .article-breadcrumb { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 34px; color: var(--muted); font-size: 13px; }
        .article-breadcrumb a:hover { color: var(--foreground); }
        .english-discovery-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
        .english-discovery-strip a { border: 1px solid var(--border); border-radius: 999px; padding: 6px 10px; color: var(--muted); font-size: 12px; text-decoration: none; }
        .tag-list .tag { text-decoration: none; }
        .english-verification { margin: -24px 0 52px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface); }
        .english-verification summary { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 20px 22px; cursor: pointer; list-style: none; }
        .english-verification summary::-webkit-details-marker { display: none; }
        .english-verification summary > span:first-child { display: grid; gap: 5px; }
        .english-verification summary small { color: var(--muted); font-weight: 400; line-height: 1.5; }
        .english-verification summary > span:last-child { color: var(--muted); font-size: 12px; white-space: nowrap; }
        .english-verification[open] summary { border-bottom: 1px solid var(--border); }
        .english-verification-details { display: grid; grid-template-columns: minmax(180px, .45fr) minmax(0, 1.55fr); gap: 30px; padding: 22px; }
        .english-verification-details h2 { margin: 7px 0 0; font-size: 20px; }
        .english-verification-details dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin: 0; }
        .english-verification-details dl > div { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
        .english-verification-details dt { color: var(--muted); }
        .english-verification-details dd { margin: 0; font-weight: 650; text-align: right; }
        .english-toc { margin-bottom: 58px; }
        .english-toc ol { columns: 2; column-gap: 36px; }
        .english-toc li { break-inside: avoid; margin-bottom: 9px; }
        .article-content .table-scroll { overflow-x: auto; }
        .article-content h2, .article-content h3 { scroll-margin-top: 100px; }
        .article-content pre { overflow-x: auto; }
        .english-source-panel { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(240px, .65fr); gap: 36px; margin-top: 72px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 34px 0; }
        .english-source-panel h2 { margin: 7px 0 0; font-size: clamp(27px, 4vw, 40px); letter-spacing: -.04em; }
        .english-source-panel p:not(.eyebrow) { max-width: 720px; margin: 14px 0 0; color: var(--muted); line-height: 1.7; }
        .english-source-panel > div:last-child { display: grid; align-content: center; gap: 12px; }
        .english-source-panel > div:last-child a { border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; text-decoration: none; }
        .english-tool-recommendation { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 22px; align-items: center; margin-top: 28px; border: 1px solid var(--border); border-radius: 18px; padding: 22px; background: var(--surface); }
        .english-tool-recommendation > span { color: var(--muted); font-size: 11px; writing-mode: vertical-rl; }
        .english-tool-recommendation p { margin: 7px 0 0; color: var(--muted); line-height: 1.6; }
        .english-related { display: grid; grid-template-columns: minmax(190px, .55fr) minmax(0, 1.45fr); gap: 38px; margin-top: 72px; }
        .english-related h2 { margin: 7px 0 0; font-size: clamp(28px, 4vw, 42px); letter-spacing: -.04em; }
        .english-related > div:last-child { display: grid; gap: 10px; }
        .english-related > div:last-child a { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 7px 16px; border: 1px solid var(--border); border-radius: 16px; padding: 18px 20px; background: var(--surface); text-decoration: none; }
        .english-related span, .english-related small { color: var(--muted); font-size: 12px; }
        .english-related strong { grid-column: 1; line-height: 1.45; }
        .english-related small { grid-column: 2; grid-row: 1 / span 2; align-self: center; }
        @media (max-width: 760px) {
          .english-verification summary { align-items: flex-start; flex-direction: column; }
          .english-verification-details, .english-source-panel, .english-related { grid-template-columns: 1fr; }
          .english-verification-details dl { grid-template-columns: 1fr; }
          .english-toc ol { columns: 1; }
          .english-tool-recommendation { grid-template-columns: 1fr; }
          .english-tool-recommendation > span { writing-mode: horizontal-tb; }
        }
        @media (max-width: 560px) { .english-related > div:last-child a { grid-template-columns: 1fr; } .english-related small { grid-column: 1; grid-row: auto; } }
      `}</style>
    </main>
  );
}
