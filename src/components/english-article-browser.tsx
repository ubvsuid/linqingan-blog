import Link from "next/link";

import { EnglishArticleQueryInput } from "@/components/english-article-query-input";
import {
  browseEnglishArticles,
  buildEnglishBrowseHref,
  ENGLISH_ARTICLE_CONTENT_TYPES,
  ENGLISH_ARTICLE_DIFFICULTIES,
  getEnglishArticleFacets,
  normalizeEnglishArticleBrowseParams,
  type EnglishArticleBrowseParams,
} from "@/lib/english-article-browser";
import type { EnglishDiscoveryArticle } from "@/lib/english-discovery";

import styles from "./english-article-browser.module.css";

interface EnglishArticleBrowserProps {
  articles: EnglishDiscoveryArticle[];
  params: EnglishArticleBrowseParams;
  pathname: string;
  lockedTag?: string;
}

export function EnglishArticleBrowser({
  articles,
  params,
  pathname,
  lockedTag,
}: EnglishArticleBrowserProps) {
  const normalizedParams = normalizeEnglishArticleBrowseParams(
    articles,
    params,
    { allowTag: !lockedTag },
  );
  const effectiveParams = lockedTag
    ? { ...normalizedParams, tag: lockedTag }
    : normalizedParams;
  const result = browseEnglishArticles(articles, effectiveParams);
  const facets = getEnglishArticleFacets(articles);
  const hasFilters = Boolean(
    normalizedParams.q
      || normalizedParams.module
      || normalizedParams.difficulty
      || normalizedParams.type
      || normalizedParams.tag,
  );

  return (
    <section className={styles.browser} aria-label="Browse English Screeps articles">
      <form className={styles.controls} action={pathname} method="get" role="search">
        <EnglishArticleQueryInput
          initialQuery={normalizedParams.q}
          scopeHrefs={lockedTag ? articles.map((article) => article.href) : undefined}
        />

        <div className={`${styles.selects} ${lockedTag ? styles.selectsLocked : ""}`}>
          <label>
            <span>Module</span>
            <select name="module" defaultValue={normalizedParams.module}>
              <option value="">All modules</option>
              {facets.modules.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span>Difficulty</span>
            <select name="difficulty" defaultValue={normalizedParams.difficulty}>
              <option value="">All levels</option>
              {ENGLISH_ARTICLE_DIFFICULTIES
                .map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span>Type</span>
            <select name="type" defaultValue={normalizedParams.type}>
              <option value="">All types</option>
              {ENGLISH_ARTICLE_CONTENT_TYPES
                .map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          {!lockedTag ? (
            <label>
              <span>Topic</span>
              <select name="tag" defaultValue={normalizedParams.tag}>
                <option value="">All topics</option>
                {facets.tags.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          ) : null}
          <label>
            <span>Sort</span>
            <select name="sort" defaultValue={normalizedParams.sort}>
              <option value="newest">Newest</option>
              <option value="shortest">Shortest read</option>
            </select>
          </label>
        </div>

        <div className={styles.summary}>
          <p><strong>{result.total}</strong> matching {result.total === 1 ? "guide" : "guides"}</p>
          <div className={styles.actions}>
            <button type="submit">Apply filters</button>
            {hasFilters || normalizedParams.sort !== "newest" || normalizedParams.page > 1
              ? <Link href={pathname}>Clear filters</Link>
              : null}
          </div>
        </div>
      </form>

      {result.articles.length > 0 ? (
        <div className={styles.results}>
          {result.articles.map((article) => (
            <article key={article.href}>
              <div className={styles.meta}>
                <span>{article.moduleTitle}</span>
                <span>{article.difficulty}</span>
                <span>{article.contentType}</span>
              </div>
              <h2><Link href={article.href}>{article.title}</Link></h2>
              <p>{article.description}</p>
              <div className={styles.footer}>
                <small>{article.readingTime}</small>
                <div>
                  {article.topics.slice(0, 3).map((topic) => (
                    <Link href={`/en/tags/${topic.slug}`} key={topic.slug}>{topic.label}</Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <strong>No published guide matches these filters.</strong>
          <p>Try a broader module, remove a difficulty filter, or search by an API method, object, return code, or symptom.</p>
          <Link href={pathname}>Show all articles</Link>
        </div>
      )}

      {result.totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Article pages">
          {result.page > 1
            ? <Link rel="prev" href={buildEnglishBrowseHref(pathname, normalizedParams, { page: result.page - 1 })}>Previous</Link>
            : <span aria-disabled="true">Previous</span>}
          <span>Page {result.page} of {result.totalPages}</span>
          {result.page < result.totalPages
            ? <Link rel="next" href={buildEnglishBrowseHref(pathname, normalizedParams, { page: result.page + 1 })}>Next</Link>
            : <span aria-disabled="true">Next</span>}
        </nav>
      ) : null}
    </section>
  );
}
