import Link from "next/link";

import { formatDate } from "@/lib/date";
import type { PostSummary } from "@/lib/posts";
import { getPublicTagRecords, getTagArchiveHref } from "@/lib/tags";

interface PostCardProps {
  post: PostSummary;
}

export function PostCard({ post }: PostCardProps) {
  const visibleUpdatedAt =
    post.updatedAt && post.updatedAt !== post.publishedAt
      ? post.updatedAt
      : null;
  const publicTags = getPublicTagRecords();

  return (
    <article className="post-card">
      <div className="post-meta">
        <time dateTime={post.publishedAt}>
          发布于 {formatDate(post.publishedAt)}
        </time>
        {visibleUpdatedAt ? (
          <>
            <span aria-hidden="true">/</span>
            <time dateTime={visibleUpdatedAt}>
              更新于 {formatDate(visibleUpdatedAt)}
            </time>
          </>
        ) : null}
        <span aria-hidden="true">/</span>
        <span>{post.readingMinutes} 分钟</span>
        <span aria-hidden="true">/</span>
        <span>{post.category}</span>
      </div>

      <h2>
        <Link href={`/blog/${post.slug}`} prefetch={false}>{post.title}</Link>
      </h2>

      <p>{post.description}</p>

      <div className="tag-list" aria-label="文章标签">
        {post.tags.map((tag) => {
          const href = getTagArchiveHref(tag, publicTags);
          return href ? (
            <Link className="tag" key={tag} href={href} prefetch={false}>
              {tag}
            </Link>
          ) : (
            <span className="tag" key={tag}>{tag}</span>
          );
        })}
      </div>
    </article>
  );
}
