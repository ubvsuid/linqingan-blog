import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
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
          <p className="eyebrow">NOW · JULY 2026</p>
          <h1>最近在做什么</h1>
          <p>更新于 2026 年 7 月，这个页面会随着当前重点持续变化。</p>
        </header>

        <div
          className="article-content now-list"
          aria-label={`近况第 ${pagination.currentPage} 页`}
        >
          {pagination.items.map((entry) => (
            <section className="now-entry" key={entry.id}>
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
          border-top: 1px solid var(--border);
          padding: 4px 0 42px;
        }

        .now-entry:last-child {
          border-bottom: 1px solid var(--border);
        }
      `}</style>
    </main>
  );
}