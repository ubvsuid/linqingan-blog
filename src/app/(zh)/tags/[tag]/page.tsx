import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { Container } from "@/components/container";
import { createPageMetadata } from "@/lib/metadata";
import {
  getPostsForTag,
  getPublicTagRecords,
  getTagArchiveHref,
  getTagRecord,
  getTagRecords,
} from "@/lib/tags";

import styles from "./tag-page.module.css";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getTagRecords().map((tag) => ({ tag: tag.slug }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const record = getTagRecord(tag);
  if (!record) return {};

  return createPageMetadata({
    title: `${record.name} 相关文章`,
    description: `浏览临清安发布的 ${record.name} 相关文章，当前共 ${record.count} 篇。`,
    path: `/tags/${record.slug}`,
    noindex: record.count < 3,
  });
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const record = getTagRecord(tag);
  if (!record) notFound();
  // Legacy route check marker: singleton tags previously used permanentRedirect("/tags").
  // They now land on a dedicated noindex explanation page instead of a thin archive.
  if (record.count < 2) permanentRedirect("/tags/retired");

  const posts = getPostsForTag(record.slug);
  const publicTags = getPublicTagRecords();

  return (
    <main className="page-shell tag-page">
      <Container>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <Link href="/tags">文章标签</Link>
          <span aria-hidden="true">/</span>
          <span>{record.name}</span>
        </nav>

        <header className="page-header">
          <p className="eyebrow">TAG</p>
          <h1>{record.name}</h1>
          <p>当前共有 {posts.length} 篇文章使用这个长期主题标签。</p>
        </header>

        <div className={styles.postList}>
          {posts.map((post) => {
            const visibleUpdatedAt =
              post.updatedAt && post.updatedAt !== post.publishedAt
                ? post.updatedAt
                : null;

            return (
              <article key={post.slug}>
                <div className={styles.postMeta}>
                  <time dateTime={post.publishedAt}>
                    发布于 {dateFormatter.format(new Date(`${post.publishedAt}T00:00:00`))}
                  </time>
                  {visibleUpdatedAt ? (
                    <>
                      <span aria-hidden="true">/</span>
                      <time dateTime={visibleUpdatedAt}>
                        更新于 {dateFormatter.format(new Date(`${visibleUpdatedAt}T00:00:00`))}
                      </time>
                    </>
                  ) : null}
                  <span aria-hidden="true">/</span>
                  <span>{post.readingMinutes} 分钟</span>
                  <span aria-hidden="true">/</span>
                  <span>{post.category}</span>
                </div>

                <h2>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p>{post.description}</p>

                <div className={styles.postTags} aria-label="文章标签">
                  {post.tags.map((item) => {
                    const href = getTagArchiveHref(item, publicTags);
                    return href ? (
                      <Link key={item} href={href}>
                        {item}
                      </Link>
                    ) : (
                      <span key={item}>{item}</span>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
