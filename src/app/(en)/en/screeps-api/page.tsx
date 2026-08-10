import Link from "next/link";

import { Container } from "@/components/container";
import { ScreepsApiExplorer } from "@/components/screeps-api-explorer";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { getLocalizedScreepsApiReference } from "@/lib/screeps-api-reference-localized";
import { siteConfig } from "@/lib/site";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps API Quick Reference",
  description:
    "Search common Screeps Game, Creep, Room, Structure, Market, and PathFinder APIs, then continue to matching guides, return codes, tools, or the official API reference.",
  path: "/en/screeps-api",
  chinesePath: "/screeps-api",
});

export default function EnglishScreepsApiPage() {
  const entries = getLocalizedScreepsApiReference("en");
  const pageUrl = `${siteConfig.url}/en/screeps-api`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Screeps API Quick Reference",
    description:
      "A searchable quick reference for common Screeps Game, Creep, Room, Structure, Market, and PathFinder APIs.",
    url: pageUrl,
    inLanguage: "en",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: entries.length,
      itemListElement: entries.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: entry.signature,
        url: `${pageUrl}#${entry.id}`,
      })),
    },
  };

  return (
    <main className={styles.page} lang="en">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en/knowledge">Knowledge Base</Link>
          <span aria-hidden="true">/</span>
          <span>API Quick Reference</span>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">API QUICK REFERENCE</p>
          <h1>Search common Screeps APIs</h1>
          <p>
            Find common APIs by object, method, or keyword. This page is a navigation and recall aid rather than a replacement for the official API Reference. For state-changing actions, record return codes and verify later-tick state.
          </p>
          <div className="button-row">
            <a
              className="button button-secondary"
              href="https://docs.screeps.com/api/"
              target="_blank"
              rel="noreferrer"
            >
              Open official API Reference ↗
            </a>
            <Link className="button button-secondary" href="/en/screeps-errors">
              Open return codes
            </Link>
          </div>
        </header>

        <ScreepsApiExplorer entries={entries} locale="en" />
      </Container>
    </main>
  );
}
