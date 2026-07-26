import type { ReactNode } from "react";
import Link from "next/link";

import { Container } from "@/components/container";
import { englishArticleRoutePairs } from "@/lib/english-articles-complete";
import { getKnowledgeBasePostPosition } from "@/lib/knowledge-base";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

interface BlogPostLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function BlogPostLayout({ children, params }: BlogPostLayoutProps) {
  const { slug } = await params;
  const chinesePath = `/blog/${slug}`;
  const englishPath = englishArticleRoutePairs[chinesePath];
  const position = getKnowledgeBasePostPosition(slug);
  const languageLinks = englishPath ? (
    <>
      <link rel="alternate" hrefLang="zh-CN" href={`${siteConfig.url}${chinesePath}`} />
      <link rel="alternate" hrefLang="en" href={`${siteConfig.url}${englishPath}`} />
      <link rel="alternate" hrefLang="x-default" href={`${siteConfig.url}${englishPath}`} />
    </>
  ) : null;

  if (!position) return <>{languageLinks}{children}</>;

  const postsBySlug = new Map(getAllPosts().map((post) => [post.slug, post]));
  const currentPost = postsBySlug.get(slug);
  const previousPost = position.previousSlug ? postsBySlug.get(position.previousSlug) : null;
  const nextPost = position.nextSlug ? postsBySlug.get(position.nextSlug) : null;
  const moduleHref = `/knowledge/${position.section.id}`;
  const articleUrl = `${siteConfig.url}/blog/${slug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Screeps知识库", item: `${siteConfig.url}/knowledge` },
      { "@type": "ListItem", position: 3, name: position.section.title, item: `${siteConfig.url}${moduleHref}` },
      { "@type": "ListItem", position: 4, name: currentPost?.title ?? slug, item: articleUrl },
    ],
  };

  return (
    <>
      {languageLinks}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="knowledge-article-context">
        <Container>
          <nav className="knowledge-article-breadcrumb" aria-label="面包屑">
            <Link href="/">首页</Link><span aria-hidden="true">/</span><Link href="/knowledge">知识库</Link><span aria-hidden="true">/</span><Link href={moduleHref}>{position.section.title}</Link><span aria-hidden="true">/</span><span aria-current="page">本文</span>
          </nav>
          <div className="knowledge-article-module-row">
            <div>
              <p className="eyebrow">KNOWLEDGE MODULE {String(position.section.number).padStart(2, "0")}</p>
              <Link className="knowledge-article-module-title" href={moduleHref}>{position.section.title}</Link>
              <p>{position.section.description}</p>
            </div>
            <Link className="knowledge-article-position" href={moduleHref}>
              <span>专题内进度</span><strong>{position.index + 1} / {position.section.slugs.length}</strong><small>查看完整学习顺序 →</small>
            </Link>
          </div>
        </Container>
      </div>

      {children}

      <div className="knowledge-article-navigation">
        <Container>
          <div className="knowledge-article-navigation-heading">
            <div><p className="eyebrow">CONTINUE THIS MODULE</p><h2>继续学习{position.section.title}</h2></div>
            <Link href={moduleHref}>返回专题目录 →</Link>
          </div>
          <nav className="knowledge-article-pagination" aria-label="专题文章导航">
            {previousPost ? (
              <Link href={`/blog/${previousPost.slug}`}><span>专题上一篇</span><strong>{previousPost.title}</strong></Link>
            ) : (
              <Link href={moduleHref}><span>专题起点</span><strong>查看本模块的学习目标与顺序</strong></Link>
            )}
            {nextPost ? (
              <Link href={`/blog/${nextPost.slug}`}><span>专题下一篇</span><strong>{nextPost.title}</strong></Link>
            ) : (
              <Link href="/knowledge"><span>已完成本模块</span><strong>选择下一个知识模块</strong></Link>
            )}
          </nav>
        </Container>
      </div>

      <style>{`
        .article-shell .article-breadcrumb,
        .article-shell > .article-container > article > .article-pagination { display: none; }
        .knowledge-article-context { border-bottom: 1px solid var(--border); padding: 28px 0 34px; background: var(--surface); }
        .knowledge-article-breadcrumb { display: flex; flex-wrap: wrap; gap: 9px; margin-bottom: 25px; color: var(--muted); font-size: 13px; }
        .knowledge-article-breadcrumb a { color: inherit; }
        .knowledge-article-module-row { display: grid; grid-template-columns: minmax(0, 1fr) 180px; gap: 34px; align-items: end; }
        .knowledge-article-module-title { display: inline-flex; margin-top: 7px; font-size: clamp(27px, 4vw, 42px); font-weight: 760; letter-spacing: -.04em; line-height: 1.12; }
        .knowledge-article-module-row > div > p:last-child { max-width: 760px; margin: 12px 0 0; color: var(--muted); line-height: 1.7; }
        .knowledge-article-position { display: grid; gap: 5px; border: 1px solid var(--border); border-radius: 16px; padding: 17px; background: var(--background); }
        .knowledge-article-position:hover { border-color: var(--muted); text-decoration: none; }
        .knowledge-article-position span, .knowledge-article-position small { color: var(--muted); font-size: 11px; }
        .knowledge-article-position strong { font-size: 23px; }
        .knowledge-article-navigation { border-top: 1px solid var(--border); padding: 62px 0 86px; background: var(--surface); }
        .knowledge-article-navigation-heading { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 18px; margin-bottom: 22px; }
        .knowledge-article-navigation-heading h2 { margin: 7px 0 0; font-size: clamp(28px, 4vw, 42px); letter-spacing: -.04em; }
        .knowledge-article-navigation-heading > a { font-weight: 700; }
        .knowledge-article-pagination { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
        .knowledge-article-pagination a { display: grid; gap: 8px; border: 1px solid var(--border); border-radius: 18px; padding: 22px; background: var(--background); }
        .knowledge-article-pagination a:hover { border-color: var(--muted); text-decoration: none; }
        .knowledge-article-pagination span { color: var(--muted); font-size: 12px; }
        .knowledge-article-pagination strong { line-height: 1.5; }
        @media (max-width: 720px) {
          .knowledge-article-module-row { grid-template-columns: 1fr; }
          .knowledge-article-position { width: 100%; }
          .knowledge-article-pagination { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
