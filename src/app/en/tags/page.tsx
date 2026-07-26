import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { englishTags } from "@/lib/english-discovery";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "English Screeps Topics",
  description: "Browse English Screeps guides by Memory, spawning, movement, Controllers, construction, defense, market systems, resources, CPU, debugging, and JavaScript.",
  path: "/en/tags",
  chinesePath: "/tags",
});

export default function EnglishTagsPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Topics</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">TOPIC INDEX</p>
          <h1>Browse English Screeps topics</h1>
          <p>Use focused topic pages when you know the system or concept but not the exact article title.</p>
        </header>

        <section className={styles.grid} aria-label="English topic pages">
          {englishTags.map((tag) => (
            <article className={styles.card} key={tag.slug}>
              <p className="eyebrow">{tag.count} {tag.count === 1 ? "GUIDE" : "GUIDES"}</p>
              <h2>{tag.label}</h2>
              <p>Articles that match the {tag.label.toLowerCase()} topic across the verified English library.</p>
              <Link href={`/en/tags/${tag.slug}`}>Browse {tag.label} →</Link>
            </article>
          ))}
        </section>
      </Container>
    </main>
  );
}
