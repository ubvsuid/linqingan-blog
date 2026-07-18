import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleEnhancements } from "@/components/article-enhancements";
import { ArticleFeedback } from "@/components/article-feedback";
import { Container } from "@/components/container";
import {
  beginnerSeriesSlugs,
  getBeginnerSeriesIndex,
} from "@/lib/beginner-series";
import { formatDate } from "@/lib/date";
import {
  getAllPosts,
  getArticlePosts,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/posts";
import { siteConfig } from "@/lib/site";
import { tagToSlug } from "@/lib/tags";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "文章不存在",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const path = `/blog/${post.slug}`;
  const socialImage = post.cover ?? `${siteConfig.url}/opengraph-image`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "article",
      url: path,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      tags: post.tags,
      images: [{ url: socialImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [socialImage],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const articleUrl = `${siteConfig.url}/blog/${post.slug}`;
  const beginnerIndex = getBeginnerSeriesIndex(post.slug);
  const isBeginnerPost = beginnerIndex >= 0;
  const allPosts = getAllPosts();
  const articlePosts = getArticlePosts();
  const articleIndex = articlePosts.findIndex((item) => item.slug === post.slug);
  const visibleUpdatedAt =
    post.updatedAt && post.updatedAt !== post.publishedAt
      ? post.updatedAt
      : null;

  const previousSlug =
    beginnerIndex > 0 ? beginnerSeriesSlugs[beginnerIndex - 1] : null;
  const nextSlug =
    beginnerIndex >= 0 && beginnerIndex < beginnerSeriesSlugs.length - 1
      ? beginnerSeriesSlugs[beginnerIndex + 1]
      : null;
  const previousPost = previousSlug
    ? allPosts.find((item) => item.slug === previousSlug)
    : undefined;
  const nextPost = nextSlug
    ? allPosts.find((item) => item.slug === nextSlug)
    : undefined;

  const ordinaryPreviousPost =
    !isBeginnerPost && articleIndex > 0
      ? articlePosts[articleIndex - 1]
      : undefined;
  const ordinaryNextPost =
    !isBeginnerPost &&
    articleIndex >= 0 &&
    articleIndex < articlePosts.length - 1
      ? articlePosts[articleIndex + 1]
      : undefined;
  const relatedPosts = isBeginnerPost ? [] : getRelatedPosts(post, 3);
  const articleId = `article-content-${post.slug}`;
  const sectionName = isBeginnerPost ? "Screeps 新手入门" : "文章";
  const sectionHref = isBeginnerPost ? "/beginner" : "/blog";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt ?? post.publishedAt,
        mainEntityOfPage: articleUrl,
        url: articleUrl,
        author: {
          "@type": "Person",
          name: siteConfig.author.name,
          url: `${siteConfig.url}/about`,
        },
        publisher: {
          "@type": "Person",
          name: siteConfig.author.name,
          url: `${siteConfig.url}/about`,
        },
        keywords: post.tags.join(", "),
      },
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
            name: sectionName,
            item: `${siteConfig.url}${sectionHref}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: articleUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="article-shell">
      <Container className="article-container">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <article>
          <header className="article-header">
            <nav className="article-breadcrumb" aria-label="面包屑">
              <Link href="/">首页</Link>
              <span aria-hidden="true">/</span>
              <Link href={sectionHref}>{sectionName}</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">本文</span>
            </nav>
            <p className="eyebrow">{post.category}</p>
            <h1>{post.title}</h1>
            <p className="article-description">{post.description}</p>
            <div className="post-meta">
              <time dateTime={post.publishedAt}>
                发布于 {formatDate(post.publishedAt)}
              </time>
              {visibleUpdatedAt ? (
                <>
                  <span aria-hidden="true">/</span>
                  <time dateTime={visibleUpdatedAt}>
                    更新于 {formatDate(visibleUpdatedAt)}
                  </time>
                </>
              ) : null}
              <span aria-hidden="true">/</span>
              <span>{post.readingMinutes} 分钟阅读</span>
            </div>
            <div className="tag-list" aria-label="文章标签">
              {post.tags.map((tag) => (
                <Link className="tag" key={tag} href={`/tags/${tagToSlug(tag)}`}>
                  {tag}
                </Link>
              ))}
            </div>
          </header>

          <section className="verification-status" aria-labelledby="verification-status-title">
            <div>
              <p className="eyebrow">VERIFICATION</p>
              <h2 id="verification-status-title">验证状态</h2>
            </div>
            <dl>
              <div>
                <dt>官方文档</dt>
                <dd>{post.verification.docsChecked ? "已核对" : "待核对"}</dd>
              </div>
              <div>
                <dt>JavaScript 语法</dt>
                <dd>{post.verification.syntaxChecked ? "已检查" : "待检查"}</dd>
              </div>
              <div>
                <dt>Screeps Console</dt>
                <dd>{post.verification.consoleTested ? "已测试" : "待测试"}</dd>
              </div>
              <div>
                <dt>真实主循环</dt>
                <dd>{post.verification.liveTested ? "已验证" : "待验证"}</dd>
              </div>
              <div>
                <dt>最后核对</dt>
                <dd>{formatDate(post.verification.checkedAt)}</dd>
              </div>
            </dl>
          </section>

          {isBeginnerPost ? (
            <section className="series-status" aria-label="系列阅读进度">
              <div className="series-status-copy">
                <span>Screeps 新手入门</span>
                <strong>
                  第 {beginnerIndex + 1} / {beginnerSeriesSlugs.length} 篇
                </strong>
              </div>
              <div
                className="series-progress"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={beginnerSeriesSlugs.length}
                aria-valuenow={beginnerIndex + 1}
              >
                <span
                  style={{
                    width: `${((beginnerIndex + 1) / beginnerSeriesSlugs.length) * 100}%`,
                  }}
                />
              </div>
            </section>
          ) : null}

          {post.tableOfContents.length > 1 ? (
            <nav className="article-toc" aria-label="本文目录">
              <p className="article-toc-title">本文目录</p>
              <ol>
                {post.tableOfContents.map((item) => (
                  <li
                    className={item.level === 3 ? "toc-level-three" : undefined}
                    key={item.id}
                  >
                    <a href={`#${item.id}`}>{item.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div
            id={articleId}
            className="article-content"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
          <ArticleEnhancements articleId={articleId} />

          <ArticleFeedback
            slug={post.slug}
            title={post.title}
            articleUrl={articleUrl}
            email={siteConfig.author.email}
            issueUrl={siteConfig.links.issues}
          />

          {relatedPosts.length > 0 ? (
            <section className="related-posts" aria-labelledby="related-posts-title">
              <div>
                <p className="eyebrow">CONTINUE</p>
                <h2 id="related-posts-title">继续阅读</h2>
              </div>
              <div className="related-post-grid">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`}>
                    <span>{relatedPost.category}</span>
                    <strong>{relatedPost.title}</strong>
                    <small>{relatedPost.readingMinutes} 分钟阅读</small>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {isBeginnerPost ? (
            <nav className="article-pagination" aria-label="系列文章导航">
              {previousPost ? (
                <Link
                  className="article-pagination-link article-pagination-previous"
                  href={`/blog/${previousPost.slug}`}
                >
                  <span>上一篇</span>
                  <strong>{previousPost.title}</strong>
                </Link>
              ) : (
                <span className="article-pagination-placeholder" />
              )}

              {nextPost ? (
                <Link
                  className="article-pagination-link article-pagination-next"
                  href={`/blog/${nextPost.slug}`}
                >
                  <span>下一篇</span>
                  <strong>{nextPost.title}</strong>
                </Link>
              ) : (
                <Link
                  className="article-pagination-link article-pagination-next"
                  href="/beginner"
                >
                  <span>已读完</span>
                  <strong>返回入门目录</strong>
                </Link>
              )}
            </nav>
          ) : ordinaryPreviousPost || ordinaryNextPost ? (
            <nav className="article-pagination" aria-label="文章导航">
              {ordinaryPreviousPost ? (
                <Link
                  className="article-pagination-link article-pagination-previous"
                  href={`/blog/${ordinaryPreviousPost.slug}`}
                >
                  <span>上一篇</span>
                  <strong>{ordinaryPreviousPost.title}</strong>
                </Link>
              ) : (
                <span className="article-pagination-placeholder" />
              )}
              {ordinaryNextPost ? (
                <Link
                  className="article-pagination-link article-pagination-next"
                  href={`/blog/${ordinaryNextPost.slug}`}
                >
                  <span>下一篇</span>
                  <strong>{ordinaryNextPost.title}</strong>
                </Link>
              ) : (
                <Link
                  className="article-pagination-link article-pagination-next"
                  href="/blog"
                >
                  <span>继续浏览</span>
                  <strong>返回全部文章</strong>
                </Link>
              )}
            </nav>
          ) : null}
        </article>
      </Container>

      <style>{`
        .article-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 34px;
          color: var(--muted);
          font-size: 13px;
        }

        .article-breadcrumb a:hover,
        .tag-list .tag:hover {
          color: var(--foreground);
        }

        .tag-list .tag {
          text-decoration: none;
        }

        .series-status {
          margin: -24px 0 52px;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 20px 22px;
          background: var(--surface);
        }

        .verification-status {
          display: grid;
          grid-template-columns: minmax(150px, .45fr) minmax(0, 1.55fr);
          gap: 30px;
          margin: -24px 0 52px;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 20px 22px;
          background: var(--surface);
        }

        .verification-status h2 {
          margin: 7px 0 0;
          font-size: 20px;
        }

        .verification-status dl {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 24px;
          margin: 0;
        }

        .verification-status dl > div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .verification-status dt {
          color: var(--muted);
        }

        .verification-status dd {
          margin: 0;
          font-weight: 650;
        }

        .series-status-copy {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 14px;
          font-size: 14px;
        }

        .series-status-copy span {
          color: var(--muted);
        }

        .series-progress {
          height: 3px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--surface-soft);
        }

        .series-progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--foreground);
        }

        .article-toc {
          margin: 0 0 58px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 26px 0;
        }

        .article-toc-title {
          margin: 0 0 14px;
          font-weight: 700;
        }

        .article-toc ol {
          display: grid;
          gap: 9px;
          margin: 0;
          padding-left: 22px;
          color: var(--muted);
        }

        .article-toc li::marker {
          color: var(--border);
        }

        .article-toc .toc-level-three {
          margin-left: 20px;
          font-size: 0.94em;
        }

        .article-toc a:hover {
          color: var(--foreground);
        }

        .article-content pre.has-copy-button {
          position: relative;
          padding-top: 58px;
        }

        .copy-code-button {
          position: absolute;
          top: 12px;
          right: 12px;
          min-width: 62px;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 7px 12px;
          background: var(--surface);
          color: var(--muted);
          font-size: 12px;
          line-height: 1;
          cursor: pointer;
        }

        .copy-code-button:hover {
          color: var(--foreground);
        }

        .related-posts {
          display: grid;
          grid-template-columns: minmax(180px, .55fr) minmax(0, 1.45fr);
          gap: 42px;
          margin-top: 72px;
        }

        .related-posts h2 {
          margin: 8px 0 0;
          font-size: clamp(28px, 4vw, 42px);
          letter-spacing: -.04em;
        }

        .related-post-grid {
          display: grid;
          gap: 10px;
        }

        .related-post-grid a {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px 18px;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 19px 20px;
          background: var(--surface);
        }

        .related-post-grid a:hover {
          border-color: var(--muted);
          text-decoration: none;
        }

        .related-post-grid span,
        .related-post-grid small {
          color: var(--muted);
          font-size: 12px;
        }

        .related-post-grid strong {
          grid-column: 1;
          line-height: 1.45;
        }

        .related-post-grid small {
          grid-column: 2;
          grid-row: 1 / span 2;
          align-self: center;
        }

        .article-pagination {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 80px;
          border-top: 1px solid var(--border);
          padding-top: 28px;
        }

        .article-pagination-link {
          display: grid;
          gap: 8px;
          min-height: 132px;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 22px;
          background: var(--surface);
          transition: transform 160ms ease, border-color 160ms ease;
        }

        .article-pagination-link:hover {
          transform: translateY(-2px);
          border-color: var(--muted);
          text-decoration: none;
        }

        .article-pagination-link span {
          color: var(--muted);
          font-size: 13px;
        }

        .article-pagination-link strong {
          line-height: 1.45;
        }

        .article-pagination-next {
          text-align: right;
        }

        @media (max-width: 720px) {
          .related-posts {
            grid-template-columns: 1fr;
            gap: 26px;
          }
        }

        @media (max-width: 640px) {
          .verification-status {
            grid-template-columns: 1fr;
          }

          .verification-status dl {
            grid-template-columns: 1fr;
          }

          .series-status-copy {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }

          .article-toc .toc-level-three {
            margin-left: 8px;
          }

          .article-pagination {
            grid-template-columns: 1fr;
          }

          .article-pagination-placeholder {
            display: none;
          }

          .article-pagination-next {
            text-align: left;
          }
        }
      `}</style>
    </main>
  );
}

