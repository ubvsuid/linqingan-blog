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
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Knowledge Base</span></nav>
        <header className={styles.header}>
          <p className="eyebrow">SCREEPS KNOWLEDGE BASE</p>
          <h1>Browse Screeps by system</h1>
          <p>Browse {englishKnowledgeArticleCount} published English guides through eight practical systems. Each section is generated from the complete article registry, so newly published guides appear here automatically.</p>
        </header>

        <nav className="knowledge-system-map" aria-label="Jump to a knowledge module">
          {englishKnowledgeSections.map((module, index) => (
            <a href={`#module-${module.number}`} key={module.number}>
              <span>{String(module.number).padStart(2, "0")}</span>
              <strong>{module.title}</strong>
              <small>{module.articles.length} {module.articles.length === 1 ? "guide" : "guides"}</small>
              {index < englishKnowledgeSections.length - 1 ? <i aria-hidden="true">→</i> : null}
            </a>
          ))}
        </nav>

        <div className={styles.knowledgeModules}>
          {englishKnowledgeSections.map((module) => (
            <section className={styles.knowledgeModule} id={`module-${module.number}`} key={module.number} aria-labelledby={`module-${module.number}-title`}>
              <div className={styles.knowledgeModuleHeader}>
                <span>{String(module.number).padStart(2, "0")}</span>
                <div>
                  <h2 id={`module-${module.number}-title`}>{module.title}</h2>
                  <p>{module.description}</p>
                  <small>{module.articles.length} published {module.articles.length === 1 ? "guide" : "guides"}</small>
                </div>
              </div>

              {module.articles.length > 0 ? (
                <ol className={styles.knowledgeArticleList}>
                  {module.articles.map((article) => (
                    <li key={article.href}>
                      <Link href={article.href}>
                        <span>{article.category}</span>
                        <strong>{article.title}</strong>
                        <small>{article.readingTime} · Score {article.finalScore}</small>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : <p className={styles.knowledgeEmpty}>No published guide is assigned to this module yet.</p>}
            </section>
          ))}
        </div>

        <section className={styles.grid} aria-label="Available English resources" style={{ marginTop: 52 }}>
          <article className={styles.card}><p className="eyebrow">ERROR REFERENCE</p><h2>Return codes</h2><p>Use common Screeps return codes as the first branch in an action debugging process.</p><Link href="/en/screeps-errors">Open error codes →</Link></article>
          <article className={styles.card}><p className="eyebrow">GLOSSARY</p><h2>Core terminology</h2><p>Review concise definitions for the objects, resources, limits, and runtime concepts used across Screeps.</p><Link href="/en/glossary">Open the glossary →</Link></article>
          <article className={`${styles.card} ${styles.full}`}><p className="eyebrow">TOOLS</p><h2>Calculate and diagnose before editing production code</h2><p>The current English tool set includes a Creep body calculator and a room snapshot diagnostic tool.</p><Link href="/en/tools">Browse tools →</Link></article>
        </section>
      </Container>

      <style>{`
        .knowledge-system-map { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 46px; border: 1px solid var(--border); border-radius: 22px; overflow: hidden; background: var(--surface); }
        .knowledge-system-map a { position: relative; display: grid; min-height: 150px; align-content: start; padding: 20px; text-decoration: none; }
        .knowledge-system-map a:nth-child(n + 5) { border-top: 1px solid var(--border); }
        .knowledge-system-map a:not(:nth-child(4n + 1)) { border-left: 1px solid var(--border); }
        .knowledge-system-map span { justify-self: end; color: var(--muted); font-family: monospace; font-size: 11px; }
        .knowledge-system-map strong { margin-top: 20px; font-size: 18px; line-height: 1.35; }
        .knowledge-system-map small { margin-top: 7px; color: var(--muted); }
        .knowledge-system-map i { position: absolute; right: -9px; top: 50%; z-index: 2; width: 18px; height: 18px; border-radius: 999px; background: var(--foreground); color: var(--background); font-style: normal; text-align: center; line-height: 17px; }
        .knowledge-system-map a:nth-child(4n) i { display: none; }
        @media (max-width: 800px) { .knowledge-system-map { grid-template-columns: repeat(2, minmax(0, 1fr)); } .knowledge-system-map a:nth-child(n + 3) { border-top: 1px solid var(--border); } .knowledge-system-map a:nth-child(odd) { border-left: 0; } .knowledge-system-map a:nth-child(even) { border-left: 1px solid var(--border); } .knowledge-system-map a:nth-child(2n) i { display: none; } }
        @media (max-width: 520px) { .knowledge-system-map { grid-template-columns: 1fr; } .knowledge-system-map a { min-height: 0; } .knowledge-system-map a + a { border-top: 1px solid var(--border); border-left: 0; } .knowledge-system-map i { display: none; } }
      `}</style>
    </main>
  );
}
