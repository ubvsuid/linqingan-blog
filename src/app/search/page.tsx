import Link from "next/link";

import { Container } from "@/components/container";
import { SiteSearch } from "@/components/site-search";
import { createPageMetadata } from "@/lib/metadata";
import { getSearchDocuments } from "@/lib/search";

export const metadata = createPageMetadata({
  title: "站内搜索",
  description: "搜索临清安网站中的 Screeps 文章、术语、错误码和项目内容。",
  path: "/search",
  noindex: true,
});

interface SearchPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const initialQuery = Array.isArray(params.q) ? params.q[0] ?? "" : params.q ?? "";
  const documents = getSearchDocuments();

  return (
    <main className="page-shell search-page">
      <Container>
        <nav className="search-breadcrumb" aria-label="面包屑">
          <Link href="/resources">资料中心</Link>
          <span aria-hidden="true">/</span>
          <span>站内搜索</span>
        </nav>

        <header className="page-header search-header">
          <p className="eyebrow">SEARCH</p>
          <h1>搜索整个网站</h1>
          <p>
            同时搜索文章正文、标签、Screeps 术语、API 返回值和项目说明。输入中文或英文都可以。
          </p>
        </header>

        <SiteSearch documents={documents} initialQuery={initialQuery} />
      </Container>

      <style>{`
        .search-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .search-header { max-width: 860px; }
      `}</style>
    </main>
  );
}