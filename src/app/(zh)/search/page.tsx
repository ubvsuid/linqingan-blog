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
    <main className="page-shell search-page">
      <Container>
        <nav className="search-breadcrumb" aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <span>站内搜索</span>
        </nav>

        <header className="page-header search-header">
          <p className="eyebrow">SEARCH + DIAGNOSTICS</p>
          <h1>从问题开始，不只找一篇文章</h1>
          <p>
            Search V2 负责发现最相关的文章、术语、错误码和工具；如果问题仍未定位，继续沿着症状诊断、API、返回码和 accepted Runtime Evidence 缩小范围。
          </p>
        </header>

        <aside className="search-problem-path" aria-label="Screeps 问题解决链路">
          <div>
            <p className="eyebrow">PROBLEM-SOLVING PATH</p>
            <h2>问题 → 可能原因 → 返回码 / API → 教程 / 工具 → Runtime Evidence</h2>
            <p>搜索用于发现，Diagnostics 用于排查，Runtime Evidence 用于判断某条结论是否真的在 Screeps Console 或 Live 主循环里跑过。</p>
          </div>
          <nav>
            <Link href="/diagnostics">症状诊断</Link>
            <Link href="/screeps-api">API Reference</Link>
            <Link href="/screeps-errors">错误码</Link>
            <Link href="/verified">Runtime Evidence</Link>
          </nav>
        </aside>

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
        .search-problem-path { display: grid; gap: 18px; margin: 0 0 28px; padding: 22px 24px; border: 1px solid var(--border); border-radius: 20px; background: var(--surface); }
        .search-problem-path h2 { margin: 6px 0 8px; font-size: clamp(20px, 3vw, 28px); }
        .search-problem-path p:last-child { margin: 0; color: var(--muted); line-height: 1.7; }
        .search-problem-path nav { display: flex; flex-wrap: wrap; gap: 10px 16px; font-size: 13px; }
      `}</style>
    </main>
  );
}
