import Link from "next/link";

import { Container } from "@/components/container";
import { MarketTerminalCalculator } from "@/components/market-terminal-calculator";
import { ToolUtilityBar } from "@/components/tool-utility-bar";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

import "../../../screeps-planning-tools.css";

export const metadata = createPageMetadata({
  title: "Screeps Market 与 Terminal 成本计算器",
  description: "计算 Terminal 运输 Energy、Market 成交后的实际单价和创建订单的 5% 手续费，不需要连接 Screeps 账号。",
  path: "/tools/market-terminal-cost-calculator",
});

export default function MarketTerminalCostCalculatorPage() {
  const pageUrl = `${siteConfig.url}/tools/market-terminal-cost-calculator`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Market 与 Terminal 成本计算器",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "计算 Screeps Terminal 交易 Energy、Market 实际成交单价与订单手续费。",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "工具", item: `${siteConfig.url}/tools` },
          { "@type": "ListItem", position: 3, name: "Market 与 Terminal 成本计算器", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="面包屑"><Link href="/tools">工具</Link><span aria-hidden="true">/</span><span>Market 与 Terminal 成本计算器</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS MARKET TOOL</p>
          <h1>Market 与 Terminal 成本计算器</h1>
          <p>比较 Terminal 发送成本、计入运输 Energy 后的 Market 实际单价，以及创建订单时需要支付的手续费。配置只保存在当前网址参数中。</p>
        </header>

        <ToolUtilityBar title="Market 与 Terminal 成本计算器" issueUrl={siteConfig.links.issues} />
        <MarketTerminalCalculator locale="zh" />

        <section className="planning-tool-notes" aria-labelledby="market-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="market-tool-boundaries-title">把结果作为执行前检查</h2></div>
          <div>
            <p>房间名解析按官方世界的标准房间坐标计算。修改过地图或常量的私服可能得到不同结果。</p>
            <p>执行 Market deal 的一方承担交易 Energy 和 Terminal cooldown。本工具不会读取真实订单、房间库存、Credits或cooldown。</p>
            <div className="planning-tool-links">
              <Link href="/knowledge/market-advanced-resources">查看市场与高级资源专题 →</Link>
              <a href="https://docs.screeps.com/market.html" rel="noreferrer" target="_blank">查看官方 Market 文档 ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
