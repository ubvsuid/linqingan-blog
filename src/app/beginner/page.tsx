import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Screeps 新手入门",
  description:
    "按顺序阅读五篇 Screeps 新手文章，从认识游戏到完成第一次采集与运输循环。",
  alternates: {
    canonical: "/beginner",
  },
};

const beginnerSlugs = [
  "screeps-introduction",
  "screeps-first-room",
  "screeps-tick-and-game-loop",
  "screeps-first-creep-harvest",
  "screeps-creep-deliver-energy",
] as const;

export default function BeginnerPage() {
  const allPosts = getAllPosts();
  const posts = beginnerSlugs.flatMap((slug) => {
    const post = allPosts.find((item) => item.slug === slug);
    return post ? [post] : [];
  });

  return (
    <main className="page-shell beginner-page">
      <Container>
        <header className="page-header beginner-header">
          <p className="eyebrow">SCREEPS BEGINNER</p>
          <h1>Screeps 新手入门</h1>
          <p>
            从认识游戏开始，按顺序完成界面、tick、移动、采集和运输。
            每篇只解决一个问题。
          </p>
        </header>

        <div className="beginner-list" aria-label="Screeps 新手入门文章">
          {posts.map((post, index) => (
            <Link
              className="beginner-item"
              href={`/blog/${post.slug}`}
              key={post.slug}
            >
              <span className="beginner-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="beginner-copy">
                <strong>{post.title}</strong>
                <span>{post.description}</span>
              </span>
              <span className="beginner-meta">
                {post.readingMinutes} 分钟 <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </Container>

      <style>{`
        .beginner-header {
          max-width: 900px;
        }

        .beginner-list {
          border-top: 1px solid var(--border);
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
          white-space: nowrap;
        }

        @media (max-width: 760px) {
          .beginner-item {
            grid-template-columns: 44px minmax(0, 1fr);
            gap: 16px;
            padding-block: 24px;
          }

          .beginner-meta {
            grid-column: 2;
          }
        }
      `}</style>
    </main>
  );
}
