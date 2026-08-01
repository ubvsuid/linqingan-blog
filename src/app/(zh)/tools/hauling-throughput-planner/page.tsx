import Link from "next/link";

import { Container } from "@/components/container";
import { HaulingThroughputPlanner } from "@/components/hauling-throughput-planner";
import { ToolUtilityBar } from "@/components/tool-utility-bar";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

import "../../../screeps-planning-tools.css";

export const metadata = createPageMetadata({
  title: "Screeps 运输吞吐量规划器",
  description: "根据CARRY、MOVE、地形、路线长度和目标运输量，计算往返时间、所需Creep数量、寿命运输量与替换TTL。",
  path: "/tools/hauling-throughput-planner",
});

export default function HaulingThroughputPlannerPage() {
  const pageUrl = `${siteConfig.url}/tools/hauling-throughput-planner`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps 运输吞吐量规划器",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "根据CARRY、MOVE、地形、路线和运输需求规划Screeps物流吞吐量。",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "工具", item: `${siteConfig.url}/tools` },
          { "@type": "ListItem", position: 3, name: "运输吞吐量规划器", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="面包屑"><Link href="/tools">工具</Link><span aria-hidden="true">/</span><span>运输吞吐量规划器</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS LOGISTICS TOOL</p>
          <h1>运输吞吐量规划器</h1>
          <p>把路线长度、CARRY与MOVE数量、地形、Boost、装卸时间和目标运输量转换为往返周期、所需Creep数量、寿命运输量和替换阈值。</p>
        </header>

        <ToolUtilityBar title="运输吞吐量规划器" issueUrl={siteConfig.links.issues} />
        <HaulingThroughputPlanner locale="zh" />

        <section className="planning-tool-notes" aria-labelledby="hauling-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="hauling-tool-boundaries-title">路线模型无法看到拥堵</h2></div>
          <div>
            <p>满载去程假设所有CARRY都装有资源；空CARRY在返程不产生fatigue，但其他非MOVE部件在两个方向都会产生重量。</p>
            <p>真实房间中的路径变化、MOVE受伤、pull链、敌对干扰、Source停产、目标阻塞和Container容量仍需单独检查。</p>
            <div className="planning-tool-links">
              <Link href="/blog/screeps-move-fatigue-body-ratio">理解MOVE与fatigue比例 →</Link>
              <Link href="/blog/screeps-creep-withdraw-container-energy">检查Container取能逻辑 →</Link>
              <a href="https://docs.screeps.com/creeps.html" rel="noreferrer" target="_blank">查看官方Creep移动文档 ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
