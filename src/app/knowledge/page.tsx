import Link from "next/link";

import { Container } from "@/components/container";
import { knowledgeBaseSections, knowledgeBaseSlugs } from "@/lib/knowledge-base";
import { createPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/lib/posts";

export const metadata = createPageMetadata({
  title: "Screeps 中文知识库",
  description: "60 篇互不重复的 Screeps 中文教程，按入门、Memory、Spawn、资源经济、寻路、防御、高级资源与运行诊断分组。",
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
          <h1>60 篇 Screeps 中文知识库</h1>
          <p>
            每篇只解决一个主要问题。建议第一次学习从第 1 组开始；遇到具体报错或 API 问题时，直接进入对应主题组。
          </p>
          <div className="knowledge-stats" aria-label="知识库数据">
            <span><strong>{knowledgeBaseSlugs.length}</strong> 篇文章</span>
            <span><strong>{knowledgeBaseSections.length}</strong> 个主题组</span>
            <span><strong>{allPosts.length}</strong> 篇已发布</span>
          </div>
        </header>

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
                  <h2>{section.title}</h2>
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
        .knowledge-jump { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 60px; }
        .knowledge-jump a { border: 1px solid var(--border); border-radius: 999px; padding: 10px 14px; background: var(--surface); font-size: 13px; }
        .knowledge-jump a:hover { border-color: var(--muted); text-decoration: none; }
        .knowledge-sections { display: grid; gap: 76px; }
        .knowledge-section { scroll-margin-top: 24px; }
        .knowledge-section > header { display: grid; grid-template-columns: 58px minmax(0, 1fr); gap: 22px; margin-bottom: 24px; }
        .knowledge-section > header > span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 13px; padding-top: 12px; }
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
        @media (max-width: 760px) { .knowledge-section ol { grid-template-columns: 1fr; } .knowledge-section li:nth-child(odd) { border-right: 0; } .knowledge-section li:nth-child(even) { padding-left: 0; } .knowledge-section > header { grid-template-columns: 36px minmax(0, 1fr); gap: 12px; } }
      `}</style>
    </main>
  );
}

