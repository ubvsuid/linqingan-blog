import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import {
  englishKnowledgeArticleCount,
  englishKnowledgeSections,
} from "@/lib/english-knowledge";

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
          <Link href="/en">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Knowledge Base</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">SCREEPS KNOWLEDGE BASE</p>
          <h1>Browse Screeps by system</h1>
          <p>
            Browse {englishKnowledgeArticleCount} published English guides through eight
            practical systems. Each section is generated from the complete article registry,
            so newly published guides appear here automatically.
          </p>
        </header>

        <div className={styles.knowledgeModules}>
          {englishKnowledgeSections.map((module) => (
            <section
              className={styles.knowledgeModule}
              id={`module-${module.number}`}
              key={module.number}
              aria-labelledby={`module-${module.number}-title`}
            >
              <div className={styles.knowledgeModuleHeader}>
                <span>{String(module.number).padStart(2, "0")}</span>
                <div>
                  <h2 id={`module-${module.number}-title`}>{module.title}</h2>
                  <p>{module.description}</p>
                  <small>
                    {module.articles.length} published {module.articles.length === 1 ? "guide" : "guides"}
                  </small>
                </div>
              </div>

              {module.articles.length > 0 ? (
                <ol className={styles.knowledgeArticleList}>
                  {module.articles.map((article) => (
                    <li key={article.href}>
                      <Link href={article.href}>
                        <span>{article.category}</span>
                        <strong>{article.title}</strong>
                        <small>
                          {article.readingTime} · Score {article.finalScore}
                        </small>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.knowledgeEmpty}>No published guide is assigned to this module yet.</p>
              )}
            </section>
          ))}
        </div>

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
