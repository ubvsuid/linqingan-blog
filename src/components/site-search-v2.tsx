"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { SearchDocument, SearchDocumentType } from "@/lib/search";
import type {
  SearchEventResponse,
  SearchV2Response,
  SearchV2Source,
} from "@/lib/search-v2-types";

const typeOrder: SearchDocumentType[] = ["文章", "术语", "错误码", "工具", "项目"];
type SearchFilter = "全部" | SearchDocumentType;

const popularSearches = [
  "Creep 不移动",
  "ERR_NOT_IN_RANGE",
  "Spawn 失败",
  "Memory 保存目标",
  "CPU bucket",
  "Link transferEnergy",
];

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

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
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

function getOrCreateBrowserId(storage: Storage, key: string): string {
  const current = storage.getItem(key);
  if (current) return current;
  const next = crypto.randomUUID();
  storage.setItem(key, next);
  return next;
}

export function SiteSearchV2({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<SearchFilter>("全部");
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [queryId, setQueryId] = useState<number | null>(null);
  const [source, setSource] = useState<SearchV2Source | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const anonymousIdRef = useRef("");
  const sessionIdRef = useRef("");
  const lastRecordedSearchRef = useRef("");
  const normalizedQuery = normalize(query);

  useEffect(() => {
    try {
      anonymousIdRef.current = getOrCreateBrowserId(
        window.localStorage,
        "linqingan:anonymous-id",
      );
      sessionIdRef.current = getOrCreateBrowserId(
        window.sessionStorage,
        "linqingan:session-id",
      );
    } catch {
      anonymousIdRef.current = "";
      sessionIdRef.current = "";
    }
  }, []);

  useEffect(() => {
    if (!normalizedQuery) {
      setResults([]);
      setQueryId(null);
      setSource(null);
      setIsLoading(false);
      setRequestError(false);
      return;
    }

    setQueryId(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setRequestError(false);

      try {
        const params = new URLSearchParams({ q: query.trim(), limit: "40" });
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Search V2 request failed with ${response.status}`);
        }

        const payload = (await response.json()) as SearchV2Response;
        setResults(Array.isArray(payload.results) ? payload.results : []);
        setSource(payload.source === "database" ? "database" : "static");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRequestError(true);
        setResults([]);
        setQueryId(null);
        setSource(null);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 260);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedQuery, query]);

  useEffect(() => {
    if (!normalizedQuery || isLoading || requestError || !source) return;

    const recordedKey = `${normalizedQuery}|${results.length}|${source}`;
    const timeout = window.setTimeout(async () => {
      if (lastRecordedSearchRef.current === recordedKey) return;
      lastRecordedSearchRef.current = recordedKey;

      const analyticsPayload = {
        query: query.trim().slice(0, 80),
        results: results.length,
        source,
      };

      track(
        results.length > 0 ? "site_search_v2" : "site_search_v2_no_results",
        analyticsPayload,
      );

      try {
        const history = JSON.parse(
          window.localStorage.getItem("linqingan:search-history") ?? "[]",
        );
        const next = [
          { ...analyticsPayload, at: new Date().toISOString() },
          ...(Array.isArray(history) ? history : []),
        ].slice(0, 50);
        window.localStorage.setItem(
          "linqingan:search-history",
          JSON.stringify(next),
        );
      } catch {}

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (anonymousIdRef.current) headers["X-Anonymous-Id"] = anonymousIdRef.current;
      if (sessionIdRef.current) headers["X-Session-Id"] = sessionIdRef.current;

      try {
        const response = await fetch("/api/search/event", {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: query.trim(),
            resultCount: results.length,
          }),
        });
        if (!response.ok) return;
        const payload = (await response.json()) as SearchEventResponse;
        setQueryId(typeof payload.queryId === "number" ? payload.queryId : null);
      } catch {}
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [isLoading, normalizedQuery, query, requestError, results.length, source]);

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

  const resultCounts = useMemo(() => {
    const counts = new Map<SearchDocumentType, number>(
      typeOrder.map((type) => [type, 0]),
    );
    for (const result of results) {
      counts.set(result.type, (counts.get(result.type) ?? 0) + 1);
    }
    return counts;
  }, [results]);

  const filteredResults = useMemo(
    () =>
      activeType === "全部"
        ? results
        : results.filter((result) => result.type === activeType),
    [activeType, results],
  );

  const suggestions = useMemo(
    () => (normalizedQuery ? results.slice(0, 6) : []),
    [normalizedQuery, results],
  );

  function updateQuery(value: string) {
    setActiveSuggestionIndex(-1);
    setQuery(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  function handleSuggestionKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1,
      );
    } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      updateQuery(
        suggestions[activeSuggestionIndex].title
          .replace(/｜.*$/, "")
          .replace(/（.*$/, ""),
      );
      setActiveSuggestionIndex(-1);
    }
  }

  function handleResultClick(result: SearchDocument, position: number) {
    track("site_search_v2_result_click", {
      query: query.trim().slice(0, 80),
      result: result.id.slice(0, 80),
      type: result.type,
      position,
      source: source ?? "unknown",
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (anonymousIdRef.current) headers["X-Anonymous-Id"] = anonymousIdRef.current;
    if (sessionIdRef.current) headers["X-Session-Id"] = sessionIdRef.current;

    void fetch("/api/search/click", {
      method: "POST",
      keepalive: true,
      headers,
      body: JSON.stringify({
        queryId,
        query: query.trim(),
        result,
        position,
      }),
    }).catch(() => {});
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
            aria-activedescendant={
              activeSuggestionIndex >= 0
                ? `search-v2-suggestion-${activeSuggestionIndex}`
                : undefined
            }
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
        {isLoading
          ? "正在搜索…"
          : requestError
            ? "搜索服务暂时不可用，请稍后重试。"
            : normalizedQuery && source === "database"
              ? "Search V2 数据库检索已启用"
              : normalizedQuery && source === "static"
                ? "Search V2 静态回退已启用"
                : ""}
      </p>

      <div
        className="site-search-suggestions"
        aria-label={normalizedQuery ? "搜索联想" : "热门搜索"}
      >
        <span>{normalizedQuery ? "联想" : "热门"}</span>
        <div>
          {(normalizedQuery ? suggestions : popularSearches).map((item, index) => {
            const label =
              typeof item === "string"
                ? item
                : item.title.replace(/｜.*$/, "").replace(/（.*$/, "");
            const key = typeof item === "string" ? item : item.id;
            return (
              <button
                id={`search-v2-suggestion-${index}`}
                className={
                  typeof item !== "string" && index === activeSuggestionIndex
                    ? "suggestion-active"
                    : undefined
                }
                key={key}
                type="button"
                onMouseEnter={() =>
                  typeof item !== "string" && setActiveSuggestionIndex(index)
                }
                onClick={() => updateQuery(label)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {normalizedQuery ? (
        <>
          <div className="site-search-filters" aria-label="筛选搜索结果">
            {filters.map((type) => {
              const count =
                type === "全部" ? results.length : resultCounts.get(type) ?? 0;
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
            <p aria-live="polite">当前显示 {filteredResults.length} 条结果</p>
            <span>支持中文、英文、API 名称与常见说法</span>
          </div>
        </>
      ) : null}

      {normalizedQuery && filteredResults.length > 0 ? (
        <div className="site-search-results">
          {filteredResults.map((result, index) => (
            <article key={result.id}>
              <div>
                <span>{result.type}</span>
                <small>{result.meta}</small>
              </div>
              <h2>
                <Link
                  href={result.href}
                  onClick={() => handleResultClick(result, index + 1)}
                >
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
      ) : normalizedQuery && !isLoading ? (
        <div className="site-search-empty">
          <strong>暂时没有找到直接匹配的内容。</strong>
          <p>可以换一个 API 名称、错误码、中文说法，或者从下面的入口继续排查。</p>
          <div>
            {emptyRecommendations.map((item) => (
              <Link href={item.href} key={item.href}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : !normalizedQuery ? (
        <div className="site-search-empty">
          <strong>输入问题、API、错误码或关键词开始搜索。</strong>
          <p>Search V2 只返回最相关的一小批结果，不再把整份全文索引下载到浏览器。</p>
          <div>
            {emptyRecommendations.map((item) => (
              <Link href={item.href} key={item.href}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
