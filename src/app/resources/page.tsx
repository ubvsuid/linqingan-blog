
import Link from "next/link";

import { Container } from "@/components/container";
import { createPageMetadata } from "@/lib/metadata";
import { getSearchDocuments } from "@/lib/search";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { screepsGlossary } from "@/lib/screeps-glossary";
import { getTagRecords } from "@/lib/tags";

export const metadata = createPageMetadata({
  title: "Screeps 资料中心",
  description: "查询 Screeps 常见术语、API 返回值、文章标签和站内全部公开内容。",
  path: "/resources",
});

const resources = [
  {
    eyebrow: "KNOWLEDGE BASE",
    title: "Screeps知识库",
    description: "按 8 个主题组浏览完整教程，每篇只解决一个主要搜索意图。",
    href: "/knowledge",
    count: "60 篇文章",
  },
  {
    eyebrow: "SEARCH",
    title: "站内搜索",
    description: "同时搜索文章正文、术语、错误码、标签和项目说明。",
    href: "/search",
    count: `${getSearchDocuments().length} 条内容`,
  },
  {
    eyebrow: "GLOSSARY",
    title: "Screeps 术语表",
    description: "用新手能理解的方式解释 Creep、Spawn、Memory、RCL 等常见概念。",
    href: "/glossary",
    count: `${screepsGlossary.length} 个术语`,
  },
  {
    eyebrow: "ERROR CODES",
    title: "错误码查询",
    description: "查询 ERR_NOT_IN_RANGE、ERR_FULL、ERR_INVALID_TARGET 等返回值的原因和处理方式。",
    href: "/screeps-errors",
    count: `${screepsErrorCodes.length} 个返回值`,
  },
  {
    eyebrow: "TAGS",
    title: "文章标签",
    description: "按照 Creep、JavaScript、Spawn、Builder 等主题浏览已经发布的内容。",
    href: "/tags",
    count: `${getTagRecords().length} 个标签`,
  },
];

export default function ResourcesPage() {
  return (
    <main className="page-shell resources-page">
      <Container>
        <header className="page-header resources-header">
          <p className="eyebrow">RESOURCES</p>
          <h1>资料中心</h1>
          <p>
            文章负责连续学习，资料中心负责在遇到问题时快速查询。现在可以从一个入口搜索文章、术语、错误码、标签和项目。
          </p>
        </header>

        <div className="resources-grid">
          {resources.map((resource) => (
            <Link key={resource.href} href={resource.href}>
              <span className="eyebrow">{resource.eyebrow}</span>
              <h2>{resource.title}</h2>
              <p>{resource.description}</p>
              <div>
                <span>{resource.count}</span>
                <strong aria-hidden="true">→</strong>
              </div>
            </Link>
          ))}
        </div>

        <section className="resource-roadmap" aria-labelledby="resource-roadmap-title">
          <div>
            <p className="eyebrow">NEXT</p>
            <h2 id="resource-roadmap-title">接下来会加入</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>常用 API 快速查询</strong>
                <p>只整理新手和基础工程阶段真正会使用的对象、方法、参数与返回值。</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Creep 身体计算器</strong>
                <p>输入身体部件后计算能量成本、创建时间和基础移动比例。</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>基础工程学习路线</strong>
                <p>从固定名称代码继续走向 Memory、自动补员、模块拆分和房间管理。</p>
              </div>
            </li>
          </ol>
        </section>
      </Container>
      <style>{`
        .resources-header { max-width: 820px; }
        .resources-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        .resources-grid > a { display: grid; min-height: 280px; align-content: start; border: 1px solid var(--border); border-radius: 22px; padding: 28px; background: var(--surface); transition: transform 160ms ease, border-color 160ms ease; }
        .resources-grid > a:hover { transform: translateY(-4px); border-color: var(--muted); text-decoration: none; }
        .resources-grid h2 { margin: 22px 0 0; font-size: 28px; }
        .resources-grid p { margin: 14px 0 0; color: var(--muted); line-height: 1.75; }
        .resources-grid a > div { display: flex; justify-content: space-between; gap: 16px; margin-top: auto; padding-top: 34px; color: var(--muted); font-size: 13px; }
        .resources-grid a > div strong { color: var(--foreground); font-size: 20px; }
        .resource-roadmap { display: grid; grid-template-columns: minmax(220px, .65fr) minmax(0, 1.35fr); gap: 58px; margin-top: 82px; border-top: 1px solid var(--border); padding-top: 72px; }
        .resource-roadmap h2 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 50px); letter-spacing: -.045em; }
        .resource-roadmap ol { display: grid; margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }
        .resource-roadmap li { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 20px; border-bottom: 1px solid var(--border); padding: 24px 0; }
        .resource-roadmap li > span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; }
        .resource-roadmap strong { font-size: 19px; }
        .resource-roadmap p { margin: 9px 0 0; color: var(--muted); line-height: 1.7; }
        @media (max-width: 820px) { .resources-grid { grid-template-columns: 1fr; } .resources-grid > a { min-height: 230px; } .resource-roadmap { grid-template-columns: 1fr; gap: 34px; } }
      `}</style>
    </main>
  );
}

