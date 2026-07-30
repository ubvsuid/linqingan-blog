import Link from "next/link";

import { Container } from "@/components/container";
import { EnglishBeginnerProgress } from "@/components/english-learning-progress";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { publishedEnglishArticles } from "@/lib/english-articles-complete";
import { ENGLISH_BEGINNER_PATHS } from "@/lib/english-learning-state";

import styles from "../english.module.css";
import "../../english-home.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Beginner Roadmap",
  description:
    "A complete 12-lesson Screeps beginner roadmap from the first room and tick loop to harvesting, spawning, roles, upgrading, construction, repairs, and one combined room script.",
  path: "/en/beginner",
  chinesePath: "/beginner",
});

const stages = [
  { title: "Understand Screeps", description: "Learn what the game is, find the room view, editor and Console, then understand ticks and module.exports.loop." },
  { title: "Control the first Creep", description: "Harvest Energy, deliver it to a Spawn, and connect WORK, CARRY, and MOVE to the abilities used by the loop." },
  { title: "Create and assign simple roles", description: "Spawn a new Creep, separate Harvester, Upgrader and Builder responsibilities, then automate Controller upgrading." },
  { title: "Complete the first room loop", description: "Build an Extension, give the Builder a small task priority, and combine all three roles inside one readable main loop." },
] as const;

const beginnerArticles = ENGLISH_BEGINNER_PATHS.map((href, index) => {
  const article = publishedEnglishArticles.find((item) => item.href === href);
  if (!article) throw new Error(`Missing published beginner article: ${href}`);
  return { ...article, number: String(index + 1).padStart(2, "0") };
});

const stageGroups = stages.map((stage, index) => ({
  ...stage,
  number: String(index + 1).padStart(2, "0"),
  articles: beginnerArticles.slice(index * 3, index * 3 + 3),
}));

export default function EnglishBeginnerPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Beginner</span></nav>

        <header className={styles.header}>
          <p className="eyebrow">BEGINNER ROADMAP</p>
          <h1>Learn Screeps in twelve focused lessons</h1>
          <p>Follow the sequence from the first room and tick loop to one combined room script. Each lesson answers one beginner question, uses checked APIs, and states which Console or live-room verification remains pending.</p>
        </header>

        <EnglishBeginnerProgress />

        <nav className="beginner-roadmap-visual" aria-label="Four-stage Screeps beginner learning path">
          {stageGroups.map((stage) => (
            <a href={`#stage-${stage.number}`} key={stage.number}>
              <span>{stage.number}</span><strong>{stage.title}</strong><small>Lessons {Number(stage.number) * 3 - 2}–{Number(stage.number) * 3}</small>
            </a>
          ))}
        </nav>

        <div className="beginner-stage-groups">
          {stageGroups.map((stage) => (
            <section id={`stage-${stage.number}`} className="beginner-stage" key={stage.number} aria-labelledby={`stage-${stage.number}-title`}>
              <div className="beginner-stage-heading">
                <span>{stage.number}</span>
                <div><p className="eyebrow">STAGE {stage.number}</p><h2 id={`stage-${stage.number}-title`}>{stage.title}</h2><p>{stage.description}</p></div>
              </div>
              <ol>
                {stage.articles.map((article) => (
                  <li key={article.href}>
                    <Link href={article.href}>
                      <span>LESSON {article.number}</span>
                      <strong>{article.title}</strong>
                      <p>{article.description}</p>
                      <small>{article.readingTime}</small>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <div className={styles.notice}>
          <strong>Complete beginner sequence published</strong>
          <p>All twelve English beginner lessons are connected with previous and next navigation, Chinese counterparts, search records, canonical URLs, reciprocal language links, FAQ schema, and Sitemap entries.</p>
        </div>

        <section className={`${styles.grid} beginner-reference-grid`} aria-label="Beginner references and tools">
          <article className={styles.card}><p className="eyebrow">REFERENCE</p><h2>Check common error codes</h2><p>Use the English return-code reference while testing actions and movement.</p><Link href="/en/screeps-errors">Open error codes →</Link></article>
          <article className={styles.card}><p className="eyebrow">TOOL</p><h2>Build a valid Creep body</h2><p>Calculate Energy cost, capacity, spawn time, and loaded movement.</p><Link href="/en/tools/creep-body-calculator">Open the body calculator →</Link></article>
        </section>
      </Container>

    </main>
  );
}
