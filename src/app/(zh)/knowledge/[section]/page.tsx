import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/container";
import { KnowledgeSystemMap } from "@/components/knowledge-system-map";
import {
  getKnowledgeBaseSection,
  knowledgeBaseSections,
} from "@/lib/knowledge-base";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

interface KnowledgeSectionPageProps {
  params: Promise<{ section: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return knowledgeBaseSections.map((section) => ({ section: section.id }));
}

export async function generateMetadata({
  params,
}: KnowledgeSectionPageProps): Promise<Metadata> {
  const { section: sectionId } = await params;
  const section = getKnowledgeBaseSection(sectionId);

  if (!section) {
    return {
      title: "知识模块不存在",
      robots: { index: false, follow: false },
    };
  }

  const path = `/knowledge/${section.id}`;
  return {
    title: section.title,
    description: `${section.description} 共 ${section.slugs.length} 篇 Screeps 中文专题文章，按推荐顺序分阶段学习。`,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      title: `${section.title} | 临清安`,
      description: section.description,
    },
  };
}

export default async function KnowledgeSectionPage({
  params,
}: KnowledgeSectionPageProps) {
  const { section: sectionId } = await params;
  const section = getKnowledgeBaseSection(sectionId);
  if (!section) notFound();

  const postsBySlug = new Map(getAllPosts().map((post) => [post.slug, post]));
  const sectionIndex = knowledgeBaseSections.findIndex((item) => item.id === section.id);
  const previousSection = sectionIndex > 0 ? knowledgeBaseSections[sectionIndex - 1] : null;
  const nextSection =
    sectionIndex < knowledgeBaseSections.length - 1
      ? knowledgeBaseSections[sectionIndex + 1]
      : null;
  const sectionUrl = `${siteConfig.url}/knowledge/${section.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: section.title,
        description: section.description,
        url: sectionUrl,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: section.slugs.length,
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          itemListElement: section.slugs.map((slug, index) => {
            const post = postsBySlug.get(slug);
            return {
              "@type": "ListItem",
              position: index + 1,
              name: post?.title ?? slug,
              url: `${siteConfig.url}/blog/${slug}`,
            };
          }),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          {
            "@type": "ListItem",
            position: 2,
            name: "Screeps知识库",
            item: `${siteConfig.url}/knowledge`,
          },
          { "@type": "ListItem", position: 3, name: section.title, item: sectionUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell knowledge-module-page">
      <Container>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <nav className="module-breadcrumb" aria-label="面包屑">
          <Link href="/">首页</Link>
          <span aria-hidden="true">/</span>
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{section.title}</span>
        </nav>

        <header className="module-header">
          <p className="eyebrow">KNOWLEDGE MODULE {String(section.number).padStart(2, "0")}</p>
          <h1>{section.title}</h1>
          <p className="module-description">{section.description}</p>
          <div className="module-stats" aria-label="模块信息">
            <span><strong>{section.slugs.length}</strong> 篇文章</span>
            <span><strong>{section.stages.length}</strong> 个学习阶段</span>
            <span><strong>{section.number}</strong> / {knowledgeBaseSections.length} 模块</span>
          </div>
        </header>

        <section className="module-overview" aria-labelledby="module-overview-title">
          <div>
            <p className="eyebrow">WHO IT IS FOR</p>
            <h2 id="module-overview-title">适合谁学习</h2>
            <p>{section.audience}</p>
          </div>
          <div>
            <p className="eyebrow">LEARNING GOAL</p>
            <h2>完成后能解决什么</h2>
            <p>{section.learningGoal}</p>
          </div>
        </section>

        <KnowledgeSystemMap moduleNumber={section.number} locale="zh" />

        <div className="module-stage-list">
          {section.stages.map((stage, stageIndex) => {
            const stageSlugs = section.slugs.slice(stage.from, stage.to);
            return (
              <section className="module-stage" key={stage.title}>
                <header>
                  <span>{String(stageIndex + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="eyebrow">LEARNING STAGE</p>
                    <h2>{stage.title}</h2>
                    <p>{stage.description}</p>
                  </div>
                </header>
                <ol>
                  {stageSlugs.map((slug) => {
                    const post = postsBySlug.get(slug);
                    const articleIndex = section.slugs.indexOf(slug);
                    if (!post) return null;
                    return (
                      <li key={slug}>
                        <span>{String(articleIndex + 1).padStart(2, "0")}</span>
                        <Link href={`/blog/${slug}`}>
                          <strong>{post.title}</strong>
                          <small>{post.category} · {post.readingMinutes} 分钟阅读</small>
                          <p>{post.description}</p>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>

        <nav className="module-pagination" aria-label="知识模块导航">
          {previousSection ? (
            <Link href={`/knowledge/${previousSection.id}`}>
              <span>上一个模块</span>
              <strong>{previousSection.title}</strong>
            </Link>
          ) : (
            <Link href="/beginner">
              <span>学习前置</span>
              <strong>12篇新手入门路线</strong>
            </Link>
          )}
          {nextSection ? (
            <Link href={`/knowledge/${nextSection.id}`}>
              <span>下一个模块</span>
              <strong>{nextSection.title}</strong>
            </Link>
          ) : (
            <Link href="/knowledge">
              <span>已浏览全部模块</span>
              <strong>返回Screeps知识库</strong>
            </Link>
          )}
        </nav>
      </Container>

      <style>{`
        .knowledge-module-page { padding-top: 46px; }
        .module-breadcrumb { display: flex; flex-wrap: wrap; gap: 9px; margin-bottom: 46px; color: var(--muted); font-size: 13px; }
        .module-breadcrumb a { color: inherit; }
        .module-header { max-width: 930px; margin-bottom: 54px; }
        .module-header h1 { max-width: 900px; margin: 10px 0 20px; font-size: clamp(46px, 8vw, 86px); letter-spacing: -.06em; line-height: 1.02; }
        .module-description { max-width: 800px; margin: 0; color: var(--muted); font-size: clamp(17px, 2.2vw, 21px); line-height: 1.8; }
        .module-stats { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
        .module-stats span { border: 1px solid var(--border); border-radius: 999px; padding: 9px 14px; color: var(--muted); font-size: 13px; }
        .module-stats strong { color: var(--foreground); font-size: 16px; }
        .module-overview { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-bottom: 42px; }
        .module-overview > div { border: 1px solid var(--border); border-radius: 22px; padding: clamp(24px, 4vw, 38px); background: var(--surface); }
        .module-overview h2 { margin: 8px 0 14px; font-size: clamp(26px, 4vw, 38px); letter-spacing: -.04em; }
        .module-overview p:last-child { margin: 0; color: var(--muted); line-height: 1.75; }
        .module-stage-list { display: grid; gap: 78px; }
        .module-stage > header { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 18px; margin-bottom: 22px; }
        .module-stage > header > span { padding-top: 9px; color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; }
        .module-stage h2 { margin: 7px 0 10px; font-size: clamp(32px, 5vw, 52px); letter-spacing: -.045em; }
        .module-stage header p:last-child { max-width: 760px; margin: 0; color: var(--muted); line-height: 1.7; }
        .module-stage ol { display: grid; margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }
        .module-stage li { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 16px; border-bottom: 1px solid var(--border); padding: 24px 0; }
        .module-stage li > span { padding-top: 5px; color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 11px; }
        .module-stage li a { display: grid; gap: 8px; }
        .module-stage li a:hover { text-decoration: none; }
        .module-stage li a:hover strong { text-decoration: underline; text-underline-offset: 4px; }
        .module-stage li strong { font-size: clamp(18px, 2.4vw, 23px); line-height: 1.45; }
        .module-stage li small { color: var(--muted); font-size: 12px; }
        .module-stage li p { max-width: 760px; margin: 2px 0 0; color: var(--muted); line-height: 1.65; }
        .module-pagination { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 86px; }
        .module-pagination a { display: grid; gap: 7px; border: 1px solid var(--border); border-radius: 18px; padding: 22px; background: var(--surface); }
        .module-pagination a:hover { border-color: var(--muted); text-decoration: none; }
        .module-pagination span { color: var(--muted); font-size: 12px; }
        .module-pagination strong { line-height: 1.45; }
        @media (max-width: 720px) { .module-overview, .module-pagination { grid-template-columns: 1fr; } .module-stage > header, .module-stage li { grid-template-columns: 34px minmax(0, 1fr); gap: 10px; } }
      `}</style>
    </main>
  );
}
