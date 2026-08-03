import Link from "next/link";

import { Container } from "@/components/container";
import { SpawnQueueReplacementPlanner } from "@/components/spawn-queue-replacement-planner";
import { ToolUtilityBar } from "@/components/tool-utility-bar";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

import "../../../screeps-planning-tools.css";

export const metadata = createPageMetadata({
  title: "Screeps Spawn 队列与替换规划器",
  description: "根据身体部件、角色数量、路程、寿命和 OPERATE_SPAWN，估算 Spawn 利用率、替换时间与 prespawn TTL。",
  path: "/tools/spawn-queue-replacement-planner",
});

export default function SpawnQueueReplacementPlannerPage() {
  const pageUrl = `${siteConfig.url}/tools/spawn-queue-replacement-planner`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Spawn 队列与替换规划器",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "根据明确的角色配置规划 Spawn 平均负载、替换时机和 prespawn TTL。",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "工具", item: `${siteConfig.url}/tools` },
          { "@type": "ListItem", position: 3, name: "Spawn 队列与替换规划器", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="面包屑"><Link href="/tools">工具</Link><span aria-hidden="true">/</span><span>Spawn 队列与替换规划器</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS SPAWN TOOL</p>
          <h1>Spawn 队列与替换规划器</h1>
          <p>同时输入多个角色的身体大小、常驻数量、工作点路程、安全缓冲、普通或CLAIM寿命，以及可用Spawn和OPERATE_SPAWN等级。</p>
        </header>

        <ToolUtilityBar title="Spawn 队列与替换规划器" issueUrl={siteConfig.links.issues} />
        <SpawnQueueReplacementPlanner locale="zh" />

        <section className="planning-tool-notes" aria-labelledby="spawn-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="spawn-tool-boundaries-title">平均容量不等于真实队列</h2></div>
          <div>
            <p>工具按每个身体部件3个生成Tick、普通Creep 1500 Tick寿命、含CLAIM身体600 Tick寿命计算。OPERATE_SPAWN按规划减速比例应用，并向上取整，避免低估队列时间。</p>
            <p>真实生产仍可能受到多个角色同时到期、房间Energy未补满、Spawn被干扰、出生方向阻塞和队列优先级变化影响。</p>
            <div className="planning-tool-links">
              <Link href="/blog/screeps-spawncreep-return-codes">检查 spawnCreep 返回码 →</Link>
              <Link href="/blog/screeps-spawn-emergency-recovery">建立紧急恢复队列 →</Link>
              <a href="https://docs.screeps.com/creeps.html" rel="noreferrer" target="_blank">查看官方 Creep 文档 ↗</a>
              <a href="https://docs.screeps.com/power.html" rel="noreferrer" target="_blank">查看官方 Power 文档 ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
