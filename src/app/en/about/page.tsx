import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { englishDiscoveryArticles } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "About Linqingan and the Screeps Knowledge Project",
  description:
    "About Linqingan, the English Screeps knowledge project, its practical debugging focus, verification approach, open development process, evidence boundaries, and contact channels.",
  path: "/en/about",
  chinesePath: "/about",
});

export default function EnglishAboutPage() {
  const moduleCount = new Set(englishDiscoveryArticles.map((article) => article.moduleNumber)).size;
  const topicCount = new Set(englishDiscoveryArticles.flatMap((article) => article.tagSlugs)).size;

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/en">Home</Link><span aria-hidden="true">/</span><span>About</span></nav>
        <header className={styles.header}>
          <p className="eyebrow">ABOUT THE PROJECT</p>
          <h1>Build, run, observe, and improve</h1>
          <p>Linqingan is a public Screeps learning and engineering project focused on practical JavaScript, transparent verification, debugging workflows, and tools that help players reason about live systems.</p>
        </header>

        <section className="about-profile-panel" aria-labelledby="about-profile-title">
          <div className="about-profile-identity">
            <Image src="/profile-avatar.webp" alt="Linqingan profile" width={116} height={116} />
            <div><p className="eyebrow">AUTHOR AND MAINTAINER</p><h2 id="about-profile-title">Linqingan</h2><p>The site documents Screeps learning, automation systems, code maintenance, and the process of turning isolated snippets into systems that keep running.</p></div>
          </div>
          <dl>
            <div><dt>English guides</dt><dd>{englishDiscoveryArticles.length}</dd></div>
            <div><dt>Knowledge modules</dt><dd>{moduleCount}</dd></div>
            <div><dt>Topic archives</dt><dd>{topicCount}</dd></div>
            <div><dt>Working tools</dt><dd>2</dd></div>
          </dl>
        </section>

        <section className="evidence-ladder" aria-labelledby="evidence-ladder-title">
          <div className="evidence-heading"><p className="eyebrow">EVIDENCE LADDER</p><h2 id="evidence-ladder-title">Every technical claim has a visible boundary</h2><p>The site does not present syntax checks, offline simulations, Console tests, and live multi-tick behavior as equivalent evidence.</p></div>
          <ol>
            <li><span>01</span><div><strong>Source review</strong><p>Read the Chinese source, identify the intended task, and separate confirmed facts from assumptions.</p></div></li>
            <li><span>02</span><div><strong>Official API check</strong><p>Verify methods, constants, return codes, ownership rules, and timing behavior against official documentation.</p></div></li>
            <li><span>03</span><div><strong>Syntax and offline checks</strong><p>Check JavaScript structure, calculations, state transitions, and deterministic examples without claiming live-room proof.</p></div></li>
            <li><span>04</span><div><strong>Console and live-room evidence</strong><p>Mark real Console or multi-tick tests only when that evidence actually exists; otherwise the article says it is pending.</p></div></li>
          </ol>
        </section>

        <section className={styles.grid} style={{ marginTop: 52 }}>
          <article className={styles.card}><p className="eyebrow">ENGLISH DIRECTION</p><h2>Not a copy of the official API</h2><p>The English section is designed around practical questions: why an action fails, how to inspect the state, which return value matters, and how to validate the fix across ticks.</p><Link href="/en/knowledge">View the knowledge map →</Link></article>
          <article className={styles.card}><p className="eyebrow">OPEN DEVELOPMENT</p><h2>Issues and changes stay public</h2><p>The website repository, change history, pull requests, and issue tracker are public so technical claims and implementation decisions can be reviewed.</p><a href={siteConfig.links.repository} rel="noreferrer" target="_blank">Open the repository ↗</a></article>
          <article className={styles.card}><p className="eyebrow">LIMITATIONS</p><h2>No hidden live-game claim</h2><p>Tool results remain calculations or static snapshot assessments. Articles identify when live-room testing, screenshots, or longer observation are still missing.</p><Link href="/en/verification">Read the verification method →</Link></article>
          <article className={styles.card}><p className="eyebrow">CONTACT</p><h2>Report a technical problem</h2><p>Provide the affected URL, Screeps API or return code, expected behavior, actual result, and any relevant Console output.</p><a href={`mailto:${siteConfig.author.email}`}>Send an email →</a></article>
        </section>
      </Container>

      <style>{`
        .about-profile-panel { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr); gap: 38px; border: 1px solid var(--border); border-radius: 24px; padding: clamp(26px, 5vw, 48px); background: var(--surface); }
        .about-profile-identity { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 24px; align-items: center; }
        .about-profile-identity img { border-radius: 999px; }
        .about-profile-identity h2 { margin: 7px 0 0; font-size: clamp(34px, 5vw, 56px); letter-spacing: -.05em; }
        .about-profile-identity p:not(.eyebrow) { max-width: 690px; margin: 13px 0 0; color: var(--muted); line-height: 1.75; }
        .about-profile-panel dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; }
        .about-profile-panel dl > div { display: grid; align-content: end; min-height: 120px; border: 1px solid var(--border); border-radius: 17px; padding: 18px; background: var(--background); }
        .about-profile-panel dt { color: var(--muted); font-size: 12px; }
        .about-profile-panel dd { margin: 8px 0 0; font-size: 30px; font-weight: 760; }
        .evidence-ladder { display: grid; grid-template-columns: minmax(240px, .7fr) minmax(0, 1.3fr); gap: 48px; margin-top: 70px; }
        .evidence-heading h2 { margin: 7px 0 0; font-size: clamp(31px, 5vw, 52px); letter-spacing: -.05em; }
        .evidence-heading > p:last-child { margin: 16px 0 0; color: var(--muted); line-height: 1.75; }
        .evidence-ladder ol { display: grid; margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }
        .evidence-ladder li { display: grid; grid-template-columns: 54px minmax(0, 1fr); gap: 18px; border-bottom: 1px solid var(--border); padding: 22px 0; }
        .evidence-ladder li > span { color: var(--muted); font-family: monospace; font-size: 12px; }
        .evidence-ladder strong { font-size: 20px; }
        .evidence-ladder li p { margin: 8px 0 0; color: var(--muted); line-height: 1.65; }
        @media (max-width: 820px) { .about-profile-panel, .evidence-ladder { grid-template-columns: 1fr; } }
        @media (max-width: 560px) { .about-profile-identity { grid-template-columns: 1fr; } .about-profile-panel dl { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
