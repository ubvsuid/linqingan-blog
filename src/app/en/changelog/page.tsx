import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "English Site Changelog",
  description: "Meaningful changes to the Linqingan English Screeps interface, navigation, search, tools, accessibility, and technical SEO.",
  path: "/en/changelog",
  chinesePath: "/changelog",
});

const releases = [
  {
    date: "July 26, 2026",
    title: "English interface and internationalization refinement",
    items: [
      "Added English-specific document language handling, response headers, metadata ownership, structured data, error states, and loading states.",
      "Moved the task-first navigation above the system diagram and clarified publication versus live-room verification.",
      "Simplified the desktop navigation and delayed the mobile menu breakpoint.",
      "Added Screeps status accents, sample labels for tool previews, useful knowledge metadata, popular searches, and a keyboard search shortcut.",
      "Expanded the About page, roadmap, changelog, issue reporting, and content-use information.",
    ],
  },
  {
    date: "July 26, 2026",
    title: "English discovery and platform upgrade",
    items: [
      "Added a searchable and filterable guide library, topic archives, English RSS, related guides, and article-specific share images.",
      "Added reciprocal Chinese and English hreflang links and read-only production quality gates.",
      "Introduced the staged beginner roadmap, eight-system knowledge map, tool previews, and public evidence boundaries.",
    ],
  },
];

export default function EnglishChangelogPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Changelog</span></nav>
        <header className={styles.header}><p className="eyebrow">CHANGELOG</p><h1>Meaningful English site changes</h1><p>This page records interface, navigation, search, tool, accessibility, and technical SEO changes. Individual article revisions are tracked separately.</p></header>
        <div className="english-changelog-list">
          {releases.map((release) => (
            <article key={`${release.date}-${release.title}`}>
              <time>{release.date}</time>
              <div><h2>{release.title}</h2><ul>{release.items.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </article>
          ))}
        </div>
      </Container>
      <style>{`
        .english-changelog-list { display: grid; border-top: 1px solid var(--border); }
        .english-changelog-list article { display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 34px; border-bottom: 1px solid var(--border); padding: 34px 0; }
        .english-changelog-list time { color: var(--screeps-controller); font-family: monospace; font-size: 12px; }
        .english-changelog-list h2 { margin: 0; font-size: clamp(25px, 4vw, 38px); letter-spacing: -.04em; }
        .english-changelog-list ul { display: grid; gap: 10px; margin: 18px 0 0; padding-left: 20px; color: var(--muted); }
        @media (max-width: 660px) { .english-changelog-list article { grid-template-columns: 1fr; gap: 10px; } }
      `}</style>
    </main>
  );
}
