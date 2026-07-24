import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { publishedEnglishArticles } from "@/lib/english-articles";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Articles and Debugging Guides",
  description:
    "Practical English Screeps articles with checked APIs, runnable JavaScript examples, debugging steps, safety boundaries, and transparent verification status.",
  path: "/en/blog",
  chinesePath: "/blog",
});

export default function EnglishBlogPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Articles</span>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">VERIFIED ARTICLES</p>
          <h1>Practical Screeps articles</h1>
          <p>
            Focused guides for a single task or debugging problem. Each article separates
            official API facts, offline checks, and live-game verification status.
          </p>
        </header>

        <section className={styles.grid} aria-label="English Screeps articles">
          {publishedEnglishArticles.map((article) => (
            <article className={`${styles.card} ${styles.full}`} key={article.href}>
              <p className="eyebrow">{article.category}</p>
              <h2>{article.title}</h2>
              <p>{article.description}</p>
              <p>
                <small>
                  {article.publishedLabel} · {article.readingTime} · Score {article.finalScore}
                </small>
              </p>
              <Link href={article.href}>Read the guide →</Link>
            </article>
          ))}
        </section>

        <div className={styles.notice}>
          <strong>Publication standard</strong>
          <p>
            English articles are published only after source review, official API checks,
            JavaScript syntax review, duplicate-intent checks, and a final score of at least 96.
          </p>
        </div>
      </Container>
    </main>
  );
}
