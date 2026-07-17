import Link from "next/link";

import { formatDate } from "@/lib/date";
import type { PostSummary } from "@/lib/posts";
import { tagToSlug } from "@/lib/tags";

interface PostCardProps {
  post: PostSummary;
}

export function PostCard({ post }: PostCardProps) {
  const hasVisibleUpdate =
    post.updatedAt !== undefined && post.updatedAt !== post.publishedAt;

  return (
    <article className="post-card">
      <div className="post-meta">
        <time dateTime={post.publishedAt}>
          发布于 {formatDate(post.publishedAt)}
        </time>
        {hasVisibleUpdate ? (
          <>
            <span aria-hidden="true">/</span>
            <time dateTime={post.updatedAt}>更新于 {formatDate(post.updatedAt)}</time>
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

      <div className="tag-list" aria-label="文章标签">
        {post.tags.map((tag) => (
          <Link className="tag" key={tag} href={`/tags/${tagToSlug(tag)}`}>
            {tag}
          </Link>
        ))}
      </div>
    </article>
  );
}
