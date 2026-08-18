import Link from "next/link";

import { Container } from "@/components/container";
import { ScreepsDiagnosticCenter } from "@/components/screeps-diagnostic-center";
import {
  chineseDiagnosticDetailIds,
  getChineseDiagnosticDetailSymptom,
} from "@/lib/screeps-diagnostic-detail-pages";
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
      {
        "@type": "CollectionPage",
        name: "Screeps 故障诊断中心",
        url: pageUrl,
        inLanguage: "zh-CN",
        description: "从可见游戏症状进入结构化 Screeps 故障诊断路径。",
        mainEntity: { "@id": `${pageUrl}#symptoms` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#symptoms`,
        numberOfItems: screepsDiagnosticSymptoms.length,
        itemListElement: screepsDiagnosticSymptoms.map((symptom, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: symptom.zhTitle,
          url: `${pageUrl}#${symptom.id}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "故障诊断中心", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="resource-breadcrumb" aria-label="面包屑">
          <Link href="/knowledge">知识库</Link><span aria-hidden="true">/</span><span>故障诊断中心</span>
        </nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS DIAGNOSTIC CENTER</p>
          <h1>先说“哪里不对”，再定位错误码</h1>
          <p>这里不是另一份错误码字典。它从你能直接观察到的症状开始，把排查过程连接到真实返回值、API、对象 Hub、专题教程、浏览器本地工具与已接受的 Runtime Verification。</p>
        </header>
        <aside className="error-tip">
          <strong>推荐使用方式</strong>
          <p>先选最接近的症状，按“快速排查”保存真实返回值和运行状态；只有拿到证据后，再进入对应错误码与 API 分支。</p>
        </aside>
        <aside className="error-tip">
          <strong>第一阶段独立排查页</strong>
          <p>
            {chineseDiagnosticDetailIds.map((id, index) => {
              const symptom = getChineseDiagnosticDetailSymptom(id);
              if (!symptom) return null;
              return (
                <span key={id}>
                  {index > 0 ? " · " : ""}
                  <Link href={`/diagnostics/${id}`}>{symptom.zhTitle}</Link>
                </span>
              );
            })}
          </p>
        </aside>
        <ScreepsDiagnosticCenter locale="zh" />
      </Container>
    </main>
  );
}
