import Link from "next/link";

import { Container } from "@/components/container";
import { VerifiedContentExplorer } from "@/components/verified-content-explorer";
import { createPageMetadata } from "@/lib/metadata";
import {
  getVerifiedContentSummary,
  getVerifiedContentWithEvidence,
} from "@/lib/verified-content";

import styles from "./verified.module.css";

export const metadata = createPageMetadata({
  title: "Runtime Evidence Hub | Screeps 运行证据",
  description:
    "查看已接受的 Screeps Console 与真实主循环 Runtime Evidence，并按验证级别、API、返回码和时间筛选可核对的文章结论。",
  path: "/verified",
});

export const revalidate = 300;

export default async function VerifiedPage() {
  const verifiedPosts = await getVerifiedContentWithEvidence("zh");
  const { liveCount, consoleCount } = getVerifiedContentSummary(verifiedPosts);
  const evidenceCount = verifiedPosts.reduce((total, post) => total + post.evidenceCount, 0);

  return (
    <main className="page-shell">
      <Container>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <Link href="/verification">验证方法</Link>
          <span aria-hidden="true">/</span>
          <span>Runtime Evidence Hub</span>
        </nav>

        <header className="page-header">
          <p className="eyebrow">RUNTIME EVIDENCE HUB</p>
          <h1>这条 Screeps 结论，实际跑过吗？</h1>
          <p>
            这里把文章结论和已接受的 Screeps Console / Live Runtime Evidence 连起来。你可以直接看到证据来自哪个运行级别、涉及哪个 API 和返回码、什么时候验证，以及当时记录了什么；文档核对和离线模拟不会被冒充成真实 Runtime。
          </p>
          <p>
            <Link href="/diagnostics">从症状开始诊断 →</Link>{" · "}
            <Link href="/search">搜索 API / 错误码 →</Link>{" · "}
            <Link href="/verification">了解验证边界 →</Link>
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
          <div>
            <strong>{evidenceCount}</strong>
            <span>条公开 accepted Evidence</span>
          </div>
        </section>

        {verifiedPosts.length > 0 ? (
          <VerifiedContentExplorer posts={verifiedPosts} />
        ) : (
          <section className={styles.empty}>
            <strong>当前还没有达到 Console / 真实主循环等级的公开文章。</strong>
            <p>
              真实证据可以先进入受控证据库，但只有文章的 Markdown 验证字段经过审核并明确接受对应等级后，才会出现在这里。
            </p>
          </section>
        )}
      </Container>
    </main>
  );
}
