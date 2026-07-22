"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { SearchDocument, SearchDocumentType } from "@/lib/search";

const typeOrder: SearchDocumentType[] = ["文章", "术语", "错误码", "项目"];
type SearchFilter = "全部" | SearchDocumentType;

const synonymGroups = [
  ["采集", "harvest", "source"],
  ["运输", "搬运", "transfer", "withdraw"],
  ["升级", "upgrade", "upgradecontroller", "controller"],
  ["工地", "建造", "construction", "constructionsite", "build"],
  ["维修", "repair"],
  ["没能量", "能量不足", "err_not_enough_energy"],
  ["距离不足", "够不到", "err_not_in_range"],
] as const;

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
}

function getSearchTokens(query: string): string[] {
  const normalizedQuery = normalize(query);
  const tokens = new Set(normalizedQuery.split(/\s+/).filter(Boolean));

  for (const group of synonymGroups) {
    if (group.some((term) => normalizedQuery.includes(term))) {
      for (const term of group) tokens.add(term);
    }
  }

  return [...tokens];
}

function scoreDocument(document: SearchDocument, query: string): number {
  const normalizedTitle = normalize(document.title);
  const normalizedDescription = normalize(document.description);
  const normalizedMeta = normalize(document.meta);
  const normalizedKeywords = normalize(document.keywords.join(" "));
  const normalizedText = normalize(document.text);
  const tokens = getSearchTokens(query);

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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return text;

  const pattern = tokens
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp)
    .join("|");
  if (!pattern) return text;

  const parts = text.split(new RegExp(`(${pattern})`, "gi"));
  const normalizedTokens = new Set(tokens);

  return (
    <>
      {parts.map((part, index) =>
        normalizedTokens.has(normalize(part)) ? (
          <mark key={`${part}-${index}`}>{part}</mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function SiteSearch({
  documents,
  initialQuery = "",
}: {
  documents: SearchDocument[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<SearchFilter>("全部");
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = normalize(query);

  const rankedResults = useMemo(() => {
    if (!normalizedQuery) return documents;

    return documents
      .map((document) => ({ document, score: scoreDocument(document, normalizedQuery) }))
      .filter((item) => item.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          typeOrder.indexOf(left.document.type) - typeOrder.indexOf(right.document.type),
      )
      .map((item) => item.document);
  }, [documents, normalizedQuery]);

  const resultCounts = useMemo(() => {
    const counts = new Map<SearchDocumentType, number>(typeOrder.map((type) => [type, 0]));
    for (const result of rankedResults) {
      counts.set(result.type, (counts.get(result.type) ?? 0) + 1);
    }
    return counts;
  }, [rankedResults]);

  const results = useMemo(() => {
    const filtered =
      activeType === "全部"
        ? rankedResults
        : rankedResults.filter((document) => document.type === activeType);
    return filtered.slice(0, normalizedQuery ? 40 : 12);
  }, [activeType, normalizedQuery, rankedResults]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (event.key === "/" && !isTypingTarget) {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.key === "Escape" && document.activeElement === inputRef.current) {
        if (query) updateQuery("");
        else inputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function updateQuery(value: string) {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const filters: SearchFilter[] = ["全部", ...typeOrder];

  return (
    <div className="site-search">
      <label className="site-search-field">
        <span>搜索整个网站</span>
        <div>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="输入 Creep、Memory、ERR_NOT_IN_RANGE、项目……"
          />
          {query ? (
            <button type="button" onClick={() => updateQuery("")}>
              清空
            </button>
          ) : (
            <small>按 / 快速搜索</small>
          )}
        </div>
      </label>

      <div className="site-search-filters" aria-label="筛选搜索结果">
        {filters.map((type) => {
          const count = type === "全部" ? rankedResults.length : resultCounts.get(type) ?? 0;
          return (
            <button
              key={type}
              type="button"
              aria-pressed={activeType === type}
              onClick={() => setActiveType(type)}
            >
              <span>{type}</span>
              <small>{count}</small>
            </button>
          );
        })}
      </div>

      <div className="site-search-summary">
        <p aria-live="polite">
          {normalizedQuery
            ? `当前显示 ${results.length} 条结果`
            : `展示 ${results.length} 条常用内容`}
        </p>
        <span>支持中文、英文和常见说法</span>
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
                <Link href={result.href}>
                  <HighlightedText text={result.title} query={query} />
                </Link>
              </h2>
              <p>
                <HighlightedText text={result.description} query={query} />
              </p>
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
        .site-search-field > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; }
        .site-search-field input { width: 100%; min-height: 56px; border: 1px solid var(--border); border-radius: 15px; padding: 0 17px; background: var(--background); color: var(--foreground); font: inherit; font-size: 16px; outline: none; }
        .site-search-field input:focus { border-color: var(--foreground); box-shadow: 0 0 0 3px color-mix(in srgb, var(--foreground) 10%, transparent); }
        .site-search-field button { min-height: 42px; border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; background: var(--background); color: var(--foreground); cursor: pointer; }
        .site-search-field small { white-space: nowrap; color: var(--muted); }
        .site-search-filters { display: flex; flex-wrap: wrap; gap: 8px; }
        .site-search-filters button { display: inline-flex; min-height: 40px; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 999px; padding: 0 12px 0 15px; background: var(--surface); color: var(--muted); cursor: pointer; }
        .site-search-filters button[aria-pressed="true"] { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
        .site-search-filters small { display: grid; min-width: 22px; min-height: 22px; place-items: center; border-radius: 999px; background: color-mix(in srgb, currentColor 10%, transparent); font-size: 10px; }
        .site-search-summary { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; color: var(--muted); font-size: 13px; }
        .site-search-summary p { margin: 0; }
        .site-search-results { display: grid; border-top: 1px solid var(--border); }
        .site-search-results article { border-bottom: 1px solid var(--border); padding: 28px 0; }
        .site-search-results article > div:first-child { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; color: var(--muted); font-size: 12px; }
        .site-search-results article > div:first-child > span { border: 1px solid var(--border); border-radius: 999px; padding: 4px 9px; color: var(--foreground); }
        .site-search-results h2 { margin: 12px 0 0; font-size: clamp(22px, 3vw, 31px); }
        .site-search-results p { max-width: 800px; margin: 11px 0 0; color: var(--muted); line-height: 1.75; }
        .site-search-results mark { border-radius: 3px; padding: 0 .12em; background: color-mix(in srgb, var(--foreground) 14%, transparent); color: inherit; }
        .site-search-keywords { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 17px; }
        .site-search-keywords span { border: 1px solid var(--border); border-radius: 999px; padding: 5px 10px; color: var(--muted); font-size: 11px; }
        .site-search-empty { border: 1px dashed var(--border); border-radius: 20px; padding: 48px 24px; text-align: center; }
        .site-search-empty p { margin: 10px auto 0; max-width: 560px; color: var(--muted); line-height: 1.7; }
        .site-search-empty a { display: inline-flex; margin-top: 20px; font-weight: 650; }
        @media (max-width: 560px) { .site-search-field > div { grid-template-columns: 1fr; } .site-search-field button, .site-search-field small { justify-self: start; } }
      `}</style>
    </div>
  );
}