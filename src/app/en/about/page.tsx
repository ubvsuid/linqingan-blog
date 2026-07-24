import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "About Linqingan and the Screeps Knowledge Project",
  description:
    "About Linqingan, the English Screeps knowledge project, its practical debugging focus, verification approach, open development process, and contact channels.",
  path: "/en/about",
  chinesePath: "/about",
});

export default function EnglishAboutPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>About</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">ABOUT THE PROJECT</p>
          <h1>Build, run, observe, and improve</h1>
          <p>
            Linqingan is a public Screeps learning and engineering project focused on practical JavaScript, transparent verification, debugging workflows, and tools that help players reason about live systems.
          </p>
        </header>

        <section className={styles.grid}>
          <article className={styles.card}>
            <Image src="/profile-avatar.webp" alt="Linqingan profile" width={96} height={96} style={{ borderRadius: 999 }} />
            <h2>Linqingan</h2>
            <p>The site documents Screeps learning, automation systems, code maintenance, and the process of turning isolated snippets into systems that keep running.</p>
            <a href={siteConfig.links.github} rel="noreferrer" target="_blank">GitHub profile ↗</a>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">ENGLISH DIRECTION</p>
            <h2>Not a copy of the official API</h2>
            <p>The English section is designed around practical questions: why an action fails, how to inspect the state, which return value matters, and how to validate the fix across ticks.</p>
            <Link href="/en/knowledge">View the knowledge map →</Link>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">OPEN DEVELOPMENT</p>
            <h2>Issues and changes stay public</h2>
            <p>The website repository, change history, and issue tracker are public so technical claims and implementation decisions can be reviewed.</p>
            <a href={siteConfig.links.repository} rel="noreferrer" target="_blank">Open the repository ↗</a>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">CONTACT</p>
            <h2>Report a technical problem</h2>
            <p>Provide the affected URL, Screeps API or return code, expected behavior, actual result, and any relevant Console output.</p>
            <a href={`mailto:${siteConfig.author.email}`}>Send an email →</a>
          </article>
        </section>
      </Container>
    </main>
  );
}
