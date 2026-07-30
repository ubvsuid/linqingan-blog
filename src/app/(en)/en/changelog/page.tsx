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
    date: "July 30, 2026",
    dateTime: "2026-07-30",
    title: "Audit remediation and evidence workflow upgrade",
    items: [
      "Changed the English guide library to server-rendered pagination with a lightweight search index that loads only when search is used.",
      "Added explicit static-page revision dates, stricter Lighthouse performance budgets, and automated checks for sitemap, CSP, and performance policy.",
      "Added shareable tool configurations, copyable diagnostic results, local beginner progress, and recent-reading history without accounts or tracking.",
      "Expanded evidence statuses, review provenance, submission guidance, and the manual accessibility test matrix without claiming unperformed live tests.",
      "Moved the theme initializer and remaining eligible English page styles out of inline markup, with the stricter CSP candidate limited to a low-volume verification canary.",
    ],
  },
  {
    date: "July 26, 2026",
    dateTime: "2026-07-26",
    title: "English interface and internationalization refinement",
    items: [
      "Added English-specific document language handling, response headers, metadata ownership, structured data, and English error states.",
      "Moved the task-first navigation above the system diagram and clarified publication versus live-room verification.",
      "Simplified the desktop navigation and delayed the mobile menu breakpoint.",
      "Added Screeps status accents, sample labels for tool previews, useful knowledge metadata, popular searches, and a keyboard search shortcut.",
      "Expanded the About page, roadmap, changelog, issue reporting, and content-use information.",
    ],
  },
  {
    date: "July 26, 2026",
    dateTime: "2026-07-26",
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
        <div className={styles.changelogList}>
          {releases.map((release) => (
            <article key={`${release.dateTime}-${release.title}`}>
              <time dateTime={release.dateTime}>{release.date}</time>
              <div><h2>{release.title}</h2><ul>{release.items.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </article>
          ))}
        </div>
      </Container>
    </main>
  );
}
