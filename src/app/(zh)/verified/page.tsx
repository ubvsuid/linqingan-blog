import Link from "next/link";

import { Container } from "@/components/container";
import { formatDate } from "@/lib/date";
import { createPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

import styles from "./verified.module.css";

export const metadata = createPageMetadata({
  title: "最近验证的 Screeps 内容",
  description: "按最近 verification.checkedAt 查看 Screeps 文章的文档核对、语法检查、Console 与真实主循环验证状态。",
  path: "/verified",
});

function levelLabel(post: ReturnType<typeof getAllPosts>[number]) {
  if (post.verification.liveTested) return "真实主循环已验证";
  if (post.verification.consoleTested) return "Screeps Console 已验证";
  if (post.verification.syntaxChecked) return "语法与文档已核对";
  if (post.verification.docsChecked) return "官方文档已核对";
  return "待进一步核对";
}

export default function VerifiedPage() {
  const posts = getAllPosts()
    .slice()
    .sort(
      (left, right) =>
        right.verification.checkedAt.localeCompare(left.verification.checkedAt)
        || right.publishedAt.localeCompare(left.publishedAt),
    );
  const runtimeVerified = posts.filter(
    (post) => post.verification.consoleTested || post.verification.liveTested,
  ).length;
  const pageUrl = `${siteConfig.url}/verified`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "最近验证的 Screeps 内容",
    description: "按最近核对日期查看站内文章当前证据等级。",
    url: pageUrl,
    inLanguage: "zh-CN",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.slice(0, 30).map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: post.title,
        url: `${siteConfig.url}/blog/${post.slug}`,
      })),
    },
  };

  return (
    <main className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Container>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <Link href="/verification">验证方法</Link>
          <span aria-hidden="true">/</span>
          <span>最近验证</span>
        </nav>

        <header className={`page-header ${styles.header}`}>
          <p className="eyebrow">RECENTLY VERIFIED</p>
          <h1>最近验证的 Screeps 内容</h1>
          <p>
            这里不把“验证”简化成一个绿色对勾，而是按文章当前记录的核对日期与证据等级展示。文档、语法、Console 和真实主循环仍然是不同强度的证据。
          </p>
          <div className={styles.stats}>
            <span><strong>{posts.length}</strong> 篇有验证记录的文章</span>
            <span><strong>{runtimeVerified}</strong> 篇包含运行环境证据</span>
            <Link href="/verification">查看验证方法 →</Link>
          </div>
        </header>

        <div className={styles.list}>
          {posts.map((post) => (
            <article key={post.slug}>
              <div className={styles.date}>
                <time dateTime={post.verification.checkedAt}>{formatDate(post.verification.checkedAt)}</time>
                <span>{levelLabel(post)}</span>
              </div>
              <div className={styles.content}>
                <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
                <p>{post.description}</p>
                <div className={styles.badges} aria-label="验证状态">
                  <span data-active={post.verification.docsChecked}>文档</span>
                  <span data-active={post.verification.syntaxChecked}>语法</span>
                  <span data-active={post.verification.consoleTested}>Console</span>
                  <span data-active={post.verification.liveTested}>主循环</span>
                </div>
                {post.verification.testedAt ? (
                  <small>
                    最近运行测试：{formatDate(post.verification.testedAt)}
                    {post.verification.testEnvironment ? ` · ${post.verification.testEnvironment}` : ""}
                  </small>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </main>
  );
}
