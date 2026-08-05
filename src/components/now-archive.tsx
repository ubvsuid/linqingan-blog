import Link from "next/link";

import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
import { formatDate } from "@/lib/date";
import { nowEntries } from "@/lib/now-entries";
import { paginateItems } from "@/lib/pagination";
import { getRecentSiteActivity, getSiteStatus } from "@/lib/site-status";

interface NowArchiveProps {
  currentPage: number;
}

export function NowArchive({ currentPage }: NowArchiveProps) {
  const pagination = paginateItems(nowEntries, currentPage);
  const status = getSiteStatus();
  const recentActivity = getRecentSiteActivity(3);

  return (
    <main className="page-shell now-page">
      <Container className="narrow-container">
        <header className="page-header now-header">
          <p className="eyebrow">NOW</p>
          <h1>近况</h1>
          <p>记录我现在正在推进的事情，以及这个网站最近发生的重要变化。</p>
        </header>

        {currentPage === 1 ? (
          <>
            <section className="now-status" aria-label="网站当前公开状态">
              <div><strong>{status.articleCount}</strong><span>篇公开文章</span></div>
              <div><strong>{status.knowledgeSectionCount}</strong><span>个知识模块</span></div>
              <div><strong>{status.toolCount}</strong><span>个在线工具</span></div>
              <div>
                <strong>{status.latestContentDate ? formatDate(status.latestContentDate) : "—"}</strong>
                <span>最近内容变更</span>
              </div>
            </section>

            <section className="now-changelog" aria-labelledby="now-changelog-title">
              <div className="now-changelog-heading">
                <div>
                  <p className="eyebrow">LIVE ACTIVITY</p>
                  <h2 id="now-changelog-title">最近变化</h2>
                </div>
                {status.latestActivityDate ? (
                  <span>最近更新于 {formatDate(status.latestActivityDate)}</span>
                ) : null}
              </div>
              <p className="now-changelog-description">
                这里会自动合并文章发布、文章修订与手工记录的网站更新，避免近况日期落后于实际内容。
              </p>
              <div className="now-changelog-preview">
                {recentActivity.map((entry) => (
                  <article key={entry.id}>
                    <span>{entry.type}</span>
                    <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                    <h3>
                      {entry.href ? <Link href={entry.href}>{entry.title}</Link> : entry.title}
                    </h3>
                  </article>
                ))}
              </div>
              <Link className="now-changelog-link" href="/changelog">
                查看完整更新日志 →
              </Link>
            </section>
          </>
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
        .now-status { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 48px; border: 1px solid var(--border); border-radius: 20px; background: var(--surface); overflow: hidden; }
        .now-status > div { display: grid; gap: 7px; padding: 22px; }
        .now-status > div + div { border-left: 1px solid var(--border); }
        .now-status strong { font-size: clamp(22px, 3vw, 31px); letter-spacing: -.035em; }
        .now-status span { color: var(--muted); font-size: 12px; }
        .now-changelog { margin-top: 28px; border: 1px solid var(--border); border-radius: 24px; padding: 30px; background: var(--surface); }
        .now-changelog-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
        .now-changelog-heading h2, .now-history-heading h2 { margin: 8px 0 0; font-size: clamp(31px, 5vw, 44px); letter-spacing: -.04em; }
        .now-changelog-heading > span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; }
        .now-changelog-description { max-width: 680px; margin: 20px 0 0; color: var(--muted); line-height: 1.75; }
        .now-changelog-preview { display: grid; margin-top: 28px; border-top: 1px solid var(--border); }
        .now-changelog-preview article { display: grid; grid-template-columns: 54px 108px minmax(0, 1fr); gap: 14px; align-items: center; border-bottom: 1px solid var(--border); padding: 18px 0; }
        .now-changelog-preview article > span { color: var(--muted); font-size: 12px; }
        .now-changelog-preview time { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 11px; }
        .now-changelog-preview h3 { margin: 0; font-size: 17px; }
        .now-changelog-preview h3 a { color: inherit; }
        .now-changelog-link { display: inline-flex; margin-top: 24px; font-weight: 750; }
        .now-history { margin-top: 78px; }
        .now-history-heading { padding-bottom: 28px; }
        .now-list { display: grid; gap: 0; }
        .now-entry { position: relative; border-top: 1px solid var(--border); padding: 32px 0 46px; }
        .now-entry:last-child { border-bottom: 1px solid var(--border); }
        .now-entry > time { color: var(--muted); font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: 12px; }
        .now-entry h3 { margin-top: 14px; font-size: clamp(24px, 4vw, 32px); }
        @media (max-width: 760px) {
          .now-status { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .now-status > div + div { border-left: 0; }
          .now-status > div:nth-child(even) { border-left: 1px solid var(--border); }
          .now-status > div:nth-child(n + 3) { border-top: 1px solid var(--border); }
        }
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
