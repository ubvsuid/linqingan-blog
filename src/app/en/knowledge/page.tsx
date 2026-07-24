import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { englishKnowledgeModules } from "@/lib/i18n";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Knowledge Base",
  description:
    "A structured map of Screeps topics covering Memory, spawning, room economy, movement, Controllers, defense, market systems, advanced resources, and debugging.",
  path: "/en/knowledge",
  chinesePath: "/knowledge",
});

export default function EnglishKnowledgePage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Knowledge Base</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">SCREEPS KNOWLEDGE BASE</p>
          <h1>Browse Screeps by system</h1>
          <p>
            The English knowledge base is organized around the systems you operate in a live colony. Article links will appear only after each English guide is rewritten, checked, and published.
          </p>
        </header>

        <ol className={styles.list}>
          {englishKnowledgeModules.map((module) => (
            <li key={module.number}>
              <span>{String(module.number).padStart(2, "0")}</span>
              <div><strong>{module.title}</strong><p>{module.description}</p></div>
            </li>
          ))}
        </ol>

        <section className={styles.grid} aria-label="Available English resources" style={{ marginTop: 52 }}>
          <article className={styles.card}>
            <p className="eyebrow">ERROR REFERENCE</p>
            <h2>Return codes</h2>
            <p>Use common Screeps return codes as the first branch in an action debugging process.</p>
            <Link href="/en/screeps-errors">Open error codes →</Link>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">GLOSSARY</p>
            <h2>Core terminology</h2>
            <p>Review concise definitions for the objects, resources, limits, and runtime concepts used across Screeps.</p>
            <Link href="/en/glossary">Open the glossary →</Link>
          </article>
          <article className={`${styles.card} ${styles.full}`}>
            <p className="eyebrow">TOOLS</p>
            <h2>Calculate and diagnose before editing production code</h2>
            <p>The current English tool set includes a Creep body calculator and a room snapshot diagnostic tool.</p>
            <Link href="/en/tools">Browse tools →</Link>
          </article>
        </section>
      </Container>
    </main>
  );
}
