import type { Metadata } from "next";

import { Container } from "@/components/container";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "文章",
  description: "Screeps、JavaScript、系统架构与网站建设文章。",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

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

        <div className="post-list">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </Container>
    </main>
  );
}
