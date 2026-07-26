import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { siteConfig } from "@/lib/site";

import styles from "../english.module.css";

export const metadata: Metadata = {
  title: { absolute: "Content and Code Use | Linqingan" },
  description: "How Linqingan English site content, examples, third-party names, and repository files may be used.",
  authors: [{ name: "Linqingan", url: `${siteConfig.url}/en/about` }],
  creator: "Linqingan",
  alternates: { canonical: "/en/license", languages: { en: "/en/license", "zh-CN": "/about", "x-default": "/en" } },
};

export default function EnglishLicensePage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Content and Code Use</span></nav>
        <header className={styles.header}><p className="eyebrow">CONTENT AND CODE USE</p><h1>Clear boundaries for reuse</h1><p>This page describes the current default. A specific page or repository file may provide different terms, and those specific terms take priority.</p></header>
        <section className={styles.grid}>
          <article className={styles.card}><p className="eyebrow">SITE CONTENT</p><h2>Copyright remains with Linqingan</h2><p>Unless a page states otherwise, original explanatory text, diagrams, interface copy, and site design are not offered under an open-content license. Link to the original page when referencing the work.</p></article>
          <article className={styles.card}><p className="eyebrow">CODE EXAMPLES</p><h2>Check the repository file first</h2><p>Small examples are published for learning and discussion, but repository files do not automatically carry an open-source license. Review the relevant file and request permission when reuse goes beyond quotation or personal study.</p></article>
          <article className={styles.card}><p className="eyebrow">THIRD-PARTY NAMES</p><h2>Screeps remains a third-party product</h2><p>Screeps names, APIs, graphics, and trademarks belong to their respective owners. Linqingan is an independent learning project and is not presented as the official Screeps documentation.</p></article>
          <article className={styles.card}><p className="eyebrow">PERMISSION</p><h2>Ask before commercial reuse</h2><p>For translations, training materials, commercial publication, bulk reproduction, or redistribution, describe the intended use and the exact pages or files involved.</p><a href={`mailto:${siteConfig.author.email}`}>Request permission →</a></article>
        </section>
      </Container>
    </main>
  );
}
