import Link from "next/link";

import { Container } from "@/components/container";
import coreTagSlugs from "@/lib/core-tag-slugs.json";
import { createPageMetadata } from "@/lib/metadata";
import { getTagRecords } from "@/lib/tags";

import styles from "./tags.module.css";

export const metadata = createPageMetadata({
  title: "文章标签",
  description: "按照 Screeps、Creep、Spawn、Memory、JavaScript 等标签浏览临清安发布的文章。",
  path: "/tags",
});

const featuredTagSlugs = new Set(coreTagSlugs);

function TagLinks({ tags }: { tags: ReturnType<typeof getTagRecords> }) {
  return (
    <div className={styles.cloud}>
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
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <span>文章标签</span>
        </nav>

        <header className={`page-header ${styles.header}`}>
          <p className="eyebrow">TAGS</p>
          <h1>文章标签</h1>
          <p>
            学习路线适合从头阅读，标签适合已经知道自己要找什么的读者。这里优先展示核心主题和至少包含两篇文章的标签。
          </p>
        </header>

        <section className={styles.section} aria-labelledby="featured-tags-title">
          <div className={styles.sectionHeading}>
            <p className="eyebrow">CORE TOPICS</p>
            <h2 id="featured-tags-title">核心标签</h2>
            <p>优先进入文章较多、能够代表网站主要内容方向的标签。</p>
          </div>
          <TagLinks tags={featuredTags} />
        </section>

        <section className={styles.section} aria-labelledby="more-tags-title">
          <div className={styles.sectionHeading}>
            <p className="eyebrow">MORE TAGS</p>
            <h2 id="more-tags-title">更多标签</h2>
            <p>这些标签目前至少连接两篇文章，适合继续缩小查询范围。</p>
          </div>
          <TagLinks tags={moreTags} />
        </section>

        <p className={styles.note}>
          另有 {singleArticleTagCount} 个只出现在单篇文章中的细粒度标签。它们保留用于文章语义，但不会进入标签中心的主要导航，也不会进入 Sitemap。
        </p>
      </Container>
    </main>
  );
}
