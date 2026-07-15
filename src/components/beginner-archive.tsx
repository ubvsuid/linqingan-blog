import Link from "next/link";

import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import {
  DEFAULT_ITEMS_PER_PAGE,
  paginateItems,
} from "@/lib/pagination";
import { getAllPosts } from "@/lib/posts";

interface BeginnerArchiveProps {
  currentPage: number;
}

export function BeginnerArchive({ currentPage }: BeginnerArchiveProps) {
  const allPosts = getAllPosts();
  const posts = beginnerSeriesSlugs.flatMap((slug) => {
    const post = allPosts.find((item) => item.slug === slug);
    return post ? [post] : [];
  });
  const pagination = paginateItems(posts, currentPage);
  const firstItemIndex =
    (pagination.currentPage - 1) * DEFAULT_ITEMS_PER_PAGE;

  return (
    <main className="page-shell beginner-page">
      <Container>
        <header className="page-header beginner-header">
          <p className="eyebrow">SCREEPS BEGINNER</p>
          <h1>Screeps 新手入门</h1>
          <p>
            从认识游戏开始，按顺序完成界面、tick、移动、采集和运输。
            每篇只解决一个问题。
          </p>
        </header>

        <div
          className="beginner-list"
          aria-label={`Screeps 新手入门第 ${pagination.currentPage} 页`}
        >
          {pagination.items.map((post, index) => (
            <Link
              className="beginner-item"
              href={`/blog/${post.slug}`}
              key={post.slug}
            >
              <span className="beginner-number">
                {String(firstItemIndex + index + 1).padStart(2, "0")}
              </span>
              <span className="beginner-copy">
                <strong>{post.title}</strong>
                <span>{post.description}</span>
              </span>
              <span className="beginner-meta">
                {post.readingMinutes} 分钟 <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>

        <CollectionPagination
          key={pagination.currentPage}
          ariaLabel="Screeps 新手入门分页"
          basePath="/beginner"
          currentPage={pagination.currentPage}
          itemLabel="篇"
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
        />
      </Container>

      <style>{`
        .beginner-header {
          max-width: 900px;
        }

        .beginner-list {
          border-top: 1px solid var(--border);
        }

        .beginner-item {
          display: grid;
          grid-template-columns: 70px minmax(0, 1fr) auto;
          gap: 28px;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding: 30px 4px;
          transition:
            padding 180ms ease,
            background-color 180ms ease;
        }

        .beginner-item:hover {
          padding-inline: 18px;
          background: var(--surface);
          text-decoration: none;
        }

        .beginner-number,
        .beginner-meta {
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 12px;
        }

        .beginner-copy {
          display: grid;
          gap: 10px;
        }

        .beginner-copy strong {
          font-size: clamp(24px, 3.4vw, 38px);
          line-height: 1.2;
          letter-spacing: -0.04em;
        }

        .beginner-copy > span {
          max-width: 760px;
          color: var(--muted);
          line-height: 1.7;
        }

        .beginner-meta {
          white-space: nowrap;
        }

        @media (max-width: 760px) {
          .beginner-item {
            grid-template-columns: 44px minmax(0, 1fr);
            gap: 16px;
            padding-block: 24px;
          }

          .beginner-meta {
            grid-column: 2;
          }
        }
      `}</style>
    </main>
  );
}