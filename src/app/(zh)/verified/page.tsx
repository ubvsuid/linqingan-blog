import Link from "next/link";

import { Container } from "@/components/container";
import { formatDate } from "@/lib/date";
import { createPageMetadata } from "@/lib/metadata";
import {
  getVerifiedContent,
  getVerifiedContentSummary,
} from "@/lib/verified-content";

import styles from "./verified.module.css";

export const metadata = createPageMetadata({
  title: "最近验证的 Screeps 内容",
  description:
    "查看已经获得 Screeps Console 或真实主循环验证证据的文章，并区分 Console 片段验证与多 tick 真实运行验证。",
  path: "/verified",
});

export default function VerifiedPage() {
  const verifiedPosts = getVerifiedContent("zh");
  const { liveCount, consoleCount } = getVerifiedContentSummary(verifiedPosts);

  return (
    <main className="page-shell">
      <Container>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <Link href="/verification">验证方法</Link>
          <span aria-hidden="true">/</span>
          <span>最近验证</span>
        </nav>

        <header className="page-header">
          <p className="eyebrow">RECENTLY VERIFIED</p>
          <h1>最近验证的 Screeps 内容</h1>
          <p>
            这里不会把“文档核对”或“离线模拟”自动升级成真实环境验证。只有文章已经记录 Screeps Console 或真实主循环证据时，才会进入这个列表。
          </p>
        </header>

        <section className={styles.summary} aria-label="验证统计">
          <div>
            <strong>{consoleCount}</strong>
            <span>篇包含 Console 验证</span>
          </div>
          <div>
            <strong>{liveCount}</strong>
            <span>篇包含真实主循环验证</span>
          </div>
        </section>

        {verifiedPosts.length > 0 ? (
          <section className={styles.list} aria-label="已验证文章">
            {verifiedPosts.map((post) => (
              <article key={post.id}>
                <div className={styles.evidence}>
                  <strong>{post.level === "live" ? "真实主循环" : "Screeps Console"}</strong>
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  {post.testEnvironment ? <span>{post.testEnvironment}</span> : null}
                </div>
                <div>
                  <h2>
                    <Link href={post.href}>{post.title}</Link>
                  </h2>
                  <p>{post.description}</p>
                  <Link href={post.href}>查看验证状态 →</Link>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className={styles.empty}>
            <strong>当前还没有达到 Console / 真实主循环等级的公开文章。</strong>
            <p>
              页面仍然保留，因为它会直接读取文章验证字段；后续获得真实证据后会自动出现，不需要手工维护一份“已验证清单”。
            </p>
          </section>
        )}
      </Container>
    </main>
  );
}
