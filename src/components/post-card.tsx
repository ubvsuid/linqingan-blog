import Link from "next/link";

import { formatDate } from "@/lib/date";
import type { PostSummary } from "@/lib/posts";

interface PostCardProps {
  post: PostSummary;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="post-card">
      <div className="post-meta">
        <time dateTime={post.publishedAt}>
          {formatDate(post.publishedAt)}
        </time>
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
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
