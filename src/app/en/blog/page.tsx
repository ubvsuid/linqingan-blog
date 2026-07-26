import Link from "next/link";

import { EnglishArticleBrowser } from "@/components/english-article-browser";
import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { englishDiscoveryArticles } from "@/lib/english-discovery";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Articles and Debugging Guides",
  description:
    "Search and filter practical English Screeps articles by system, difficulty, content type, and topic. Every guide includes checked APIs, debugging steps, and transparent verification status.",
  path: "/en/blog",
  chinesePath: "/blog",
});

interface EnglishBlogPageProps {
  searchParams: Promise<{
    q?: string | string[];
    module?: string | string[];
    difficulty?: string | string[];
    type?: string | string[];
    tag?: string | string[];
  }>;
}

function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function EnglishBlogPage({ searchParams }: EnglishBlogPageProps) {
  const params = await searchParams;

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Articles</span>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">ARTICLE LIBRARY</p>
          <h1>Practical Screeps articles for the problem you need to solve</h1>
          <p>
            Browse {englishDiscoveryArticles.length} published guides by system, difficulty,
            content type, or topic. Start with{" "}
            <Link href="/en/blog/screeps-introduction">
              What Is Screeps and What Do You Actually Do in It?
            </Link>{" "}
            or follow the beginner sequence through{" "}
            <Link href="/en/blog/screeps-first-room-code">
              How to Combine Your First Screeps Room Loop
            </Link>.
          </p>
        </header>

        <EnglishArticleBrowser
          articles={englishDiscoveryArticles}
          initialQuery={readParam(params.q)}
          initialModule={readParam(params.module)}
          initialDifficulty={readParam(params.difficulty)}
          initialType={readParam(params.type)}
          initialTag={readParam(params.tag)}
        />

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
