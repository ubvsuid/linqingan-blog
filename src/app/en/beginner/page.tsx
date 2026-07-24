import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Beginner Roadmap",
  description:
    "A clear Screeps beginner roadmap from ticks, the game loop, and the first Creep to roles, upgrading, construction, and a stable room loop.",
  path: "/en/beginner",
  chinesePath: "/beginner",
});

const stages = [
  {
    title: "Understand the game loop",
    description: "Learn what Screeps is, how ticks work, where your JavaScript runs, and why every action must be repeated across ticks.",
  },
  {
    title: "Control the first Creep",
    description: "Read a Creep from Game.creeps, move it, harvest Energy, transfer resources, and inspect return codes.",
  },
  {
    title: "Spawn and assign roles",
    description: "Create new Creeps, attach role data in Memory, count role populations, and keep a minimum workforce alive.",
  },
  {
    title: "Build the first room loop",
    description: "Upgrade the Controller, place an Extension, build and repair structures, and connect the tasks inside module.exports.loop.",
  },
];

const beginnerArticles = [
  {
    href: "/en/blog/screeps-creep-harvest-energy",
    number: "01",
    title: "Harvest Energy with the first Creep",
    description: "Find a named Creep and Source, call harvest(), and move only when the return code reports insufficient range.",
  },
  {
    href: "/en/blog/screeps-transfer-energy-to-spawn",
    number: "02",
    title: "Deliver Energy to a Spawn",
    description: "Add a delivery state, use transfer(), handle a full Spawn, and complete the first round trip.",
  },
  {
    href: "/en/blog/screeps-creep-body-parts",
    number: "03",
    title: "Understand WORK, CARRY, and MOVE",
    description: "Connect active body parts to harvesting, Store capacity, movement, fatigue, and common failure symptoms.",
  },
] as const;

export default function EnglishBeginnerPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Beginner</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">BEGINNER ROADMAP</p>
          <h1>Learn Screeps in a stable order</h1>
          <p>
            Follow focused lessons in sequence. Each article answers one beginner question,
            uses checked APIs, and states which live-game verification remains pending.
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
          <strong>Published beginner sequence</strong>
          <p>
            The first English Creep sequence is live: harvest Energy, deliver it to a Spawn,
            then connect WORK, CARRY, and MOVE to the abilities used by that loop.
          </p>
        </div>

        <section className={styles.grid} aria-label="Published beginner articles" style={{ marginTop: 48 }}>
          {beginnerArticles.map((article) => (
            <article className={styles.card} key={article.href}>
              <p className="eyebrow">LESSON {article.number}</p>
              <h2>{article.title}</h2>
              <p>{article.description}</p>
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
