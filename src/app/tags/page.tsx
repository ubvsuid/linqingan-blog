import Link from "next/link";

import { Container } from "@/components/container";
import { createPageMetadata } from "@/lib/metadata";
import { getTagRecords } from "@/lib/tags";

export const metadata = createPageMetadata({
  title: "文章标签",
  description: "按照 Screeps、Creep、Spawn、Builder、JavaScript 等标签浏览临清安发布的文章。",
  path: "/tags",
});

export default function TagsPage() {
  const tags = getTagRecords();

  return (
    <main className="page-shell tags-page">
      <Container>
        <nav className="tags-breadcrumb" aria-label="面包屑"><Link href="/resources">资料中心</Link><span aria-hidden="true">/</span><span>文章标签</span></nav>
        <header className="page-header"><p className="eyebrow">TAGS</p><h1>文章标签</h1><p>学习路线适合从头阅读，标签适合已经知道自己要找什么的读者。数字表示当前包含该标签的文章数量。</p></header>
        <div className="tag-cloud" aria-label="全部文章标签">
          {tags.map((tag) => (
            <Link key={tag.slug} href={`/tags/${tag.slug}`}>
              <strong>{tag.name}</strong><span>{tag.count}</span>
            </Link>
          ))}
        </div>
      </Container>
      <style>{`
        .tags-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .tag-cloud { display: flex; flex-wrap: wrap; gap: 10px; }
        .tag-cloud a { display: inline-flex; min-height: 44px; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 999px; padding: 0 15px 0 18px; background: var(--surface); transition: transform 160ms ease, border-color 160ms ease; }
        .tag-cloud a:hover { transform: translateY(-2px); border-color: var(--muted); text-decoration: none; }
        .tag-cloud strong { font-size: 14px; }
        .tag-cloud span { display: grid; min-width: 24px; min-height: 24px; place-items: center; border-radius: 999px; background: var(--background); color: var(--muted); font-size: 11px; }
      `}</style>
    </main>
  );
}
