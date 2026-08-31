import type { Metadata } from "next";
import Link from "next/link";

import { EnglishArticleBrowser } from "@/components/english-article-browser";
import { Container } from "@/components/container";
import {
  browseEnglishArticles,
  normalizeEnglishArticleBrowseParams,
  parseEnglishArticleBrowseParams,
} from "@/lib/english-article-browser";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { englishDiscoveryArticles } from "@/lib/english-discovery";

import styles from "../english.module.css";

const metadataDescription =
  "Search and filter practical English Screeps articles by system, difficulty, content type, and topic. Every page includes source review, clear scope, and transparent verification status.";

interface EnglishBlogPageProps {
  searchParams: Promise<{
    q?: string | string[];
    module?: string | string[];
    difficulty?: string | string[];
    type?: string | string[];
    tag?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
}

export async function generateMetadata({
  searchParams,
}: EnglishBlogPageProps): Promise<Metadata> {
  const parsed = parseEnglishArticleBrowseParams(await searchParams);
  const normalized = normalizeEnglishArticleBrowseParams(
    englishDiscoveryArticles,
    parsed,
  );
  const result = browseEnglishArticles(englishDiscoveryArticles, normalized);
  const hasBrowseFilters = Boolean(
    parsed.q
      || parsed.module
      || parsed.difficulty
      || parsed.type
      || parsed.tag
      || parsed.sort !== "newest",
  );
  const hasValidPage = parsed.page === result.page;
  const isCleanPagination = !hasBrowseFilters && hasValidPage;
  const canonicalPath =
    isCleanPagination && parsed.page > 1
      ? `/en/blog?page=${parsed.page}`
      : "/en/blog";
  const title =
    isCleanPagination && parsed.page > 1
      ? `Screeps Articles and Debugging Guides — Page ${parsed.page}`
      : "Screeps Articles and Debugging Guides";

  const metadata = createEnglishPageMetadata({
    title,
    description: metadataDescription,
    path: canonicalPath,
    chinesePath: "/blog",
    noindex: !isCleanPagination,
  });

  if (canonicalPath === "/en/blog") return metadata;

  return {
    ...metadata,
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: canonicalPath,
        "x-default": "/en/blog",
      },
      types: metadata.alternates?.types,
    },
  };
}

export default async function EnglishBlogPage({ searchParams }: EnglishBlogPageProps) {
  const params = parseEnglishArticleBrowseParams(await searchParams);

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
          params={params}
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
