import Link from "next/link";

import { Container } from "@/components/container";
import { ServerEnglishSearch } from "@/components/server-english-search";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { englishSearchDocuments } from "@/lib/english-search";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Search the English Screeps Section",
  description: "Search English Screeps guides, references, tools, roadmap pages, and knowledge topics on Linqingan.",
  path: "/en/search",
  chinesePath: "/search",
  noindex: true,
});

interface EnglishSearchPageProps {
  searchParams: Promise<{
    q?: string | string[];
    type?: string | string[];
  }>;
}

function readParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] ?? "" : value ?? "").trim();
}

export default async function EnglishSearchPage({ searchParams }: EnglishSearchPageProps) {
  const params = await searchParams;
  const query = readParam(params.q).slice(0, 120);
  const activeType = readParam(params.type);

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Search</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">SEARCH</p>
          <h1>Search the English section</h1>
          <p>Search published English guides, the beginner roadmap, knowledge topics, glossary, error codes, verification method, and working tools.</p>
        </header>
        <ServerEnglishSearch
          documents={englishSearchDocuments}
          query={query}
          activeType={activeType}
        />
      </Container>
    </main>
  );
}
