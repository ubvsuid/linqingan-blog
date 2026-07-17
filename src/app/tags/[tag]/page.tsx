import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/container";
import { createPageMetadata } from "@/lib/metadata";
import { getPostsForTag, getTagRecord, getTagRecords } from "@/lib/tags";

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
  });
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" });

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const record = getTagRecord(tag);
  if (!record) notFound();
  const posts = getPostsForTag(record.slug);

  return (
    <main className="page-shell tag-page">
      <Container>
        <nav className="tag-breadcrumb" aria-label="面包屑"><Link href="/tags">文章标签</Link><span aria-hidden="true">/</span><span>{record.name}</span></nav>
        <header className="page-header"><p className="eyebrow">TAG</p><h1>{record.name}</h1><p>当前共有 {posts.length} 篇文章使用这个标签。</p></header>
        <div className="tag-post-list">
          {posts.map((post) => (
            <article key={post.slug}>
              <div className="tag-post-meta"><time dateTime={post.publishedAt}>{dateFormatter.format(new Date(`${post.publishedAt}T00:00:00`))}</time><span aria-hidden="true">/</span><span>{post.readingMinutes} 分钟</span><span aria-hidden="true">/</span><span>{post.category}</span></div>
              <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
              <p>{post.description}</p>
              <div className="tag-post-tags">{post.tags.map((item) => <span key={item}>{item}</span>)}</div>
            </article>
          ))}
        </div>
      </Container>
      <style>{`
        .tag-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .tag-post-list { display: grid; border-top: 1px solid var(--border); }
        .tag-post-list article { border-bottom: 1px solid var(--border); padding: 30px 0; }
        .tag-post-meta { display: flex; flex-wrap: wrap; gap: 8px; color: var(--muted); font-size: 12px; }
        .tag-post-list h2 { margin: 13px 0 0; font-size: clamp(23px, 3vw, 32px); }
        .tag-post-list p { max-width: 780px; margin: 12px 0 0; color: var(--muted); line-height: 1.75; }
        .tag-post-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 18px; }
        .tag-post-tags span { border: 1px solid var(--border); border-radius: 999px; padding: 5px 10px; color: var(--muted); font-size: 11px; }
      `}</style>
    </main>
  );
}
