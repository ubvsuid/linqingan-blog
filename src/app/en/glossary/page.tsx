import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Glossary",
  description:
    "Concise English definitions for common Screeps terms such as Creep, Spawn, tick, Memory, Controller, RCL, GCL, CPU, bucket, store, fatigue, and room visibility.",
  path: "/en/glossary",
  chinesePath: "/glossary",
});

const terms = [
  ["Creep", "A programmable unit built from body parts such as MOVE, WORK, CARRY, ATTACK, and HEAL."],
  ["Spawn", "A player-owned structure that creates Creeps when the room has enough available Energy."],
  ["Tick", "One simulation step. Your loop runs again on each tick, so multi-step behavior must preserve state."],
  ["Game loop", "The exported function that reads the current world state and issues actions for the current tick."],
  ["Memory", "Persistent JSON-compatible data used to carry decisions and state across ticks."],
  ["Controller", "The room object that determines ownership, reservation, and Room Controller Level."],
  ["RCL", "Room Controller Level. It controls structure limits and unlocks room capabilities."],
  ["GCL", "Global Control Level. It limits how many rooms an account can control."],
  ["CPU limit", "The normal CPU allowance available to your code over time."],
  ["CPU bucket", "Stored CPU credit that rises when usage is low and can support temporary bursts."],
  ["Store", "A capacity interface used by Creeps and structures to hold Energy and other resources."],
  ["Fatigue", "Movement delay accumulated by a Creep. Active MOVE parts reduce fatigue each tick."],
  ["Room visibility", "Access to live room objects. A room outside current vision cannot be read from Game.rooms."],
  ["Return code", "A numeric result from a Screeps method that explains whether the action was accepted or why it failed."],
  ["Construction Site", "A planned structure location that requires build progress before the structure exists."],
  ["PathFinder", "The path search system used for custom movement costs, obstacles, and multi-room routing."],
] as const;

export default function EnglishGlossaryPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Glossary</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">SCREEPS GLOSSARY</p>
          <h1>Core terms without the detour</h1>
          <p>Use these short definitions while reading the API, debugging Console output, or following the beginner roadmap.</p>
        </header>

        <div className={styles.grid}>
          {terms.map(([term, definition]) => (
            <article className={styles.card} key={term}>
              <p className="eyebrow">TERM</p>
              <h2>{term}</h2>
              <p>{definition}</p>
            </article>
          ))}
        </div>

        <div className={styles.notice}>
          <strong>Need a numeric result?</strong>
          <p>Open the English error-code reference when a method returns 0, -2, -6, -8, -9, or another Screeps constant.</p>
          <Link href="/en/screeps-errors">Open error codes →</Link>
        </div>
      </Container>
    </main>
  );
}
