import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Free Screeps Tools",
  description:
    "Free English Screeps tools for calculating Creep bodies and diagnosing room snapshots without connecting your game account.",
  path: "/en/tools",
  chinesePath: "/knowledge#reference-tools",
});

export default function EnglishToolsPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Tools</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">SCREEPS TOOLS</p>
          <h1>Calculate and diagnose safely</h1>
          <p>
            These tools run locally in the browser. They do not request a Screeps token, connect to your account, or execute game actions.
          </p>
        </header>

        <section className={styles.grid} aria-label="English Screeps tools">
          <article className={styles.card}>
            <p className="eyebrow">BODY CALCULATOR</p>
            <h2>Creep Body Calculator</h2>
            <p>Combine body parts and calculate Energy cost, spawn time, total hits, carry capacity, and loaded movement speed.</p>
            <Link href="/en/tools/creep-body-calculator">Open calculator →</Link>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">ROOM DIAGNOSTICS</p>
            <h2>Room Snapshot Diagnostic</h2>
            <p>Enter Spawn, workforce, Energy, Controller, construction, CPU, and bucket values to receive prioritized checks.</p>
            <Link href="/en/tools/room-diagnostics">Open diagnostics →</Link>
          </article>
        </section>

        <div className={styles.notice}>
          <strong>Operational boundary</strong>
          <p>Tool output is a calculation or static snapshot assessment. Always inspect live return codes and multi-tick behavior before changing production automation.</p>
        </div>
      </Container>
    </main>
  );
}
