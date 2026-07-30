import type {
  EnglishContentType,
  EnglishDifficulty,
  EnglishDiscoveryArticle,
} from "@/lib/english-discovery";

export const ENGLISH_ARTICLE_PAGE_SIZE = 12;
export const ENGLISH_ARTICLE_DIFFICULTIES = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const satisfies readonly EnglishDifficulty[];
export const ENGLISH_ARTICLE_CONTENT_TYPES = [
  "Lesson",
  "Guide",
  "Debugging",
  "Safety",
  "Reference",
] as const satisfies readonly EnglishContentType[];

export type EnglishArticleSort = "newest" | "shortest";

export interface EnglishArticleBrowseParams {
  q: string;
  module: string;
  difficulty: string;
  type: string;
  tag: string;
  sort: EnglishArticleSort;
  page: number;
}

export interface EnglishArticleTopic {
  label: string;
  slug: string;
}

export interface EnglishArticleCard {
  href: string;
  title: string;
  description: string;
  moduleTitle: string;
  difficulty: EnglishDifficulty;
  contentType: EnglishContentType;
  readingTime: string;
  updatedAt: string;
  topics: EnglishArticleTopic[];
}

export interface EnglishArticleIndexItem {
  href: string;
  title: string;
  searchText: string;
}

export interface EnglishArticleFacets {
  modules: string[];
  tags: string[];
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function readParam(value: string | string[] | undefined, maxLength = 120): string {
  const first = Array.isArray(value) ? value[0] ?? "" : value ?? "";
  return first.normalize("NFKC").trim().slice(0, maxLength);
}

function readPage(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(readParam(value, 8), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseEnglishArticleBrowseParams(
  values: RawSearchParams,
): EnglishArticleBrowseParams {
  const sort = readParam(values.sort, 20);

  return {
    q: readParam(values.q),
    module: readParam(values.module, 80),
    difficulty: readParam(values.difficulty, 24),
    type: readParam(values.type, 24),
    tag: readParam(values.tag, 80),
    sort: sort === "shortest" ? "shortest" : "newest",
    page: readPage(values.page),
  };
}

function toTopics(article: EnglishDiscoveryArticle): EnglishArticleTopic[] {
  return article.tags.map((label, index) => ({
    label,
    slug: article.tagSlugs[index],
  })).filter((topic) => Boolean(topic.slug));
}

export function toEnglishArticleCard(
  article: EnglishDiscoveryArticle,
): EnglishArticleCard {
  return {
    href: article.href,
    title: article.title,
    description: article.description,
    moduleTitle: article.moduleTitle,
    difficulty: article.difficulty,
    contentType: article.contentType,
    readingTime: article.readingTime,
    updatedAt: article.updatedAt,
    topics: toTopics(article),
  };
}

function normalizeSearchValue(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en");
}

function articleMatches(
  article: EnglishDiscoveryArticle,
  params: EnglishArticleBrowseParams,
): boolean {
  const normalizedQuery = normalizeSearchValue(params.q);
  const searchable = normalizeSearchValue([
    article.title,
    article.description,
    article.primaryKeyword,
    article.searchIntent,
    article.moduleTitle,
    article.difficulty,
    article.contentType,
    ...article.keywords,
    ...article.tags,
  ].join(" "));

  return (
    (!normalizedQuery || searchable.includes(normalizedQuery))
    && (!params.module || article.moduleTitle === params.module)
    && (!params.difficulty || article.difficulty === params.difficulty)
    && (!params.type || article.contentType === params.type)
    && (!params.tag || article.tags.includes(params.tag))
  );
}

function readingMinutes(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

export function browseEnglishArticles(
  articles: EnglishDiscoveryArticle[],
  params: EnglishArticleBrowseParams,
) {
  const filtered = articles.filter((article) => articleMatches(article, params));
  filtered.sort((left, right) => {
    if (params.sort === "shortest") {
      return (
        readingMinutes(left.readingTime) - readingMinutes(right.readingTime)
        || right.updatedAt.localeCompare(left.updatedAt)
        || left.title.localeCompare(right.title)
      );
    }
    return (
      right.updatedAt.localeCompare(left.updatedAt)
      || left.title.localeCompare(right.title)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ENGLISH_ARTICLE_PAGE_SIZE));
  const page = Math.min(params.page, totalPages);
  const offset = (page - 1) * ENGLISH_ARTICLE_PAGE_SIZE;

  return {
    articles: filtered
      .slice(offset, offset + ENGLISH_ARTICLE_PAGE_SIZE)
      .map(toEnglishArticleCard),
    total: filtered.length,
    totalPages,
    page,
  };
}

export function getEnglishArticleFacets(
  articles: EnglishDiscoveryArticle[],
): EnglishArticleFacets {
  return {
    modules: Array.from(new Set(articles.map((article) => article.moduleTitle))).sort(),
    tags: Array.from(new Set(articles.flatMap((article) => article.tags))).sort(),
  };
}

export function normalizeEnglishArticleBrowseParams(
  articles: EnglishDiscoveryArticle[],
  params: EnglishArticleBrowseParams,
  options: { allowTag?: boolean } = {},
): EnglishArticleBrowseParams {
  const facets = getEnglishArticleFacets(articles);
  const allowTag = options.allowTag ?? true;

  return {
    ...params,
    module: facets.modules.includes(params.module) ? params.module : "",
    difficulty: ENGLISH_ARTICLE_DIFFICULTIES.includes(
      params.difficulty as EnglishDifficulty,
    )
      ? params.difficulty
      : "",
    type: ENGLISH_ARTICLE_CONTENT_TYPES.includes(
      params.type as EnglishContentType,
    )
      ? params.type
      : "",
    tag:
      allowTag && facets.tags.includes(params.tag)
        ? params.tag
        : "",
  };
}

export function createEnglishArticleIndex(
  articles: EnglishDiscoveryArticle[],
): EnglishArticleIndexItem[] {
  return articles.map((article) => ({
    href: article.href,
    title: article.title,
    searchText: normalizeSearchValue([
      article.title,
      article.description,
      article.primaryKeyword,
      article.moduleTitle,
      ...article.tags,
      ...article.keywords.slice(0, 16),
    ].join(" ")).slice(0, 1200),
  }));
}

export function buildEnglishBrowseHref(
  pathname: string,
  params: EnglishArticleBrowseParams,
  overrides: Partial<EnglishArticleBrowseParams> = {},
): string {
  const next = { ...params, ...overrides };
  const search = new URLSearchParams();

  if (next.q) search.set("q", next.q);
  if (next.module) search.set("module", next.module);
  if (next.difficulty) search.set("difficulty", next.difficulty);
  if (next.type) search.set("type", next.type);
  if (next.tag) search.set("tag", next.tag);
  if (next.sort !== "newest") search.set("sort", next.sort);
  if (next.page > 1) search.set("page", String(next.page));

  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}
