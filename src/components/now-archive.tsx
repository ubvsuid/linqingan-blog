import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
import { formatDate } from "@/lib/date";
import { nowEntries } from "@/lib/now-entries";
import { paginateItems } from "@/lib/pagination";

interface NowArchiveProps {
  currentPage: number;
}

export function NowArchive({ currentPage }: NowArchiveProps) {
  const pagination = paginateItems(nowEntries, currentPage);

  return (
    <main className="page-shell">
      <Container className="narrow-container">
        <header className="page-header">
          <p className="eyebrow">NOW</p>
          <h1>近况</h1>
          <p>记录网站与 Screeps 内容目前正在发生什么，不写成长文章，只保留阶段性的变化。</p>
        </header>

        <div
          className="article-content now-list"
          aria-label={`近况第 ${pagination.currentPage} 页`}
        >
          {pagination.items.map((entry) => (
            <section className="now-entry" key={entry.id}>
              <time dateTime={entry.date}>{formatDate(entry.date)}</time>
              <h2>{entry.title}</h2>
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
        .now-list {
          display: grid;
          gap: 0;
        }

        .now-entry {
          position: relative;
          border-top: 1px solid var(--border);
          padding: 32px 0 46px;
        }

        .now-entry:last-child {
          border-bottom: 1px solid var(--border);
        }

        .now-entry > time {
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 12px;
        }

        .now-entry h2 {
          margin-top: 14px;
        }
      `}</style>
    </main>
  );
}
