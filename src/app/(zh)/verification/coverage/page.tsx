import Link from "next/link";

import { Container } from "@/components/container";
import { VerificationCoverage } from "@/components/verification-coverage";
import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { verificationCoveragePlans } from "@/lib/verification-coverage";

export const revalidate = 300;

export const metadata = createPageMetadata({
  title: "Screeps 验证覆盖率与 Evidence 优先级",
  description: "查看高频 Screeps 诊断路径当前有哪些 accepted Console / Live multi-tick 验证、还缺什么证据，以及下一批真实 Evidence 的优先级。",
  path: "/verification/coverage",
});

export default function VerificationCoveragePage() {
  const pageUrl = `${siteConfig.url}/verification/coverage`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Screeps 验证覆盖率与 Evidence 优先级",
        url: pageUrl,
        inLanguage: "zh-CN",
        description: "按症状诊断路径展示当前 accepted Runtime Verification 覆盖与下一步 Evidence 缺口。",
        mainEntity: { "@id": `${pageUrl}#coverage` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#coverage`,
        numberOfItems: verificationCoveragePlans.length,
        itemListElement: verificationCoveragePlans.map((plan, index) => {
          const symptom = screepsDiagnosticSymptoms.find((item) => item.id === plan.symptomId);
          return {
            "@type": "ListItem",
            position: index + 1,
            name: symptom?.zhTitle ?? plan.symptomId,
            url: `${pageUrl}#coverage-${plan.symptomId}`,
          };
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "验证方法", item: `${siteConfig.url}/verification` },
          { "@type": "ListItem", position: 3, name: "验证覆盖", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="resource-breadcrumb" aria-label="面包屑">
          <Link href="/verification">验证方法</Link><span aria-hidden="true">/</span><span>验证覆盖</span>
        </nav>
        <header className="page-header">
          <p className="eyebrow">VERIFICATION COVERAGE</p>
          <h1>先看哪里缺证据，再决定下一次实测</h1>
          <p>这里不把“有文章”当成“已验证”。它把 Phase 4B 的高频症状路径映射到 Error、API、Object Hub、Guide、Tool，并用现有 accepted Verification 边界计算当前运行时证据覆盖。</p>
        </header>
        <aside className="error-tip">
          <strong>当前原则</strong>
          <p>Evidence 强度与覆盖完整度分开记录；没有 accepted Console / Live multi-tick 证据时就保持未验证，不从数据库、文档核对或离线模拟自动推断成已验证。</p>
        </aside>
        <VerificationCoverage locale="zh" />
      </Container>
    </main>
  );
}
