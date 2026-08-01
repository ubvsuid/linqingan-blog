import Link from "next/link";

import { Container } from "@/components/container";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

import "../../screeps-planning-tools.css";

export const metadata = createPageMetadata({
  title: "免费 Screeps 工具",
  description: "使用无需账号连接的 Screeps 身体、房间、市场、Controller 和 Lab 规划工具。所有计算都在浏览器本地完成。",
  path: "/tools",
});

const tools = [
  {
    eyebrow: "BODY CALCULATOR",
    title: "Creep 身体计算器",
    description: "计算身体成本、生成时间、生命值、携带容量与满载移动速度。",
    href: "/tools/creep-body-calculator",
  },
  {
    eyebrow: "ROOM DIAGNOSTICS",
    title: "房间运行诊断",
    description: "根据Spawn、角色、Energy、Controller、工地、CPU和bucket快照检查风险。",
    href: "/tools/room-diagnostics",
  },
  {
    eyebrow: "MARKET & TERMINAL",
    title: "Market 与 Terminal 成本计算器",
    description: "计算运输Energy、成交后的实际单价和创建订单手续费。",
    href: "/tools/market-terminal-cost-calculator",
  },
  {
    eyebrow: "CONTROLLER",
    title: "Controller 降级与 Upgrader 规划器",
    description: "估算降级安全余量、WORK吞吐量、Boost效果和RCL8升级上限。",
    href: "/tools/controller-downgrade-planner",
  },
  {
    eyebrow: "LAB & BOOST",
    title: "Lab 反应与 Boost 规划器",
    description: "展开化合物反应链，并计算生产轮数、基础矿物和整批Boost需求。",
    href: "/tools/lab-reaction-boost-planner",
  },
] as const;

export default function ToolsPage() {
  const pageUrl = `${siteConfig.url}/tools`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "免费 Screeps 工具",
        url: pageUrl,
        inLanguage: "zh-CN",
        description: "无需连接Screeps账号的浏览器本地计算与诊断工具。",
        mainEntity: { "@id": `${pageUrl}#tools` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#tools`,
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.title,
          url: `${siteConfig.url}${tool.href}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "工具", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="面包屑"><Link href="/">首页</Link><span aria-hidden="true">/</span><span>工具</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS TOOLS</p>
          <h1>计算、诊断与规划工具</h1>
          <p>全部工具都在浏览器本地运行，不要求Screeps Token，不连接玩家账号，也不会执行游戏操作。结果用于执行前检查，真实状态仍需通过返回码和后续Tick验证。</p>
        </header>

        <section className="tools-hub-grid" aria-label="Screeps 工具列表">
          {tools.map((tool) => (
            <Link className="tools-hub-card" href={tool.href} key={tool.href}>
              <span className="eyebrow">{tool.eyebrow}</span>
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
              <strong>打开工具 →</strong>
            </Link>
          ))}
        </section>
      </Container>
    </main>
  );
}
