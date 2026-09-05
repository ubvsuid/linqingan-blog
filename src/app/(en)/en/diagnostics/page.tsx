import Link from "next/link";

import { Container } from "@/components/container";
import { ScreepsDiagnosticCenter } from "@/components/screeps-diagnostic-center";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";
import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";

import styles from "../english.module.css";

export const revalidate = 300;

export const metadata = createEnglishPageMetadata({ title: "Screeps Diagnostic Center", description: "Start from symptoms such as a Creep not moving, Spawn failures, Controller downgrade pressure, Link transfer problems, Market failures, high CPU, or stalled logistics, then continue into return codes, APIs, object hubs, guides, tools, and accepted runtime verification.", path: "/en/diagnostics", chinesePath: "/diagnostics" });

export default function EnglishDiagnosticsPage() {
  const pageUrl = `${siteConfig.url}/en/diagnostics`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: "Screeps Diagnostic Center", url: pageUrl, inLanguage: "en", description: "A symptom-first entry point into structured Screeps troubleshooting paths.", mainEntity: { "@id": `${pageUrl}#symptoms` } },
      { "@type": "ItemList", "@id": `${pageUrl}#symptoms`, numberOfItems: screepsDiagnosticSymptoms.length, itemListElement: screepsDiagnosticSymptoms.map((symptom, index) => ({ "@type": "ListItem", position: index + 1, name: symptom.enTitle, url: `${pageUrl}#${symptom.id}` })) },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` }, { "@type": "ListItem", position: 2, name: "Diagnostic Center", item: pageUrl }] },
    ],
  };

  return (
    <main className={styles.page} lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/en/knowledge">Knowledge</Link><span aria-hidden="true">/</span><span>Diagnostic Center</span></nav>
        <header className={styles.header}><p className="eyebrow">SCREEPS DIAGNOSTIC CENTER</p><h1>Start with the symptom, not the constant</h1><p>This is not another error-code dictionary. Start from the behavior you can observe, capture the real return value and runtime state, then continue into APIs, object hubs, focused guides, local tools, and accepted runtime verification.</p></header>
        <div className={styles.notice}><strong>Recommended workflow</strong><p>If you want step-by-step guidance, start with <Link href="/en/resolver">Problem Resolver V1</Link>. If you already have the real return value, use the symptom relationship paths below.</p></div>
        <ScreepsDiagnosticCenter locale="en" />
      </Container>
    </main>
  );
}
