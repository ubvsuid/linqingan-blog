"use client";

import { useMemo, useState } from "react";

import type { EnglishArticleIndexItem } from "@/lib/english-article-browser";

import styles from "./english-article-browser.module.css";

interface EnglishArticleQueryInputProps {
  initialQuery: string;
  scopeHrefs?: string[];
}

export function EnglishArticleQueryInput({
  initialQuery,
  scopeHrefs,
}: EnglishArticleQueryInputProps) {
  const [query, setQuery] = useState(initialQuery);
  const [index, setIndex] = useState<EnglishArticleIndexItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const scope = useMemo(
    () => scopeHrefs ? new Set(scopeHrefs) : null,
    [scopeHrefs],
  );

  async function loadIndex() {
    if (index || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/en/blog-index.json");
      if (!response.ok) return;
      const payload: unknown = await response.json();
      if (Array.isArray(payload)) setIndex(payload as EnglishArticleIndexItem[]);
    } catch {
      setIndex([]);
    } finally {
      setLoading(false);
    }
  }

  const normalizedQuery = query.normalize("NFKC").trim().toLocaleLowerCase("en");
  const suggestions = normalizedQuery && index
    ? index
        .filter((article) => (!scope || scope.has(article.href)) && article.searchText.includes(normalizedQuery))
        .slice(0, 8)
    : [];

  return (
    <label className={styles.search}>
      <span>Search articles</span>
      <input
        name="q"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={loadIndex}
        list="english-article-suggestions"
        maxLength={120}
        autoComplete="off"
        placeholder="Try: PathFinder, CPU bucket, terminal, ERR_NO_PATH"
        aria-describedby="english-article-search-help"
      />
      <small id="english-article-search-help" aria-live="polite">
        {loading
          ? "Loading article suggestions…"
          : "Suggestions load only when this field is used; submit to get server-rendered results."}
      </small>
      <datalist id="english-article-suggestions">
        {suggestions.map((article) => (
          <option value={article.title} key={article.href} />
        ))}
      </datalist>
    </label>
  );
}
