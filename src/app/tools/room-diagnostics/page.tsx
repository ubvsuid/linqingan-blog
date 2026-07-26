import Link from "next/link";

import { Container } from "@/components/container";
import { RoomDiagnostics } from "@/components/room-diagnostics";
import { ToolUtilityBar } from "@/components/tool-utility-bar";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Screeps 房间运行诊断工具",
  description:
    "输入 Spawn、角色、Energy、Controller、工地和 CPU 快照，生成按严重程度排序的 Screeps 房间诊断结果与对应排查文章。",
  path: "/tools/room-diagnostics",
});

export default function RoomDiagnosticsPage() {
  const pageUrl = `${siteConfig.url}/tools/room-diagnostics`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps 房间运行诊断工具",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description:
          "根据 Screeps 房间快照检查 Spawn、采集者、运输、Energy、Controller、工地和 CPU 风险。",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "知识库", item: `${siteConfig.url}/knowledge` },
          { "@type": "ListItem", position: 3, name: "房间运行诊断", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell diagnostic-tool-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Container>
        <nav className="diagnostic-breadcrumb" aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <span>房间运行诊断</span>
        </nav>

        <header className="page-header diagnostic-header">
          <p className="eyebrow">SCREEPS TOOL</p>
          <h1>房间运行诊断</h1>
          <p>
            根据一份房间静态快照，检查断代、Energy 输入、Controller 降级、工地规模和 CPU 风险。工具不会连接账号，也不会执行任何游戏动作。
          </p>
        </header>

        <ToolUtilityBar title="房间运行诊断" issueUrl={siteConfig.links.issues} />

        <RoomDiagnostics />

        <section className="diagnostic-boundaries" aria-labelledby="diagnostic-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="diagnostic-boundaries-title">使用边界</h2></div>
          <div>
            <p>结果来自你输入的单次快照，不代表真实多 tick 趋势。诊断阈值是本站维护建议，不是 Screeps 官方固定警戒线。</p>
            <p>执行 Console 探针前要把示例房间名改成自己的房间。工具只输出只读查询代码，不会 Spawn、移动、交易、拆除或修改 Memory。</p>
            <div className="diagnostic-links">
              <Link href="/blog/screeps-cpu-getused-bucket">学习 CPU 监控 →</Link>
              <Link href="/blog/screeps-spawn-emergency-recovery">处理房间断代 →</Link>
              <Link href="/verification">查看本站验证方法 →</Link>
            </div>
          </div>
        </section>
      </Container>
      <style>{`
        .diagnostic-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .diagnostic-header { max-width: 980px; }
        .diagnostic-header > p:last-child { max-width: 840px; }
        .diagnostic-boundaries { display: grid; grid-template-columns: minmax(220px, .65fr) minmax(0, 1.35fr); gap: 58px; margin-top: 78px; border-top: 1px solid var(--border); padding: 68px 0 30px; }
        .diagnostic-boundaries h2 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 50px); letter-spacing: -.045em; }
        .diagnostic-boundaries > div:last-child > p { margin: 0; color: var(--muted); line-height: 1.8; }
        .diagnostic-boundaries > div:last-child > p + p { margin-top: 16px; }
        .diagnostic-links { display: flex; flex-wrap: wrap; gap: 12px 20px; margin-top: 26px; }
        .diagnostic-links a { font-weight: 680; }
        @media (max-width: 800px) { .diagnostic-boundaries { grid-template-columns: 1fr; gap: 32px; } }
      `}</style>
    </main>
  );
}
