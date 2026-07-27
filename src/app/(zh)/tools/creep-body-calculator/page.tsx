import Link from "next/link";

import { Container } from "@/components/container";
import { CreepBodyCalculator } from "@/components/creep-body-calculator";
import { ToolUtilityBar } from "@/components/tool-utility-bar";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Screeps Creep 身体计算器",
  description:
    "选择 MOVE、WORK、CARRY 等身体部件，计算 Creep 的 Energy 成本、生成时间、生命值、携带容量和满载移动速度。",
  path: "/tools/creep-body-calculator",
});

export default function CreepBodyCalculatorPage() {
  const pageUrl = `${siteConfig.url}/tools/creep-body-calculator`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Creep 身体计算器",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description:
          "计算 Screeps Creep 身体成本、生成时间、生命值、携带容量与基础移动速度。",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "CNY",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "知识库", item: `${siteConfig.url}/knowledge` },
          { "@type": "ListItem", position: 3, name: "Creep 身体计算器", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell body-tool-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Container>
        <nav className="body-tool-breadcrumb" aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <span>Creep 身体计算器</span>
        </nav>

        <header className="page-header body-tool-header">
          <p className="eyebrow">SCREEPS TOOL</p>
          <h1>Creep 身体计算器</h1>
          <p>
            组合身体部件，立即查看 Energy 成本、Spawn 生成时间、基础生命值、携带容量与满载移动估算。配置会同步到网址参数，复制链接即可分享当前方案。
          </p>
        </header>

        <ToolUtilityBar title="Creep 身体计算器" issueUrl={siteConfig.links.issues} />

        <CreepBodyCalculator />

        <section className="body-tool-notes" aria-labelledby="body-tool-notes-title">
          <div>
            <p className="eyebrow">BOUNDARIES</p>
            <h2 id="body-tool-notes-title">计算边界</h2>
          </div>
          <div>
            <p>
              工具使用官方基础部件成本、每个身体部件 3 tick 的生成时间、每个部件 100 hits，以及不超过 50 个身体部件的规则。
            </p>
            <p>
              移动结果按满载且所有非 MOVE 部件产生 fatigue 估算，不包含 Boost、受伤部件、空 CARRY、Pull、Power Creep 效果和具体路径状态。
            </p>
            <div className="body-tool-links">
              <Link href="/blog/screeps-dynamic-creep-body-energy">阅读动态身体生成文章 →</Link>
              <Link href="/blog/screeps-move-fatigue-body-ratio">理解 MOVE 与 fatigue →</Link>
              <a href="https://docs.screeps.com/creeps.html" rel="noreferrer" target="_blank">查看 Screeps 官方说明 ↗</a>
            </div>
          </div>
        </section>
      </Container>

      <style>{`
        .body-tool-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .body-tool-header { max-width: 980px; }
        .body-tool-header > p:last-child { max-width: 820px; }
        .body-tool-notes { display: grid; grid-template-columns: minmax(220px, .65fr) minmax(0, 1.35fr); gap: 58px; margin-top: 78px; border-top: 1px solid var(--border); padding: 68px 0 30px; }
        .body-tool-notes h2 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 50px); letter-spacing: -.045em; }
        .body-tool-notes > div:last-child > p { margin: 0; color: var(--muted); line-height: 1.8; }
        .body-tool-notes > div:last-child > p + p { margin-top: 16px; }
        .body-tool-links { display: flex; flex-wrap: wrap; gap: 12px 20px; margin-top: 26px; }
        .body-tool-links a { font-weight: 680; }
        @media (max-width: 800px) { .body-tool-notes { grid-template-columns: 1fr; gap: 32px; } }
      `}</style>
    </main>
  );
}
