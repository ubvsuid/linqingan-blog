import Link from "next/link";

import { Container } from "@/components/container";

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

export function EnglishArticlePage({
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
            <div className="tag-list" aria-label="Article tags">
              {tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
          </header>

          <section className="english-verification" aria-labelledby="verification-status-title">
            <div>
              <p className="eyebrow">VERIFICATION</p>
              <h2 id="verification-status-title">Verification status</h2>
            </div>
            <dl>
              {verification.map((item) => (
                <div key={item.term}><dt>{item.term}</dt><dd>{item.value}</dd></div>
              ))}
            </dl>
          </section>

          <nav className="article-toc english-toc" aria-label="Table of contents">
            <p className="article-toc-title">Table of contents</p>
            <ol>
              {toc.map(([label, id]) => (
                <li key={id}><a href={`#${id}`}>{label}</a></li>
              ))}
            </ol>
          </nav>

          <div className="article-content" dangerouslySetInnerHTML={{ __html: articleHtml }} />

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
                <strong>Return to English articles</strong>
              </Link>
            )}
          </nav>
        </article>
      </Container>

      <style>{`
        .article-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 34px;
          color: var(--muted);
          font-size: 13px;
        }
        .article-breadcrumb a:hover { color: var(--foreground); }
        .english-verification {
          display: grid;
          grid-template-columns: minmax(180px, .45fr) minmax(0, 1.55fr);
          gap: 30px;
          margin: -24px 0 52px;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 22px;
          background: var(--surface);
        }
        .english-verification h2 { margin: 7px 0 0; font-size: 20px; }
        .english-verification dl {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 24px;
          margin: 0;
        }
        .english-verification dl > div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }
        .english-verification dt { color: var(--muted); }
        .english-verification dd { margin: 0; font-weight: 650; text-align: right; }
        .english-toc { margin-bottom: 58px; }
        .english-toc ol { columns: 2; column-gap: 36px; }
        .english-toc li { break-inside: avoid; margin-bottom: 9px; }
        .article-content .table-scroll { overflow-x: auto; }
        .article-content h2, .article-content h3 { scroll-margin-top: 100px; }
        .article-content pre { overflow-x: auto; }
        @media (max-width: 760px) {
          .english-verification { grid-template-columns: 1fr; }
          .english-verification dl { grid-template-columns: 1fr; }
          .english-toc ol { columns: 1; }
        }
      `}</style>
    </main>
  );
}
