import Link from "next/link";

import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
import { PostCard } from "@/components/post-card";
import { paginateBlogPosts } from "@/lib/blog-pagination";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { getAllPosts } from "@/lib/posts";

interface BlogArchiveProps {
  currentPage: number;
}

export function BlogArchive({ currentPage }: BlogArchiveProps) {
  const allPosts = getAllPosts();
  const pagination = paginateBlogPosts(allPosts, currentPage);
  const topicArticleCount = Math.max(0, allPosts.length - beginnerSeriesSlugs.length);

  return (
    <main className="page-shell">
      <Container>
        <header className="page-header article-archive-header">
          <p className="eyebrow">WRITING</p>
          <h1>文章</h1>
          <p>
            汇总全部公开内容，包括 {beginnerSeriesSlugs.length} 篇连续的新手路线与 {topicArticleCount} 篇基础工程、运行诊断和进阶专题文章。
          </p>
        </header>

        <section className="archive-overview" aria-label="文章归档概况">
          <div>
            <span>全部文章</span>
            <strong>{allPosts.length}</strong>
          </div>
          <div>
            <span>新手路线</span>
            <strong>{beginnerSeriesSlugs.length}</strong>
          </div>
          <Link href="/beginner">按学习顺序浏览入门路线 →</Link>
        </section>

        <nav className="archive-topic-links" aria-label="按内容类型浏览">
          <span>按类型浏览</span>
          <Link href="/beginner">新手路线</Link>
          <Link href="/tags/basic-engineering">基础工程</Link>
          <Link href="/tags/common-questions">常见问题</Link>
          <Link href="/tags/debugging">错误排查</Link>
          <Link href="/tags/advanced-development">进阶开发</Link>
          <Link href="/knowledge">专题知识库</Link>
        </nav>

        <div className="post-list" aria-label={`文章第 ${currentPage} 页`}>
          {pagination.posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        <CollectionPagination
          key={pagination.currentPage}
          ariaLabel="文章分页"
          basePath="/blog"
          currentPage={pagination.currentPage}
          itemLabel="篇"
          totalItems={pagination.totalPosts}
          totalPages={pagination.totalPages}
        />
      </Container>

      <style>{`
        .article-archive-header {
          margin-bottom: 42px;
        }

        .archive-overview {
          display: grid;
          grid-template-columns: repeat(2, minmax(130px, 0.35fr)) minmax(260px, 1fr);
          gap: 16px;
          align-items: stretch;
          margin-bottom: 38px;
        }

        .archive-overview > div,
        .archive-overview > a {
          display: grid;
          align-content: center;
          min-height: 112px;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 20px 22px;
          background: var(--surface);
        }

        .archive-overview > div {
          gap: 4px;
        }

        .archive-overview span {
          color: var(--muted);
          font-size: 13px;
        }

        .archive-overview strong {
          font-size: 28px;
        }

        .archive-overview > a {
          align-items: center;
          font-weight: 680;
        }

        .archive-overview > a:hover {
          border-color: var(--muted);
          text-decoration: none;
        }

        .archive-topic-links { display: flex; flex-wrap: wrap; gap: 9px; align-items: center; margin: -14px 0 36px; }
        .archive-topic-links > span { margin-right: 4px; color: var(--muted); font-size: 12px; }
        .archive-topic-links a { border: 1px solid var(--border); border-radius: 999px; padding: 8px 12px; background: var(--surface); font-size: 12px; }
        .archive-topic-links a:hover { border-color: var(--muted); text-decoration: none; }

        @media (max-width: 700px) {
          .archive-overview {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .archive-overview > a {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </main>
  );
}
