import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EnglishArticleBrowser } from "@/components/english-article-browser";
import { Container } from "@/components/container";
import {
  englishTags,
  getEnglishArticlesByTag,
  getEnglishTag,
} from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

import styles from "../../english.module.css";

interface EnglishTagPageProps {
  params: Promise<{ tag: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return englishTags.map((tag) => ({ tag: tag.slug }));
}

export async function generateMetadata({ params }: EnglishTagPageProps): Promise<Metadata> {
  const { tag: slug } = await params;
  const tag = getEnglishTag(slug);
  if (!tag) return { title: "Topic not found", robots: { index: false, follow: false } };

  const path = `/en/tags/${tag.slug}`;
  const title = `${tag.label} Screeps Guides | Linqingan`;
  const description = `Browse ${tag.count} verified English Screeps guides related to ${tag.label}, with checked APIs, debugging steps, and transparent verification status.`;

  return {
    title: { absolute: title },
    description,
    robots: {
      index: tag.count >= 3,
      follow: true,
    },
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${siteConfig.url}${path}`,
      siteName: "Linqingan",
      title,
      description,
      images: [{ url: `${siteConfig.url}/opengraph-image`, width: 1200, height: 630 }],
    },
  };
}

export default async function EnglishTagPage({ params }: EnglishTagPageProps) {
  const { tag: slug } = await params;
  const tag = getEnglishTag(slug);
  if (!tag) notFound();
  const articles = getEnglishArticlesByTag(slug);

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><Link href="/en/tags">Topics</Link><span aria-hidden="true">/</span><span>{tag.label}</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">TOPIC · {tag.count} {tag.count === 1 ? "GUIDE" : "GUIDES"}</p>
          <h1>{tag.label} Screeps guides</h1>
          <p>Focused English articles connected to {tag.label.toLowerCase()}, organized with the same filters used by the main article library.</p>
        </header>
        <EnglishArticleBrowser articles={articles} initialTag={tag.label} />
      </Container>
    </main>
  );
}
