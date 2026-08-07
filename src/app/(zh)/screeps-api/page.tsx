import Link from "next/link";

import { Container } from "@/components/container";
import { ScreepsApiReferenceBrowser } from "@/components/screeps-api-reference-browser";
import { createPageMetadata } from "@/lib/metadata";
import { screepsApiReference, screepsApiReferenceGroups } from "@/lib/screeps-api-reference";
import { siteConfig } from "@/lib/site";

import styles from "./screeps-api.module.css";

export const metadata = createPageMetadata({
  title: "Screeps API 快速查询",
  description: "快速查询常用 Screeps Game、Room、Creep、Spawn、Structure 与 Market API，并跳转到站内对应指南。",
  path: "/screeps-api",
});

export default function ScreepsApiPage() {
  const pageUrl = `${siteConfig.url}/screeps-api`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Screeps API 快速查询",
    description: "常用 Screeps API 的调用形式、用途与站内指南入口。",
    url: pageUrl,
    inLanguage: "zh-CN",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: screepsApiReference.length,
      itemListElement: screepsApiReference.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${entry.object}.${entry.method}`,
        url: entry.guideHref ? `${siteConfig.url}${entry.guideHref}` : pageUrl,
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
          <span>API 快速查询</span>
        </nav>

        <header className={`page-header ${styles.header}`}>
          <p className="eyebrow">API QUICK REFERENCE</p>
          <h1>Screeps API 快速查询</h1>
          <p>
            用对象名、方法名或用途快速定位本站最常用的 Screeps API。这里是查询入口，不替代官方完整 API 文档；需要边界、返回码和代码示例时继续进入对应站内指南。
          </p>
          <div className={styles.meta}>
            <span><strong>{screepsApiReference.length}</strong> 个常用 API</span>
            <span><strong>{screepsApiReferenceGroups.length}</strong> 个对象分组</span>
            <Link href="/screeps-errors">错误码查询 →</Link>
          </div>
        </header>

        <ScreepsApiReferenceBrowser
          entries={screepsApiReference}
          groups={screepsApiReferenceGroups}
        />

        <footer className={styles.footer}>
          <p>找不到方法时，可以继续使用站内搜索查询对象名、错误码或具体问题。</p>
          <Link href="/search?q=API">搜索全部 API 相关内容 →</Link>
        </footer>
      </Container>
    </main>
  );
}
