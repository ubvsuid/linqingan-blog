import Link from "next/link";

import { ArticleFeedback } from "@/components/article-feedback";
import { Container } from "@/components/container";
import { EnglishArticleLearningTracker } from "@/components/english-learning-progress";
import {
  englishDiscoveryArticles,
  getEnglishDiscoveryArticle,
  getRelatedEnglishArticles,
} from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

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
  articleHref?: string;
  chinesePath?: string;
  headline: string;
  description: string;
  breadcrumbLabel: string;
  category: string;
  publishedAt: string;
  publishedLabel: string;
  modifiedAt?: string;
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

function formatEnglishDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
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
  modifiedAt,
  readingTime,
  tags,
  verification,
  toc,
  articleHtml,
  jsonLd,
  previous,
  next,
}: EnglishArticlePageProps) {
  const discovery = articleHref
    ? getEnglishDiscoveryArticle(articleHref)
    : englishDiscoveryArticles.find(
        (article) => article.title === headline || article.description === description,
      );
  const resolvedArticleHref = discovery?.href ?? articleHref ?? "";
  const resolvedChinesePath = chinesePath ?? discovery?.chinesePath ?? "/blog";
  const resolvedModifiedAt = modifiedAt ?? discovery?.updatedAt ?? publishedAt;
  const visibleModifiedAt = resolvedModifiedAt !== publishedAt ? resolvedModifiedAt : null;
  const articleSlug = resolvedArticleHref.split("/").filter(Boolean).at(-1) ?? "english-guide";
  const related = resolvedArticleHref
    ? getRelatedEnglishArticles(resolvedArticleHref, 4)
    : [];
  const verificationSummary = verification
    .slice(0, 3)
    .map((item) => `${item.term}: ${item.value}`)
    .join(" · ");
  const toolRecommendation = discovery?.suppressToolRecommendation
    ? null
    : discovery?.tagSlugs.some(
          (tag) => tag === "creeps" || tag === "energy",
        )
      ? {
          href: "/en/tools/creep-body-calculator",
          title: "Creep Body Calculator",
          description:
            "Check body cost, spawn time, capacity, hits, and loaded movement before changing a worker design.",
        }
      : discovery?.tagSlugs.some(
            (tag) => tag === "cpu" || tag === "debugging" || tag === "controllers",
          )
        ? {
            href: "/en/tools/room-diagnostics",
            title: "Room Snapshot Diagnostic",
            description:
              "Review room, Controller, workforce, Energy, CPU, and bucket risks from a read-only snapshot.",
          }
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
              <Link href="/en/blog">Guides</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{breadcrumbLabel}</span>
            </nav>
            <p className="eyebrow">{category}</p>
            <h1>{headline}</h1>
            <p className="article-description">{description}</p>
            <div className="post-meta">
              <time dateTime={publishedAt}>Published {publishedLabel}</time>
              {visibleModifiedAt ? (
                <>
                  <span aria-hidden="true">/</span>
                  <time dateTime={visibleModifiedAt}>Updated {formatEnglishDate(visibleModifiedAt)}</time>
                </>
              ) : null}
              <span aria-hidden="true">/</span>
              <span>{readingTime}</span>
              <span aria-hidden="true">/</span>
              <span>By <Link href="/en/about" rel="author">Linqingan</Link></span>
            </div>

            {discovery ? (
              <div className="english-discovery-strip" aria-label="Article classification">
                <Link href={discovery.moduleHref}>{discovery.moduleTitle}</Link>
                <Link href={`/en/blog?difficulty=${discovery.difficulty}`}>{discovery.difficulty}</Link>
                <Link href={`/en/blog?type=${discovery.contentType}`}>{discovery.contentType}</Link>
              </div>
            ) : null}

            <div className="tag-list" aria-label="Article topics">
              {discovery
                ? discovery.tags.map((tag, index) => (
                    <Link className="tag" href={`/en/tags/${discovery.tagSlugs[index]}`} key={tag}>
                      {tag}
                    </Link>
                  ))
                : tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
          </header>

          {resolvedArticleHref ? (
            <EnglishArticleLearningTracker
              href={resolvedArticleHref}
              title={headline}
            />
          ) : null}

          <details className="english-verification">
            <summary>
              <span>
                <strong>Verification status</strong>
                <small>{verificationSummary || "Open the full verification record"}</small>
              </span>
              <span aria-hidden="true">View details</span>
            </summary>
            <div className="english-verification-details">
              <div>
                <p className="eyebrow">VERIFICATION</p>
                <h2>Evidence and test status</h2>
              </div>
              <dl>
                {verification.map((item) => (
                  <div key={item.term}>
                    <dt>{item.term}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
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

          <section className="english-source-panel" aria-labelledby={`english-source-title-${articleSlug}`}>
            <div>
              <p className="eyebrow">SOURCE AND SCOPE</p>
              <h2 id={`english-source-title-${articleSlug}`}>Review the source, evidence, or next system</h2>
              <p>This English guide is rewritten for a focused search intent while preserving the technical scope and verification boundaries of its Chinese source. Live-room evidence is claimed only when the verification record says it exists.</p>
            </div>
            <div>
              <Link href={resolvedChinesePath} hrefLang="zh-CN">Open the Chinese source →</Link>
              <Link href="/en/verification">Review the verification method →</Link>
              {discovery ? <Link href={discovery.moduleHref}>Continue in {discovery.moduleTitle} →</Link> : null}
            </div>
          </section>

          {toolRecommendation ? (
            <aside className="english-tool-recommendation" aria-label="Relevant tool">
              <span>RELEVANT TOOL</span>
              <div>
                <strong>{toolRecommendation.title}</strong>
                <p>{toolRecommendation.description}</p>
              </div>
              <Link href={toolRecommendation.href}>Open tool →</Link>
            </aside>
          ) : null}

          <ArticleFeedback
            slug={articleSlug}
            title={headline}
            articleUrl={`${siteConfig.url}${resolvedArticleHref}`}
            email={siteConfig.author.email}
            issueUrl={siteConfig.links.issues}
            language="en"
            rssHref="/en/feed.xml"
            changelogHref="/en/changelog"
          />

          {related.length > 0 ? (
            <section className="english-related" aria-labelledby={`english-related-title-${articleSlug}`}>
              <div>
                <p className="eyebrow">RELATED GUIDES</p>
                <h2 id={`english-related-title-${articleSlug}`}>Continue with a related problem</h2>
              </div>
              <div>
                {related.map((article) => (
                  <Link href={article.href} key={article.href}>
                    <span>{article.moduleTitle}</span>
                    <strong>{article.title}</strong>
                    <small>{article.readingTime} · {article.difficulty}</small>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <nav className="article-pagination" aria-label="Article navigation">
            {previous ? (
              <Link className="article-pagination-link article-pagination-previous" href={previous.href}>
                <span>{previous.label}</span>
                <strong>{previous.title}</strong>
              </Link>
            ) : <span className="article-pagination-placeholder" />}
            {next ? (
              <Link className="article-pagination-link article-pagination-next" href={next.href}>
                <span>{next.label}</span>
                <strong>{next.title}</strong>
              </Link>
            ) : (
              <Link className="article-pagination-link article-pagination-next" href="/en/blog">
                <span>Continue reading</span>
                <strong>Return to English guides</strong>
              </Link>
            )}
          </nav>
        </article>
      </Container>
    </main>
  );
}
