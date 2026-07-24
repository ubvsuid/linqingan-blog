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
            This page defines the English learning sequence before the individual lessons are published. It keeps the future article series focused on one beginner question at a time.
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
          <strong>Article status</strong>
          <p>
            The English articles are intentionally not published yet. The first batch will focus on Creep movement, ERR_NOT_IN_RANGE, spawnCreep return codes, harvesting, delivery, Memory state, and CPU basics.
          </p>
        </div>

        <section className={styles.grid} aria-label="Beginner resources" style={{ marginTop: 48 }}>
          <article className={styles.card}>
            <p className="eyebrow">REFERENCE</p>
            <h2>Check common error codes</h2>
            <p>Use the English return-code reference while testing simple actions in the Console.</p>
            <Link href="/en/screeps-errors">Open error codes →</Link>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">TOOL</p>
            <h2>Build a valid Creep body</h2>
            <p>Calculate Energy cost and movement before calling spawnCreep.</p>
            <Link href="/en/tools/creep-body-calculator">Open the body calculator →</Link>
          </article>
        </section>
      </Container>
    </main>
  );
}
