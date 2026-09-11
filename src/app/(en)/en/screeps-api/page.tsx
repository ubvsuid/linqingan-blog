import Link from "next/link";

import { Container } from "@/components/container";
import { ScreepsApiCoverageSnapshot } from "@/components/screeps-api-coverage-snapshot";
import { ScreepsApiExplorer } from "@/components/screeps-api-explorer";
import { ScreepsApiHubDirectory } from "@/components/screeps-api-hub-directory";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { getLocalizedScreepsApiReference } from "@/lib/screeps-api-reference-localized";
import { siteConfig } from "@/lib/site";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps API Reference: Objects, Methods & Return Codes",
  description:
    "Search the Screeps API by object, method, or keyword. Find Creep, Room, Spawn, Controller, Market, PathFinder, Store, return codes, guides, and tools.",
  path: "/en/screeps-api",
  chinesePath: "/screeps-api",
});

export default function EnglishScreepsApiPage() {
  const entries = getLocalizedScreepsApiReference("en");
  const pageUrl = `${siteConfig.url}/en/screeps-api`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Screeps API Reference",
    description:
      "A searchable Screeps API reference for common objects, methods, and return-code context, with hubs connecting guides, errors, tools, and verification.",
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
          <span>Screeps API Reference</span>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">SCREEPS API REFERENCE</p>
          <h1>Screeps API Reference</h1>
          <p>
            Use this Screeps API reference to find common objects, methods, and return-code context quickly. Search by object, method, or keyword, or start from Creep, Room, Spawn, Controller, Market, Link, Tower, Terminal, Lab, PathFinder, and Store hubs. It is a practical navigation and recall layer, not a replacement for the official API Reference. For state-changing actions, record return codes and verify later-tick state.
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

        <ScreepsApiCoverageSnapshot locale="en" />
        <ScreepsApiHubDirectory locale="en" />
        <ScreepsApiExplorer entries={entries} locale="en" />
      </Container>
    </main>
  );
}
