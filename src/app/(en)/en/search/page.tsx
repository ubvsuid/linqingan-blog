import Link from "next/link";

import { Container } from "@/components/container";
import { EnglishSiteSearch } from "@/components/english-site-search";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { getKnowledgeClusterHandoffSignals } from "@/lib/knowledge-cluster-handoff";
import { getEnglishInitialSearchDocuments } from "@/lib/english-search";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Search and Diagnose Screeps Problems",
  description: "Search English Screeps guides, return codes, APIs, tools, and then continue through symptom diagnostics and accepted Runtime Evidence.",
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
  const initialDocuments = getEnglishInitialSearchDocuments(initialQuery);
  const clusterHandoffs = getKnowledgeClusterHandoffSignals("en");

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Search</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">SEARCH + DIAGNOSTICS</p>
          <h1>Start with the problem, not just a page title</h1>
          <p>Search discovers the most relevant guides, references, return codes, and tools. When the answer is still uncertain, continue through symptom diagnostics, API surfaces, and accepted Runtime Evidence.</p>
        </header>

        <div className={styles.notice}>
          <strong>Problem-solving path</strong>
          <p>Problem → likely cause → return code / API → guide / tool → accepted Runtime Evidence.</p>
          <p>
            <Link href="/en/diagnostics">Symptom diagnostics →</Link>{" · "}
            <Link href="/en/screeps-api">API reference →</Link>{" · "}
            <Link href="/en/screeps-errors">Return codes →</Link>{" · "}
            <Link href="/en/verified">Runtime Evidence Hub →</Link>
          </p>
        </div>

        <EnglishSiteSearch
          initialQuery={initialQuery}
          initialDocuments={initialDocuments}
          clusterHandoffs={clusterHandoffs}
        />
      </Container>
    </main>
  );
}
