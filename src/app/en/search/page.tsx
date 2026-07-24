import Link from "next/link";

import { Container } from "@/components/container";
import { EnglishSiteSearch } from "@/components/english-site-search";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { englishSearchDocuments } from "@/lib/english-search";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Search the English Screeps Section",
  description: "Search English Screeps articles, references, tools, roadmap pages, and knowledge topics on Linqingan.",
  path: "/en/search",
  chinesePath: "/search",
  noindex: true,
});

interface EnglishSearchPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function EnglishSearchPage({ searchParams }: EnglishSearchPageProps) {
  const params = await searchParams;
  const initialQuery = Array.isArray(params.q) ? params.q[0] ?? "" : params.q ?? "";

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Search</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">SEARCH</p>
          <h1>Search the English section</h1>
          <p>Search published English articles, the beginner roadmap, knowledge topics, glossary, error codes, verification method, and working tools.</p>
        </header>
        <EnglishSiteSearch documents={englishSearchDocuments} initialQuery={initialQuery} />
      </Container>
    </main>
  );
}
