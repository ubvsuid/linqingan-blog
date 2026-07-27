"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { SearchDocument, SearchDocumentType } from "@/lib/search";

const typeOrder: SearchDocumentType[] = ["文章", "术语", "错误码", "工具", "项目"];
type SearchFilter = "全部" | SearchDocumentType;

const synonymGroups = [
  ["采集", "harvest", "source"],
  ["运输", "搬运", "transfer", "withdraw"],
  ["升级", "upgrade", "upgradecontroller", "controller"],
  ["工地", "建造", "construction", "constructionsite", "build"],
  ["维修", "repair"],
  ["没能量", "能量不足", "err_not_enough_energy"],
  ["距离不足", "够不到", "err_not_in_range"],
  ["身体", "body", "部件", "bodpart", "bodypart_cost"],
  ["移动速度", "走得慢", "fatigue", "move"],
  ["出生", "生成", "spawn", "spawncreep"],
] as const;

const emptyRecommendations = [
  {
    href: "/tools/creep-body-calculator",
    title: "Creep 身体计算器",
    description: "计算身体成本、生成时间和移动比例。",
  },
  {
    href: "/screeps-errors",
    title: "错误码查询",
    description: "按返回值检查常见失败原因。",
  },
  {
    href: "/knowledge",
    title: "知识模块",
    description: "按当前问题进入对应学习模块。",
  },
];

const popularSearches = [
  "Creep 不移动",
  "ERR_NOT_IN_RANGE",
  "Spawn 失败",
  "Memory 保存目标",
  "CPU bucket",
  "Link transferEnergy",
];

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

function editDistance(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);
  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let diagonal = rows[0];
    rows[0] = rightIndex;
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const previous = rows[leftIndex];
      rows[leftIndex] = Math.min(rows[leftIndex] + 1, rows[leftIndex - 1] + 1, diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1));
      diagonal = previous;
    }
  }
  return rows[left.length];
}

function isNearMatch(token: string, candidate: string): boolean {
  if (token.length < 4 || candidate.length < 4) return false;
  const threshold = token.length >= 8 ? 2 : 1;
  return Math.abs(token.length - candidate.length) <= threshold && editDistance(token, candidate) <= threshold;
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

  if (score === 0) {
    const candidates = [
      ...normalizedTitle.split(/[^a-z0-9_\u4e00-\u9fff]+/).filter(Boolean),
      ...normalizedKeywords.split(/[^a-z0-9_\u4e00-\u9fff]+/).filter(Boolean),
    ];
    for (const token of tokens) {
      if (candidates.some((candidate) => isNearMatch(token, candidate))) score += 2;
    }
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
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [expandedDocuments, setExpandedDocuments] = useState<SearchDocument[] | null>(null);
  const [isLoadingFullIndex, setIsLoadingFullIndex] = useState(false);
  const fullIndexRequested = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = normalize(query);
  const searchableDocuments = expandedDocuments ?? documents;

  const rankedResults = useMemo(() => {
    if (!normalizedQuery) return searchableDocuments;

    return searchableDocuments
      .map((document) => ({ document, score: scoreDocument(document, normalizedQuery) }))
      .filter((item) => item.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          typeOrder.indexOf(left.document.type) - typeOrder.indexOf(right.document.type),
      )
      .map((item) => item.document);
  }, [normalizedQuery, searchableDocuments]);

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

  const suggestions = useMemo(
    () => normalizedQuery ? rankedResults.slice(0, 6) : [],
    [normalizedQuery, rankedResults],
  );

  useEffect(() => {
    if (!normalizedQuery || fullIndexRequested.current) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fullIndexRequested.current = true;
      setIsLoadingFullIndex(true);
      fetch("/api/search-index", { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`Search index request failed: ${response.status}`);
          return response.json();
        })
        .then((payload) => {
          if (Array.isArray(payload)) setExpandedDocuments(payload);
        })
        .catch(() => {
          fullIndexRequested.current = false;
        })
        .finally(() => setIsLoadingFullIndex(false));
    }, 220);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedQuery]);

  useEffect(() => {
    if (!normalizedQuery) return;
    const timeout = window.setTimeout(() => {
      const payload = { query: query.trim().slice(0, 80), results: rankedResults.length, type: activeType };
      track(rankedResults.length > 0 ? "site_search" : "site_search_no_results", payload);
      try {
        const history = JSON.parse(window.localStorage.getItem("linqingan:search-history") ?? "[]");
        const next = [payload, ...(Array.isArray(history) ? history : [])].slice(0, 50);
        window.localStorage.setItem("linqingan:search-history", JSON.stringify(next));
      } catch {}
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [activeType, normalizedQuery, query, rankedResults.length]);

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
  }, [query]);

  function handleSuggestionKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      updateQuery(suggestions[activeSuggestionIndex].title.replace(/｜.*$/, "").replace(/（.*$/, ""));
      setActiveSuggestionIndex(-1);
    }
  }

  function handleResultClick(result: SearchDocument) {
    track("site_search_result_click", {
      query: query.trim().slice(0, 80),
      result: result.id.slice(0, 80),
      type: result.type,
    });
  }

  function updateQuery(value: string) {
    setActiveSuggestionIndex(-1);
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
            onKeyDown={handleSuggestionKeyDown}
            aria-activedescendant={activeSuggestionIndex >= 0 ? `search-suggestion-${activeSuggestionIndex}` : undefined}
            placeholder="输入 Creep、Memory、ERR_NOT_IN_RANGE、身体计算器……"
          />
          {query ? (
            <button type="button" onClick={() => updateQuery("")}>清空</button>
          ) : (
            <small>按 / 快速搜索</small>
          )}
        </div>
      </label>

      <p className="search-index-status" aria-live="polite">
        {isLoadingFullIndex ? "正在加载精简全文索引…" : normalizedQuery && expandedDocuments ? "已启用精简全文搜索" : ""}
      </p>

      <div className="site-search-suggestions" aria-label={normalizedQuery ? "搜索联想" : "热门搜索"}>
        <span>{normalizedQuery ? "联想" : "热门"}</span>
        <div>
          {(normalizedQuery ? suggestions : popularSearches).map((item, itemIndex) => {
            const label = typeof item === "string"
              ? item
              : item.title.replace(/｜.*$/, "").replace(/（.*$/, "");
            const key = typeof item === "string" ? item : item.id;
            return (
              <button id={`search-suggestion-${itemIndex}`} className={typeof item !== "string" && suggestions.indexOf(item) === activeSuggestionIndex ? "suggestion-active" : undefined} key={key} type="button" onMouseEnter={() => typeof item !== "string" && setActiveSuggestionIndex(suggestions.indexOf(item))} onClick={() => updateQuery(label)}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

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
                <Link href={result.href} onClick={() => handleResultClick(result)}>
                  <HighlightedText text={result.title} query={query} />
                </Link>
              </h2>
              <p><HighlightedText text={result.description} query={query} /></p>
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
          <strong>没有找到“{query.trim()}”</strong>
          <p>
            可以去掉括号、点号或方法后的参数，只保留对象名、方法名、错误码或中文问题。例如把 <code>spawn.spawnCreep()</code> 改成 <code>spawnCreep</code>。
          </p>
          <div className="site-search-empty-grid">
            {emptyRecommendations.map((item) => (
              <Link href={item.href} key={item.href}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </Link>
            ))}
          </div>
          <a className="site-search-feedback" href="https://github.com/ubvsuid/linqingan-blog/issues/new" rel="noreferrer" target="_blank">
            提交缺少的内容 ↗
          </a>
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
        .site-search-suggestions { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 12px; align-items: start; color: var(--muted); font-size: 12px; }
        .site-search-suggestions > span { padding-top: 10px; font-weight: 700; }
        .site-search-suggestions > div { display: flex; flex-wrap: wrap; gap: 8px; }
        .site-search-suggestions button { min-height: 36px; border: 1px solid var(--border); border-radius: 999px; padding: 0 12px; background: var(--surface); color: var(--foreground); cursor: pointer; }
        .site-search-suggestions button:hover, .site-search-suggestions button.suggestion-active { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
        .search-index-status { min-height: 20px; margin: -8px 0 12px; color: var(--muted); font-size: 12px; }
        .site-search-filters { display: flex; flex-wrap: wrap; gap: 8px; }
        .site-search-filters button { display: inline-flex; min-height: 42px; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 999px; padding: 0 12px 0 15px; background: var(--surface); color: var(--muted); cursor: pointer; }
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
        .site-search-empty { border: 1px dashed var(--border); border-radius: 20px; padding: clamp(28px, 5vw, 48px); text-align: center; }
        .site-search-empty > p { margin: 12px auto 0; max-width: 680px; color: var(--muted); line-height: 1.75; }
        .site-search-empty code { border-radius: 5px; padding: .1em .35em; background: var(--surface); }
        .site-search-empty-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 28px; text-align: left; }
        .site-search-empty-grid a { display: grid; gap: 8px; border: 1px solid var(--border); border-radius: 16px; padding: 18px; background: var(--surface); }
        .site-search-empty-grid a:hover { border-color: var(--muted); text-decoration: none; }
        .site-search-empty-grid span { color: var(--muted); font-size: 13px; line-height: 1.6; }
        .site-search-feedback { display: inline-flex; margin-top: 24px; font-weight: 650; }
        @media (max-width: 720px) { .site-search-empty-grid { grid-template-columns: 1fr; } }
        @media (max-width: 560px) { .site-search-field > div { grid-template-columns: 1fr; } .site-search-field button, .site-search-field small { justify-self: start; } }
      `}</style>
    </div>
  );
}
