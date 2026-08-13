import Link from "next/link";

import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
import { PostCard } from "@/components/post-card";
import { RecentlyViewedArticles } from "@/components/recently-viewed-articles";
import { paginateBlogPosts } from "@/lib/blog-pagination";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { getAllPosts } from "@/lib/posts";

import styles from "./blog-archive.module.css";

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
        <header className={`page-header ${styles.header}`}>
          <p className="eyebrow">WRITING</p>
          <h1>文章</h1>
          <p>
            汇总全部公开内容，包括 {beginnerSeriesSlugs.length} 篇连续的新手路线与 {topicArticleCount} 篇基础工程、运行诊断和进阶专题文章。
          </p>
        </header>

        <section className={styles.overview} aria-label="文章归档概况">
          <div><span>全部文章</span><strong>{allPosts.length}</strong></div>
          <div><span>新手路线</span><strong>{beginnerSeriesSlugs.length}</strong></div>
          <Link href="/beginner">按学习顺序浏览入门路线 →</Link>
        </section>

        <nav className={styles.topicLinks} aria-label="按内容类型浏览">
          <span>按类型浏览</span>
          <Link href="/beginner">新手路线</Link>
          <Link href="/tags/basic-engineering">基础工程</Link>
          <Link href="/tags/common-questions">常见问题</Link>
          <Link href="/tags/debugging">错误排查</Link>
          <Link href="/tags/advanced-development">进阶开发</Link>
          <Link href="/knowledge">专题知识库</Link>
        </nav>

        <RecentlyViewedArticles />

        <div className="post-list" aria-label={`文章第 ${currentPage} 页`}>
          {pagination.posts.map((post) => <PostCard key={post.slug} post={post} />)}
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
    </main>
  );
}
