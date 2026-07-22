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
  const pagination = paginateItems(
    changelogEntries,
    currentPage,
    CHANGELOG_ITEMS_PER_PAGE,
  );
  const groupedEntries = groupEntriesByDate(pagination.items);
  const latestDate = changelogEntries[0]?.date;

  return (
    <main className="page-shell changelog-page">
      <Container>
        <nav className="changelog-breadcrumb" aria-label="面包屑">
          <Link href="/now">近况</Link>
          <span aria-hidden="true">/</span>
          <span>更新日志</span>
        </nav>

        <header className="page-header changelog-header">
          <p className="eyebrow">CHANGELOG</p>
          <h1>更新日志</h1>
          <p>记录网站、内容、工具、SEO 和验证流程中的具体变化。</p>
          <div className="changelog-summary" aria-label="更新日志统计">
            <span>{changelogEntries.length} 条公开记录</span>
            {latestDate ? <span>最近更新于 {formatDate(latestDate)}</span> : null}
          </div>
        </header>

        <div
          className="changelog-groups"
          aria-label={`更新日志第 ${pagination.currentPage} 页`}
        >
          {groupedEntries.map(([date, entries]) => (
            <section className="changelog-day" key={date}>
              <div className="changelog-date">
                <time dateTime={date}>{formatDate(date)}</time>
              </div>
              <div className="changelog-day-entries">
                {entries.map((entry) => (
                  <article className="changelog-entry" key={entry.id}>
                    <span className={`changelog-type changelog-type-${entry.type}`}>
                      {entry.type}
                    </span>
                    <div>
                      <h2>{entry.title}</h2>
                      <p>{entry.summary}</p>
                      {entry.links?.length ? (
                        <div className="changelog-links" aria-label="相关页面">
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

      <style>{`
        .changelog-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .changelog-header { max-width: 900px; }
        .changelog-summary { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 24px; color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; }
        .changelog-groups { display: grid; margin-top: 76px; border-top: 1px solid var(--border); }
        .changelog-day { display: grid; grid-template-columns: minmax(150px, .42fr) minmax(0, 1.58fr); gap: 48px; border-bottom: 1px solid var(--border); padding: 46px 0 52px; }
        .changelog-date time { position: sticky; top: 24px; color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 13px; }
        .changelog-day-entries { display: grid; }
        .changelog-entry { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 22px; padding: 0 0 30px; }
        .changelog-entry + .changelog-entry { border-top: 1px solid var(--border); padding-top: 30px; }
        .changelog-entry:last-child { padding-bottom: 0; }
        .changelog-type { display: inline-flex; width: fit-content; height: 28px; align-items: center; border: 1px solid var(--border); border-radius: 999px; padding: 0 10px; background: var(--surface); color: var(--muted); font-size: 12px; }
        .changelog-entry h2 { margin: 0; font-size: clamp(21px, 3vw, 28px); letter-spacing: -.025em; }
        .changelog-entry p { max-width: 780px; margin: 11px 0 0; color: var(--muted); line-height: 1.75; }
        .changelog-links { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 17px; }
        .changelog-links a { font-size: 14px; font-weight: 700; }
        @media (max-width: 760px) {
          .changelog-groups { margin-top: 54px; }
          .changelog-day { grid-template-columns: 1fr; gap: 24px; padding: 36px 0 42px; }
          .changelog-date time { position: static; }
        }
        @media (max-width: 520px) {
          .changelog-entry { grid-template-columns: 1fr; gap: 13px; }
        }
      `}</style>
    </main>
  );
}
