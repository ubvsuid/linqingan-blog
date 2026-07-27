"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  EnglishContentType,
  EnglishDifficulty,
  EnglishDiscoveryArticle,
} from "@/lib/english-discovery";

const ITEMS_PER_PAGE = 12;

interface EnglishArticleBrowserProps {
  articles: EnglishDiscoveryArticle[];
  initialQuery?: string;
  initialModule?: string;
  initialDifficulty?: string;
  initialType?: string;
  initialTag?: string;
}

function updateLocation(values: Record<string, string>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  url.searchParams.delete("page");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

export function EnglishArticleBrowser({
  articles,
  initialQuery = "",
  initialModule = "",
  initialDifficulty = "",
  initialType = "",
  initialTag = "",
}: EnglishArticleBrowserProps) {
  const [query, setQuery] = useState(initialQuery);
  const [module, setModule] = useState(initialModule);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [contentType, setContentType] = useState(initialType);
  const [tag, setTag] = useState(initialTag);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const modules = useMemo(
    () => Array.from(new Set(articles.map((article) => article.moduleTitle))).sort(),
    [articles],
  );
  const tags = useMemo(
    () => Array.from(new Set(articles.flatMap((article) => article.tags))).sort(),
    [articles],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = articles.filter((article) => {
      const searchable = [
        article.title,
        article.description,
        article.primaryKeyword,
        article.searchIntent,
        article.moduleTitle,
        article.difficulty,
        article.contentType,
        ...article.keywords,
        ...article.tags,
      ].join(" ").toLowerCase();

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery))
        && (!module || article.moduleTitle === module)
        && (!difficulty || article.difficulty === difficulty)
        && (!contentType || article.contentType === contentType)
        && (!tag || article.tags.includes(tag))
      );
    });

    return result.sort((left, right) => {
      if (sort === "shortest") return Number.parseInt(left.readingTime, 10) - Number.parseInt(right.readingTime, 10);
      return right.updatedAt.localeCompare(left.updatedAt);
    });
  }, [articles, query, module, difficulty, contentType, tag, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  function changeFilter(key: string, value: string, setter: (value: string) => void) {
    setter(value);
    setPage(1);
    updateLocation({ [key]: value });
  }

  function resetFilters() {
    setQuery("");
    setModule("");
    setDifficulty("");
    setContentType("");
    setTag("");
    setSort("newest");
    setPage(1);
    window.history.replaceState(null, "", window.location.pathname);
  }

  return (
    <section className="english-article-browser" aria-label="Browse English Screeps articles">
      <div className="article-browser-controls">
        <label className="article-browser-search">
          <span>Search articles</span>
          <input
            type="search"
            value={query}
            onChange={(event) => changeFilter("q", event.target.value, setQuery)}
            placeholder="Try: PathFinder, CPU bucket, terminal, ERR_NO_PATH"
          />
        </label>

        <div className="article-browser-selects">
          <label><span>Module</span><select value={module} onChange={(event) => changeFilter("module", event.target.value, setModule)}><option value="">All modules</option>{modules.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Difficulty</span><select value={difficulty} onChange={(event) => changeFilter("difficulty", event.target.value, setDifficulty)}><option value="">All levels</option>{(["Beginner", "Intermediate", "Advanced"] satisfies EnglishDifficulty[]).map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Type</span><select value={contentType} onChange={(event) => changeFilter("type", event.target.value, setContentType)}><option value="">All types</option>{(["Lesson", "Guide", "Debugging", "Safety", "Reference"] satisfies EnglishContentType[]).map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Topic</span><select value={tag} onChange={(event) => changeFilter("tag", event.target.value, setTag)}><option value="">All topics</option>{tags.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Sort</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="newest">Newest</option><option value="shortest">Shortest read</option></select></label>
        </div>

        <div className="article-browser-summary" aria-live="polite">
          <p><strong>{filtered.length}</strong> matching {filtered.length === 1 ? "guide" : "guides"}</p>
          {(query || module || difficulty || contentType || tag) ? <button type="button" onClick={resetFilters}>Clear filters</button> : null}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="article-browser-results">
          {visible.map((article) => (
            <article key={article.href}>
              <div className="article-browser-meta"><span>{article.moduleTitle}</span><span>{article.difficulty}</span><span>{article.contentType}</span></div>
              <h2><Link href={article.href}>{article.title}</Link></h2>
              <p>{article.description}</p>
              <div className="article-browser-footer">
                <small>{article.readingTime}</small>
                <div>{article.tags.slice(0, 3).map((value, index) => <Link href={`/en/tags/${article.tagSlugs[index]}`} key={value}>{value}</Link>)}</div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="article-browser-empty">
          <strong>No published guide matches these filters.</strong>
          <p>Try a broader module, remove a difficulty filter, or search by an API method, object, return code, or symptom.</p>
          <button type="button" onClick={resetFilters}>Show all articles</button>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="article-browser-pagination" aria-label="Article pages">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
        </nav>
      ) : null}

      <style>{`
        .english-article-browser { display: grid; gap: 34px; }
        .article-browser-controls { display: grid; gap: 18px; border: 1px solid var(--border); border-radius: 24px; padding: clamp(20px, 4vw, 30px); background: var(--surface); }
        .article-browser-search, .article-browser-selects label { display: grid; gap: 8px; color: var(--muted); font-size: 12px; font-weight: 650; }
        .article-browser-search input, .article-browser-selects select { width: 100%; min-height: 48px; border: 1px solid var(--border); border-radius: 13px; padding: 0 14px; background: var(--background); color: var(--foreground); font: inherit; font-size: 14px; }
        .article-browser-search input { min-height: 56px; font-size: 16px; }
        .article-browser-selects { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
        .article-browser-summary { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
        .article-browser-summary p { margin: 0; color: var(--muted); }
        .article-browser-summary strong { color: var(--foreground); }
        .article-browser-summary button, .article-browser-empty button, .article-browser-pagination button { min-height: 42px; border: 1px solid var(--border); border-radius: 999px; padding: 0 15px; background: var(--background); color: var(--foreground); cursor: pointer; }
        .article-browser-results { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .article-browser-results article { display: flex; min-height: 330px; flex-direction: column; border: 1px solid var(--border); border-radius: 22px; padding: clamp(24px, 4vw, 34px); background: var(--surface); }
        .article-browser-meta { display: flex; flex-wrap: wrap; gap: 7px; }
        .article-browser-meta span, .article-browser-footer a { border: 1px solid var(--border); border-radius: 999px; padding: 4px 8px; color: var(--muted); font-size: 11px; text-decoration: none; }
        .article-browser-results h2 { margin: 20px 0 0; font-size: clamp(24px, 3.4vw, 35px); line-height: 1.15; letter-spacing: -.04em; }
        .article-browser-results p { margin: 15px 0 24px; color: var(--muted); line-height: 1.75; }
        .article-browser-footer { display: grid; gap: 13px; margin-top: auto; }
        .article-browser-footer small { color: var(--muted); }
        .article-browser-footer div { display: flex; flex-wrap: wrap; gap: 7px; }
        .article-browser-empty { border: 1px dashed var(--border); border-radius: 22px; padding: clamp(34px, 7vw, 68px); text-align: center; }
        .article-browser-empty p { max-width: 650px; margin: 12px auto 22px; color: var(--muted); line-height: 1.7; }
        .article-browser-pagination { display: flex; align-items: center; justify-content: center; gap: 18px; }
        .article-browser-pagination span { color: var(--muted); font-size: 13px; }
        .article-browser-pagination button:disabled { cursor: not-allowed; opacity: .45; }
        @media (max-width: 980px) { .article-browser-selects { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 760px) { .article-browser-results { grid-template-columns: 1fr; } .article-browser-results article { min-height: 0; } }
        @media (max-width: 560px) { .article-browser-selects { grid-template-columns: 1fr; } .article-browser-summary { align-items: flex-start; flex-direction: column; } }
      `}</style>
    </section>
  );
}
