"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { EnglishSearchDocument } from "@/lib/english-search";

const popularQueries = ["ERR_NOT_IN_RANGE", "creep not moving", "CPU bucket", "body calculator", "Memory cleanup"];

const featuredResources: EnglishSearchDocument[] = [
  {
    id: "featured-beginner",
    title: "Screeps Beginner Roadmap",
    description: "Follow a guided sequence from the first Creep to roles, upgrading, construction, and a complete first-room loop.",
    href: "/en/beginner",
    type: "Page",
    keywords: ["beginner", "first Creep", "learning path"],
  },
  {
    id: "featured-errors",
    title: "Screeps Error Codes and Return Values",
    description: "Look up common return codes before changing movement, spawning, market, construction, or Controller logic.",
    href: "/en/screeps-errors",
    type: "Reference",
    keywords: ["return code", "ERR_NOT_IN_RANGE", "ERR_NO_PATH"],
  },
  {
    id: "featured-knowledge",
    title: "Screeps Knowledge Base",
    description: "Browse curated modules for Memory, spawning, economy, movement, Controllers, defense, resources, and debugging.",
    href: "/en/knowledge",
    type: "Page",
    keywords: ["knowledge", "modules", "systems"],
  },
  {
    id: "featured-body-calculator",
    title: "Screeps Creep Body Calculator",
    description: "Calculate Energy cost, spawn time, hits, carry capacity, and loaded movement speed in the browser.",
    href: "/en/tools/creep-body-calculator",
    type: "Tool",
    keywords: ["body calculator", "creep cost", "MOVE ratio"],
  },
  {
    id: "featured-room-diagnostics",
    title: "Screeps Room Snapshot Diagnostic",
    description: "Check Spawn, workforce, Energy, Controller, construction, CPU, and bucket risks from a static room snapshot.",
    href: "/en/tools/room-diagnostics",
    type: "Tool",
    keywords: ["room diagnostics", "CPU bucket", "Controller downgrade"],
  },
  {
    id: "featured-guides",
    title: "English Screeps Guide Library",
    description: "Browse all published English guides with filters for system, difficulty, content type, and topic.",
    href: "/en/blog",
    type: "Page",
    keywords: ["guides", "articles", "Screeps tutorials"],
  },
];

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

export function EnglishSiteSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState("");
  const [documents, setDocuments] = useState<EnglishSearchDocument[] | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);
  const normalizedQuery = normalize(query);

  const loadSearchIndex = useCallback(async () => {
    if (documents || loadingRef.current) return;

    loadingRef.current = true;
    setLoadState("loading");

    try {
      const response = await fetch("/en/search-index.json", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Search index request failed with ${response.status}`);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error("Search index response is not an array");
      setDocuments(payload as EnglishSearchDocument[]);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    } finally {
      loadingRef.current = false;
    }
  }, [documents]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      event.preventDefault();
      inputRef.current?.focus();
      void loadSearchIndex();
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [loadSearchIndex]);

  useEffect(() => {
    if (normalizedQuery || type) {
      void loadSearchIndex();
      return;
    }

    const timer = window.setTimeout(() => {
      void loadSearchIndex();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [loadSearchIndex, normalizedQuery, type]);

  const results = useMemo(() => {
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const sourceDocuments = normalizedQuery || type ? documents ?? [] : featuredResources;
    const filteredByType = type ? sourceDocuments.filter((document) => document.type === type) : sourceDocuments;

    if (!normalizedQuery) return filteredByType.slice(0, 12);

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

  const waitingForIndex = Boolean(normalizedQuery || type) && (loadState === "idle" || loadState === "loading");

  return (
    <div className="english-site-search">
      <div className="english-search-toolbar">
        <label className="english-search-field">
          <span>Search the English section <small>Press <kbd>/</kbd> to focus</small></span>
          <div>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onFocus={() => void loadSearchIndex()}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Try: ERR_NOT_IN_RANGE, body calculator, CPU bucket"
            />
            {query ? <button type="button" onClick={() => updateQuery("")}>Clear</button> : null}
          </div>
        </label>
        <label className="english-search-type">
          <span>Resource type</span>
          <select
            value={type}
            onFocus={() => void loadSearchIndex()}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">All resources</option>
            <option value="Article">Articles</option>
            <option value="Tool">Tools</option>
            <option value="Reference">References</option>
            <option value="Page">Pages</option>
          </select>
        </label>
      </div>

      {!normalizedQuery ? (
        <div className="english-popular-searches" aria-label="Popular English searches">
          <span>Popular searches</span>
          {popularQueries.map((item) => <button type="button" key={item} onClick={() => { void loadSearchIndex(); updateQuery(item); }}>{item}</button>)}
        </div>
      ) : null}

      <p className="english-search-summary" aria-live="polite">
        {waitingForIndex
          ? "Loading the English search index…"
          : normalizedQuery
            ? `${results.length} matching result${results.length === 1 ? "" : "s"}`
            : "Recommended English resources"}
      </p>

      {loadState === "error" && (normalizedQuery || type) ? (
        <div className="english-search-empty">
          <strong>The search index could not load.</strong>
          <p>Retry the index request, or continue with the roadmap, knowledge modules, references, and tools below.</p>
          <div><button type="button" onClick={() => { setLoadState("idle"); void loadSearchIndex(); }}>Retry search</button><Link href="/en/beginner">Beginner roadmap</Link><Link href="/en/knowledge">Knowledge modules</Link></div>
        </div>
      ) : waitingForIndex ? (
        <div className="english-search-loading" role="status">Preparing searchable guides, tools, references, and topic pages…</div>
      ) : results.length > 0 ? (
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
          <div><Link href="/en/beginner">Beginner roadmap</Link><Link href="/en/knowledge">Knowledge modules</Link><Link href="/en/screeps-errors">Error codes</Link><Link href="/en/blog">All guides</Link></div>
        </div>
      )}

      <style>{`
        .english-site-search { display: grid; gap: 24px; }
        .english-search-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 14px; }
        .english-search-field, .english-search-type { display: grid; gap: 9px; border: 1px solid var(--border); border-radius: 22px; padding: 22px; background: var(--surface); color: var(--muted); font-size: 13px; }
        .english-search-field > span { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; }
        .english-search-field > span small { color: var(--muted); font-size: 11px; }
        .english-search-field kbd { border: 1px solid var(--border); border-radius: 5px; padding: 1px 6px; background: var(--background); color: var(--foreground); font-family: monospace; }
        .english-search-field > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; }
        .english-search-field input, .english-search-type select { min-height: 56px; border: 1px solid var(--border); border-radius: 15px; padding: 0 17px; background: var(--background); color: var(--foreground); font: inherit; font-size: 16px; }
        .english-search-field input:focus { border-color: var(--screeps-controller); }
        .english-search-field button { min-height: 42px; align-self: center; border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; background: var(--background); color: var(--foreground); cursor: pointer; }
        .english-popular-searches { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .english-popular-searches > span { margin-right: 4px; color: var(--muted); font-size: 12px; }
        .english-popular-searches button { border: 1px solid var(--border); border-radius: 999px; padding: 8px 12px; background: var(--surface); color: var(--foreground); cursor: pointer; }
        .english-popular-searches button:hover { border-color: var(--screeps-controller); }
        .english-search-summary { margin: 0; color: var(--muted); font-size: 13px; }
        .english-search-loading { border: 1px dashed var(--border); border-radius: 20px; padding: clamp(28px, 5vw, 48px); color: var(--muted); text-align: center; }
        .english-search-results { display: grid; border-top: 1px solid var(--border); }
        .english-search-results article { border-bottom: 1px solid var(--border); padding: 28px 0; }
        .english-search-results article > span { display: inline-flex; border: 1px solid var(--border); border-radius: 999px; padding: 4px 9px; font-size: 11px; }
        .english-search-results h2 { margin: 12px 0 0; font-size: clamp(23px, 3vw, 32px); }
        .english-search-results h2 mark { border-radius: 4px; padding: 0 .08em; background: color-mix(in srgb, var(--screeps-energy) 25%, transparent); color: inherit; }
        .english-search-results p { max-width: 780px; margin: 10px 0 0; color: var(--muted); line-height: 1.7; }
        .english-search-results article > div { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 16px; }
        .english-search-results small { border: 1px solid var(--border); border-radius: 999px; padding: 5px 9px; color: var(--muted); }
        .english-search-empty { border: 1px dashed var(--border); border-radius: 20px; padding: clamp(28px, 5vw, 48px); text-align: center; }
        .english-search-empty p { max-width: 660px; margin: 12px auto 20px; color: var(--muted); line-height: 1.75; }
        .english-search-empty > div { display: flex; flex-wrap: wrap; justify-content: center; gap: 9px; }
        .english-search-empty a, .english-search-empty button { border: 1px solid var(--border); border-radius: 999px; padding: 9px 13px; background: var(--surface); color: var(--foreground); text-decoration: none; cursor: pointer; }
        @media (max-width: 760px) { .english-search-toolbar { grid-template-columns: 1fr; } }
        @media (max-width: 560px) { .english-search-field > div { grid-template-columns: 1fr; } .english-search-field button { justify-self: start; } }
      `}</style>
    </div>
  );
}
