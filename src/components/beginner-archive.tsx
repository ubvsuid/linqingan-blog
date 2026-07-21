import { Fragment } from "react";
import Link from "next/link";

import { BeginnerProgressMarker } from "@/components/beginner-progress-marker";
import { BeginnerProgressSummary } from "@/components/beginner-progress-summary";
import { Container } from "@/components/container";
import {
  beginnerSeriesSlugs,
  beginnerStages,
  getBeginnerStageForSlug,
} from "@/lib/beginner-series";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

const stageKnowledgeLinks: Record<
  string,
  { label: string; href: string }
> = {
  "understand-screeps": {
    label: "Memory 与代码工程",
    href: "/knowledge#memory-engineering",
  },
  "control-first-creep": {
    label: "移动、寻路与视野",
    href: "/knowledge#movement-vision",
  },
  "build-room-team": {
    label: "Spawn 与 Creep 生命周期",
    href: "/knowledge#spawn-lifecycle",
  },
  "complete-room-loop": {
    label: "建设与防御",
    href: "/knowledge#construction-defense",
  },
};

export function BeginnerArchive() {
  const allPosts = getAllPosts();
  const posts = beginnerSeriesSlugs.flatMap((slug) => {
    const post = allPosts.find((item) => item.slug === slug);
    return post ? [post] : [];
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "首页",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Screeps 新手入门",
            item: `${siteConfig.url}/beginner`,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Screeps 新手入门学习路线",
        description:
          "按顺序学习 Screeps：从基础概念和 Creep 控制，到角色分工、Controller 升级、Extension 建造与房间基础代码。",
        numberOfItems: posts.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: posts.map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: post.title,
          url: `${siteConfig.url}/blog/${post.slug}`,
        })),
      },
    ],
  };

  return (
    <main className="page-shell beginner-page">
      <Container>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <header className="page-header beginner-header">
          <p className="eyebrow">SCREEPS BEGINNER</p>
          <h1>Screeps 新手入门</h1>
          <p>
            12 篇文章组成一条完整学习路线：从认识游戏、控制第一只 Creep，到完成采集运输、角色分工、Controller 升级、Extension 建造与第一份房间代码。
          </p>
          <p className="beginner-header-note">
            建议按顺序学习。遇到术语或返回码时，不必退出路线，可以使用下面的辅助入口查询后继续。
          </p>
        </header>

        <BeginnerProgressSummary />

        <nav className="beginner-support-grid" aria-label="入门辅助入口">
          <Link href="/glossary">
            <span>术语查询</span>
            <strong>Screeps 术语表</strong>
            <p>快速理解 Creep、Spawn、Controller、tick、RCL 等常用概念。</p>
          </Link>
          <Link href="/screeps-errors">
            <span>错误排查</span>
            <strong>Screeps 错误码</strong>
            <p>遇到 ERR_NOT_IN_RANGE、ERR_FULL 或能量不足时，直接查询含义和处理方向。</p>
          </Link>
          <Link href="/knowledge">
            <span>完成入门后</span>
            <strong>专题知识库</strong>
            <p>按 Memory、Spawn、房间经济、寻路、建设与运行诊断继续学习。</p>
          </Link>
        </nav>

        <nav className="beginner-stage-nav" aria-label="入门阶段导航">
          {beginnerStages.map((stage) => (
            <a key={stage.id} href={`#${stage.id}`}>
              {String(stage.number).padStart(2, "0")} · {stage.title}
            </a>
          ))}
        </nav>

        <div className="beginner-list" aria-label="Screeps 新手入门完整路线">
          {posts.map((post, index) => {
            const stage = getBeginnerStageForSlug(post.slug);
            const previousPost = posts[index - 1];
            const previousStage = previousPost
              ? getBeginnerStageForSlug(previousPost.slug)
              : undefined;
            const showStageHeading =
              stage && (!previousStage || previousStage.id !== stage.id);
            const knowledgeLink = stage
              ? stageKnowledgeLinks[stage.id]
              : undefined;

            return (
              <Fragment key={post.slug}>
                {showStageHeading ? (
                  <section className="beginner-stage-heading" id={stage.id}>
                    <span>阶段 {stage.number}</span>
                    <div>
                      <strong>{stage.title}</strong>
                      <p>{stage.description}</p>
                      {knowledgeLink ? (
                        <Link href={knowledgeLink.href}>
                          完成本阶段后查看：{knowledgeLink.label} →
                        </Link>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                <Link className="beginner-item" href={`/blog/${post.slug}`}>
                  <span className="beginner-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="beginner-copy">
                    <strong>{post.title}</strong>
                    <span>{post.description}</span>
                  </span>
                  <span className="beginner-meta">
                    <span>{post.readingMinutes} 分钟</span>
                    <BeginnerProgressMarker slug={post.slug} />
                    <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </Fragment>
            );
          })}
        </div>

        <section className="beginner-complete" aria-labelledby="beginner-complete-title">
          <div>
            <p className="eyebrow">AFTER THE BEGINNER PATH</p>
            <h2 id="beginner-complete-title">完成12篇后，先从 Memory 整理这份代码</h2>
            <p>
              入门路线使用固定名称帮助你看清每一步。下一阶段应学习跨 tick 状态、角色字段、自动补员和模块拆分，让房间从“能运行”走向“更稳定”。
            </p>
          </div>
          <div className="beginner-complete-links">
            <Link href="/blog/screeps-memory-basics">从 Memory 基础开始 →</Link>
            <Link href="/knowledge">按主题浏览知识库 →</Link>
            <Link href="/blog">查看全部文章 →</Link>
          </div>
        </section>
      </Container>

      <style>{`
        .beginner-header {
          max-width: 920px;
        }

        .beginner-header-note {
          margin-top: 14px !important;
          color: var(--muted);
          font-size: 14px;
        }

        .beginner-support-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin: 38px 0 28px;
        }

        .beginner-support-grid a {
          display: grid;
          gap: 9px;
          min-height: 172px;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 22px;
          background: var(--surface);
          transition: transform 160ms ease, border-color 160ms ease;
        }

        .beginner-support-grid a:hover {
          transform: translateY(-2px);
          border-color: var(--muted);
          text-decoration: none;
        }

        .beginner-support-grid span {
          color: var(--muted);
          font-size: 12px;
        }

        .beginner-support-grid strong {
          font-size: 18px;
        }

        .beginner-support-grid p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .beginner-stage-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 48px;
        }

        .beginner-stage-nav a {
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 9px 13px;
          background: var(--surface);
          font-size: 13px;
        }

        .beginner-stage-nav a:hover {
          border-color: var(--muted);
          text-decoration: none;
        }

        .beginner-list {
          border-top: 1px solid var(--border);
        }

        .beginner-stage-heading {
          display: grid;
          grid-template-columns: 70px minmax(0, 1fr);
          gap: 28px;
          align-items: start;
          scroll-margin-top: 24px;
          border-bottom: 1px solid var(--border);
          padding: 32px 4px 24px;
          background: color-mix(in srgb, var(--surface) 70%, transparent);
        }

        .beginner-stage-heading > span {
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 12px;
          text-transform: uppercase;
        }

        .beginner-stage-heading > div {
          display: grid;
          gap: 7px;
        }

        .beginner-stage-heading strong {
          font-size: 18px;
        }

        .beginner-stage-heading p {
          max-width: 760px;
          margin: 0;
          color: var(--muted);
          line-height: 1.7;
        }

        .beginner-stage-heading a {
          width: fit-content;
          margin-top: 4px;
          font-size: 13px;
          font-weight: 650;
        }

        .beginner-item {
          display: grid;
          grid-template-columns: 70px minmax(0, 1fr) auto;
          gap: 28px;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding: 30px 4px;
          transition: padding 180ms ease, background-color 180ms ease;
        }

        .beginner-item:hover {
          padding-inline: 18px;
          background: var(--surface);
          text-decoration: none;
        }

        .beginner-number,
        .beginner-meta {
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 12px;
        }

        .beginner-copy {
          display: grid;
          gap: 10px;
        }

        .beginner-copy strong {
          font-size: clamp(24px, 3.4vw, 38px);
          line-height: 1.2;
          letter-spacing: -0.04em;
        }

        .beginner-copy > span {
          max-width: 760px;
          color: var(--muted);
          line-height: 1.7;
        }

        .beginner-meta {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 9px;
          white-space: nowrap;
        }

        .beginner-complete {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(260px, .85fr);
          gap: 38px;
          margin-top: 72px;
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: clamp(28px, 5vw, 48px);
          background: var(--surface);
        }

        .beginner-complete h2 {
          margin: 8px 0 16px;
          font-size: clamp(30px, 5vw, 48px);
          line-height: 1.15;
          letter-spacing: -.045em;
        }

        .beginner-complete p:not(.eyebrow) {
          margin: 0;
          color: var(--muted);
          line-height: 1.8;
        }

        .beginner-complete-links {
          display: grid;
          align-content: center;
          gap: 14px;
          font-weight: 650;
        }

        @media (max-width: 820px) {
          .beginner-support-grid,
          .beginner-complete {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .beginner-stage-heading,
          .beginner-item {
            grid-template-columns: 44px minmax(0, 1fr);
            gap: 16px;
          }

          .beginner-stage-heading {
            padding-block: 24px 18px;
          }

          .beginner-item {
            padding-block: 24px;
          }

          .beginner-meta {
            grid-column: 2;
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
