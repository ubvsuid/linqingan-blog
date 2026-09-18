import Link from "next/link";

import { Container } from "@/components/container";
import { ScreepsApiCoverageSnapshot } from "@/components/screeps-api-coverage-snapshot";
import { ScreepsApiExplorer } from "@/components/screeps-api-explorer";
import { ScreepsApiHubDirectory } from "@/components/screeps-api-hub-directory";
import { createPageMetadata } from "@/lib/metadata";
import { getLocalizedScreepsApiReference } from "@/lib/screeps-api-reference-localized";
import { siteConfig } from "@/lib/site";

import styles from "./page.module.css";

export const metadata = createPageMetadata({
  title: "Screeps API 快速查询",
  description:
    "快速查询常用 Screeps Game、Creep、Room、Structure 与系统 API，并从 Creep、Room、Spawn、Controller、Market、Link、Tower、Terminal、Lab、PathFinder 与 Store Hub 进入教程、错误码、工具和验证内容。",
  path: "/screeps-api",
});

export default function ScreepsApiPage() {
  const entries = getLocalizedScreepsApiReference("zh");
  const pageUrl = `${siteConfig.url}/screeps-api`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Screeps API 快速查询",
    description:
      "常用 Screeps Game、Creep、Room、Structure 与系统 API 的快速查询、对象 Hub 与实践入口。",
    url: pageUrl,
    inLanguage: "zh-CN",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: entries.length,
      itemListElement: entries.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: entry.signature,
        url: `${pageUrl}#${entry.id}`,
      })),
    },
  };

  return (
    <main className="page-shell monochrome-system-page screeps-api-monochrome-hub">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Container>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <span>API 快速查询</span>
        </nav>

        <header className="page-header">
          <p className="eyebrow">SCREEPS API</p>
          <h1>Know the API.</h1>
          <p>
            Screeps API 快速查询继续保留完整搜索与分组能力，但先从核心对象理解系统边界：Creep、Room、Spawn、Controller、Store、PathFinder，以及 Market、Link、Tower、Terminal 与 Lab。本站负责导航和实践解释，不替代官方 API Reference；真实动作仍应保存返回值并在后续 tick 核对状态。
          </p>
          <div className={styles.actions} aria-label="API 快速入口">
            <a href="#api-explorer-title">Search API ↓</a>
            <Link href="/screeps-errors">Error Codes →</Link>
            <a href="https://docs.screeps.com/api/" target="_blank" rel="noreferrer">
              Official Reference ↗
            </a>
          </div>
        </header>

        <ScreepsApiHubDirectory locale="zh" />
        <ScreepsApiCoverageSnapshot locale="zh" />
        <ScreepsApiExplorer entries={entries} locale="zh" />
      </Container>
    </main>
  );
}
