import Link from "next/link";

import { Container } from "@/components/container";
import { ScreepsDiagnosticCenter } from "@/components/screeps-diagnostic-center";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";

export const revalidate = 300;

export const metadata = createPageMetadata({
  title: "Screeps 故障诊断中心",
  description: "从 Creep 不移动、Spawn 不生产、Controller 快降级、Link 不传能、Market 交易失败、CPU 过高等症状开始，进入错误码、API、对象 Hub、教程、工具与验证路径。",
  path: "/diagnostics",
});

export default function DiagnosticsPage() {
  const pageUrl = `${siteConfig.url}/diagnostics`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: "Screeps 故障诊断中心", url: pageUrl, inLanguage: "zh-CN", description: "从可见游戏症状进入结构化 Screeps 故障诊断路径。", mainEntity: { "@id": `${pageUrl}#symptoms` } },
      { "@type": "ItemList", "@id": `${pageUrl}#symptoms`, numberOfItems: screepsDiagnosticSymptoms.length, itemListElement: screepsDiagnosticSymptoms.map((symptom, index) => ({ "@type": "ListItem", position: index + 1, name: symptom.zhTitle, url: `${pageUrl}#${symptom.id}` })) },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: "故障诊断中心", item: pageUrl }] },
    ],
  };

  return (
    <main className="page-shell monochrome-system-page solve-system-page diagnostics-monochrome-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="resource-breadcrumb" aria-label="面包屑"><Link href="/knowledge">知识库</Link><span aria-hidden="true">/</span><span>故障诊断中心</span></nav>
        <header className="page-header solve-system-hero">
          <p className="eyebrow">DIAGNOSTICS / SYMPTOM FIRST</p>
          <h1>Start with what you see.</h1>
          <p>从你能直接观察到的症状开始，把问题缩小到真实返回值、API、对象 Hub、教程、工具与 accepted Runtime Evidence。这里不猜隐藏状态，也不是另一份错误码字典。</p>
        </header>
        <nav className="solve-entry-switch" aria-label="选择问题解决入口">
          <Link href="/resolver#screeps-doctor"><span>01</span><strong>Have a Snapshot</strong><small>进入 Doctor，用结构化事实做只读诊断。</small></Link>
          <Link href="/resolver#problem-resolver-zh"><span>02</span><strong>Need guided checks</strong><small>进入 Resolver，按真实状态与返回值逐步排查。</small></Link>
        </nav>
        <ScreepsDiagnosticCenter locale="zh" />
      </Container>
    </main>
  );
}
