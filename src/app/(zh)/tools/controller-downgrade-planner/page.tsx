import Link from "next/link";

import { Container } from "@/components/container";
import { ControllerUpgraderPlanner } from "@/components/controller-upgrader-planner";
import { ToolUtilityBar } from "@/components/tool-utility-bar";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

import "../../../screeps-planning-tools.css";

export const metadata = createPageMetadata({
  title: "Screeps Controller 降级与 Upgrader 规划器",
  description: "根据 ticksToDowngrade、WORK、Boost、有效升级比例和 RCL8 上限，估算 Controller 安全余量与升级能力。",
  path: "/tools/controller-downgrade-planner",
});

export default function ControllerDowngradePlannerPage() {
  const pageUrl = `${siteConfig.url}/tools/controller-downgrade-planner`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Controller 降级与 Upgrader 规划器",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "根据明确的房间参数规划 Controller 降级安全余量和 Upgrader 吞吐量。",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "工具", item: `${siteConfig.url}/tools` },
          { "@type": "ListItem", position: 3, name: "Controller 降级规划器", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="面包屑"><Link href="/tools">工具</Link><span aria-hidden="true">/</span><span>Controller 降级规划器</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS CONTROLLER TOOL</p>
          <h1>Controller 降级与 Upgrader 规划器</h1>
          <p>把真实 Controller 快照转换为安全余量和升级吞吐量估算。可以分别调整WORK数量、升级Boost、有效工作比例、RCL8上限和OPERATE_CONTROLLER。</p>
        </header>

        <ToolUtilityBar title="Controller 降级与 Upgrader 规划器" issueUrl={siteConfig.links.issues} />
        <ControllerUpgraderPlanner locale="zh" />

        <section className="planning-tool-notes" aria-labelledby="controller-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="controller-tool-boundaries-title">真实快照与规划结果要分开</h2></div>
          <div>
            <p>工具不会假设Upgrader每个Tick都能到达Controller、获得Energy并成功提交升级意图。请用“实际执行升级的时间比例”反映运输、移动和供能系统。</p>
            <p>现实时间仅为估算，因为Screeps Tick长度会随服务器负载变化。Controller当前的ticksToDowngrade始终是判断风险的主要依据。</p>
            <div className="planning-tool-links">
              <Link href="/blog/screeps-upgrade-controller">阅读 Controller 升级文章 →</Link>
              <Link href="/knowledge">进入 Controller 与扩张专题 →</Link>
              <a href="https://docs.screeps.com/control.html" rel="noreferrer" target="_blank">查看官方 Controller 文档 ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
