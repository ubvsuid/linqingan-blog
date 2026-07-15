import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { PostCard } from "@/components/post-card";
import { getFeaturedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const posts = getFeaturedPosts(3);

  return (
    <main>
      <section className="hero">
        <Container>
          <p className="eyebrow">LIN QINGAN · DIGITAL GARDEN</p>
          <h1>
            构建，运行
            <br />
            迭代
          </h1>
          <p className="hero-description">Screeps 与系统实践。</p>
          <div className="button-row">
            <Link className="button button-primary" href="/blog">
              阅读文章
            </Link>
            <Link className="button button-secondary" href="/projects">
              查看项目
            </Link>
          </div>
        </Container>
      </section>

      <Container>
        <section className="status-panel" aria-labelledby="current-project">
          <div>
            <p className="eyebrow">CURRENT PROJECT</p>
            <h2 id="current-project">Screeps Contract Kernel V7.3</h2>
            <p>
              围绕任务调度、房间经济、资源预算和市场补能构建的 Screeps
              自动化系统，当前目标是稳定冲击 RCL8。
            </p>
          </div>
          <dl className="status-grid">
            <div>
              <dt>版本</dt>
              <dd>V7.3</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>持续开发</dd>
            </div>
            <div>
              <dt>当前重点</dt>
              <dd>市场补能与 RCL8</dd>
            </div>
          </dl>
        </section>

        <section className="home-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FEATURED WRITING</p>
              <h2>精选文章</h2>
            </div>
            <Link className="text-link" href="/blog">
              全部文章 →
            </Link>
          </div>

          <div className="post-grid">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        <section className="principles">
          <p className="eyebrow">WHAT I WRITE ABOUT</p>
          <div className="principle-grid">
            <article>
              <span>01</span>
              <h2>Screeps 自动化</h2>
              <p>从基础概念到房间运营，解释代码如何在长期世界中持续工作。</p>
            </article>
            <article>
              <span>02</span>
              <h2>真实工程记录</h2>
              <p>保留设计选择、失败原因、性能问题和版本迭代，而不只展示结果。</p>
            </article>
            <article>
              <span>03</span>
              <h2>新手友好写作</h2>
              <p>先解决当前会遇到的问题，再把复杂架构留给单独的进阶文章。</p>
            </article>
          </div>
        </section>
      </Container>
    </main>
  );
}
