import Link from "next/link";

import { Container } from "@/components/container";
import { ToolUtilityBar } from "@/components/tool-utility-bar";
import { TowerPowerCalculator } from "@/components/tower-power-calculator";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

import "../../../screeps-planning-tools.css";

export const metadata = createPageMetadata({
  title: "Screeps Tower 伤害、治疗与维修计算器",
  description: "计算Tower距离衰减、多塔攻击、治疗或维修效果、Energy消耗、目标所需Tick与OPERATE_TOWER增益。",
  path: "/tools/tower-damage-heal-repair-calculator",
});

export default function TowerDamageHealRepairCalculatorPage() {
  const pageUrl = `${siteConfig.url}/tools/tower-damage-heal-repair-calculator`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Tower 伤害、治疗与维修计算器",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "计算标准Screeps Tower在不同距离和Energy限制下的攻击、治疗与维修能力。",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "工具", item: `${siteConfig.url}/tools` },
          { "@type": "ListItem", position: 3, name: "Tower 伤害、治疗与维修计算器", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="面包屑"><Link href="/tools">工具</Link><span aria-hidden="true">/</span><span>Tower 伤害、治疗与维修计算器</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS DEFENSE TOOL</p>
          <h1>Tower 伤害、治疗与维修计算器</h1>
          <p>计算距离衰减、单塔效果、多塔齐射、Energy消耗、OPERATE_TOWER增益，以及加入敌方治疗、受到伤害或结构损耗后的净推进速度。</p>
        </header>

        <ToolUtilityBar title="Tower 伤害、治疗与维修计算器" issueUrl={siteConfig.links.issues} />
        <TowerPowerCalculator locale="zh" />

        <section className="planning-tool-notes" aria-labelledby="tower-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="tower-tool-boundaries-title">原始Tower能力不等于真实战斗结算</h2></div>
          <div>
            <p>工具按标准Tower能力、Range 5以内满效果、到Range 20线性衰减，以及每次动作10 Energy计算，并假设所有Tower每Tick都能对同一目标提交动作。</p>
            <p>真实战斗仍取决于TOUGH顺序与Boost、敌方治疗、目标移动、Rampart、Safe Mode、动作冲突、Tower之间的Energy差异和最终被接受的意图。</p>
            <div className="planning-tool-links">
              <Link href="/blog/screeps-tower-auto-attack-hostiles">建立可验证的Tower攻击逻辑 →</Link>
              <Link href="/blog/screeps-tower-repair-threshold">设置分阶段维修阈值 →</Link>
              <a href="https://docs.screeps.com/defense.html" rel="noreferrer" target="_blank">查看官方防御文档 ↗</a>
              <a href="https://docs.screeps.com/power.html" rel="noreferrer" target="_blank">查看官方Power文档 ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
