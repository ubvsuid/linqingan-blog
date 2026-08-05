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
        description: "无需连接 Screeps 账号的浏览器本地计算与诊断工具。",
        mainEntity: { "@id": `${pageUrl}#tools` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#tools`,
        numberOfItems: toolCatalog.length,
        itemListElement: toolCatalog.map((tool, index) => ({
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
    <main className="page-shell planning-tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="面包屑"><Link href="/">首页</Link><span aria-hidden="true">/</span><span>工具</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS TOOLS</p>
          <h1>计算、诊断与规划工具</h1>
          <p>全部工具都在浏览器本地运行，不要求 Screeps Token，不连接玩家账号，也不会执行游戏操作。结果用于执行前检查，真实状态仍需通过返回码和后续 Tick 验证。</p>
        </header>

        <section className="tools-hub-grid" aria-label="Screeps 工具列表">
          {toolCatalog.map((tool) => (
            <Link className="tools-hub-card" href={getToolHref(tool.slug)} key={tool.slug}>
              <span className="eyebrow">{tool.eyebrow}</span>
              <h2>{tool.zhTitle}</h2>
              <p>{tool.zhDescription}</p>
              <strong>打开工具 →</strong>
            </Link>
          ))}
        </section>
      </Container>
    </main>
  );
}
