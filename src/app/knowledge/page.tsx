import Link from "next/link";

import { Container } from "@/components/container";
import { beginnerSeriesSlugs, beginnerStages } from "@/lib/beginner-series";
import { knowledgeBaseSections, knowledgeBaseSlugs } from "@/lib/knowledge-base";
import { createPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/lib/posts";

export const metadata = createPageMetadata({
  title: "Screeps知识库",
  description:
    "先通过 12 篇 Screeps 新手路线建立基础，再按 Memory、Spawn、房间经济、寻路、Controller、建设防御、高级资源与运行诊断查找专题文章。",
  path: "/knowledge",
});

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
            第一次接触 Screeps，先按顺序完成新手路线；已经遇到具体 API、报错或系统问题时，再进入下面对应的知识模块。
          </p>
          <div className="knowledge-stats" aria-label="知识库数据">
            <span><strong>{beginnerSeriesSlugs.length}</strong> 篇新手路线</span>
            <span><strong>{knowledgeBaseSlugs.length}</strong> 篇专题文章</span>
            <span><strong>{knowledgeBaseSections.length}</strong> 个知识模块</span>
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

        <div className="knowledge-module-heading">
          <div>
            <p className="eyebrow">TOPIC MODULES</p>
            <h2>按问题进入知识模块</h2>
          </div>
          <p>下面的文章不要求按顺序阅读。找到当前问题所属模块，再进入对应文章。</p>
        </div>

        <nav className="knowledge-jump" aria-label="知识库主题导航">
          {knowledgeBaseSections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {String(section.number).padStart(2, "0")} · {section.title}
            </a>
          ))}
        </nav>

        <div className="knowledge-sections">
          {knowledgeBaseSections.map((section) => (
            <section key={section.id} id={section.id} className="knowledge-section">
              <header>
                <span>{String(section.number).padStart(2, "0")}</span>
                <div>
                  <div className="knowledge-section-title-row">
                    <h2>{section.title}</h2>
                    <small>{section.slugs.length} 篇</small>
                  </div>
                  <p>{section.description}</p>
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
        .knowledge-section header p { max-width: 780px; margin: 12px 0 0; color: var(--muted); line-height: 1.75; }
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
        @media (max-width: 820px) { .knowledge-beginner, .knowledge-module-heading { grid-template-columns: 1fr; } }
        @media (max-width: 760px) { .knowledge-section ol { grid-template-columns: 1fr; } .knowledge-section li:nth-child(odd) { border-right: 0; } .knowledge-section li:nth-child(even) { padding-left: 0; } .knowledge-section > header { grid-template-columns: 36px minmax(0, 1fr); gap: 12px; } }
      `}</style>
    </main>
  );
}
