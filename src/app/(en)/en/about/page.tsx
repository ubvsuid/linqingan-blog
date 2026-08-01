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
    "About Linqingan, the English Screeps knowledge project, its practical debugging focus, verification approach, open development process, evidence boundaries, editorial policy, and contact channels.",
  path: "/en/about",
  chinesePath: "/about",
});

export default function EnglishAboutPage() {
  const moduleCount = new Set(englishDiscoveryArticles.map((article) => article.moduleNumber)).size;
  const topicCount = new Set(englishDiscoveryArticles.flatMap((article) => article.tagSlugs)).size;
  const profileUrl = `${siteConfig.url}/en/about`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        url: profileUrl,
        name: "About Linqingan and the Screeps Knowledge Project",
        mainEntity: { "@id": `${profileUrl}#author` },
      },
      {
        "@type": "Person",
        "@id": `${profileUrl}#author`,
        name: "Linqingan",
        url: profileUrl,
        image: `${siteConfig.url}/profile-avatar.webp`,
        sameAs: [siteConfig.links.github, siteConfig.links.repository],
        knowsAbout: [
          "Screeps",
          "JavaScript",
          "automation",
          "debugging",
          "CPU and Memory diagnostics",
          "Screeps return codes",
        ],
      },
    ],
  };

  return (
    <main className={styles.page} lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/en">Home</Link><span aria-hidden="true">/</span><span>About</span></nav>
        <header className={styles.header}>
          <p className="eyebrow">ABOUT THE PROJECT</p>
          <h1>Build, run, observe, and improve</h1>
          <p>Linqingan is a public Screeps learning and engineering project focused on practical JavaScript, transparent verification, return-code debugging, and tools that help players reason about systems across ticks.</p>
        </header>

        <section className="about-profile-panel" aria-labelledby="about-profile-title">
          <div className="about-profile-identity">
            <Image src="/profile-avatar.webp" alt="Linqingan profile" width={116} height={116} priority />
            <div><p className="eyebrow">AUTHOR AND MAINTAINER</p><h2 id="about-profile-title">Linqingan</h2><p>The site documents Screeps learning, automation systems, code maintenance, and the process of turning isolated snippets into observable systems. The project has been maintained publicly since July 2026, with source code, changes, limitations, and issue reports available for independent review.</p></div>
          </div>
          <dl>
            <div><dt>English guides</dt><dd>{englishDiscoveryArticles.length}</dd></div>
            <div><dt>Knowledge modules</dt><dd>{moduleCount}</dd></div>
            <div><dt>Topic archives</dt><dd>{topicCount}</dd></div>
            <div><dt>Working tools</dt><dd>8</dd></div>
          </dl>
        </section>

        <section className="project-timeline" aria-labelledby="project-timeline-title">
          <div><p className="eyebrow">PUBLIC PROJECT HISTORY</p><h2 id="project-timeline-title">What can be checked independently</h2><p>The site avoids unverifiable experience claims. The public repository, production branch, quality checks, change history, article feedback, and issue tracker provide evidence visitors can inspect.</p></div>
          <ol>
            <li><span>JUL 2026</span><div><strong>Public English section established</strong><p>English navigation, roadmap, knowledge modules, references, search, tools, and content registries were published as a connected system.</p></div></li>
            <li><span>CONTINUOUS</span><div><strong>Production and content checks</strong><p>Content, routes, links, types, lint, accessibility basics, simulations, production builds, and bilingual Lighthouse routes run before release.</p></div></li>
            <li><span>PUBLIC</span><div><strong>Changes and limitations remain visible</strong><p>Pull requests, repository history, issue reports, evidence boundaries, and known limitations remain available for review.</p></div></li>
          </ol>
        </section>

        <section className="evidence-ladder" aria-labelledby="evidence-ladder-title">
          <div className="evidence-heading"><p className="eyebrow">EVIDENCE LADDER</p><h2 id="evidence-ladder-title">Every technical claim has a visible boundary</h2><p>The site does not present syntax checks, offline simulations, Console tests, and live multi-tick behavior as equivalent evidence.</p></div>
          <ol>
            <li><span>01</span><div><strong>Source review</strong><p>Read the source, identify the intended task, and separate confirmed facts from assumptions.</p></div></li>
            <li><span>02</span><div><strong>Official API check</strong><p>Verify methods, constants, return codes, ownership rules, and timing behavior against official documentation.</p></div></li>
            <li><span>03</span><div><strong>Syntax and offline checks</strong><p>Check JavaScript structure, calculations, state transitions, and deterministic examples without claiming live-room proof.</p></div></li>
            <li><span>04</span><div><strong>Console and live-room evidence</strong><p>Mark real Console output, screenshots, or multi-tick tests only when the evidence exists; otherwise the guide says it is pending.</p></div></li>
          </ol>
        </section>

        <section className={`${styles.grid} about-detail-grid`}>
          <article className={styles.card}><p className="eyebrow">EDITORIAL POLICY</p><h2>One problem, one clear outcome</h2><p>Each guide targets a defined search intent, separates minimal code from guarded production logic, identifies expected results, and avoids inventing live-game evidence.</p><Link href="/en/verification">Read the verification method →</Link></article>
          <article className={styles.card}><p className="eyebrow">TEST ENVIRONMENT</p><h2>Evidence states where it came from</h2><p>Documentation checks, JavaScript syntax, offline simulations, Screeps Console observations, and live-room tests are recorded separately. A published page is not automatically marked live-tested.</p><Link href="/en/roadmap">Review evidence priorities →</Link></article>
          <article className={styles.card}><p className="eyebrow">OPEN DEVELOPMENT</p><h2>Issues and changes stay public</h2><p>The website repository, change history, pull requests, and issue tracker are public so technical claims and implementation decisions can be reviewed.</p><a href={siteConfig.links.repository} rel="noreferrer" target="_blank">Open the repository ↗</a></article>
          <article className={styles.card}><p className="eyebrow">LIMITATIONS</p><h2>No hidden live-game claim</h2><p>Tool results remain calculations or static snapshot assessments. Real screenshots and live-room evidence are added only when the underlying session evidence exists.</p><Link href="/en/verification">Read the verification method →</Link></article>
          <article className={styles.card}><p className="eyebrow">CHANGELOG</p><h2>Review completed changes</h2><p>The English changelog summarizes meaningful interface, navigation, tool, search, performance, verification, and SEO updates.</p><Link href="/en/changelog">Open the changelog →</Link></article>
          <article className={styles.card}><p className="eyebrow">CONTACT</p><h2>Report a technical problem</h2><p>Provide the affected URL, Screeps object or API, return code, expected behavior, actual result, and relevant Console output. Remove account secrets before posting.</p><a href={siteConfig.links.issues} rel="noreferrer" target="_blank">Open an issue ↗</a></article>
        </section>
      </Container>
    </main>
  );
}
