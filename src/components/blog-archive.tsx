import { BlogPagination } from "@/components/blog-pagination";
import { Container } from "@/components/container";
import { PostCard } from "@/components/post-card";
import { paginateBlogPosts } from "@/lib/blog-pagination";
import { getAllPosts } from "@/lib/posts";

interface BlogArchiveProps {
  currentPage: number;
}

export function BlogArchive({ currentPage }: BlogArchiveProps) {
  const pagination = paginateBlogPosts(getAllPosts(), currentPage);

  return (
    <main className="page-shell">
      <Container>
        <header className="page-header">
          <p className="eyebrow">WRITING</p>
          <h1>文章</h1>
          <p>
            关于 Screeps、JavaScript、自动化系统、网站建设和开发复盘。
          </p>
        </header>

        <div className="post-list" aria-label={`文章第 ${currentPage} 页`}>
          {pagination.posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        <BlogPagination
          key={pagination.currentPage}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalPosts={pagination.totalPosts}
        />
      </Container>

      <style>{`
        .blog-pagination {
          display: grid;
          gap: 20px;
          margin-top: 54px;
          border-top: 1px solid var(--border);
          padding-top: 30px;
        }

        .blog-pagination-row {
          display: grid;
          grid-template-columns: minmax(120px, 1fr) auto minmax(120px, 1fr);
          align-items: center;
          gap: 20px;
        }

        .blog-pagination-link {
          display: inline-flex;
          width: fit-content;
          min-height: 42px;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0 16px;
          background: var(--surface);
          font-size: 14px;
          font-weight: 650;
          transition:
            transform 160ms ease,
            border-color 160ms ease;
        }

        .blog-pagination-link:hover {
          transform: translateY(-2px);
          border-color: var(--muted);
          text-decoration: none;
        }

        .blog-pagination-next {
          justify-self: end;
        }

        .blog-pagination-disabled {
          color: var(--muted);
          cursor: not-allowed;
          opacity: 0.48;
        }

        .blog-pagination-disabled:hover {
          transform: none;
          border-color: var(--border);
        }

        .blog-pagination-summary {
          margin: 0;
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 13px;
          text-align: center;
          white-space: nowrap;
        }

        .blog-page-jump {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--muted);
          font-size: 14px;
        }

        .blog-page-input {
          width: 82px;
          min-height: 42px;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0 10px;
          background: var(--surface);
          color: var(--foreground);
          text-align: center;
          outline: none;
        }

        .blog-page-input:focus {
          border-color: var(--foreground);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--foreground) 10%, transparent);
        }

        .blog-page-submit {
          min-height: 42px;
          border: 1px solid var(--foreground);
          border-radius: 999px;
          padding: 0 18px;
          background: var(--foreground);
          color: var(--background);
          font-weight: 650;
          cursor: pointer;
          transition: transform 160ms ease;
        }

        .blog-page-submit:hover {
          transform: translateY(-2px);
        }

        .blog-page-error {
          min-height: 22px;
          margin: -10px 0 0;
          color: var(--muted);
          font-size: 13px;
          text-align: center;
        }

        @media (max-width: 640px) {
          .blog-pagination-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .blog-pagination-summary {
            grid-column: 1 / -1;
            grid-row: 1;
          }

          .blog-pagination-previous {
            grid-column: 1;
            grid-row: 2;
          }

          .blog-pagination-next {
            grid-column: 2;
            grid-row: 2;
          }

          .blog-pagination-link {
            justify-content: center;
          }
        }
      `}</style>
    </main>
  );
}
