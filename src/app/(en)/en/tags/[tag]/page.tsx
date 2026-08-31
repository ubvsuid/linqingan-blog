import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EnglishArticleBrowser } from "@/components/english-article-browser";
import { Container } from "@/components/container";
import {
  browseEnglishArticles,
  normalizeEnglishArticleBrowseParams,
  parseEnglishArticleBrowseParams,
} from "@/lib/english-article-browser";
import {
  englishTags,
  getEnglishArticlesByTag,
  getEnglishTag,
} from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

import styles from "../../english.module.css";

interface EnglishTagPageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{
    q?: string | string[];
    module?: string | string[];
    difficulty?: string | string[];
    type?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return englishTags.map((tag) => ({ tag: tag.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: EnglishTagPageProps): Promise<Metadata> {
  const { tag: slug } = await params;
  const tag = getEnglishTag(slug);
  if (!tag) return { title: "Topic not found", robots: { index: false, follow: false } };

  const basePath = `/en/tags/${tag.slug}`;
  const baseTitle = `${tag.label} Screeps Guides`;
  const description = `Browse focused English Screeps guides related to ${tag.label}, with checked APIs, debugging steps, and transparent verification status.`;
  const articles = getEnglishArticlesByTag(slug);
  const parsed = parseEnglishArticleBrowseParams(await searchParams);
  const normalized = normalizeEnglishArticleBrowseParams(
    articles,
    parsed,
    { allowTag: false },
  );
  const result = browseEnglishArticles(articles, {
    ...normalized,
    tag: tag.label,
  });
  const hasBrowseFilters = Boolean(
    parsed.q
      || parsed.module
      || parsed.difficulty
      || parsed.type
      || parsed.sort !== "newest",
  );
  const hasValidPage = parsed.page === result.page;
  const isCleanPagination = !hasBrowseFilters && hasValidPage;
  const canonicalPath =
    isCleanPagination && parsed.page > 1
      ? `/en/tags/${tag.slug}?page=${parsed.page}`
      : basePath;
  const title =
    isCleanPagination && parsed.page > 1
      ? `${baseTitle} — Page ${parsed.page} | Linqingan`
      : `${baseTitle} | Linqingan`;

  return {
    title: { absolute: title },
    description,
    robots: {
      index: tag.count >= 3 && isCleanPagination,
      follow: true,
    },
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${siteConfig.url}${canonicalPath}`,
      siteName: "Linqingan",
      title,
      description,
      images: [{ url: `${siteConfig.url}/opengraph-image`, width: 1200, height: 630 }],
    },
  };
}

export default async function EnglishTagPage({ params, searchParams }: EnglishTagPageProps) {
  const { tag: slug } = await params;
  const tag = getEnglishTag(slug);
  if (!tag) notFound();
  const articles = getEnglishArticlesByTag(slug);
  const count = articles.length;
  const browseParams = parseEnglishArticleBrowseParams(await searchParams);

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><Link href="/en/tags">Topics</Link><span aria-hidden="true">/</span><span>{tag.label}</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">TOPIC · {count} {count === 1 ? "GUIDE" : "GUIDES"}</p>
          <h1>{tag.label} Screeps guides</h1>
          <p>Focused English articles connected to {tag.label.toLowerCase()}, organized with the same filters used by the main article library.</p>
        </header>
        <EnglishArticleBrowser
          articles={articles}
          params={browseParams}
          pathname={`/en/tags/${tag.slug}`}
          lockedTag={tag.label}
        />
      </Container>
    </main>
  );
}
