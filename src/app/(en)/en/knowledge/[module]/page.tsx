import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/container";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { englishKnowledgeSections } from "@/lib/english-knowledge";
import { siteConfig } from "@/lib/site";

import styles from "../../english.module.css";

interface EnglishKnowledgeModulePageProps {
  params: Promise<{ module: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return englishKnowledgeSections.map((section) => ({ module: section.slug }));
}

export async function generateMetadata({ params }: EnglishKnowledgeModulePageProps): Promise<Metadata> {
  const { module: slug } = await params;
  const section = englishKnowledgeSections.find((item) => item.slug === slug);
  if (!section) return { title: "Knowledge module not found", robots: { index: false, follow: false } };

  const path = `/en/knowledge/${section.slug}`;
  const title = `${section.title}: Screeps Guides | Linqingan`;
  const description = `${section.description} Browse the relevant English Screeps lessons, debugging guides, safety checks, and references in one system page.`;

  return {
    title: { absolute: title },
    description,
    authors: [{ name: "Linqingan", url: `${siteConfig.url}/en/about` }],
    alternates: {
      canonical: path,
      types: { "application/rss+xml": "/en/feed.xml" },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${siteConfig.url}${path}`,
      siteName: "Linqingan",
      title,
      description,
      images: [{ url: `${siteConfig.url}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteConfig.url}/opengraph-image`],
    },
  };
}

export default async function EnglishKnowledgeModulePage({ params }: EnglishKnowledgeModulePageProps) {
  const { module: slug } = await params;
  const section = englishKnowledgeSections.find((item) => item.slug === slug);
  if (!section) notFound();

  const articles = section.articles.map((article) => ({
    article,
    discovery: getEnglishDiscoveryArticle(article.href),
  }));
  const topicMap = new Map<string, string>();
  for (const { discovery } of articles) {
    discovery?.tags.forEach((tag, index) => topicMap.set(discovery.tagSlugs[index], tag));
  }
  const path = `/en/knowledge/${section.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: section.title,
        description: section.description,
        url: `${siteConfig.url}${path}`,
        inLanguage: "en-US",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: articles.length,
          itemListElement: articles.map(({ article }, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: article.title,
            url: `${siteConfig.url}${article.href}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
          { "@type": "ListItem", position: 2, name: "Knowledge", item: `${siteConfig.url}/en/knowledge` },
          { "@type": "ListItem", position: 3, name: section.title, item: `${siteConfig.url}${path}` },
        ],
      },
    ],
  };

  return (
    <main className={styles.page} lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><Link href="/en/knowledge">Knowledge</Link><span aria-hidden="true">/</span><span>{section.title}</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">SYSTEM {String(section.number).padStart(2, "0")} · {articles.length} GUIDES</p>
          <h1>{section.title}</h1>
          <p>{section.description} This page connects the system overview to focused lessons, diagnostics, and operational boundaries.</p>
        </header>

        <section className={styles.grid} aria-label="Module navigation">
          <article className={styles.card}>
            <p className="eyebrow">START HERE</p>
            <h2>Read the system in a useful order</h2>
            <p>Begin with lessons or foundational guides, then move to debugging, safety, and advanced operations. Each article states the evidence level it actually reached.</p>
            <Link href={articles[0]?.article.href ?? "/en/blog"}>Open the first guide →</Link>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">RELATED TOPICS</p>
            <h2>Browse focused archives</h2>
            <p>{[...topicMap.values()].join(", ") || "Screeps systems and debugging"}</p>
            <div className="tag-list" aria-label="Related topic archives">
              {[...topicMap.entries()].slice(0, 8).map(([tagSlug, label]) => <Link className="tag" href={`/en/tags/${tagSlug}`} key={tagSlug}>{label}</Link>)}
            </div>
          </article>
        </section>

        <section className={styles.knowledgeModule} aria-labelledby="module-guide-list-title">
          <div className={styles.knowledgeModuleHeader}>
            <span>{String(section.number).padStart(2, "0")}</span>
            <div>
              <h2 id="module-guide-list-title">Published guides in this system</h2>
              <p>Use the labels to distinguish sequential lessons, task-focused guides, debugging workflows, safety pages, and references.</p>
            </div>
          </div>
          <ol className={styles.knowledgeArticleList}>
            {articles.map(({ article, discovery }) => (
              <li key={article.href}>
                <Link href={article.href}>
                  <span>{discovery?.contentType ?? article.category}</span>
                  <strong>{article.title}</strong>
                  <small>{article.readingTime}{discovery ? ` · ${discovery.difficulty}` : ""}</small>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <div className={styles.notice}>
          <strong>Need a guide that is not listed?</strong>
          <p>Search by API method, error code, or symptom first. Zero-result English searches are recorded anonymously and can be submitted as a public content request.</p>
          <Link href="/en/search">Search the English section →</Link>
        </div>
      </Container>
    </main>
  );
}
