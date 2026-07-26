import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { publishedEnglishArticles } from "@/lib/english-articles-complete";
import { englishKnowledgeModules } from "@/lib/i18n";

import styles from "../home.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Tutorials, Debugging Guides and Tools | Linqingan",
  description:
    "Learn Screeps with practical JavaScript guides, debugging checklists, error-code references, and free tools for creeps, rooms, CPU, Memory, pathfinding, and automation.",
  path: "/en",
  chinesePath: "/",
});

const quickEntries = [
  { href: "/en/blog", eyebrow: "ARTICLES", title: "Read verified Screeps guides", description: "Search focused JavaScript and debugging guides by system, difficulty, content type, or topic." },
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
          <p className="eyebrow">SCREEPS · JAVASCRIPT · SYSTEMS</p>
          <h1>Practical Screeps guides and tools</h1>
          <p className={styles.heroDescription}>
            Learn the game step by step, debug code that does not behave as expected, and use focused tools for bodies, rooms, CPU, Memory, movement, and automation.
          </p>
          <p className={styles.heroStats}>{publishedEnglishArticles.length} verified articles · 8 knowledge modules · 2 working tools</p>

          <div className="english-system-visual" role="img" aria-label="Screeps Energy loop and debugging workflow diagram">
            <div className="system-loop">
              <div><span>01</span><small>INPUT</small><strong>Source</strong><p>Energy enters the room economy.</p></div>
              <i aria-hidden="true">→</i>
              <div><span>02</span><small>WORKER</small><strong>Creep</strong><p>WORK, CARRY, and MOVE define possible actions.</p></div>
              <i aria-hidden="true">→</i>
              <div><span>03</span><small>OUTPUT</small><strong>Spawn · Controller</strong><p>Delivery and upgrading create visible progress.</p></div>
            </div>
            <div className="system-console">
              <div><span>main.js</span><span>verified workflow</span></div>
              <code><b>const</b> result = creep.harvest(source);</code>
              <code><b>if</b> (result === ERR_NOT_IN_RANGE) creep.moveTo(source);</code>
              <p><span>✓</span> inspect state <span>✓</span> read return code <span>✓</span> verify next tick</p>
            </div>
          </div>

          <section className="english-task-hub" aria-labelledby="english-task-title">
            <div className="english-task-heading"><p className="eyebrow">CHOOSE YOUR NEXT STEP</p><h2 id="english-task-title">What do you want to do?</h2></div>
            <div className="english-task-grid">
              <article><span>01</span><p className="eyebrow">START LEARNING</p><h3>Control your first Creep</h3><p>Harvest Energy, deliver it to a Spawn, and understand the body parts that make the loop possible.</p><Link href="/en/beginner">Open the beginner roadmap →</Link></article>
              <article><span>02</span><p className="eyebrow">FIX A PROBLEM</p><h3>Search an API, error code, or symptom</h3><p>Search published articles, terms, return codes, tools, and common debugging questions.</p><form role="search" action="/en/search"><label htmlFor="english-home-search">Describe the problem</label><div><input id="english-home-search" type="search" name="q" placeholder="Example: creep not moving" /><button type="submit">Search</button></div></form></article>
              <article><span>03</span><p className="eyebrow">USE A TOOL</p><h3>Calculate or diagnose before changing code</h3><p>Use a Creep body calculator and a read-only room snapshot diagnostic tool.</p><Link href="/en/tools">Browse English tools →</Link></article>
            </div>
          </section>
        </Container>
      </section>

      <section className={styles.learningSection} aria-labelledby="english-foundation-title">
        <Container>
          <div className={styles.sectionHeading}><div><p className="eyebrow">ENGLISH FOUNDATION</p><h2 id="english-foundation-title">Verified beginner lessons and API safety guides</h2></div><Link href="/en/blog">Read the articles →</Link></div>
          <div className={styles.learningGrid}>
            <article className={styles.learningIntro}>
              <p>The English section combines navigation, reference pages, search, verification rules, functional tools, and focused articles. Each article is rewritten for a clear English search intent rather than translated sentence by sentence.</p>
              <div className={styles.statRow} aria-label="English foundation status"><div><strong>{publishedEnglishArticles.length}</strong><span>verified articles</span></div><div><strong>2</strong><span>working tools</span></div><div><strong>8</strong><span>knowledge modules</span></div></div>
            </article>
            <ol className={styles.stageList}>
              <li><span>01</span><div><strong>First Creep sequence</strong><p>Harvest Energy, deliver it to a Spawn, and understand WORK, CARRY, and MOVE.</p></div></li>
              <li><span>02</span><div><strong>Reference pages</strong><p>English error-code and glossary pages for quick lookup while reading code or the official API.</p></div></li>
              <li><span>03</span><div><strong>Practical tools</strong><p>Interactive body calculations and room snapshot diagnostics with explicit boundaries.</p></div></li>
              <li><span>04</span><div><strong>Verified publication batches</strong><p>New articles are added only after source, official API, code, and duplicate-intent checks.</p></div></li>
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
          <div className={styles.sectionHeading}><div><p className="eyebrow">QUICK LOOKUP</p><h2 id="english-quick-title">English articles, references and tools</h2></div><Link href="/en/blog">View articles →</Link></div>
          <div className={styles.quickGrid}>{quickEntries.map((entry) => <Link href={entry.href} key={entry.href}><span className="eyebrow">{entry.eyebrow}</span><strong>{entry.title}</strong><p>{entry.description}</p><span aria-hidden="true">→</span></Link>)}</div>
        </Container>
      </section>

      <style>{`
        .english-system-visual { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(320px, .65fr); width: min(100%, 1120px); margin: 48px auto 0; border: 1px solid var(--border); border-radius: 26px; overflow: hidden; background: var(--surface); text-align: left; }
        .system-loop { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; gap: 14px; align-items: center; padding: 30px; }
        .system-loop > div { display: grid; min-height: 190px; align-content: start; border: 1px solid var(--border); border-radius: 18px; padding: 20px; background: var(--background); }
        .system-loop > div > span { justify-self: end; color: var(--muted); font-family: monospace; font-size: 11px; }
        .system-loop small { margin-top: 24px; color: var(--muted); font-size: 10px; letter-spacing: .09em; }
        .system-loop strong { margin-top: 7px; font-size: 21px; letter-spacing: -.03em; }
        .system-loop p { margin: 10px 0 0; color: var(--muted); font-size: 13px; line-height: 1.6; }
        .system-loop i { color: var(--muted); font-style: normal; }
        .system-console { display: grid; align-content: center; gap: 13px; border-left: 1px solid var(--border); padding: 30px; background: #101216; color: #ecedf0; }
        .system-console > div { display: flex; justify-content: space-between; color: #969da8; font-family: monospace; font-size: 11px; }
        .system-console code { white-space: normal; color: #d9dce1; font-family: monospace; font-size: 13px; line-height: 1.65; }
        .system-console code b { color: #ffffff; }
        .system-console p { display: flex; flex-wrap: wrap; gap: 7px 12px; margin: 10px 0 0; color: #aeb4bd; font-size: 11px; }
        .system-console p span { color: #ffffff; }
        .english-task-hub { width: min(100%, 1120px); margin: 52px auto 0; text-align: left; }
        .english-task-heading { max-width: 720px; margin: 0 auto 24px; text-align: center; }
        .english-task-heading h2 { margin: 0; font-size: clamp(30px, 4.5vw, 48px); line-height: 1.08; letter-spacing: -.045em; }
        .english-task-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .english-task-grid article { display: flex; min-height: 315px; flex-direction: column; border: 1px solid var(--border); border-radius: 22px; padding: 28px; background: color-mix(in srgb, var(--surface) 92%, transparent); text-align: left; }
        .english-task-grid article > span:first-child { align-self: flex-end; color: var(--muted); font-family: monospace; font-size: 12px; }
        .english-task-grid article .eyebrow { margin-top: 28px; }
        .english-task-grid h3 { margin: 0; font-size: clamp(23px, 2.6vw, 30px); line-height: 1.2; letter-spacing: -.035em; }
        .english-task-grid article > p:not(.eyebrow) { margin: 14px 0 24px; color: var(--muted); font-size: 14px; line-height: 1.7; }
        .english-task-grid article > a, .english-task-grid form { margin-top: auto; font-weight: 720; }
        .english-task-grid form { display: grid; gap: 8px; }
        .english-task-grid form label { color: var(--muted); font-size: 12px; }
        .english-task-grid form > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
        .english-task-grid input, .english-task-grid button { min-height: 46px; border: 1px solid var(--border); border-radius: 12px; background: var(--background); color: var(--foreground); }
        .english-task-grid input { min-width: 0; padding: 0 13px; }
        .english-task-grid button { padding: 0 15px; background: var(--foreground); color: var(--background); font-weight: 700; cursor: pointer; }
        @media (max-width: 980px) { .english-system-visual { grid-template-columns: 1fr; } .system-console { border-top: 1px solid var(--border); border-left: 0; } }
        @media (max-width: 920px) { .english-task-grid { grid-template-columns: 1fr; } .english-task-grid article { min-height: 0; } }
        @media (max-width: 720px) { .system-loop { grid-template-columns: 1fr; } .system-loop i { transform: rotate(90deg); justify-self: center; } .system-loop > div { min-height: 0; } }
        @media (max-width: 520px) { .english-system-visual { border-radius: 20px; } .system-loop, .system-console { padding: 20px; } .english-task-hub { margin-top: 38px; } .english-task-grid article { border-radius: 18px; padding: 22px; } }
      `}</style>
    </main>
  );
}
