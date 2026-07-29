import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { publishedEnglishArticles } from "@/lib/english-articles-complete";
import { englishKnowledgeModules } from "@/lib/i18n";

import styles from "../../home.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Verified Screeps Tutorials, Debugging Guides and Tools | Linqingan",
  description:
    "Learn Screeps with observable JavaScript examples, return-code debugging workflows, clearly stated test boundaries, and free tools for creeps, rooms, CPU, Memory, pathfinding, and automation.",
  path: "/en",
  chinesePath: "/",
});

const quickEntries = [
  { href: "/en/blog", eyebrow: "ARTICLES", title: "Read practical Screeps guides", description: "Search focused JavaScript and debugging guides by system, difficulty, content type, or topic." },
  { href: "/en/screeps-errors", eyebrow: "ERROR CODES", title: "Look up Screeps return codes", description: "Understand common failures such as ERR_NOT_IN_RANGE, ERR_NO_PATH, ERR_BUSY, and ERR_FULL." },
  { href: "/en/glossary", eyebrow: "GLOSSARY", title: "Review core Screeps terms", description: "Quick definitions for Creep, Spawn, Memory, tick, RCL, CPU bucket, and other common concepts." },
  { href: "/en/tools/creep-body-calculator", eyebrow: "BODY TOOL", title: "Build and calculate a Creep body", description: "Calculate Energy cost, spawn time, hits, carry capacity, and loaded movement speed." },
  { href: "/en/tools/room-diagnostics", eyebrow: "ROOM CHECK", title: "Diagnose a room snapshot", description: "Check Spawn, economy, Controller, construction, CPU, and bucket risks without connecting an account." },
  { href: "/en/tags", eyebrow: "TOPICS", title: "Browse by Screeps system", description: "Open focused topic archives for Memory, movement, Controllers, defense, market systems, CPU, and more." },
];

export default function EnglishHomePage() {
  return (
    <main className={styles.home} lang="en">
      <section className={`${styles.hero} screeps-room-grid`}>
        <Container className={styles.heroInner}>
          <p className="eyebrow">SCREEPS · JAVASCRIPT · VERIFIED BOUNDARIES</p>
          <h1>Verified Screeps guides for safer automation and debugging</h1>
          <p className={styles.heroDescription}>
            Learn with observable examples, return-code diagnostics, practical tools, and a clear record of what has been checked in documentation, offline tests, the Console, or a live room.
          </p>
          <div className="english-hero-actions" aria-label="Primary English actions">
            <Link className="english-primary-action" href="/en/beginner">Start the beginner roadmap</Link>
            <Link href="/en/search">Search a problem</Link>
          </div>
          <p className={styles.heroStats}>{publishedEnglishArticles.length} published English guides · 8 knowledge modules · 2 working tools</p>
          <p className="english-verification-note">Every guide states its own verification level. Publication does not imply hidden live-room testing.</p>

          <section className="english-task-hub" aria-labelledby="english-task-title">
            <div className="english-task-heading"><p className="eyebrow">CHOOSE YOUR NEXT STEP</p><h2 id="english-task-title">What do you want to do?</h2></div>
            <div className="english-task-grid">
              <article><span>01</span><p className="eyebrow">START LEARNING</p><h3>Control your first Creep</h3><p>Harvest Energy, deliver it to a Spawn, and understand the body parts that make the loop possible.</p><Link href="/en/beginner">Open the beginner roadmap →</Link></article>
              <article><span>02</span><p className="eyebrow">FIX A PROBLEM</p><h3>Search an API, error code, or symptom</h3><p>Search published guides, terms, return codes, tools, and common debugging questions.</p><form role="search" action="/en/search"><label htmlFor="english-home-search">Describe the problem</label><div><input id="english-home-search" type="search" name="q" placeholder="Example: creep not moving" /><button type="submit">Search</button></div></form></article>
              <article><span>03</span><p className="eyebrow">USE A TOOL</p><h3>Calculate or diagnose before changing code</h3><p>Use a Creep body calculator and a read-only room snapshot diagnostic tool.</p><Link href="/en/tools">Browse English tools →</Link></article>
            </div>
          </section>

          <div className="english-system-visual" role="img" aria-label="Screeps Energy loop and debugging workflow diagram">
            <div className="system-loop">
              <div><span>01</span><small>INPUT</small><strong className="english-accent-energy">Source</strong><p>Energy enters the room economy.</p></div>
              <i aria-hidden="true">→</i>
              <div><span>02</span><small>WORKER</small><strong>Creep</strong><p>WORK, CARRY, and MOVE define possible actions.</p></div>
              <i aria-hidden="true">→</i>
              <div><span>03</span><small>OUTPUT</small><strong className="english-accent-controller">Spawn · Controller</strong><p>Delivery and upgrading create visible progress.</p></div>
            </div>
            <div className="system-console">
              <div><span>main.js</span><span>debugging workflow</span></div>
              <code><b>const</b> result = creep.harvest(source);</code>
              <code><b>if</b> (result === ERR_NOT_IN_RANGE) creep.moveTo(source);</code>
              <p><span>✓</span> inspect state <span>✓</span> read return code <span>✓</span> verify next tick</p>
            </div>
          </div>
        </Container>
      </section>

      <section className={styles.learningSection} aria-labelledby="english-foundation-title">
        <Container>
          <div className={styles.sectionHeading}><div><p className="eyebrow">ENGLISH FOUNDATION</p><h2 id="english-foundation-title">Beginner lessons, references, and API safety guides</h2></div><Link href="/en/blog">Browse the guide library →</Link></div>
          <div className={styles.learningGrid}>
            <article className={styles.learningIntro}>
              <p>The English section combines navigation, reference pages, search, verification rules, functional tools, and focused guides. Each guide is organized for a clear English search intent rather than translated sentence by sentence.</p>
              <div className={styles.statRow} aria-label="English section status"><div><strong>{publishedEnglishArticles.length}</strong><span>published guides</span></div><div><strong>2</strong><span>working tools</span></div><div><strong>8</strong><span>knowledge modules</span></div></div>
            </article>
            <ol className={styles.stageList}>
              <li><span>01</span><div><strong>First Creep sequence</strong><p>Harvest Energy, deliver it to a Spawn, and understand WORK, CARRY, and MOVE.</p></div></li>
              <li><span>02</span><div><strong>Reference pages</strong><p>English error-code and glossary pages for quick lookup while reading code or the official API.</p></div></li>
              <li><span>03</span><div><strong>Practical tools</strong><p>Interactive body calculations and room snapshot diagnostics with explicit boundaries.</p></div></li>
              <li><span>04</span><div><strong>Transparent publication checks</strong><p>Each guide identifies the source, API, syntax, offline, Console, and live-room evidence that actually exists.</p></div></li>
            </ol>
          </div>
        </Container>
      </section>

      <section className={styles.knowledgeSection} aria-labelledby="english-knowledge-title">
        <Container>
          <div className={styles.knowledgeCard}>
            <div className={styles.knowledgeIntro}><p className="eyebrow">KNOWLEDGE MAP</p><h2 id="english-knowledge-title">A structured Screeps knowledge base</h2><p>Browse the subjects the English section covers without mixing beginner lessons and advanced engineering into one list.</p><div className={styles.knowledgeStats} aria-label="Knowledge map size"><span><strong>8</strong> subject modules</span><span><strong>{publishedEnglishArticles.length}</strong> published guides</span></div><Link href="/en/knowledge">Open the knowledge map →</Link></div>
            <ol className={styles.knowledgeTopics}>{englishKnowledgeModules.map((module) => <li key={module.number}><span>{String(module.number).padStart(2, "0")}</span><strong>{module.title}</strong></li>)}</ol>
          </div>
        </Container>
      </section>

      <section className={styles.quickSection} aria-labelledby="english-quick-title">
        <Container>
          <div className={styles.sectionHeading}><div><p className="eyebrow">QUICK LOOKUP</p><h2 id="english-quick-title">English guides, references, and tools</h2></div><Link href="/en/blog">View guides →</Link></div>
          <div className={styles.quickGrid}>{quickEntries.map((entry) => <Link href={entry.href} key={entry.href}><span className="eyebrow">{entry.eyebrow}</span><strong>{entry.title}</strong><p>{entry.description}</p><span aria-hidden="true">→</span></Link>)}</div>
        </Container>
      </section>
    </main>
  );
}
