import Link from "next/link";

import { Container } from "@/components/container";
import { ServerSiteSearch } from "@/components/server-site-search";
import { createPageMetadata } from "@/lib/metadata";
import { getSearchDocuments } from "@/lib/search";

export const metadata = createPageMetadata({
  title: "站内搜索",
  description: "搜索临清安网站中的 Screeps 文章、术语、错误码、工具和公开建设内容。",
  path: "/search",
  noindex: true,
});

interface SearchPageProps {
  searchParams: Promise<{
    q?: string | string[];
    type?: string | string[];
  }>;
}

function readParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] ?? "" : value ?? "").trim();
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = readParam(params.q).slice(0, 120);
  const activeType = readParam(params.type);
  const documents = getSearchDocuments({ includeArticleText: Boolean(query) });

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
            同时搜索文章正文、知识模块、标签、Screeps 术语、API 返回值、实用工具和公开建设说明。输入中文或英文都可以。
          </p>
        </header>

        <ServerSiteSearch
          documents={documents}
          query={query}
          activeType={activeType}
        />
      </Container>

      <style>{`
        .search-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .search-header { max-width: 900px; }
      `}</style>
    </main>
  );
}
