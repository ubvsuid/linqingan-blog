import Link from "next/link";

import { Container } from "@/components/container";
import { ScreepsApiExplorer } from "@/components/screeps-api-explorer";
import { ScreepsApiHubDirectory } from "@/components/screeps-api-hub-directory";
import { createPageMetadata } from "@/lib/metadata";
import { getLocalizedScreepsApiReference } from "@/lib/screeps-api-reference-localized";
import { siteConfig } from "@/lib/site";

import styles from "./page.module.css";

export const metadata = createPageMetadata({
  title: "Screeps API 快速查询",
  description:
    "快速查询常用 Screeps Game、Creep、Room、Structure 与系统 API，并从 Creep、Room、StructureSpawn、Controller、Market 对象 Hub 继续进入教程、错误码、工具和验证内容。",
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
      "常用 Screeps Game、Creep、Room、Structure 与系统 API 的快速查询和对象 Hub 入口。",
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
    <main className="page-shell">
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
          <p className="eyebrow">API QUICK REFERENCE</p>
          <h1>Screeps API 快速查询</h1>
          <p>
            用对象名、方法名或关键词快速定位常用 API；如果已经知道自己在处理 Creep、Room、Spawn、Controller 或 Market，可以先进入对象 Hub。这里负责导航和概念提醒，不替代官方 API Reference；涉及真实动作时，仍应保存返回值并在后续 tick 核对状态。
          </p>
          <div className="button-row">
            <a
              className="button button-secondary"
              href="https://docs.screeps.com/api/"
              target="_blank"
              rel="noreferrer"
            >
              打开官方 API Reference ↗
            </a>
            <Link className="button button-secondary" href="/screeps-errors">
              查询错误码
            </Link>
          </div>
        </header>

        <ScreepsApiHubDirectory locale="zh" />
        <ScreepsApiExplorer entries={entries} locale="zh" />
      </Container>
    </main>
  );
}
