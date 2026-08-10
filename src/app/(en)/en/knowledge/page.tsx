import Link from "next/link";

import { Container } from "@/components/container";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import {
  englishKnowledgeArticleCount,
  englishKnowledgeSections,
} from "@/lib/english-knowledge";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Knowledge Base",
  description:
    "A structured map of Screeps topics covering Memory, spawning, room economy, movement, Controllers, defense, market systems, advanced resources, debugging, API lookup, tools, and verification evidence.",
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
          <p>Browse {englishKnowledgeArticleCount} published English guides through eight indexable system pillars. Newly published guides appear in the relevant system automatically.</p>
        </header>

        <nav className="knowledge-system-map" aria-label="Open a knowledge module">
          {englishKnowledgeSections.map((module, index) => (
            <Link href={`/en/knowledge/${module.slug}`} key={module.number}>
              <span>{String(module.number).padStart(2, "0")}</span>
              <strong>{module.title}</strong>
              <small>{module.articles.length} {module.articles.length === 1 ? "guide" : "guides"}</small>
              {index < englishKnowledgeSections.length - 1 ? <i aria-hidden="true">→</i> : null}
            </Link>
          ))}
        </nav>

        <div className={styles.knowledgeModules}>
          {englishKnowledgeSections.map((module) => (
            <section className={styles.knowledgeModule} id={`module-${module.number}`} key={module.number} aria-labelledby={`module-${module.number}-title`}>
              <div className={styles.knowledgeModuleHeader}>
                <span>{String(module.number).padStart(2, "0")}</span>
                <div>
                  <h2 id={`module-${module.number}-title`}><Link href={`/en/knowledge/${module.slug}`}>{module.title}</Link></h2>
                  <p>{module.description}</p>
                  <small>{module.articles.length} published {module.articles.length === 1 ? "guide" : "guides"} · <Link href={`/en/knowledge/${module.slug}`}>Open system page</Link></small>
                </div>
              </div>

              {module.articles.length > 0 ? (
                <ol className={styles.knowledgeArticleList}>
                  {module.articles.slice(0, 6).map((article) => {
                    const discovery = getEnglishDiscoveryArticle(article.href);
                    return (
                      <li key={article.href}>
                        <Link href={article.href}>
                          <span>{article.category}</span>
                          <strong>{article.title}</strong>
                          <small>{article.readingTime}{discovery ? ` · ${discovery.difficulty} · ${discovery.contentType}` : ""}</small>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              ) : <p className={styles.knowledgeEmpty}>No published guide is assigned to this module yet.</p>}
              {module.articles.length > 6 ? <p className={styles.knowledgeEmpty}><Link href={`/en/knowledge/${module.slug}`}>View all {module.articles.length} guides in this system →</Link></p> : null}
            </section>
          ))}
        </div>

        <section className={`${styles.grid} knowledge-resource-grid`} aria-label="Available English resources">
          <article className={styles.card}><p className="eyebrow">API QUICK REFERENCE</p><h2>Common Screeps APIs</h2><p>Search Game, Creep, Room, Structure, Market, and PathFinder APIs, then continue to a matching guide or official documentation.</p><Link href="/en/screeps-api">Open API quick reference →</Link></article>
          <article className={styles.card}><p className="eyebrow">ERROR REFERENCE</p><h2>Return codes</h2><p>Use common Screeps return codes as the first branch in an action debugging process.</p><Link href="/en/screeps-errors">Open error codes →</Link></article>
          <article className={styles.card}><p className="eyebrow">GLOSSARY</p><h2>Core terminology</h2><p>Review concise definitions for the objects, resources, limits, and runtime concepts used across Screeps.</p><Link href="/en/glossary">Open the glossary →</Link></article>
          <article className={styles.card}><p className="eyebrow">RECENTLY VERIFIED</p><h2>Runtime evidence</h2><p>See English guides whose shared source records explicitly contain Console testing or live multi-tick verification.</p><Link href="/en/verified">Browse verified guides →</Link></article>
          <article className={`${styles.card} ${styles.full}`}><p className="eyebrow">TOOLS</p><h2>Calculate and diagnose before editing production code</h2><p>Use the English body, room, Market, Controller, Lab, Spawn, hauling, and Tower tools without connecting a Screeps account.</p><Link href="/en/tools">Browse tools →</Link></article>
        </section>
      </Container>
    </main>
  );
}
