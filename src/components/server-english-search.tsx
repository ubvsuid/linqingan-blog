import Link from "next/link";
import { Fragment } from "react";

import type { EnglishSearchDocument } from "@/lib/english-search";

import styles from "./server-search.module.css";

const resourceTypes: EnglishSearchDocument["type"][] = [
  "Article",
  "Tool",
  "Reference",
  "Page",
];
const popularQueries = [
  "ERR_NOT_IN_RANGE",
  "creep not moving",
  "CPU bucket",
  "body calculator",
  "Memory cleanup",
];

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en");
}

function tokenize(value: string): string[] {
  return normalize(value).split(/[^a-z0-9_]+/).filter(Boolean);
}

function scoreDocument(document: EnglishSearchDocument, tokens: string[]): number {
  if (tokens.length === 0) return 0;

  const title = normalize(document.title);
  const description = normalize(document.description);
  const keywords = normalize(document.keywords.join(" "));
  let score = 0;

  for (const token of tokens) {
    if (title === token) score += 25;
    else if (title.startsWith(token)) score += 14;
    else if (title.includes(token)) score += 10;
    if (keywords.includes(token)) score += 7;
    if (description.includes(token)) score += 3;
  }

  return score;
}

function highlight(text: string, tokens: string[]) {
  if (tokens.length === 0) return text;
  const usefulTokens = tokens.filter((token) => token.length >= 2);
  if (usefulTokens.length === 0) return text;
  const expression = new RegExp(
    `(${usefulTokens
      .sort((left, right) => right.length - left.length)
      .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})`,
    "gi",
  );
  const normalizedTokens = new Set(usefulTokens.map(normalize));

  return text.split(expression).map((part, index) =>
    normalizedTokens.has(normalize(part))
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : <Fragment key={`${part}-${index}`}>{part}</Fragment>,
  );
}

interface ServerEnglishSearchProps {
  documents: EnglishSearchDocument[];
  query: string;
  activeType: string;
}

export function ServerEnglishSearch({
  documents,
  query,
  activeType,
}: ServerEnglishSearchProps) {
  const normalizedType = resourceTypes.includes(activeType as EnglishSearchDocument["type"])
    ? activeType as EnglishSearchDocument["type"]
    : "";
  const tokens = tokenize(query);
  const ranked = query.trim()
    ? documents
        .map((document) => ({ document, score: scoreDocument(document, tokens) }))
        .filter(({ score }) => score > 0)
        .sort(
          (left, right) =>
            right.score - left.score
            || resourceTypes.indexOf(left.document.type) - resourceTypes.indexOf(right.document.type)
            || left.document.title.localeCompare(right.document.title, "en"),
        )
        .map(({ document }) => document)
    : documents.filter((document) => document.type === "Tool" || document.type === "Reference");
  const results = (normalizedType
    ? ranked.filter((document) => document.type === normalizedType)
    : ranked
  ).slice(0, query.trim() ? 40 : 12);

  return (
    <section className={styles.search} aria-label="English site search results">
      <form className={styles.controls} action="/en/search" method="get" role="search">
        <label>
          <span>Search the English section</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            maxLength={120}
            autoComplete="off"
            placeholder="Try: ERR_NOT_IN_RANGE, body calculator, CPU bucket"
          />
        </label>
        <label>
          <span>Resource type</span>
          <select name="type" defaultValue={normalizedType}>
            <option value="">All resources</option>
            {resourceTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <button type="submit">Search</button>
      </form>

      <nav className={styles.popular} aria-label="Popular searches">
        <strong>Popular</strong>
        {popularQueries.map((popularQuery) => (
          <Link key={popularQuery} href={`/en/search?q=${encodeURIComponent(popularQuery)}`}>
            {popularQuery}
          </Link>
        ))}
      </nav>

      <div className={styles.summary}>
        <p>
          {query.trim()
            ? <><strong>{results.length}</strong> matching resources</>
            : <><strong>{results.length}</strong> useful starting points</>}
        </p>
        {(query.trim() || normalizedType) ? <Link className={styles.reset} href="/en/search">Clear filters</Link> : null}
      </div>

      {results.length > 0 ? (
        <div className={styles.results}>
          {results.map((result) => (
            <article className={styles.result} key={result.id}>
              <div className={styles.meta}><span>{result.type}</span></div>
              <h2>
                <Link href={result.href} aria-label={result.title}>
                  {highlight(result.title, tokens)}
                </Link>
              </h2>
              <p>{highlight(result.description, tokens)}</p>
              {result.keywords.length > 0 ? (
                <div className={styles.keywords} aria-label="Related keywords">
                  {result.keywords.slice(0, 5).map((keyword) => <span key={keyword}>{keyword}</span>)}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <strong>No published resource matches “{query.trim()}”.</strong>
          <p>Try an API method, return code, object name, or a shorter symptom without punctuation and parameters.</p>
          <div className={styles.emptyActions}>
            <Link href="/en/knowledge">Browse knowledge</Link>
            <Link href="/en/screeps-errors">Check error codes</Link>
            <a
              href={`https://github.com/ubvsuid/linqingan-blog/issues/new?title=${encodeURIComponent(`Missing English search result: ${query.trim().slice(0, 80)}`)}`}
              rel="noreferrer"
              target="_blank"
            >
              Request missing content ↗
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
