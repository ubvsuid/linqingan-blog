import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EnglishArticleBrowser } from "@/components/english-article-browser";
import { Container } from "@/components/container";
import {
  browseEnglishArticles,
  buildEnglishBrowseHref,
  normalizeEnglishArticleBrowseParams,
  parseEnglishArticleBrowseParams,
  type EnglishArticleBrowseParams,
} from "@/lib/english-article-browser";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { englishDiscoveryArticles } from "@/lib/english-discovery";

import styles from "../english.module.css";

const BASE_TITLE = "Screeps Articles and Debugging Guides";
const BASE_DESCRIPTION =
  "Search and filter practical English Screeps articles by system, difficulty, content type, and topic. Every page includes source review, clear scope, and transparent verification status.";
const KNOWN_BROWSE_PARAMS = new Set([
  "q",
  "module",
  "difficulty",
  "type",
  "tag",
  "sort",
  "page",
]);

type EnglishBlogSearchParams = Record<
  string,
  string | string[] | undefined
>;

interface EnglishBlogPageProps {
  searchParams: Promise<EnglishBlogSearchParams>;
}

function readFirstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] ?? "" : value ?? "").trim();
}

function getBrowseState(values: EnglishBlogSearchParams) {
  const parsed = parseEnglishArticleBrowseParams(values);
  const normalized = normalizeEnglishArticleBrowseParams(
    englishDiscoveryArticles,
    parsed,
  );
  const result = browseEnglishArticles(englishDiscoveryArticles, normalized);

  return { parsed, normalized, result };
}

function hasNonPaginationParameters(values: EnglishBlogSearchParams): boolean {
  if (
    ["q", "module", "difficulty", "type", "tag", "sort"]
      .some((key) => Boolean(readFirstParam(values[key])))
  ) {
    return true;
  }

  return Object.keys(values).some((key) => !KNOWN_BROWSE_PARAMS.has(key));
}

function hasInvalidPageParameter(values: EnglishBlogSearchParams): boolean {
  const rawPage = readFirstParam(values.page);
  return Boolean(rawPage) && !/^[1-9]\d*$/.test(rawPage);
}

function canonicalBrowseParams(
  params: EnglishArticleBrowseParams,
  page: number,
): EnglishArticleBrowseParams {
  return { ...params, page };
}

export async function generateMetadata({
  searchParams,
}: EnglishBlogPageProps): Promise<Metadata> {
  const values = await searchParams;
  const { parsed, normalized, result } = getBrowseState(values);
  const outOfRange = parsed.page > result.totalPages;
  const canonicalPage = outOfRange ? 1 : result.page;
  const canonicalPath = buildEnglishBrowseHref(
    "/en/blog",
    canonicalBrowseParams(normalized, canonicalPage),
  );
  const parameterized = Object.values(values).some((value) =>
    Boolean(readFirstParam(value)),
  );
  const noindex =
    outOfRange
    || hasInvalidPageParameter(values)
    || hasNonPaginationParameters(values);
  const title = canonicalPage > 1
    ? `${BASE_TITLE} — Page ${canonicalPage}`
    : BASE_TITLE;
  const metadata = createEnglishPageMetadata({
    title,
    description: BASE_DESCRIPTION,
    path: canonicalPath,
    chinesePath: "/blog",
    noindex,
  });

  if (parameterized) {
    metadata.alternates = {
      canonical: canonicalPath,
      types: {
        "application/rss+xml": "/en/feed.xml",
      },
    };
  }

  return metadata;
}

export default async function EnglishBlogPage({ searchParams }: EnglishBlogPageProps) {
  const values = await searchParams;
  const { parsed, normalized, result } = getBrowseState(values);

  if (parsed.page > result.totalPages) {
    notFound();
  }

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Articles</span>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">ARTICLE LIBRARY</p>
          <h1>Practical Screeps articles for the problem you need to solve</h1>
          <p>
            Browse {englishDiscoveryArticles.length} published guides by system, difficulty,
            content type, or topic. Start with{" "}
            <Link href="/en/blog/screeps-introduction">
              What Is Screeps? A Programming Strategy Game
            </Link>{" "}
            or follow the beginner sequence through{" "}
            <Link href="/en/blog/screeps-first-room-code">
              How to Combine Your First Screeps Room Loop
            </Link>.
          </p>
        </header>

        <EnglishArticleBrowser
          articles={englishDiscoveryArticles}
          params={canonicalBrowseParams(normalized, result.page)}
          pathname="/en/blog"
        />

        <div className={styles.notice}>
          <strong>Publication standard</strong>
          <p>
            English articles are published only after source review, official API checks where
            applicable, JavaScript syntax review where code is present, duplicate-intent and link
            checks, and editorial review. Publication does not imply Console or multi-tick live-room
            verification; those evidence states remain separate in each guide. {" "}
            <Link href="/en/verification">Review the verification method.</Link>
          </p>
        </div>
      </Container>
    </main>
  );
}
