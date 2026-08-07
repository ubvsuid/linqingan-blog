import Link from "next/link";

import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
import {
  CHANGELOG_ITEMS_PER_PAGE,
  changelogEntries,
  type ChangelogEntry,
} from "@/lib/changelog";
import { formatDate } from "@/lib/date";
import { paginateItems } from "@/lib/pagination";
import { latestSiteAuditEntry } from "@/lib/site-audit-entry";

import styles from "./changelog-archive.module.css";

interface ChangelogArchiveProps {
  currentPage: number;
}

function groupEntriesByDate(entries: ChangelogEntry[]) {
  const groups = new Map<string, ChangelogEntry[]>();

  for (const entry of entries) {
    const current = groups.get(entry.date) ?? [];
    current.push(entry);
    groups.set(entry.date, current);
  }

  return [...groups.entries()];
}

export function ChangelogArchive({ currentPage }: ChangelogArchiveProps) {
  const allEntries = [latestSiteAuditEntry, ...changelogEntries];
  const pagination = paginateItems(
    allEntries,
    currentPage,
    CHANGELOG_ITEMS_PER_PAGE,
  );
  const groupedEntries = groupEntriesByDate(pagination.items);
  const latestDate = allEntries[0]?.date;

  return (
    <main className="page-shell changelog-page">
      <Container>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/now">近况</Link>
          <span aria-hidden="true">/</span>
          <span>更新日志</span>
        </nav>

        <header className={`page-header ${styles.header}`}>
          <p className="eyebrow">CHANGELOG</p>
          <h1>更新日志</h1>
          <p>记录网站、内容、工具、SEO 和验证流程中的具体变化。</p>
          <div className={styles.summary} aria-label="更新日志统计">
            <span>{allEntries.length} 条公开记录</span>
            {latestDate ? <span>最近更新于 {formatDate(latestDate)}</span> : null}
          </div>
        </header>

        <div className={styles.groups} aria-label={`更新日志第 ${pagination.currentPage} 页`}>
          {groupedEntries.map(([date, entries]) => (
            <section className={styles.day} key={date}>
              <div className={styles.date}>
                <time dateTime={date}>{formatDate(date)}</time>
              </div>
              <div className={styles.entries}>
                {entries.map((entry) => (
                  <article className={styles.entry} key={entry.id}>
                    <span className={styles.type}>{entry.type}</span>
                    <div>
                      <h2>{entry.title}</h2>
                      <p>{entry.summary}</p>
                      {entry.links?.length ? (
                        <div className={styles.links} aria-label="相关页面">
                          {entry.links.map((link) => (
                            <Link href={link.href} key={`${entry.id}-${link.href}`}>
                              {link.label} →
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <CollectionPagination
          key={pagination.currentPage}
          ariaLabel="更新日志分页"
          basePath="/changelog"
          currentPage={pagination.currentPage}
          itemLabel="条更新"
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
        />
      </Container>
    </main>
  );
}
