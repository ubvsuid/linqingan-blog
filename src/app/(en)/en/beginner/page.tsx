import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { publishedEnglishArticles } from "@/lib/english-articles-complete";

import styles from "../english.module.css";

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

        <section className={styles.grid} aria-label="Beginner references and tools" style={{ marginTop: 48 }}>
          <article className={styles.card}><p className="eyebrow">REFERENCE</p><h2>Check common error codes</h2><p>Use the English return-code reference while testing actions and movement.</p><Link href="/en/screeps-errors">Open error codes →</Link></article>
          <article className={styles.card}><p className="eyebrow">TOOL</p><h2>Build a valid Creep body</h2><p>Calculate Energy cost, capacity, spawn time, and loaded movement.</p><Link href="/en/tools/creep-body-calculator">Open the body calculator →</Link></article>
        </section>
      </Container>

      <style>{`
        .beginner-roadmap-visual { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; margin-bottom: 64px; border: 1px solid var(--border); border-radius: 22px; overflow: hidden; background: var(--surface); }
        .beginner-roadmap-visual a { position: relative; display: grid; min-height: 170px; align-content: start; padding: 24px; text-decoration: none; }
        .beginner-roadmap-visual a + a { border-left: 1px solid var(--border); }
        .beginner-roadmap-visual a::after { content: "→"; position: absolute; top: 50%; right: -9px; z-index: 2; width: 18px; height: 18px; border-radius: 999px; background: var(--foreground); color: var(--background); text-align: center; line-height: 17px; }
        .beginner-roadmap-visual a:last-child::after { display: none; }
        .beginner-roadmap-visual span { justify-self: end; color: var(--muted); font-family: monospace; font-size: 12px; }
        .beginner-roadmap-visual strong { margin-top: 22px; font-size: 20px; line-height: 1.3; }
        .beginner-roadmap-visual small { color: var(--muted); }
        .beginner-stage-groups { display: grid; gap: 54px; }
        .beginner-stage { scroll-margin-top: 110px; border-top: 1px solid var(--border); padding-top: 30px; }
        .beginner-stage-heading { display: grid; grid-template-columns: 70px minmax(0, 1fr); gap: 26px; margin-bottom: 24px; }
        .beginner-stage-heading > span { color: var(--muted); font-family: monospace; font-size: 13px; }
        .beginner-stage-heading h2 { margin: 7px 0 0; font-size: clamp(31px, 5vw, 52px); letter-spacing: -.05em; }
        .beginner-stage-heading p:not(.eyebrow) { max-width: 780px; margin: 13px 0 0; color: var(--muted); line-height: 1.7; }
        .beginner-stage ol { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 0; padding: 0; list-style: none; }
        .beginner-stage li a { display: flex; min-height: 310px; flex-direction: column; border: 1px solid var(--border); border-radius: 20px; padding: 24px; background: var(--surface); text-decoration: none; }
        .beginner-stage li a > span { color: var(--muted); font-size: 11px; letter-spacing: .05em; }
        .beginner-stage li strong { margin-top: 20px; font-size: 24px; line-height: 1.25; letter-spacing: -.035em; }
        .beginner-stage li p { margin: 13px 0 20px; color: var(--muted); line-height: 1.7; }
        .beginner-stage li small { margin-top: auto; color: var(--muted); }
        @media (max-width: 900px) { .beginner-roadmap-visual { grid-template-columns: repeat(2, minmax(0, 1fr)); } .beginner-roadmap-visual a:nth-child(3) { border-top: 1px solid var(--border); border-left: 0; } .beginner-roadmap-visual a:nth-child(2)::after { display: none; } .beginner-stage ol { grid-template-columns: 1fr; } .beginner-stage li a { min-height: 0; } }
        @media (max-width: 560px) { .beginner-roadmap-visual { grid-template-columns: 1fr; } .beginner-roadmap-visual a + a { border-top: 1px solid var(--border); border-left: 0; } .beginner-roadmap-visual a::after { display: none; } .beginner-stage-heading { grid-template-columns: 1fr; gap: 8px; } }
      `}</style>
    </main>
  );
}
