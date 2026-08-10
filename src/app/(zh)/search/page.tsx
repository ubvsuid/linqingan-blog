import Link from "next/link";

import { Container } from "@/components/container";
import { SiteSearchV2 } from "@/components/site-search-v2";
import { createPageMetadata } from "@/lib/metadata";
import { searchV2 } from "@/lib/search-v2";

export const metadata = createPageMetadata({
  title: "站内搜索",
  description: "搜索临清安网站中的 Screeps 文章、术语、错误码、工具和公开建设内容。",
  path: "/search",
  noindex: true,
});

interface SearchPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const initialQuery = Array.isArray(params.q) ? params.q[0] ?? "" : params.q ?? "";
  const initialResponse = initialQuery
    ? await searchV2(initialQuery, { limit: 40 })
    : null;

  return (
    <main className="page-shell search-page">
      <Container>
        <nav className="search-breadcrumb" aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <span>站内搜索</span>
        </nav>

        <header className="page-header search-header">
          <p className="eyebrow">SEARCH</p>
          <h1>搜索整个网站</h1>
          <p>
            同时搜索文章、知识模块、标签、Screeps 术语、API 返回值、实用工具和公开建设说明。输入中文或英文都可以。
          </p>
        </header>

        <section aria-label="筛选搜索结果">
          <SiteSearchV2
            initialQuery={initialQuery}
            initialResponse={initialResponse}
          />
        </section>
      </Container>

      <style>{`
        .search-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .search-header { max-width: 900px; }
      `}</style>
    </main>
  );
}
