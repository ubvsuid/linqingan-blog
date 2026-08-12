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
  title: "最近验证的 Screeps 内容",
  description:
    "查看已经获得 Screeps Console 或真实主循环验证证据的文章，并按验证级别、API 和返回码筛选受控 Runtime Evidence。",
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
          <span>最近验证</span>
        </nav>

        <header className="page-header">
          <p className="eyebrow">RECENTLY VERIFIED</p>
          <h1>最近验证的 Screeps 内容</h1>
          <p>
            这里不会把“文档核对”或“离线模拟”自动升级成真实环境验证。只有文章验证字段已经明确接受 Screeps Console 或真实主循环证据时，才会进入这个列表；结构化证据只负责补充可核对的运行细节。
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
