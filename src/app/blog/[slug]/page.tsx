import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleEnhancements } from "@/components/article-enhancements";
import { Container } from "@/components/container";
import {
  beginnerSeriesSlugs,
  getBeginnerSeriesIndex,
} from "@/lib/beginner-series";
import { formatDate } from "@/lib/date";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

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
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.cover ? [post.cover] : undefined,
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
  const articleId = `article-content-${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
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
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.author.name,
    },
    keywords: post.tags.join(", "),
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
            <Link
              href={isBeginnerPost ? "/beginner" : "/blog"}
              className="back-link"
            >
              ← {isBeginnerPost ? "返回入门" : "返回文章"}
            </Link>
            <p className="eyebrow">{post.category}</p>
            <h1>{post.title}</h1>
            <p className="article-description">{post.description}</p>
            <div className="post-meta">
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
              <span aria-hidden="true">/</span>
              <span>{post.readingMinutes} 分钟阅读</span>
            </div>
            <div className="tag-list">
              {post.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </header>

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
          ) : null}
        </article>
      </Container>

      <style>{`
        .series-status {
          margin: -24px 0 52px;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 20px 22px;
          background: var(--surface);
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
          transition:
            transform 160ms ease,
            border-color 160ms ease;
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

        @media (max-width: 640px) {
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
