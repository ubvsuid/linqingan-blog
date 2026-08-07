import Link from "next/link";

import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
import { changelogEntries } from "@/lib/changelog";
import { formatDate } from "@/lib/date";
import { nowEntries } from "@/lib/now-entries";
import { paginateItems } from "@/lib/pagination";
import { getRecentSiteActivity, getSiteStatus } from "@/lib/site-status";

import styles from "./now-archive.module.css";

interface NowArchiveProps {
  currentPage: number;
}

export function NowArchive({ currentPage }: NowArchiveProps) {
  const pagination = paginateItems(nowEntries, currentPage);
  const status = getSiteStatus();
  const recentActivityLimit = Math.max(3, changelogEntries.slice(0, 3).length);
  const recentActivity = getRecentSiteActivity(recentActivityLimit);

  return (
    <main className="page-shell now-page">
      <Container className="narrow-container">
        <header className={`page-header ${styles.header}`}>
          <p className="eyebrow">NOW</p>
          <h1>近况</h1>
          <p>记录我现在正在推进的事情，以及这个网站最近发生的重要变化。</p>
        </header>

        {currentPage === 1 ? (
          <>
            <section className={styles.status} aria-label="网站当前公开状态">
              <div><strong>{status.articleCount}</strong><span>篇公开文章</span></div>
              <div><strong>{status.knowledgeSectionCount}</strong><span>个知识模块</span></div>
              <div><strong>{status.toolCount}</strong><span>个在线工具</span></div>
              <div>
                <strong>{status.latestPublishedDate ? formatDate(status.latestPublishedDate) : "—"}</strong>
                <span>最近文章发布</span>
              </div>
            </section>

            <section className={styles.changelog} aria-labelledby="now-changelog-title">
              <div className={styles.changelogHeading}>
                <div>
                  <p className="eyebrow">LIVE ACTIVITY</p>
                  <h2 id="now-changelog-title">最近变化</h2>
                </div>
                {status.latestActivityDate ? (
                  <span>最近更新于 {formatDate(status.latestActivityDate)}</span>
                ) : null}
              </div>
              <p className={styles.changelogDescription}>
                这里会自动合并文章发布、文章修订与手工记录的网站更新，避免近况日期落后于实际内容。
              </p>
              <div className={styles.changelogPreview}>
                {recentActivity.map((entry) => (
                  <article key={entry.id}>
                    <span>{entry.type}</span>
                    <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                    <h3>{entry.href ? <Link href={entry.href}>{entry.title}</Link> : entry.title}</h3>
                  </article>
                ))}
              </div>
              <Link className={styles.changelogLink} href="/changelog">
                查看完整更新日志 →
              </Link>
            </section>
          </>
        ) : null}

        <section className={styles.history} aria-labelledby="now-history-title">
          <div className={styles.historyHeading}>
            <p className="eyebrow">MILESTONES</p>
            <h2 id="now-history-title">阶段性记录</h2>
          </div>

          <div className={`article-content ${styles.list}`} aria-label={`近况第 ${pagination.currentPage} 页`}>
            {pagination.items.map((entry) => (
              <section className={styles.entry} key={entry.id}>
                <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                <h3>{entry.title}</h3>
                {entry.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {entry.bullets ? (
                  <ul>{entry.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
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
    </main>
  );
}
