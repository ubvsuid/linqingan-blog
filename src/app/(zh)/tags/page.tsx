import Link from "next/link";

import { Container } from "@/components/container";
import coreTagSlugs from "@/lib/core-tag-slugs.json";
import { createPageMetadata } from "@/lib/metadata";
import { getTagRecords } from "@/lib/tags";

export const metadata = createPageMetadata({
  title: "文章标签",
  description: "按照 Screeps、Creep、Spawn、Memory、JavaScript 等标签浏览临清安发布的文章。",
  path: "/tags",
});

const featuredTagSlugs = new Set(coreTagSlugs);

function TagLinks({ tags }: { tags: ReturnType<typeof getTagRecords> }) {
  return (
    <div className="tag-cloud">
      {tags.map((tag) => (
        <Link key={tag.slug} href={`/tags/${tag.slug}`}>
          <strong>{tag.name}</strong>
          <span>{tag.count}</span>
        </Link>
      ))}
    </div>
  );
}

export default function TagsPage() {
  const tags = getTagRecords();
  const featuredTags = tags.filter((tag) => featuredTagSlugs.has(tag.slug));
  const moreTags = tags.filter(
    (tag) => tag.count >= 2 && !featuredTagSlugs.has(tag.slug),
  );
  const singleArticleTagCount = tags.filter((tag) => tag.count === 1).length;

  return (
    <main className="page-shell tags-page">
      <Container>
        <nav className="tags-breadcrumb" aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <span>文章标签</span>
        </nav>

        <header className="page-header tags-header">
          <p className="eyebrow">TAGS</p>
          <h1>文章标签</h1>
          <p>
            学习路线适合从头阅读，标签适合已经知道自己要找什么的读者。这里优先展示核心主题和至少包含两篇文章的标签。
          </p>
        </header>

        <section className="tags-section" aria-labelledby="featured-tags-title">
          <div className="tags-section-heading">
            <p className="eyebrow">CORE TOPICS</p>
            <h2 id="featured-tags-title">核心标签</h2>
            <p>优先进入文章较多、能够代表网站主要内容方向的标签。</p>
          </div>
          <TagLinks tags={featuredTags} />
        </section>

        <section className="tags-section" aria-labelledby="more-tags-title">
          <div className="tags-section-heading">
            <p className="eyebrow">MORE TAGS</p>
            <h2 id="more-tags-title">更多标签</h2>
            <p>这些标签目前至少连接两篇文章，适合继续缩小查询范围。</p>
          </div>
          <TagLinks tags={moreTags} />
        </section>

        <p className="tags-note">
          另有 {singleArticleTagCount} 个只出现在单篇文章中的细粒度标签。它们仍保留在文章页和对应标签URL中，但不占用标签中心的主要位置。
        </p>
      </Container>

      <style>{`
        .tags-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .tags-header { max-width: 880px; }
        .tags-section { display: grid; grid-template-columns: minmax(220px, .62fr) minmax(0, 1.38fr); gap: 54px; margin-top: 68px; border-top: 1px solid var(--border); padding-top: 56px; }
        .tags-section-heading h2 { margin: 8px 0 0; font-size: clamp(32px, 4.5vw, 46px); letter-spacing: -.04em; }
        .tags-section-heading > p:last-child { margin: 13px 0 0; color: var(--muted); line-height: 1.7; }
        .tag-cloud { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 10px; }
        .tag-cloud a { display: inline-flex; min-height: 44px; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 999px; padding: 0 15px 0 18px; background: var(--surface); transition: transform 160ms ease, border-color 160ms ease; }
        .tag-cloud a:hover { transform: translateY(-2px); border-color: var(--muted); text-decoration: none; }
        .tag-cloud strong { font-size: 14px; }
        .tag-cloud span { display: grid; min-width: 24px; min-height: 24px; place-items: center; border-radius: 999px; background: var(--background); color: var(--muted); font-size: 11px; }
        .tags-note { margin: 64px 0 0; border-top: 1px solid var(--border); padding-top: 24px; color: var(--muted); font-size: 13px; line-height: 1.7; }
        @media (max-width: 760px) { .tags-section { grid-template-columns: 1fr; gap: 28px; } }
      `}</style>
    </main>
  );
}
