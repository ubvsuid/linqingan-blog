import Link from "next/link";

import { Container } from "@/components/container";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { getToolHref, toolCatalog } from "@/lib/tool-catalog";

import "../../screeps-planning-tools.css";

export const metadata = createPageMetadata({
  title: "免费 Screeps 工具",
  description: "使用无需账号连接的 Screeps 身体、房间、市场、Controller、Lab、Spawn、运输和 Tower 规划工具。所有计算都在浏览器本地完成。",
  path: "/tools",
});

const toolHubOrder: Record<string, number> = {
  "room-diagnostics": 0,
  "creep-body-calculator": 1,
  "market-terminal-cost-calculator": 2,
  "controller-downgrade-planner": 3,
  "lab-reaction-boost-planner": 4,
  "spawn-queue-replacement-planner": 5,
  "hauling-throughput-planner": 6,
  "tower-damage-heal-repair-calculator": 7,
};

export default function ToolsPage() {
  const pageUrl = `${siteConfig.url}/tools`;
  const orderedTools = [...toolCatalog].sort(
    (a, b) => (toolHubOrder[a.slug] ?? 999) - (toolHubOrder[b.slug] ?? 999),
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "免费 Screeps 工具",
        url: pageUrl,
        inLanguage: "zh-CN",
        description: "无需连接 Screeps 账号的浏览器本地计算与诊断工具。",
        mainEntity: { "@id": `${pageUrl}#tools` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#tools`,
        numberOfItems: orderedTools.length,
        itemListElement: orderedTools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.zhTitle,
          url: `${siteConfig.url}${getToolHref(tool.slug)}`,
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
    <main className="page-shell planning-tool-page monochrome-system-page tools-monochrome-hub">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="面包屑"><Link href="/">首页</Link><span aria-hidden="true">/</span><span>工具</span></nav>
        <header className="page-header tools-hub-header">
          <p className="eyebrow">SCREEPS TOOLS</p>
          <h1>Tools for Screeps.</h1>
          <p>计算、诊断与规划工具，全部在浏览器本地运行：不要求 Screeps Token，不连接玩家账号，也不会执行游戏操作。先用工具检查，再用返回码与后续 Tick 验证真实状态。</p>
        </header>

        <section className="tools-hub-list" aria-label="Screeps 工具列表">
          {orderedTools.map((tool, index) => (
            <Link className="tools-hub-row" href={getToolHref(tool.slug)} key={tool.slug}>
              <span className="tools-hub-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="tools-hub-copy">
                <span className="tools-hub-eyebrow">{tool.eyebrow}</span>
                <strong>{tool.zhTitle}</strong>
                <span>{tool.zhDescription}</span>
              </span>
              <span className="tools-hub-action">Open →</span>
            </Link>
          ))}
        </section>
      </Container>
    </main>
  );
}
