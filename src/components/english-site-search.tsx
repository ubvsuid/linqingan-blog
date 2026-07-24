"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { EnglishSearchDocument } from "@/lib/english-search";

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en");
}

export function EnglishSiteSearch({
  documents,
  initialQuery = "",
}: {
  documents: EnglishSearchDocument[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const normalizedQuery = normalize(query);

  const results = useMemo(() => {
    if (!normalizedQuery) return documents;
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return documents
      .map((document) => {
        const title = normalize(document.title);
        const description = normalize(document.description);
        const keywords = normalize(document.keywords.join(" "));
        let score = 0;

        for (const token of tokens) {
          if (title === token) score += 20;
          else if (title.includes(token)) score += 8;
          if (keywords.includes(token)) score += 5;
          if (description.includes(token)) score += 3;
        }

        return { document, score };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((item) => item.document);
  }, [documents, normalizedQuery]);

  function updateQuery(value: string) {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <div className="english-site-search">
      <label className="english-search-field">
        <span>Search the English section</span>
        <div>
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Try: ERR_NOT_IN_RANGE, body calculator, CPU bucket"
          />
          {query ? <button type="button" onClick={() => updateQuery("")}>Clear</button> : null}
        </div>
      </label>

      <p className="english-search-summary" aria-live="polite">
        {normalizedQuery ? `${results.length} matching result${results.length === 1 ? "" : "s"}` : `${results.length} English resources available`}
      </p>

      {results.length > 0 ? (
        <div className="english-search-results">
          {results.map((result) => (
            <article key={result.id}>
              <span>{result.type}</span>
              <h2><Link href={result.href}>{result.title}</Link></h2>
              <p>{result.description}</p>
              <div>{result.keywords.slice(0, 5).map((keyword) => <small key={keyword}>{keyword}</small>)}</div>
            </article>
          ))}
        </div>
      ) : (
        <div className="english-search-empty">
          <strong>No English resource matches “{query.trim()}”.</strong>
          <p>The English article library has not been published yet. Try an API name, return code, glossary term, or tool name.</p>
          <Link href="/en/knowledge">Browse the knowledge map →</Link>
        </div>
      )}

      <style>{`
        .english-site-search { display: grid; gap: 24px; }
        .english-search-field { display: grid; gap: 9px; border: 1px solid var(--border); border-radius: 22px; padding: 22px; background: var(--surface); color: var(--muted); font-size: 13px; }
        .english-search-field > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; }
        .english-search-field input { min-height: 56px; border: 1px solid var(--border); border-radius: 15px; padding: 0 17px; background: var(--background); color: var(--foreground); font: inherit; font-size: 16px; }
        .english-search-field button { min-height: 42px; align-self: center; border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; background: var(--background); color: var(--foreground); cursor: pointer; }
        .english-search-summary { margin: 0; color: var(--muted); font-size: 13px; }
        .english-search-results { display: grid; border-top: 1px solid var(--border); }
        .english-search-results article { border-bottom: 1px solid var(--border); padding: 28px 0; }
        .english-search-results article > span { display: inline-flex; border: 1px solid var(--border); border-radius: 999px; padding: 4px 9px; font-size: 11px; }
        .english-search-results h2 { margin: 12px 0 0; font-size: clamp(23px, 3vw, 32px); }
        .english-search-results p { max-width: 780px; margin: 10px 0 0; color: var(--muted); line-height: 1.7; }
        .english-search-results article > div { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 16px; }
        .english-search-results small { border: 1px solid var(--border); border-radius: 999px; padding: 5px 9px; color: var(--muted); }
        .english-search-empty { border: 1px dashed var(--border); border-radius: 20px; padding: clamp(28px, 5vw, 48px); text-align: center; }
        .english-search-empty p { max-width: 660px; margin: 12px auto 20px; color: var(--muted); line-height: 1.75; }
        @media (max-width: 560px) { .english-search-field > div { grid-template-columns: 1fr; } .english-search-field button { justify-self: start; } }
      `}</style>
    </div>
  );
}
