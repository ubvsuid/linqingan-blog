import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { publishedEnglishArticles } from "@/lib/english-articles";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Beginner Roadmap",
  description:
    "A complete 12-lesson Screeps beginner roadmap from the first room and tick loop to harvesting, spawning, roles, upgrading, construction, repairs, and one combined room script.",
  path: "/en/beginner",
  chinesePath: "/beginner",
});

const stages = [
  {
    title: "Understand Screeps",
    description:
      "Learn what the game is, find the room view, editor and Console, then understand ticks and module.exports.loop.",
  },
  {
    title: "Control the first Creep",
    description:
      "Harvest Energy, deliver it to a Spawn, and connect WORK, CARRY, and MOVE to the abilities used by the loop.",
  },
  {
    title: "Create and assign simple roles",
    description:
      "Spawn a new Creep, separate Harvester, Upgrader and Builder responsibilities, then automate Controller upgrading.",
  },
  {
    title: "Complete the first room loop",
    description:
      "Build an Extension, give the Builder a small task priority, and combine all three roles inside one readable main loop.",
  },
] as const;

const beginnerPaths = [
  "/en/blog/screeps-introduction",
  "/en/blog/screeps-first-room",
  "/en/blog/screeps-tick-game-loop",
  "/en/blog/screeps-creep-harvest-energy",
  "/en/blog/screeps-transfer-energy-to-spawn",
  "/en/blog/screeps-creep-body-parts",
  "/en/blog/screeps-spawn-creep",
  "/en/blog/screeps-creep-roles",
  "/en/blog/screeps-upgrade-controller",
  "/en/blog/screeps-first-extension",
  "/en/blog/screeps-build-repair",
  "/en/blog/screeps-first-room-code",
] as const;

const beginnerArticles = beginnerPaths.map((href, index) => {
  const article = publishedEnglishArticles.find((item) => item.href === href);

  if (!article) {
    throw new Error(`Missing published beginner article: ${href}`);
  }

  return {
    ...article,
    number: String(index + 1).padStart(2, "0"),
  };
});

export default function EnglishBeginnerPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Beginner</span>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">BEGINNER ROADMAP</p>
          <h1>Learn Screeps in twelve focused lessons</h1>
          <p>
            Follow the sequence from the first room and tick loop to one combined room script.
            Each lesson answers one beginner question, uses checked APIs, and states which
            Console or live-room verification remains pending.
          </p>
        </header>

        <ol className={styles.list}>
          {stages.map((stage, index) => (
            <li key={stage.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{stage.title}</strong><p>{stage.description}</p></div>
            </li>
          ))}
        </ol>

        <div className={styles.notice}>
          <strong>Complete beginner sequence published</strong>
          <p>
            All twelve English beginner lessons are connected with previous and next
            navigation, Chinese counterparts, search records, canonical URLs, hreflang,
            FAQ schema, and Sitemap entries.
          </p>
        </div>

        <section
          className={styles.grid}
          aria-label="Published beginner articles"
          style={{ marginTop: 48 }}
        >
          {beginnerArticles.map((article) => (
            <article className={styles.card} key={article.href}>
              <p className="eyebrow">LESSON {article.number}</p>
              <h2>{article.title}</h2>
              <p>{article.description}</p>
              <p>
                <small>{article.readingTime} · Score {article.finalScore}</small>
              </p>
              <Link href={article.href}>Read the lesson →</Link>
            </article>
          ))}

          <article className={styles.card}>
            <p className="eyebrow">REFERENCE</p>
            <h2>Check common error codes</h2>
            <p>Use the English return-code reference while testing actions and movement.</p>
            <Link href="/en/screeps-errors">Open error codes →</Link>
          </article>

          <article className={styles.card}>
            <p className="eyebrow">TOOL</p>
            <h2>Build a valid Creep body</h2>
            <p>Calculate Energy cost, capacity, spawn time, and loaded movement.</p>
            <Link href="/en/tools/creep-body-calculator">Open the body calculator →</Link>
          </article>
        </section>
      </Container>
    </main>
  );
}
