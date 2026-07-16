import { Fragment } from "react";
import Link from "next/link";

import { BeginnerProgressMarker } from "@/components/beginner-progress-marker";
import { BeginnerProgressSummary } from "@/components/beginner-progress-summary";
import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
import {
  beginnerSeriesSlugs,
  getBeginnerStageForSlug,
} from "@/lib/beginner-series";
import {
  DEFAULT_ITEMS_PER_PAGE,
  paginateItems,
} from "@/lib/pagination";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

interface BeginnerArchiveProps {
  currentPage: number;
}

export function BeginnerArchive({ currentPage }: BeginnerArchiveProps) {
  const allPosts = getAllPosts();
  const posts = beginnerSeriesSlugs.flatMap((slug) => {
    const post = allPosts.find((item) => item.slug === slug);
    return post ? [post] : [];
  });
  const pagination = paginateItems(posts, currentPage);
  const firstItemIndex =
    (pagination.currentPage - 1) * DEFAULT_ITEMS_PER_PAGE;
  const currentPath =
    pagination.currentPage === 1
      ? "/beginner"
      : `/beginner/page/${pagination.currentPage}`;
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
          ...(pagination.currentPage > 1
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: `第 ${pagination.currentPage} 页`,
                  item: `${siteConfig.url}${currentPath}`,
                },
              ]
            : []),
        ],
      },
      {
        "@type": "ItemList",
        name: "Screeps 新手入门学习路线",
        description:
          "按顺序学习 Screeps 的基础概念、Creep 控制和最初的生产循环。",
        numberOfItems: posts.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: pagination.items.map((post, index) => ({
          "@type": "ListItem",
          position: firstItemIndex + index + 1,
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
            从认识游戏开始，按顺序完成界面、tick、移动、采集、运输、身体部件和创建 Creep。
            每篇只解决一个问题。
          </p>
        </header>

        <BeginnerProgressSummary />

        <div
          className="beginner-list"
          aria-label={`Screeps 新手入门第 ${pagination.currentPage} 页`}
        >
          {pagination.items.map((post, index) => {
            const stage = getBeginnerStageForSlug(post.slug);
            const previousPost = pagination.items[index - 1];
            const previousStage = previousPost
              ? getBeginnerStageForSlug(previousPost.slug)
              : undefined;
            const showStageHeading =
              stage && (!previousStage || previousStage.id !== stage.id);

            return (
              <Fragment key={post.slug}>
                {showStageHeading ? (
                  <div className="beginner-stage-heading">
                    <span>阶段 {stage.number}</span>
                    <div>
                      <strong>{stage.title}</strong>
                      <p>{stage.description}</p>
                    </div>
                  </div>
                ) : null}

                <Link
                  className="beginner-item"
                  href={`/blog/${post.slug}`}
                >
                  <span className="beginner-number">
                    {String(firstItemIndex + index + 1).padStart(2, "0")}
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

        <CollectionPagination
          key={pagination.currentPage}
          ariaLabel="Screeps 新手入门分页"
          basePath="/beginner"
          currentPage={pagination.currentPage}
          itemLabel="篇"
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
        />
      </Container>

      <style>{`
        .beginner-header {
          max-width: 900px;
        }

        .beginner-list {
          border-top: 1px solid var(--border);
        }

        .beginner-stage-heading {
          display: grid;
          grid-template-columns: 70px minmax(0, 1fr);
          gap: 28px;
          align-items: start;
          border-bottom: 1px solid var(--border);
          padding: 28px 4px 22px;
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

        .beginner-item {
          display: grid;
          grid-template-columns: 70px minmax(0, 1fr) auto;
          gap: 28px;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding: 30px 4px;
          transition:
            padding 180ms ease,
            background-color 180ms ease;
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
