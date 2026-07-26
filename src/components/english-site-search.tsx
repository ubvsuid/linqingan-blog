"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

import type { EnglishSearchDocument } from "@/lib/english-search";

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en");
}

function editDistance(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let index = 0; index <= left.length; index += 1) rows[index][0] = index;
  for (let index = 0; index <= right.length; index += 1) rows[0][index] = index;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
  }
  return rows[left.length][right.length];
}

function fuzzyTokenMatch(token: string, words: string[]): boolean {
  if (token.length < 4) return false;
  return words.some((word) => Math.abs(word.length - token.length) <= 1 && editDistance(token, word) <= 1);
}

function Highlight({ text, query }: { text: string; query: string }) {
  const token = query.trim().split(/\s+/).filter(Boolean)[0];
  if (!token) return text;
  const expression = new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  return text.split(expression).map((part, index) =>
    part.toLowerCase() === token.toLowerCase()
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : <Fragment key={`${part}-${index}`}>{part}</Fragment>,
  );
}

export function EnglishSiteSearch({
  documents,
  initialQuery = "",
}: {
  documents: EnglishSearchDocument[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState("");
  const normalizedQuery = normalize(query);

  const results = useMemo(() => {
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const filteredByType = type ? documents.filter((document) => document.type === type) : documents;

    if (!normalizedQuery) {
      return filteredByType
        .slice()
        .sort((left, right) => {
          const typePriority = { Page: 4, Tool: 3, Reference: 2, Article: 1 };
          return typePriority[right.type] - typePriority[left.type];
        })
        .slice(0, 12);
    }

    return filteredByType
      .map((document) => {
        const title = normalize(document.title);
        const description = normalize(document.description);
        const keywords = normalize(document.keywords.join(" "));
        const words = `${title} ${description} ${keywords}`.split(/[^a-z0-9_]+/).filter(Boolean);
        let score = 0;

        for (const token of tokens) {
          if (title === token) score += 25;
          else if (title.includes(token)) score += 10;
          if (keywords.includes(token)) score += 6;
          if (description.includes(token)) score += 3;
          if (!`${title} ${description} ${keywords}`.includes(token) && fuzzyTokenMatch(token, words)) score += 2;
        }

        return { document, score };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((item) => item.document);
  }, [documents, normalizedQuery, type]);

  function updateQuery(value: string) {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <div className="english-site-search">
      <div className="english-search-toolbar">
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
        <label className="english-search-type">
          <span>Resource type</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">All resources</option>
            <option value="Article">Articles</option>
            <option value="Tool">Tools</option>
            <option value="Reference">References</option>
            <option value="Page">Pages</option>
          </select>
        </label>
      </div>

      <p className="english-search-summary" aria-live="polite">
        {normalizedQuery ? `${results.length} matching result${results.length === 1 ? "" : "s"}` : "Popular English resources"}
      </p>

      {results.length > 0 ? (
        <div className="english-search-results">
          {results.map((result) => (
            <article key={result.id}>
              <span>{result.type}</span>
              <h2><Link href={result.href}><Highlight text={result.title} query={query} /></Link></h2>
              <p>{result.description}</p>
              <div>{result.keywords.slice(0, 5).map((keyword) => <small key={keyword}>{keyword}</small>)}</div>
            </article>
          ))}
        </div>
      ) : (
        <div className="english-search-empty">
          <strong>No resource matches “{query.trim()}”.</strong>
          <p>Try an API method, return code, object name, symptom, or a broader knowledge topic.</p>
          <div><Link href="/en/beginner">Beginner roadmap</Link><Link href="/en/knowledge">Knowledge modules</Link><Link href="/en/screeps-errors">Error codes</Link><Link href="/en/blog">All articles</Link></div>
        </div>
      )}

      <style>{`
        .english-site-search { display: grid; gap: 24px; }
        .english-search-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 14px; }
        .english-search-field, .english-search-type { display: grid; gap: 9px; border: 1px solid var(--border); border-radius: 22px; padding: 22px; background: var(--surface); color: var(--muted); font-size: 13px; }
        .english-search-field > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; }
        .english-search-field input, .english-search-type select { min-height: 56px; border: 1px solid var(--border); border-radius: 15px; padding: 0 17px; background: var(--background); color: var(--foreground); font: inherit; font-size: 16px; }
        .english-search-field button { min-height: 42px; align-self: center; border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; background: var(--background); color: var(--foreground); cursor: pointer; }
        .english-search-summary { margin: 0; color: var(--muted); font-size: 13px; }
        .english-search-results { display: grid; border-top: 1px solid var(--border); }
        .english-search-results article { border-bottom: 1px solid var(--border); padding: 28px 0; }
        .english-search-results article > span { display: inline-flex; border: 1px solid var(--border); border-radius: 999px; padding: 4px 9px; font-size: 11px; }
        .english-search-results h2 { margin: 12px 0 0; font-size: clamp(23px, 3vw, 32px); }
        .english-search-results h2 mark { border-radius: 4px; padding: 0 .08em; background: color-mix(in srgb, var(--foreground) 16%, transparent); color: inherit; }
        .english-search-results p { max-width: 780px; margin: 10px 0 0; color: var(--muted); line-height: 1.7; }
        .english-search-results article > div { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 16px; }
        .english-search-results small { border: 1px solid var(--border); border-radius: 999px; padding: 5px 9px; color: var(--muted); }
        .english-search-empty { border: 1px dashed var(--border); border-radius: 20px; padding: clamp(28px, 5vw, 48px); text-align: center; }
        .english-search-empty p { max-width: 660px; margin: 12px auto 20px; color: var(--muted); line-height: 1.75; }
        .english-search-empty > div { display: flex; flex-wrap: wrap; justify-content: center; gap: 9px; }
        .english-search-empty a { border: 1px solid var(--border); border-radius: 999px; padding: 9px 13px; text-decoration: none; }
        @media (max-width: 760px) { .english-search-toolbar { grid-template-columns: 1fr; } }
        @media (max-width: 560px) { .english-search-field > div { grid-template-columns: 1fr; } .english-search-field button { justify-self: start; } }
      `}</style>
    </div>
  );
}
