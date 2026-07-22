import Link from "next/link";

import { Container } from "@/components/container";
import { beginnerSeriesSlugs, beginnerStages } from "@/lib/beginner-series";
import { knowledgeBaseSections, knowledgeBaseSlugs } from "@/lib/knowledge-base";
import { createPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/lib/posts";
import { getSearchDocuments } from "@/lib/search";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { screepsGlossary } from "@/lib/screeps-glossary";
import { getTagRecords } from "@/lib/tags";

export const metadata = createPageMetadata({
  title: "Screeps知识库",
  description:
    "从 12 篇 Screeps 新手路线进入 8 个专题模块，并查询术语、错误码、标签、验证方法和全部站内内容。",
  path: "/knowledge",
});

const referenceTools = [
  {
    eyebrow: "SEARCH",
    title: "站内搜索",
    description: "同时搜索文章正文、术语、错误码、标签和公开项目说明。",
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
    description: "查询 ERR_NOT_IN_RANGE、ERR_FULL、ERR_INVALID_TARGET 等返回值的原因与处理方式。",
    href: "/screeps-errors",
    count: `${screepsErrorCodes.length} 个返回值`,
  },
  {
    eyebrow: "TAGS",
    title: "文章标签",
    description: "按照 Creep、JavaScript、Spawn、Builder 等主题浏览已发布内容。",
    href: "/tags",
    count: `${getTagRecords().length} 个标签`,
  },
  {
    eyebrow: "VERIFICATION",
    title: "文章验证方法",
    description: "了解文档核对、语法检查、离线模拟、Console 与真实主循环验证的区别。",
    href: "/verification",
    count: "5 种验证状态",
  },
];

const plannedTools = [
  {
    title: "常用 API 快速查询",
    description: "整理新手和基础工程阶段真正会使用的对象、方法、参数与返回值。",
  },
  {
    title: "Creep 身体计算器",
    description: "输入身体部件后计算能量成本、创建时间和基础移动比例。",
  },
  {
    title: "房间运行诊断清单",
    description: "按 Spawn、Creep、Energy、Controller、工地和 CPU 逐项检查常见问题。",
  },
];

export default function KnowledgePage() {
  const allPosts = getAllPosts();
  const postsBySlug = new Map(allPosts.map((post) => [post.slug, post]));

  return (
    <main className="page-shell knowledge-page">
      <Container>
        <header className="page-header knowledge-header">
          <p className="eyebrow">SCREEPS KNOWLEDGE BASE</p>
          <h1>Screeps知识库</h1>
          <p>
            第一次接触 Screeps，先按顺序完成新手路线；已经遇到具体 API、报错或系统问题时，可以进入专题模块，或直接使用下面的查询工具。
          </p>
          <div className="knowledge-stats" aria-label="知识库数据">
            <span><strong>{beginnerSeriesSlugs.length}</strong> 篇新手路线</span>
            <span><strong>{knowledgeBaseSlugs.length}</strong> 篇专题文章</span>
            <span><strong>{knowledgeBaseSections.length}</strong> 个独立模块</span>
          </div>
          <Link className="knowledge-all-posts" href="/blog">
            浏览全部 {allPosts.length} 篇文章 →
          </Link>
        </header>

        <section className="knowledge-beginner" aria-labelledby="knowledge-beginner-title">
          <div>
            <p className="eyebrow">BEGINNER PATH</p>
            <h2 id="knowledge-beginner-title">从零开始的新手模块</h2>
            <p>
              从认识游戏界面和 tick 开始，逐步完成采集、运输、角色分工、Controller 升级、Extension、建造维修与第一份房间基础代码。
            </p>
            <Link href="/beginner">开始 {beginnerSeriesSlugs.length} 篇新手路线 →</Link>
          </div>
          <ol>
            {beginnerStages.map((stage) => (
              <li key={stage.id}>
                <span>{String(stage.number).padStart(2, "0")}</span>
                <div>
                  <strong>{stage.title}</strong>
                  <small>{stage.slugs.length} 篇</small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="reference-tools" className="knowledge-reference" aria-labelledby="knowledge-reference-title">
          <div className="knowledge-reference-heading">
            <div>
              <p className="eyebrow">REFERENCE & TOOLS</p>
              <h2 id="knowledge-reference-title">查询与工具</h2>
            </div>
            <p>文章用于连续学习；这些入口用于遇到具体名词、返回值或代码问题时快速定位。</p>
          </div>

          <div className="knowledge-reference-grid">
            {referenceTools.map((item) => (
              <Link href={item.href} key={item.href}>
                <span className="eyebrow">{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div><span>{item.count}</span><strong aria-hidden="true">→</strong></div>
              </Link>
            ))}
          </div>

          <div className="knowledge-tool-roadmap">
            <div>
              <p className="eyebrow">NEXT</p>
              <h3>接下来会加入</h3>
            </div>
            <ol>
              {plannedTools.map((item, index) => (
                <li key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{item.title}</strong><p>{item.description}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="knowledge-module-heading">
          <div>
            <p className="eyebrow">TOPIC MODULES</p>
            <h2>选择你要解决的问题</h2>
          </div>
          <p>根据当前问题进入对应模块，沿着推荐顺序继续学习。</p>
        </div>

        <nav className="knowledge-jump" aria-label="知识库主题导航">
          {knowledgeBaseSections.map((section) => (
            <Link key={section.id} href={`/knowledge/${section.id}`}>
              {String(section.number).padStart(2, "0")} · {section.title}
            </Link>
          ))}
        </nav>

        <div className="knowledge-sections">
          {knowledgeBaseSections.map((section) => (
            <section key={section.id} id={section.id} className="knowledge-section">
              <header>
                <span>{String(section.number).padStart(2, "0")}</span>
                <div>
                  <div className="knowledge-section-title-row">
                    <h2><Link href={`/knowledge/${section.id}`}>{section.title}</Link></h2>
                    <small>{section.slugs.length} 篇 · {section.stages.length} 个阶段</small>
                  </div>
                  <p>{section.description}</p>
                  <Link className="knowledge-section-cta" href={`/knowledge/${section.id}`}>
                    进入专题模块并按顺序学习 →
                  </Link>
                </div>
              </header>
              <ol>
                {section.slugs.map((slug, index) => {
                  const post = postsBySlug.get(slug);
                  if (!post) return null;
                  return (
                    <li key={slug}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <Link href={`/blog/${slug}`}>
                        <strong>{post.title}</strong>
                        <small>{post.category} · {post.readingMinutes} 分钟</small>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </Container>
      <style>{`
        .knowledge-header { max-width: 900px; }
        .knowledge-header > p:not(.eyebrow) { max-width: 780px; }
        .knowledge-stats { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
        .knowledge-stats span { border: 1px solid var(--border); border-radius: 999px; padding: 9px 14px; color: var(--muted); font-size: 13px; }
        .knowledge-stats strong { color: var(--foreground); font-size: 16px; }
        .knowledge-all-posts { display: inline-flex; width: fit-content; margin-top: 18px; font-weight: 680; }
        .knowledge-beginner { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr); gap: 42px; margin-bottom: 78px; border: 1px solid var(--border); border-radius: 24px; padding: clamp(26px, 5vw, 48px); background: var(--surface); }
        .knowledge-beginner h2 { margin: 8px 0 18px; font-size: clamp(34px, 5vw, 56px); letter-spacing: -.045em; }
        .knowledge-beginner > div > p:not(.eyebrow) { max-width: 680px; margin: 0 0 24px; color: var(--muted); line-height: 1.75; }
        .knowledge-beginner > div > a { font-weight: 700; }
        .knowledge-beginner ol { display: grid; margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }
        .knowledge-beginner li { display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 12px; align-items: center; border-bottom: 1px solid var(--border); padding: 16px 0; }
        .knowledge-beginner li > span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; }
        .knowledge-beginner li div { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .knowledge-beginner li small { color: var(--muted); }
        .knowledge-reference { scroll-margin-top: 24px; margin-bottom: 92px; border-top: 1px solid var(--border); padding-top: 70px; }
        .knowledge-reference-heading { display: grid; grid-template-columns: minmax(0, .9fr) minmax(280px, 1.1fr); gap: 40px; align-items: end; margin-bottom: 30px; }
        .knowledge-reference-heading h2 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 52px); letter-spacing: -.045em; }
        .knowledge-reference-heading > p { margin: 0; color: var(--muted); line-height: 1.75; }
        .knowledge-reference-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .knowledge-reference-grid > a { display: grid; min-height: 245px; align-content: start; border: 1px solid var(--border); border-radius: 20px; padding: 25px; background: var(--surface); transition: transform 160ms ease, border-color 160ms ease; }
        .knowledge-reference-grid > a:hover { transform: translateY(-3px); border-color: var(--muted); text-decoration: none; }
        .knowledge-reference-grid h3 { margin: 20px 0 0; font-size: 24px; }
        .knowledge-reference-grid p { margin: 12px 0 0; color: var(--muted); line-height: 1.7; }
        .knowledge-reference-grid a > div { display: flex; justify-content: space-between; gap: 16px; margin-top: auto; padding-top: 28px; color: var(--muted); font-size: 13px; }
        .knowledge-reference-grid a > div strong { color: var(--foreground); font-size: 20px; }
        .knowledge-tool-roadmap { display: grid; grid-template-columns: minmax(210px, .65fr) minmax(0, 1.35fr); gap: 52px; margin-top: 58px; }
        .knowledge-tool-roadmap h3 { margin: 8px 0 0; font-size: clamp(28px, 4vw, 40px); letter-spacing: -.04em; }
        .knowledge-tool-roadmap ol { display: grid; margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }
        .knowledge-tool-roadmap li { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 18px; border-bottom: 1px solid var(--border); padding: 22px 0; }
        .knowledge-tool-roadmap li > span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; }
        .knowledge-tool-roadmap p { margin: 8px 0 0; color: var(--muted); line-height: 1.65; }
        .knowledge-module-heading { display: grid; grid-template-columns: minmax(0, .9fr) minmax(280px, 1.1fr); gap: 40px; align-items: end; margin-bottom: 28px; }
        .knowledge-module-heading h2 { margin: 8px 0 0; font-size: clamp(32px, 5vw, 52px); letter-spacing: -.045em; }
        .knowledge-module-heading > p { margin: 0; color: var(--muted); line-height: 1.75; }
        .knowledge-jump { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 70px; }
        .knowledge-jump a { border: 1px solid var(--border); border-radius: 999px; padding: 10px 14px; background: var(--surface); font-size: 13px; }
        .knowledge-jump a:hover { border-color: var(--muted); text-decoration: none; }
        .knowledge-sections { display: grid; gap: 76px; }
        .knowledge-section { scroll-margin-top: 24px; }
        .knowledge-section > header { display: grid; grid-template-columns: 58px minmax(0, 1fr); gap: 22px; margin-bottom: 24px; }
        .knowledge-section > header > span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 13px; padding-top: 12px; }
        .knowledge-section-title-row { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 16px; }
        .knowledge-section-title-row small { color: var(--muted); font-size: 13px; }
        .knowledge-section h2 { margin: 0; font-size: clamp(32px, 5vw, 52px); letter-spacing: -.045em; }
        .knowledge-section h2 a:hover { text-decoration-thickness: 2px; text-underline-offset: 7px; }
        .knowledge-section header p { max-width: 780px; margin: 12px 0 0; color: var(--muted); line-height: 1.75; }
        .knowledge-section-cta { display: inline-flex; margin-top: 15px; font-weight: 700; }
        .knowledge-section ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }
        .knowledge-section li { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 14px; border-bottom: 1px solid var(--border); padding: 20px 18px 20px 0; }
        .knowledge-section li:nth-child(odd) { border-right: 1px solid var(--border); }
        .knowledge-section li:nth-child(even) { padding-left: 18px; }
        .knowledge-section li > span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 11px; padding-top: 4px; }
        .knowledge-section li a { display: grid; gap: 8px; }
        .knowledge-section li a:hover { text-decoration: none; }
        .knowledge-section li a:hover strong { text-decoration: underline; text-underline-offset: 4px; }
        .knowledge-section strong { line-height: 1.55; }
        .knowledge-section small { color: var(--muted); font-size: 12px; }
        @media (max-width: 820px) { .knowledge-beginner, .knowledge-reference-heading, .knowledge-tool-roadmap, .knowledge-module-heading { grid-template-columns: 1fr; } }
        @media (max-width: 760px) { .knowledge-reference-grid, .knowledge-section ol { grid-template-columns: 1fr; } .knowledge-section li:nth-child(odd) { border-right: 0; } .knowledge-section li:nth-child(even) { padding-left: 0; } .knowledge-section > header { grid-template-columns: 36px minmax(0, 1fr); gap: 12px; } }
      `}</style>
    </main>
  );
}
