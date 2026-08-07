import Link from "next/link";

import { Container } from "@/components/container";
import coreTagSlugs from "@/lib/core-tag-slugs.json";
import { createPageMetadata } from "@/lib/metadata";
import { getPublicTagRecords, getTagRecords } from "@/lib/tags";

import styles from "./tags.module.css";

export const metadata = createPageMetadata({
  title: "文章标签",
  description:
    "按 Screeps、Creep、Spawn、Memory、JavaScript 等长期主题浏览文章；单篇细粒度标签保留为文章描述，不单独建立归档页。",
  path: "/tags",
});

const featuredTagSlugs = new Set(coreTagSlugs);

function TagLinks({ tags }: { tags: ReturnType<typeof getPublicTagRecords> }) {
  return (
    <div className={styles.tagCloud}>
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
  const allTags = getTagRecords();
  const publicTags = getPublicTagRecords();
  const featuredTags = publicTags.filter((tag) =>
    featuredTagSlugs.has(tag.slug),
  );
  const moreTags = publicTags.filter(
    (tag) => !featuredTagSlugs.has(tag.slug),
  );
  const descriptiveTagCount = allTags.filter((tag) => tag.count === 1).length;

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
            标签用于按长期主题继续浏览。只有至少连接两篇文章的标签才建立独立归档页；只出现一次的细粒度标签仍保留在文章中作为描述，不再额外制造薄内容页面。
          </p>
        </header>

        <section className={styles.section} aria-labelledby="featured-tags-title">
          <div className={styles.sectionHeading}>
            <p className="eyebrow">CORE TOPICS</p>
            <h2 id="featured-tags-title">核心标签</h2>
            <p>优先进入文章较多、能够代表网站主要内容方向的长期主题。</p>
          </div>
          <TagLinks tags={featuredTags} />
        </section>

        {moreTags.length > 0 ? (
          <section className={styles.section} aria-labelledby="more-tags-title">
            <div className={styles.sectionHeading}>
              <p className="eyebrow">MORE TAGS</p>
              <h2 id="more-tags-title">更多标签</h2>
              <p>这些标签至少连接两篇文章，适合继续缩小查询范围。</p>
            </div>
            <TagLinks tags={moreTags} />
          </section>
        ) : null}

        <p className={styles.note}>
          当前共有 {publicTags.length} 个可浏览标签归档；另有 {descriptiveTagCount} 个单篇细粒度标签仅作为文章描述保留，不单独生成标签页。
        </p>
      </Container>
    </main>
  );
}
