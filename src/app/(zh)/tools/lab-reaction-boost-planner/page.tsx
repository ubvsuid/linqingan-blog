import Link from "next/link";

import { Container } from "@/components/container";
import { LabReactionBoostPlanner } from "@/components/lab-reaction-boost-planner";
import { ToolUtilityBar } from "@/components/tool-utility-bar";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

import "../../../screeps-planning-tools.css";

export const metadata = createPageMetadata({
  title: "Screeps Lab 反应与 Boost 规划器",
  description: "计算化合物反应链、基础矿物、Lab运行轮数、顺序生产Tick，以及Creep Boost所需的化合物和Energy。",
  path: "/tools/lab-reaction-boost-planner",
});

export default function LabReactionBoostPlannerPage() {
  const pageUrl = `${siteConfig.url}/tools/lab-reaction-boost-planner`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Lab 反应与 Boost 规划器",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "规划 Screeps Lab 反应链、生产时间和 Creep Boost 批次。",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "工具", item: `${siteConfig.url}/tools` },
          { "@type": "ListItem", position: 3, name: "Lab 反应与 Boost 规划器", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="面包屑"><Link href="/tools">工具</Link><span aria-hidden="true">/</span><span>Lab 反应与 Boost 规划器</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS LAB TOOL</p>
          <h1>Lab 反应与 Boost 规划器</h1>
          <p>把目标化合物展开为完整反应链、基础矿物、并行输出Lab轮数和顺序cooldown时间；切换到Boost模式后，可以直接计算多只Creep的整批需求。</p>
        </header>

        <ToolUtilityBar title="Lab 反应与 Boost 规划器" issueUrl={siteConfig.links.issues} />
        <LabReactionBoostPlanner locale="zh" />

        <section className="planning-tool-notes" aria-labelledby="lab-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="lab-tool-boundaries-title">化学反应与房间物流要分开</h2></div>
          <div>
            <p>估算只覆盖化合物反应和Lab cooldown，不计算Hauler移动、补料时间、Lab布局、range检查、容量不足、Power中断和其他反应竞争。</p>
            <p>Boost模式按每个身体部件30单位化合物和20 Energy计算。每个身体部件只能接受一种化合物，真实结果仍取决于Creep与Lab状态。</p>
            <div className="planning-tool-links">
              <Link href="/knowledge">查看Lab、Boost与高级资源专题 →</Link>
              <Link href="/tools/creep-body-calculator">先计算Creep身体 →</Link>
              <a href="https://docs.screeps.com/resources.html" rel="noreferrer" target="_blank">查看官方资源与Boost文档 ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
