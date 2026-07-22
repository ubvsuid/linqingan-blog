import Link from "next/link";

import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
import { changelogEntries } from "@/lib/changelog";
import { formatDate } from "@/lib/date";
import { nowEntries } from "@/lib/now-entries";
import { paginateItems } from "@/lib/pagination";

interface NowArchiveProps {
  currentPage: number;
}

export function NowArchive({ currentPage }: NowArchiveProps) {
  const pagination = paginateItems(nowEntries, currentPage);
  const recentChanges = changelogEntries.slice(0, 3);
  const latestChangeDate = changelogEntries[0]?.date;

  return (
    <main className="page-shell now-page">
      <Container className="narrow-container">
        <header className="page-header now-header">
          <p className="eyebrow">NOW</p>
          <h1>近况</h1>
          <p>记录我现在正在推进的事情，以及这个网站最近发生的重要变化。</p>
        </header>

        {currentPage === 1 ? (
          <section className="now-changelog" aria-labelledby="now-changelog-title">
            <div className="now-changelog-heading">
              <div>
                <p className="eyebrow">CHANGELOG</p>
                <h2 id="now-changelog-title">更新日志</h2>
              </div>
              {latestChangeDate ? (
                <span>最近更新于 {formatDate(latestChangeDate)}</span>
              ) : null}
            </div>
            <p className="now-changelog-description">
              记录网站、文章、工具、SEO 和验证流程中的具体变化。这里会比近况页更新得更频繁。
            </p>
            <div className="now-changelog-preview">
              {recentChanges.map((entry) => (
                <article key={entry.id}>
                  <span>{entry.type}</span>
                  <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                  <h3>{entry.title}</h3>
                </article>
              ))}
            </div>
            <Link className="now-changelog-link" href="/changelog">
              查看完整更新日志 →
            </Link>
          </section>
        ) : null}

        <section className="now-history" aria-labelledby="now-history-title">
          <div className="now-history-heading">
            <p className="eyebrow">MILESTONES</p>
            <h2 id="now-history-title">阶段性记录</h2>
          </div>

          <div
            className="article-content now-list"
            aria-label={`近况第 ${pagination.currentPage} 页`}
          >
            {pagination.items.map((entry) => (
              <section className="now-entry" key={entry.id}>
                <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                <h3>{entry.title}</h3>
                {entry.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {entry.bullets ? (
                  <ul>
                    {entry.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </section>

        <CollectionPagination
          key={pagination.currentPage}
          ariaLabel="近况分页"
          basePath="/now"
          currentPage={pagination.currentPage}
          itemLabel="条近况"
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
        />
      </Container>

      <style>{`
        .now-header { max-width: 820px; }
        .now-changelog { margin-top: 68px; border: 1px solid var(--border); border-radius: 24px; padding: 30px; background: var(--surface); }
        .now-changelog-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
        .now-changelog-heading h2, .now-history-heading h2 { margin: 8px 0 0; font-size: clamp(31px, 5vw, 44px); letter-spacing: -.04em; }
        .now-changelog-heading > span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; }
        .now-changelog-description { max-width: 680px; margin: 20px 0 0; color: var(--muted); line-height: 1.75; }
        .now-changelog-preview { display: grid; margin-top: 28px; border-top: 1px solid var(--border); }
        .now-changelog-preview article { display: grid; grid-template-columns: 54px 108px minmax(0, 1fr); gap: 14px; align-items: center; border-bottom: 1px solid var(--border); padding: 18px 0; }
        .now-changelog-preview article > span { color: var(--muted); font-size: 12px; }
        .now-changelog-preview time { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 11px; }
        .now-changelog-preview h3 { margin: 0; font-size: 17px; }
        .now-changelog-link { display: inline-flex; margin-top: 24px; font-weight: 750; }
        .now-history { margin-top: 78px; }
        .now-history-heading { padding-bottom: 28px; }
        .now-list { display: grid; gap: 0; }
        .now-entry { position: relative; border-top: 1px solid var(--border); padding: 32px 0 46px; }
        .now-entry:last-child { border-bottom: 1px solid var(--border); }
        .now-entry > time { color: var(--muted); font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: 12px; }
        .now-entry h3 { margin-top: 14px; font-size: clamp(24px, 4vw, 32px); }
        @media (max-width: 620px) {
          .now-changelog { padding: 24px 20px; }
          .now-changelog-heading { align-items: flex-start; flex-direction: column; gap: 12px; }
          .now-changelog-preview article { grid-template-columns: 52px minmax(0, 1fr); gap: 8px 12px; }
          .now-changelog-preview time { grid-column: 2; grid-row: 1; }
          .now-changelog-preview h3 { grid-column: 1 / -1; }
        }
      `}</style>
    </main>
  );
}
