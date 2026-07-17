"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { SearchDocument, SearchDocumentType } from "@/lib/search";

const typeOrder: SearchDocumentType[] = ["文章", "术语", "错误码", "项目"];

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
}

function scoreDocument(document: SearchDocument, query: string): number {
  const normalizedTitle = normalize(document.title);
  const normalizedDescription = normalize(document.description);
  const normalizedMeta = normalize(document.meta);
  const normalizedKeywords = normalize(document.keywords.join(" "));
  const normalizedText = normalize(document.text);
  const tokens = query.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) return 0;

  let score = 0;
  for (const token of tokens) {
    if (normalizedTitle === token) score += 20;
    else if (normalizedTitle.startsWith(token)) score += 12;
    else if (normalizedTitle.includes(token)) score += 8;

    if (normalizedKeywords.includes(token)) score += 6;
    if (normalizedDescription.includes(token)) score += 4;
    if (normalizedMeta.includes(token)) score += 3;
    if (normalizedText.includes(token)) score += 1;
  }

  return score;
}

export function SiteSearch({
  documents,
  initialQuery = "",
}: {
  documents: SearchDocument[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const normalizedQuery = normalize(query);

  const results = useMemo(() => {
    if (!normalizedQuery) return documents.slice(0, 12);

    return documents
      .map((document) => ({ document, score: scoreDocument(document, normalizedQuery) }))
      .filter((item) => item.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          typeOrder.indexOf(left.document.type) - typeOrder.indexOf(right.document.type),
      )
      .map((item) => item.document)
      .slice(0, 40);
  }, [documents, normalizedQuery]);

  function updateQuery(value: string) {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <div className="site-search">
      <label className="site-search-field">
        <span>搜索整个网站</span>
        <input
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="输入 Creep、Memory、ERR_NOT_IN_RANGE、项目……"
          autoFocus
        />
      </label>

      <div className="site-search-summary">
        <p aria-live="polite">
          {normalizedQuery ? `找到 ${results.length} 条结果` : `展示 ${results.length} 条常用内容`}
        </p>
        <div aria-label="搜索范围">
          {typeOrder.map((type) => (
            <span key={type}>{type}</span>
          ))}
        </div>
      </div>

      {results.length > 0 ? (
        <div className="site-search-results">
          {results.map((result) => (
            <article key={result.id}>
              <div>
                <span>{result.type}</span>
                <small>{result.meta}</small>
              </div>
              <h2>
                <Link href={result.href}>{result.title}</Link>
              </h2>
              <p>{result.description}</p>
              {result.keywords.length > 0 ? (
                <div className="site-search-keywords" aria-label="相关关键词">
                  {result.keywords.slice(0, 5).map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="site-search-empty">
          <strong>没有找到匹配内容</strong>
          <p>可以缩短关键词，或尝试使用 Screeps 对象、API、错误码和中文描述。</p>
          <Link href="/resources">进入资料中心 →</Link>
        </div>
      )}

      <style>{`
        .site-search { display: grid; gap: 24px; }
        .site-search-field { display: grid; gap: 9px; border: 1px solid var(--border); border-radius: 22px; padding: 22px; background: var(--surface); color: var(--muted); font-size: 13px; }
        .site-search-field input { width: 100%; min-height: 56px; border: 1px solid var(--border); border-radius: 15px; padding: 0 17px; background: var(--background); color: var(--foreground); font: inherit; font-size: 16px; outline: none; }
        .site-search-field input:focus { border-color: var(--foreground); box-shadow: 0 0 0 3px color-mix(in srgb, var(--foreground) 10%, transparent); }
        .site-search-summary { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; }
        .site-search-summary p { margin: 0; color: var(--muted); font-size: 13px; }
        .site-search-summary > div, .site-search-keywords { display: flex; flex-wrap: wrap; gap: 7px; }
        .site-search-summary span, .site-search-keywords span { border: 1px solid var(--border); border-radius: 999px; padding: 5px 10px; color: var(--muted); font-size: 11px; }
        .site-search-results { display: grid; border-top: 1px solid var(--border); }
        .site-search-results article { border-bottom: 1px solid var(--border); padding: 28px 0; }
        .site-search-results article > div:first-child { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; color: var(--muted); font-size: 12px; }
        .site-search-results article > div:first-child > span { border: 1px solid var(--border); border-radius: 999px; padding: 4px 9px; color: var(--foreground); }
        .site-search-results h2 { margin: 12px 0 0; font-size: clamp(22px, 3vw, 31px); }
        .site-search-results p { max-width: 800px; margin: 11px 0 0; color: var(--muted); line-height: 1.75; }
        .site-search-keywords { margin-top: 17px; }
        .site-search-empty { border: 1px dashed var(--border); border-radius: 20px; padding: 48px 24px; text-align: center; }
        .site-search-empty p { margin: 10px auto 0; max-width: 560px; color: var(--muted); line-height: 1.7; }
        .site-search-empty a { display: inline-flex; margin-top: 20px; font-weight: 650; }
      `}</style>
    </div>
  );
}
