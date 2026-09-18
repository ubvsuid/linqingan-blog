import Link from "next/link";

import { Container } from "@/components/container";
import { SiteSearchV2 } from "@/components/site-search-v2";
import { createPageMetadata } from "@/lib/metadata";
import { searchV2 } from "@/lib/search-v2";

export const metadata = createPageMetadata({
  title: "站内搜索",
  description: "搜索 Screeps 问题、文章、术语、错误码、API、工具和 Runtime Evidence，并继续进入症状诊断路径。",
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
    <main className="page-shell search-page monochrome-system-page solve-system-page search-monochrome-page">
      <Container>
        <nav className="search-breadcrumb" aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <span>站内搜索</span>
        </nav>

        <header className="page-header search-header solve-system-hero">
          <p className="eyebrow">PROBLEM-SOLVING PATH / SEARCH V3</p>
          <h1>Ask. Route. Solve.</h1>
          <p>
            Search V3 只在高置信的症状、API 或错误码意图上给出直接 Answer Route；其余查询继续由 Search V2 负责发现，不猜测、不强行路由。
          </p>
        </header>

        <section className="search-system-map" aria-label="Screeps 问题解决链路">
          <div><span>01</span><strong>SEARCH</strong><small>问题、API、错误码</small></div>
          <div><span>02</span><strong>ROUTE</strong><small>Doctor / Resolver / Reference</small></div>
          <div><span>03</span><strong>SOLVE</strong><small>Fix / Tool / Guide</small></div>
          <div><span>04</span><strong>VERIFY</strong><small>Runtime Evidence</small></div>
        </section>

        <section aria-label="筛选搜索结果">
          <SiteSearchV2
            initialQuery={initialQuery}
            initialResponse={initialResponse}
          />
        </section>
      </Container>

    </main>
  );
}
